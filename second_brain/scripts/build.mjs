import {build} from 'esbuild';
import {mkdir,rm,cp,readFile,writeFile,readdir} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import path from 'node:path';
const root=path.resolve(import.meta.dirname,'..'),out=path.join(root,'dist');
await rm(out,{recursive:true,force:true});await mkdir(path.join(out,'vendor'),{recursive:true});
for(const name of ['style.css','app.js'])await cp(path.join(root,'static',name),path.join(out,name));
for(const name of ['web-entry.js','local-store.js','browser.css','manifest.webmanifest','icon.svg'])await cp(path.join(root,'web',name),path.join(out,name));
// Bundle only the tokenizer and ONNX runtime used by MiniLM, not a registry
// of unrelated model architectures. Keep vendor code readable for auditing.
await build({entryPoints:[path.join(root,'web/embeddings.js')],outfile:path.join(out,'embeddings.js'),bundle:true,format:'esm',platform:'browser',target:'es2022',minify:false,legalComments:'linked'});
const onnx=path.join(root,'node_modules/onnxruntime-web/dist');
for(const name of ['ort-wasm-simd-threaded.mjs','ort-wasm-simd-threaded.wasm'])await cp(path.join(onnx,name),path.join(out,'vendor',name));
for(const name of ['pdf.mjs','pdf.worker.mjs'])await cp(path.join(root,'node_modules/pdfjs-dist/build',name),path.join(out,'vendor',name));
for(const name of ['cmaps','standard_fonts','wasm'])await cp(path.join(root,'node_modules/pdfjs-dist',name),path.join(out,'vendor',name),{recursive:true});
await cp(path.join(root,'node_modules/pdfjs-dist/LICENSE'),path.join(out,'vendor/PDFJS-LICENSE'));
await cp(path.join(root,'node_modules/@huggingface/tokenizers/LICENSE'),path.join(out,'TOKENIZERS-LICENSE'));
await cp(path.join(root,'web/licenses/ONNXRUNTIME-LICENSE'),path.join(out,'vendor/ONNXRUNTIME-LICENSE'));
let html=await readFile(path.join(root,'static/index.html'),'utf8');
html=html.replace('href="/static/style.css"','href="./style.css"').replace('<script src="/static/app.js" defer></script>','<script type="module" src="./web-entry.js"></script>').replace('href="/"','href="./"');
html=html.replace('</head>',`<link rel="stylesheet" href="./browser.css"><link rel="manifest" href="./manifest.webmanifest"><link rel="icon" href="./icon.svg" type="image/svg+xml"><meta name="description" content="Your private second brain. Save notes, PDFs, bookmarks, and code on your device. Search, connect, and remember with B-Ram."><meta http-equiv="Content-Security-Policy" content="default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; style-src 'self'; img-src 'self' data: blob:; connect-src 'self' https://huggingface.co https://*.huggingface.co https://*.xethub.hf.co; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self'">\n</head>`);
await writeFile(path.join(out,'index.html'),html);await writeFile(path.join(out,'.nojekyll'),'');
// Only app-shell assets are precached. Embedding runtime/model downloads are opt-in.
const shell=['./','./index.html','./style.css','./browser.css','./app.js','./web-entry.js','./local-store.js','./manifest.webmanifest','./icon.svg','./vendor/pdf.mjs','./vendor/pdf.worker.mjs'];
async function filesUnder(dir){const files=[];for(const entry of await readdir(dir,{withFileTypes:true})){const name=path.join(dir,entry.name);if(entry.isDirectory())files.push(...await filesUnder(name));else files.push(name);}return files.sort();}
const hash=createHash('sha256');for(const file of await filesUnder(out)){hash.update(path.relative(out,file));hash.update(await readFile(file));}
const revision=hash.digest('hex').slice(0,12);
const sw=`const PREFIX='bram-shell-'+btoa(self.registration.scope);const CACHE=PREFIX+'-${revision}';const SHELL=${JSON.stringify(shell)};
self.addEventListener('install',event=>{event.waitUntil(caches.open(CACHE).then(cache=>cache.addAll(SHELL)));});
self.addEventListener('activate',event=>{event.waitUntil(caches.keys().then(keys=>Promise.all(keys.filter(k=>k.startsWith(PREFIX)&&k!==CACHE).map(k=>caches.delete(k)))).then(()=>self.clients.claim()));});
self.addEventListener('fetch',event=>{const url=new URL(event.request.url);if(event.request.method!=='GET'||url.origin!==self.location.origin||!url.href.startsWith(self.registration.scope))return;
event.respondWith(caches.open(CACHE).then(async cache=>{const cached=await cache.match(event.request);if(cached)return cached;try{const response=await fetch(event.request);if(response.ok)await cache.put(event.request,response.clone());return response;}catch(error){if(event.request.mode==='navigate')return cache.match('./index.html');throw error;}}));});`;
await writeFile(path.join(out,'sw.js'),sw);
await writeFile(path.join(out,'_headers'),`/*\n  X-Content-Type-Options: nosniff\n  Referrer-Policy: no-referrer\n  X-Frame-Options: DENY\n`);
console.log(`Built private browser edition in ${out}; revision ${revision}`);
