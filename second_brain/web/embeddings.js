import {Tokenizer} from '@huggingface/tokenizers';
import {InferenceSession,Tensor,env} from 'onnxruntime-web/wasm';
env.wasm.numThreads=1;
env.wasm.proxy=false;
env.wasm.wasmPaths={
  mjs:new URL('./vendor/ort-wasm-simd-threaded.mjs',import.meta.url).href,
  wasm:new URL('./vendor/ort-wasm-simd-threaded.wasm',import.meta.url).href,
};
const MODEL_BASE='https://huggingface.co/Xenova/all-MiniLM-L6-v2/resolve/main/';
let resourcesPromise, inferenceQueue=Promise.resolve();

async function modelFile(name){
  const url=MODEL_BASE+name;
  let cache;
  try{cache=await caches.open('bram-minilm-q8-v1');const saved=await cache.match(url);if(saved)return saved;}catch{/* Storage can be unavailable; inference can still run in memory. */}
  const response=await fetch(url);
  if(!response.ok)throw new Error(`Could not download ${name} (HTTP ${response.status}).`);
  try{await cache?.put(url,response.clone());}catch{/* A full cache must not prevent this session's inference. */}
  return response;
}
async function resources(){
  if(!resourcesPromise)resourcesPromise=(async()=>{
    const [definition,config,weights]=await Promise.all([
      modelFile('tokenizer.json').then(r=>r.json()),
      modelFile('tokenizer_config.json').then(r=>r.json()),
      modelFile('onnx/model_quantized.onnx').then(r=>r.arrayBuffer()),
    ]);
    const tokenizer=new Tokenizer(definition,config);
    const session=await InferenceSession.create(weights,{executionProviders:['wasm']});
    return {tokenizer,session};
  })().catch(error=>{resourcesPromise=null;throw error;});
  return resourcesPromise;
}
export function meanPool(data,dims,mask){
  const [batch,sequence,width]=dims,output=[];
  for(let b=0;b<batch;b++){
    const vector=new Array(width).fill(0);let count=0;
    for(let s=0;s<sequence;s++){if(!mask[b*sequence+s])continue;count++;for(let k=0;k<width;k++)vector[k]+=data[(b*sequence+s)*width+k];}
    for(let k=0;k<width;k++)vector[k]/=Math.max(count,1);
    const norm=Math.sqrt(vector.reduce((sum,x)=>sum+x*x,0))||1;
    output.push(vector.map(x=>x/norm));
  }
  return output;
}
async function infer(texts){
  if(!texts.length)return [];
  const {tokenizer,session}=await resources();
  const encoded=texts.map(text=>{const ids=tokenizer.encode(text,{add_special_tokens:true}).ids;return ids.length>256?[...ids.slice(0,255),ids.at(-1)]:ids;});
  const sequence=Math.max(...encoded.map(ids=>ids.length)),size=sequence*texts.length;
  const ids=new BigInt64Array(size),mask=new BigInt64Array(size),types=new BigInt64Array(size);
  encoded.forEach((row,b)=>row.forEach((id,s)=>{ids[b*sequence+s]=BigInt(id);mask[b*sequence+s]=1n;}));
  const feeds={input_ids:new Tensor('int64',ids,[texts.length,sequence]),attention_mask:new Tensor('int64',mask,[texts.length,sequence])};
  if(session.inputNames.includes('token_type_ids'))feeds.token_type_ids=new Tensor('int64',types,[texts.length,sequence]);
  const outputs=await session.run(feeds),hidden=outputs.last_hidden_state;
  if(!hidden||hidden.dims.length!==3)throw new Error('The MiniLM model returned an unexpected output.');
  return meanPool(hidden.data,hidden.dims,mask);
}
export function embed(texts){const operation=inferenceQueue.then(()=>infer(texts));inferenceQueue=operation.catch(()=>{});return operation;}
