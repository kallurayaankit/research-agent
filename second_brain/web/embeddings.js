import {pipeline, env} from '@huggingface/transformers';
env.allowLocalModels=false;
env.allowRemoteModels=true;
env.useBrowserCache=true;
// The service worker caches local runtime assets; avoid blob module imports.
env.useWasmCache=false;
env.backends.onnx.wasm.numThreads=1;
env.backends.onnx.wasm.wasmPaths={
  mjs:new URL('./vendor/ort-wasm-simd-threaded.asyncify.mjs',import.meta.url).href,
  wasm:new URL('./vendor/ort-wasm-simd-threaded.asyncify.wasm',import.meta.url).href,
};
let pipelinePromise;
export async function embed(texts){
  if(!pipelinePromise)pipelinePromise=pipeline('feature-extraction','Xenova/all-MiniLM-L6-v2',{dtype:'q8',device:'wasm'}).catch(error=>{pipelinePromise=null;throw error;});
  const extractor=await pipelinePromise;
  const result=await extractor(texts,{pooling:'mean',normalize:true});
  return result.tolist();
}
