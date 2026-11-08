import * as local from './local-store.js';
window.BRamLocal=local;
const $=id=>document.getElementById(id);
const make=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};

// Adapt the same interface to an API-free public website.
document.querySelector('.private-label').textContent='◉  Stored on this device';
document.querySelector('.sidebar-bottom p').textContent='Your ideas stay in this browser. Export a backup to keep them safe.';
document.querySelector('.chat-intro p').textContent='Find answers in your own notes. Source excerpts work everywhere; browser AI can synthesize them on supported devices.';
const cards=document.querySelectorAll('.settings-card');
cards[0].querySelector('h2').textContent='Browser AI · experimental';
cards[0].querySelector('pre').previousElementSibling.textContent='No API key required. Browser AI depends on your browser and hardware; enable it only if your browser provides on-device processing.';
cards[0].querySelector('.muted').textContent='B-Ram never uploads notes to an AI service. Check your browser’s AI processing information before enabling. Downloads may use significant storage.';
cards[1].querySelector('p').textContent='Build MiniLM embeddings on this device. First use downloads model files from Hugging Face (tens of MB). Note contents remain in the browser. Rebuild after edits.';
cards[3].querySelector('h2').textContent='Private browser storage';
cards[3].querySelector('p').textContent='Documents, original files, and vectors live in IndexedDB on this device. The host serves only the app. Clearing site data deletes this library, so export backups regularly.';
cards[3].querySelector('.muted').textContent='This website has no analytics or remote document database. Your hosting provider still receives normal page requests and IP addresses. Each browser profile has its own library.';
$('index-message').textContent='Model download starts only when you choose Build index.';
const build=$('build-index');build.addEventListener('click',event=>{
  if(!sessionStorage.getItem('bram-embedding-consent')){
    if(!confirm('Download the local semantic model from Hugging Face? This uses tens of MB plus runtime files. Your notes will be processed on your device.')){event.stopImmediatePropagation();return;}
    sessionStorage.setItem('bram-embedding-consent','yes');
  }
},true);

await import('./app.js');
const ui=window.BRamUI;
document.querySelector('a[href="/api/backup"]').onclick=async event=>{event.preventDefault();try{await local.exportBackup();}catch(error){ui.toast(error.message);}};
$('original-file').onclick=async event=>{event.preventDefault();try{await local.downloadOriginal($('doc-id').value);}catch(error){ui.toast(error.message);}};

const enable=make('button','button primary','Enable Browser AI');enable.id='enable-browser-ai';cards[0].append(enable);
enable.onclick=async()=>{enable.disabled=true;try{await local.enableAI(message=>{$('model-status').textContent=message;});ui.toast('Browser AI is ready for this session.');}catch(error){ui.toast(error.message);}finally{enable.disabled=false;await local.renderStatus();}};
const persist=make('button','button secondary','Protect local storage');cards[3].append(persist);
persist.onclick=async()=>{const granted=await navigator.storage?.persist?.();ui.toast(granted?'Persistent storage granted. Keep exporting backups too.':'Your browser did not grant persistent storage. Export backups regularly.');};

const banner=make('div','browser-banner');banner.append(make('span','','Your private library lives in this browser. No sign-up. No shared database.'));
const install=make('button','text-button hidden','Install B-Ram');install.id='install-app';banner.append(install);document.querySelector('.workspace').prepend(banner);
let installPrompt;
window.addEventListener('beforeinstallprompt',event=>{event.preventDefault();installPrompt=event;install.classList.remove('hidden');});
install.onclick=async()=>{await installPrompt?.prompt();installPrompt=null;install.classList.add('hidden');};
window.addEventListener('offline',()=>ui.toast('You’re offline. Your saved library is still available.'));
if('serviceWorker' in navigator){navigator.serviceWorker.register('./sw.js').then(registration=>{
  const updateNotice=()=>ui.toast('An update is ready. Close all B-Ram tabs and reopen to use it. Your library stays saved.');
  if(registration.waiting)updateNotice();
  registration.addEventListener('updatefound',()=>{const worker=registration.installing;worker?.addEventListener('statechange',()=>{if(worker.state==='installed'&&navigator.serviceWorker.controller)updateNotice();});});
}).catch(()=>ui.toast('Offline installation is unavailable in this browser. You can still use the library online.'));}

