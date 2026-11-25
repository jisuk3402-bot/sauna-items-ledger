const STORAGE_KEY='sauna-items-webapp-v1';
const PLACEHOLDER='data:image/svg+xml;charset=UTF-8,'+encodeURIComponent('<svg xmlns="http://www.w3.org/2000/svg" width="600" height="600"><rect width="100%" height="100%" fill="#eee7e0"/><text x="50%" y="49%" text-anchor="middle" font-family="sans-serif" font-size="42" fill="#8f8178">이미지 없음</text></svg>');
const DEFAULT_ITEMS=[
{id:'p01',name:'구슬괄사',image:'assets/products/product-01.jpg',vendor:'제일상회',purpose:'',price:'',note:''},
{id:'p02',name:'클렌징 브러시',image:'assets/products/product-02.jpg',vendor:'제일상회',purpose:'',price:'',note:''},
{id:'p03',name:'글로브 타월',image:'assets/products/product-03.jpg',vendor:'제일상회',purpose:'',price:'',note:''},
{id:'p04',name:'장갑 타월',image:'assets/products/product-04.jpg',vendor:'제일상회',purpose:'',price:'',note:''},
{id:'p05',name:'인견 코끼리 타월',image:'assets/products/product-05.jpg',vendor:'제일상회',purpose:'',price:'',note:''},
{id:'p06',name:'손잡이 타월',image:'assets/products/product-06.jpg',vendor:'제일상회',purpose:'',price:'',note:''},
{id:'p07',name:'진실이네 빛소금',image:'assets/products/product-07.jpg',vendor:'부창상회',purpose:'',price:'',note:''},
{id:'p08',name:'로사베누스 비누',image:'assets/products/product-08.jpg',vendor:'부창상회',purpose:'',price:'',note:''},
{id:'p09',name:'백색미인 비누',image:'assets/products/product-09.jpg',vendor:'부창상회',purpose:'',price:'',note:''},
{id:'p10',name:'콜게이트 치약',image:'assets/products/product-10.jpg',vendor:'부창상회',purpose:'',price:'',note:''}
];
let items=[];let query='';let vendorFilter='전체';let editingId=null;let pendingImage='';let saveTimer;let toastTimer;
const $=s=>document.querySelector(s);const $$=s=>[...document.querySelectorAll(s)];
const cloneDefaults=()=>JSON.parse(JSON.stringify(DEFAULT_ITEMS));
function esc(v=''){return String(v).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));}
function parseMoney(v){return Math.max(0,Number(String(v??'').replace(/[^0-9.-]/g,''))||0);}
function formatNumber(v){const n=parseMoney(v);return n?new Intl.NumberFormat('ko-KR').format(n):'';}
function won(v){return new Intl.NumberFormat('ko-KR').format(parseMoney(v))+'원';}
function uid(){return 'p'+Date.now().toString(36)+Math.random().toString(36).slice(2,6);}
function load(){try{const saved=JSON.parse(localStorage.getItem(STORAGE_KEY)||'null');items=Array.isArray(saved)&&saved.length?saved:cloneDefaults();}catch{items=cloneDefaults();}render();}
function save(){clearTimeout(saveTimer);saveTimer=setTimeout(()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(items));}catch{toast('저장 공간이 부족합니다. 백업을 저장해주세요.');}},180);}
function filtered(){const q=query.trim().toLowerCase();return items.filter(x=>(vendorFilter==='전체'||x.vendor===vendorFilter)&&(!q||[x.name,x.vendor,x.purpose,x.note].join(' ').toLowerCase().includes(q)));}
function vendors(){return [...new Set(items.map(x=>x.vendor.trim()).filter(Boolean))].sort((a,b)=>a.localeCompare(b,'ko'));}
function render(){renderStats();renderFilters();renderDesktop();renderMobile();renderVendorList();}
function renderStats(){const total=items.reduce((s,x)=>s+parseMoney(x.price),0);$('#itemCount').textContent=items.length+'개';$('#pricedCount').textContent=items.filter(x=>parseMoney(x.price)>0).length+'개';$('#grandTotal').textContent=won(total);$('#mobileTotal').textContent=won(total);}
function renderFilters(){const vals=['전체',...vendors()];$('#vendorFilters').innerHTML=vals.map(v=>`<button class="filter-chip ${v===vendorFilter?'active':''}" data-vendor-filter="${esc(v)}">${esc(v)} ${v==='전체'?`(${items.length})`:`(${items.filter(x=>x.vendor===v).length})`}</button>`).join('');}
function renderVendorList(){$('#vendorList').innerHTML=vendors().map(v=>`<option value="${esc(v)}">`).join('');}
function renderDesktop(){const list=filtered();$('#desktopEmpty').hidden=list.length>0;$('#desktopRows').innerHTML=list.map(x=>`<tr data-id="${x.id}"><td><div class="product-cell"><button class="thumb-button" data-edit="${x.id}" aria-label="${esc(x.name)} 이미지 변경"><img class="thumb" src="${x.image||PLACEHOLDER}" alt=""></button><input class="cell-input product-name" data-field="name" value="${esc(x.name)}" placeholder="제품명"></div></td><td><input class="cell-input" data-field="vendor" list="vendorList" value="${esc(x.vendor)}" placeholder="업체명"></td><td><textarea class="cell-textarea" data-field="purpose" placeholder="용도">${esc(x.purpose)}</textarea></td><td><input class="cell-input money" data-field="price" inputmode="numeric" value="${formatNumber(x.price)}" placeholder="0"></td><td><textarea class="cell-textarea" data-field="note" placeholder="MOQ·VAT·규격 등">${esc(x.note)}</textarea></td><td><div class="row-actions"><button class="small-action" data-edit="${x.id}">편집</button><button class="small-action delete" data-delete="${x.id}">삭제</button></div></td></tr>`).join('');}
function renderMobile(){const list=filtered();$('#mobileEmpty').hidden=list.length>0;$('#mobileCards').innerHTML=list.map(x=>`<article class="product-card"><img src="${x.image||PLACEHOLDER}" alt="${esc(x.name)}"><div><h3>${esc(x.name||'제품명 없음')}</h3><span class="vendor-badge">${esc(x.vendor||'업체 미입력')}</span><span class="card-price ${parseMoney(x.price)?'':'empty'}">${parseMoney(x.price)?won(x.price):'단가 미입력'}</span></div><button class="edit-card" data-edit="${x.id}">편집</button></article>`).join('');}
function updateItem(id,field,value){const x=items.find(i=>i.id===id);if(!x)return;x[field]=field==='price'?(parseMoney(value)||''):value;save();renderStats();if(field==='vendor')renderFilters();}
$('#desktopRows').addEventListener('input',e=>{const field=e.target.dataset.field;if(!field)return;const id=e.target.closest('tr').dataset.id;const x=items.find(i=>i.id===id);if(!x)return;x[field]=e.target.value;save();if(field==='price')renderStats();});
$('#desktopRows').addEventListener('blur',e=>{const field=e.target.dataset.field;if(!field)return;const id=e.target.closest('tr').dataset.id;if(field==='price'){const n=parseMoney(e.target.value);e.target.value=n?formatNumber(n):'';updateItem(id,field,n);}else if(field==='vendor'){updateItem(id,field,e.target.value.trim());}},true);
document.addEventListener('click',e=>{const add=e.target.closest('[data-add]');if(add){openEditor();return;}const edit=e.target.closest('[data-edit]');if(edit){openEditor(edit.dataset.edit);return;}const del=e.target.closest('[data-delete]');if(del){removeItem(del.dataset.delete);return;}const vf=e.target.closest('[data-vendor-filter]');if(vf){vendorFilter=vf.dataset.vendorFilter;render();return;}const sv=e.target.closest('[data-filter-vendor]');if(sv){vendorFilter=sv.dataset.filterVendor;render();return;}if(e.target.closest('[data-close]'))closeEditor();});
$('#searchInput').addEventListener('input',e=>{query=e.target.value;renderDesktop();renderMobile();});
function openEditor(id=null){editingId=id;const x=id?items.find(i=>i.id===id):{name:'',image:'',vendor:'',purpose:'',price:'',note:''};if(!x)return;pendingImage=x.image||'';$('#dialogEyebrow').textContent=id?'제품 정보':'새 제품';$('#dialogTitle').textContent=id?'제품 편집':'제품 추가';$('#editName').value=x.name;$('#editVendor').value=x.vendor;$('#editPrice').value=formatNumber(x.price);$('#editPurpose').value=x.purpose;$('#editNote').value=x.note;$('#editImagePreview').src=x.image||PLACEHOLDER;$('#deleteInDialog').hidden=!id;$('#editorDialog').showModal();setTimeout(()=>$('#editName').focus(),100);}
function closeEditor(){if($('#editorDialog').open)$('#editorDialog').close();editingId=null;pendingImage='';$('#editImageFile').value='';}
$('#editorForm').addEventListener('submit',e=>{e.preventDefault();const data={name:$('#editName').value.trim(),vendor:$('#editVendor').value.trim(),price:parseMoney($('#editPrice').value)||'',purpose:$('#editPurpose').value.trim(),note:$('#editNote').value.trim(),image:pendingImage};if(!data.name){$('#editName').focus();return;}if(editingId){Object.assign(items.find(x=>x.id===editingId),data);toast('제품 정보를 저장했습니다.');}else{items.push({id:uid(),...data});toast('새 제품을 추가했습니다.');}save();render();closeEditor();});
$('#chooseImage').addEventListener('click',()=>$('#editImageFile').click());
$('#editImageFile').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;compressImage(f).then(uri=>{pendingImage=uri;$('#editImagePreview').src=uri;});});
function compressImage(file){return new Promise((resolve,reject)=>{const r=new FileReader();r.onerror=reject;r.onload=()=>{const im=new Image();im.onerror=reject;im.onload=()=>{const max=1200,scale=Math.min(1,max/Math.max(im.width,im.height)),c=document.createElement('canvas');c.width=Math.round(im.width*scale);c.height=Math.round(im.height*scale);c.getContext('2d').drawImage(im,0,0,c.width,c.height);resolve(c.toDataURL('image/jpeg',.82));};im.src=r.result;};r.readAsDataURL(file);});}
function removeItem(id){const x=items.find(i=>i.id===id);if(!x||!confirm(`“${x.name}” 제품을 삭제할까요?`))return;items=items.filter(i=>i.id!==id);save();render();if($('#editorDialog').open)closeEditor();toast('제품을 삭제했습니다.');}
$('#deleteInDialog').addEventListener('click',()=>editingId&&removeItem(editingId));
$('#editPrice').addEventListener('blur',e=>{e.target.value=formatNumber(e.target.value);});
$('#exportCsv').addEventListener('click',()=>{const head=['No.','제품명','제품이미지','용도','가격(원)','업체명','비고'];const rows=items.map((x,i)=>[i+1,x.name,x.image?'웹앱 이미지 참조':'',x.purpose,parseMoney(x.price)||'',x.vendor,x.note]);const csv=[head,...rows].map(r=>r.map(csvCell).join(',')).join('\r\n');download('\ufeff'+csv,'사우나템_사입단가_제품리스트.csv','text/csv;charset=utf-8');toast('CSV를 저장했습니다.');});
$('#exportJson').addEventListener('click',()=>{download(JSON.stringify({version:1,exportedAt:new Date().toISOString(),items},null,2),'사우나템_웹앱_백업.json','application/json');toast('백업을 저장했습니다.');});
$('#importJson').addEventListener('click',()=>{$('#importFile').value='';$('#importFile').click();document.querySelector('.more-menu').open=false;});
$('#importFile').addEventListener('change',e=>{const f=e.target.files[0];if(!f)return;const r=new FileReader();r.onload=()=>{try{const d=JSON.parse(r.result),incoming=Array.isArray(d)?d:d.items;if(!Array.isArray(incoming))throw 0;items=incoming.map(x=>({id:x.id||uid(),name:x.name||'',image:x.image||'',vendor:x.vendor||'',purpose:x.purpose||'',price:parseMoney(x.price)||'',note:x.note||''}));save();render();toast('백업을 불러왔습니다.');}catch{alert('올바른 백업 파일이 아닙니다.');}};r.readAsText(f);});
$('#resetBtn').addEventListener('click',()=>{document.querySelector('.more-menu').open=false;if(!confirm('입력한 내용을 지우고 최초 10개 목록으로 복원할까요?'))return;items=cloneDefaults();save();render();toast('기본 목록으로 복원했습니다.');});
$('#printBtn').addEventListener('click',()=>{document.querySelector('.more-menu').open=false;window.print();});
function csvCell(v){return '"'+String(v??'').replace(/"/g,'""')+'"';}
function download(content,name,type){const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([content],{type}));a.download=name;document.body.appendChild(a);a.click();setTimeout(()=>{URL.revokeObjectURL(a.href);a.remove();},500);}
function toast(msg){const el=$('#toast');el.textContent=msg;el.classList.add('show');clearTimeout(toastTimer);toastTimer=setTimeout(()=>el.classList.remove('show'),1800);}
$('#editorDialog').addEventListener('click',e=>{if(e.target===$('#editorDialog'))closeEditor();});
window.addEventListener('beforeunload',()=>{try{localStorage.setItem(STORAGE_KEY,JSON.stringify(items));}catch{}});
if('serviceWorker' in navigator&&location.protocol.startsWith('http'))navigator.serviceWorker.register('sw.js').catch(()=>{});
load();
