const $ = (id) => document.getElementById(id);
const state = {view:'library', kind:'', tag:'', docs:[], stats:null, request:0};
const types = {note:['▤','Note'],pdf:['▧','PDF document'],snippet:['⌘','Code snippet'],bookmark:['›','Bookmark']};
let toastTimer, searchTimer, indexTimer;
function el(tag, cls, text) { const node=document.createElement(tag); if(cls) node.className=cls; if(text!==undefined) node.textContent=text; return node; }
async function api(path, options={}) { if(window.BRamLocal)return window.BRamLocal.api(path,options); const response=await fetch('/api'+path, options); if(!response.ok) { let body; try {body=await response.json();} catch {} throw new Error(typeof body?.detail==='string'?body.detail:'Please check your input and try again.'); } return response.status===204?null:response.json(); }
function json(method, body) {return {method,headers:{'Content-Type':'application/json'},body:JSON.stringify(body)};}
function toast(message) {$('toast').textContent=message;$('toast').classList.remove('hidden');clearTimeout(toastTimer);toastTimer=setTimeout(()=>$('toast').classList.add('hidden'),5500);}
function date(value) {return new Date(value).toLocaleDateString(undefined,{month:'short',day:'numeric'});}
async function refreshStats() {
  state.stats=await api('/stats');const s=state.stats;
  $('nav-total').textContent=$('stat-total').textContent=s.total;$('nav-due').textContent=$('stat-due').textContent=s.due;$('stat-indexed').textContent=s.indexed;
  $('sidebar-tags').replaceChildren();
  for(const [tag,count] of Object.entries(s.tags).sort((a,b)=>b[1]-a[1])) {const b=el('button','tag-nav');b.append(el('span','','#'),document.createTextNode(tag),el('b','',count));b.onclick=()=>{state.tag=tag;showView('library');};$('sidebar-tags').append(b);}
  if(!Object.keys(s.tags).length) $('sidebar-tags').append(el('p','tag-hint','A little order for your ideas. Add tags as you go.'));
  $('index-progress').textContent=`${s.indexed} of ${s.chunks} passages indexed${s.index.running?' · Building…':''}`;
  $('index-message').textContent=s.index.error||'';
  $('build-index').disabled=s.index.running;
}
async function refreshLibrary() {
  const version=++state.request;
  const params=new URLSearchParams({q:$('search').value,mode:$('search-mode').value,kind:state.kind,tag:state.tag});
  try {
    const docs=await api('/documents?'+params);if(version!==state.request)return;state.docs=docs;
    $('library-error').classList.add('hidden');$('cards').replaceChildren();
    $('result-count').textContent=`${docs.length} item${docs.length===1?'':'s'}`;
    $('empty').classList.toggle('hidden',docs.length>0);
    const isFiltered=Boolean($('search').value||state.kind||state.tag);
    $('empty').querySelector('h2').textContent=isFiltered?'No matches just yet.':'Make room for your next good idea.';
    $('empty').querySelector('p').textContent=isFiltered?'Try another phrase or clear your filters.':'Capture a note, save a link, or bring in that PDF you’ve been meaning to read.';
    $('first-note').textContent=isFiltered?'＋ Capture a new idea':'＋ Create your first note';
    $('sample-notes').classList.toggle('hidden',isFiltered||state.stats?.total>0);
    for(const doc of docs) $('cards').append(card(doc));
    $('active-tag').replaceChildren();if(state.tag){const b=el('button','tag-pill',`# ${state.tag}  ×`);b.onclick=()=>{state.tag='';refreshLibrary();};$('active-tag').append(b);}
  } catch(error) {if(version!==state.request)return;$('library-error').textContent=error.message;$('library-error').classList.remove('hidden');$('cards').replaceChildren();$('empty').classList.add('hidden');$('result-count').textContent='Search unavailable';}
}
function card(doc) {
  const node=el('button','document-card');const type=types[doc.kind]||types.note;
  const head=el('div','card-type'),left=el('span','type-left');left.append(el('span','type-icon',type[0]),document.createTextNode(type[1]));head.append(left,el('span','card-arrow','›'));
  node.append(head,el('h2','',doc.title),el('p','excerpt'+(doc.kind==='snippet'?' snippet-preview':''),doc.content||doc.url||'A little space for a new thought.'));
  const tags=el('div','card-tags');for(const tag of doc.tags.slice(0,4))tags.append(el('span','tag-pill',tag));node.append(tags,el('div','card-date',`Saved ${date(doc.created_at)}${doc.filename?' · Original file attached':''}`));node.onclick=()=>openEditor(doc.id);return node;
}
async function showView(view) {
  state.view=view;document.querySelectorAll('.view').forEach(n=>n.classList.toggle('hidden',n.id!==view+'-view'));document.querySelectorAll('[data-view]').forEach(n=>n.classList.toggle('active',n.dataset.view===view));
  const names={library:'My library',chat:'Ask B-Ram',review:'Daily review',settings:'Settings & backup'};$('breadcrumb').replaceChildren(document.createTextNode('Workspace '),el('span','','/'),document.createTextNode(names[view]));
  try {await refreshStats();if(view==='library')await refreshLibrary();if(view==='review')await refreshReview();if(view==='settings')await refreshStatus();}catch(error){toast(error.message);}
}
function kindChanged() {$('url-field').classList.toggle('hidden',$('doc-kind').value!=='bookmark');$('doc-url').required=$('doc-kind').value==='bookmark';$('doc-content').classList.toggle('code-editor',$('doc-kind').value==='snippet');}
async function openEditor(id=null) {
  try {
    const doc=id?await api('/documents/'+id):{title:'',kind:'note',content:'',tags:[],url:''};
    $('editor-form').reset();$('doc-id').value=id||'';$('doc-title').value=doc.title;$('doc-kind').value=doc.kind;$('doc-content').value=doc.content;$('doc-tags').value=doc.tags.join(', ');$('doc-url').value=doc.url;
    $('editor-label').textContent=id?'A THOUGHT WORTH KEEPING':'A NEW THOUGHT';$('delete-doc').classList.toggle('hidden',!id);$('original-file').classList.toggle('hidden',!doc.filename);$('original-file').href=id?`/api/documents/${id}/attachment`:'#';$('original-file').download=doc.filename||'original-file';$('visit-bookmark').classList.toggle('hidden',!doc.url);$('visit-bookmark').href=doc.url||'#';$('editor-error').textContent='';kindChanged();$('editor').showModal();$('doc-title').focus();
  }catch(error){toast(error.message);}
}
$('editor-form').onsubmit=async(event)=>{event.preventDefault();$('save-doc').disabled=true;try {const id=$('doc-id').value;const data={title:$('doc-title').value,kind:$('doc-kind').value,content:$('doc-content').value,tags:$('doc-tags').value.split(','),url:$('doc-kind').value==='bookmark'?$('doc-url').value:''};await api('/documents'+(id?'/'+id:''),json(id?'PUT':'POST',data));$('editor').close();toast('Saved. A little less to keep in your head.');await showView(state.view);}catch(error){$('editor-error').textContent=error.message;}finally{$('save-doc').disabled=false;}};
$('delete-doc').onclick=async()=>{if(!confirm('Delete this item and its original file? This cannot be undone.'))return;try{await api('/documents/'+$('doc-id').value,{method:'DELETE'});$('editor').close();toast('Item deleted.');await showView(state.view);}catch(error){$('editor-error').textContent=error.message;}};
document.querySelectorAll('.close-dialog').forEach(b=>b.onclick=()=>$('editor').close());$('doc-kind').onchange=kindChanged;
$('capture').onclick=$('first-note').onclick=()=>openEditor();$('help').onclick=$('chat-settings').onclick=()=>showView('settings');
document.querySelectorAll('[data-view]').forEach(b=>b.onclick=()=>{if(b.dataset.view==='library')state.tag='';showView(b.dataset.view);});
document.querySelectorAll('[data-kind]').forEach(b=>b.onclick=()=>{state.kind=b.dataset.kind;document.querySelectorAll('[data-kind]').forEach(t=>t.classList.toggle('active',t===b));refreshLibrary();});
$('search').oninput=()=>{clearTimeout(searchTimer);searchTimer=setTimeout(refreshLibrary,250);};$('search-mode').onchange=refreshLibrary;
$('import-button').onclick=()=>$('import-input').click();
$('import-input').onchange=async()=>{const files=Array.from($('import-input').files);$('import-button').disabled=true;let count=0;const errors=[];for(const file of files){try{const form=new FormData();form.append('file',file);await api('/import',{method:'POST',body:form});count++;}catch(error){errors.push(`${file.name}: ${error.message}`);}}$('import-input').value='';$('import-button').disabled=false;await showView('library');toast(`${count} file${count===1?'':'s'} imported.${errors.length?' '+errors.join(' '):''}`);};
$('sample-notes').onclick=async()=>{
  $('sample-notes').disabled=true;
  const samples=[
    {title:'A place for unfinished thoughts',kind:'note',tags:['welcome','ideas'],content:'Welcome to B-Ram. This is an example note — edit it, delete it, or make it your own.\n\nCapture ideas before they disappear. A question, a useful quote, a connection between two things you read. Your library doesn’t need to be perfect to be useful.'},
    {title:'Learning is a practice of returning',kind:'note',tags:['learning','habits'],content:'Example note: Spaced repetition helps us remember by revisiting ideas over increasing intervals.\n\nA useful routine: capture one idea, explain it in your own words, then revisit it tomorrow. B-Ram’s daily review brings your saved items back at 1, 3, 7, 14, and 30 day intervals.'},
    {title:'A small Python pattern: grouping ideas',kind:'snippet',tags:['python','tools'],content:'# Example: group notes by tag\nfrom collections import defaultdict\n\nby_tag = defaultdict(list)\nfor note in notes:\n    for tag in note.tags:\n        by_tag[tag].append(note.title)\n\n# Small tools make room for bigger ideas.'},
    {title:'SQLite: a database that travels with you',kind:'bookmark',tags:['local-first','reading'],url:'https://www.sqlite.org/about.html',content:'Example bookmark. SQLite stores a complete database in a single file. B-Ram uses it for your notes, original documents, full-text index, and local embedding vectors.\n\nSaved link only — this page has not been fetched or indexed.'}
  ];
  try{for(const doc of samples)await api('/documents',json('POST',doc));await showView('library');toast('Four example items added. Make them your own.');}catch(error){toast(error.message);}finally{$('sample-notes').disabled=false;}
};
async function refreshReview(){const docs=await api('/review');$('review-list').replaceChildren();if(!docs.length){const empty=el('div','empty-state');empty.append(el('span','empty-symbol','◷'),el('h2','','You’re all caught up.'),el('p','','Come back tomorrow. Your ideas will be here.'));$('review-list').append(empty);return;}for(const doc of docs){const article=el('article','review-card');article.append(el('span','eyebrow',`${types[doc.kind][1]} · ${doc.review_count} reviews`),el('h2','',doc.title),el('div','review-content',doc.content||doc.url));const actions=el('div','button-group');const open=el('button','text-button','Open item ›');open.onclick=()=>openEditor(doc.id);actions.append(open);for(const [label,remembered] of [['Revisit tomorrow',false],['I remember this ✓',true]]){const b=el('button','button '+(remembered?'primary':'secondary'),label);b.onclick=async()=>{b.disabled=true;try{await api(`/documents/${doc.id}/review`,json('POST',{remembered}));await refreshStats();await refreshReview();}catch(error){toast(error.message);b.disabled=false;}};actions.append(b);}article.append(actions);$('review-list').append(article);}}
$('chat-form').onsubmit=async(event)=>{event.preventDefault();const question=$('question').value.trim();if(!question)return;$('ask-button').disabled=true;$('ask-button').textContent='Thinking…';const user=el('div','chat-message');user.append(el('strong','','You'),document.createTextNode(question));$('conversation').append(user);const answer=el('div','chat-message assistant');answer.append(el('strong','','B-Ram'),document.createTextNode('Looking through your library…'));$('conversation').append(answer);try{const result=await api('/chat',json('POST',{question,mode:$('chat-mode').value}));answer.replaceChildren(el('strong','','B-Ram'),document.createTextNode(result.answer));if(result.sources.length){const sources=el('div','sources');result.sources.forEach((source,i)=>{const button=el('button','source-link',`[${i+1}] ${source.title}`);button.title=source.excerpt;button.onclick=()=>openEditor(source.id);sources.append(button);});answer.append(sources);}$('question').value='';}catch(error){answer.replaceChildren(el('strong','','B-Ram'),document.createTextNode(error.message));}finally{$('ask-button').disabled=false;$('ask-button').textContent='Ask B-Ram ›';answer.scrollIntoView({behavior:'smooth',block:'nearest'});}};
async function refreshStatus(){if(window.BRamLocal)return window.BRamLocal.renderStatus();const s=await api('/status');$('model-status').textContent=s.ollama?'Ollama is connected. Check that both models below are installed.':'Ollama is offline. Your library and full-text search still work.';$('model-details').replaceChildren();for(const [label,value] of [['Chat model',s.chat_model],['Embedding model',s.embedding_model],['Installed',s.models.join(', ')||'None detected']])$('model-details').append(el('dt','',label),el('dd','',value));$('model-commands').textContent=`ollama pull ${s.chat_model}\nollama pull ${s.embedding_model}`;$('data-path').textContent=s.data_path;}
$('refresh-status').onclick=()=>refreshStatus().catch(e=>toast(e.message));
$('build-index').onclick=async()=>{try{await api('/index',{method:'POST'});$('build-index').disabled=true;toast('Indexing queued. You can keep using your library.');clearInterval(indexTimer);indexTimer=setInterval(async()=>{try{await refreshStats();if(!state.stats.index.running){clearInterval(indexTimer);toast(state.stats.index.error||'Semantic index is up to date.');}}catch(e){clearInterval(indexTimer);toast(e.message);}},1500);}catch(error){toast(error.message);}};
$('restore-button').onclick=()=>$('restore-input').click();$('restore-input').onchange=async()=>{const file=$('restore-input').files[0];if(!file)return;$('restore-button').disabled=true;try{const form=new FormData();form.append('file',file);const result=await api('/restore',{method:'POST',body:form});toast(`${result.imported} items restored; ${result.skipped} existing items kept.`);await refreshStats();}catch(error){toast(error.message);}finally{$('restore-input').value='';$('restore-button').disabled=false;}};
document.addEventListener('keydown',event=>{if(['INPUT','TEXTAREA','SELECT'].includes(document.activeElement.tagName)||$('editor').open||event.metaKey||event.ctrlKey||event.altKey)return;if(event.key==='n'){event.preventDefault();openEditor();}if(event.key==='/'){event.preventDefault();showView('library');$('search').focus();}});
showView('library');
window.BRamUI={openEditor,showView,refreshStats,refreshLibrary,toast};