// Connections are intentionally explained, not opaque recommendations.
const nav=make('button','nav-item');nav.setAttribute('aria-label','Connections');nav.append(make('span','','⌘'),document.createTextNode(' Connections'));document.querySelector('.sidebar nav').append(nav);
const panel=make('section','view hidden');panel.id='connections-view';
const heading=make('div','page-heading'),intro=make('div');intro.append(make('div','eyebrow','FOLLOW YOUR CURIOSITY'),make('h1','','See how your ideas connect.'),make('p','','Links, shared tags, and local semantic matches. Up to 60 recent items.'));heading.append(intro);panel.append(heading);
const graph=make('div','connections-graph'),list=make('div','connections-list');panel.append(graph,list);document.querySelector('.workspace').append(panel);
nav.onclick=async()=>{
  document.querySelectorAll('.view').forEach(n=>n.classList.toggle('hidden',n!==panel));document.querySelectorAll('.nav-item').forEach(n=>n.classList.toggle('active',n===nav));$('breadcrumb').textContent='Workspace / Connections';
  graph.replaceChildren();list.replaceChildren();
  try{
    const data=await local.connections();if(!data.nodes.length){graph.append(make('p','','Add a few notes and tags to start making connections.'));return;}
    const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 800 500');svg.setAttribute('role','img');svg.setAttribute('aria-label','Connections between recent library items; the list below provides accessible links.');
    const positions=new Map(data.nodes.map((n,i)=>[n.id,{x:400+280*Math.cos(2*Math.PI*i/data.nodes.length-Math.PI/2),y:250+180*Math.sin(2*Math.PI*i/data.nodes.length-Math.PI/2)}]));
    for(const edge of data.edges){const a=positions.get(edge.source),b=positions.get(edge.target),line=document.createElementNS(ns,'line');for(const [k,v] of Object.entries({x1:a.x,y1:a.y,x2:b.x,y2:b.y}))line.setAttribute(k,v);line.setAttribute('class',`connection-line connection-weight-${edge.weight}`);const title=document.createElementNS(ns,'title');title.textContent=edge.reason;line.append(title);svg.append(line);}
    for(const node of data.nodes){const {x,y}=positions.get(node.id),group=document.createElementNS(ns,'g'),circle=document.createElementNS(ns,'circle'),label=document.createElementNS(ns,'text');circle.setAttribute('cx',x);circle.setAttribute('cy',y);circle.setAttribute('r',9);label.setAttribute('x',x);label.setAttribute('y',y-17);label.setAttribute('text-anchor','middle');label.textContent=node.title.slice(0,25);group.setAttribute('class','connection-node');group.setAttribute('role','button');group.setAttribute('tabindex','0');group.setAttribute('aria-label',`Open ${node.title}`);group.append(circle,label);group.onclick=()=>ui.openEditor(node.id);group.onkeydown=e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();ui.openEditor(node.id);}};svg.append(group);}
    graph.append(svg);
    if(!data.edges.length)list.append(make('p','muted','Add shared tags, write [[Another note title]] in a note, or build the semantic index to discover connections.'));
    for(const edge of data.edges.slice(0,80)){const a=data.nodes.find(d=>d.id===edge.source),b=data.nodes.find(d=>d.id===edge.target),row=make('div','connection-row');const left=make('button','text-button',a.title),right=make('button','text-button',b.title);left.onclick=()=>ui.openEditor(a.id);right.onclick=()=>ui.openEditor(b.id);row.append(left,make('span','','↔'),right,make('small','',edge.reason));list.append(row);}
  }catch(error){ui.toast(error.message);}
};

// Saved items refreshed in another tab become visible without reloading.
window.addEventListener('focus',()=>{ui.refreshStats().catch(()=>{});if(!$('library-view').classList.contains('hidden'))ui.refreshLibrary();});
