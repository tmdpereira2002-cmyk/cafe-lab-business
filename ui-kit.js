/* Café Lab UI kit: brand-first picker for long menus, and short lists that open on tap.
   Shared by Café Lab and Café Lab Business.
   Picker: Picker.attach(selectElement,{title}) hides the <select> and shows a button. Tapping it opens a panel:
   brands first (each <optgroup> is a brand), then that brand's models, with a search box.
   The <select> stays the source of truth: code can still read and set .value, and gets 'change' events.
   Clamp.apply(container,n,key) shows the first n children and a "Show all (N)" button. */
(function(){
 const TX=k=>(typeof window.UIKIT_TEXT==="function"&&window.UIKIT_TEXT(k))||({choose:"Choose",search:"Search",all:"All brands",none:"Nothing matches.",close:"Close",current:"Selected",showAll:"Show all ({n})",showLess:"Show fewer"})[k];
 const esc=s=>String(s).replace(/[&<>"]/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;"})[c]);
 const CSS=`.pkBtn{display:flex;align-items:center;gap:10px;width:100%;min-height:44px;padding:8px 12px;border:1px solid var(--line,#ddd);border-radius:10px;background:var(--bg,#fff);color:var(--ink,#222);font:inherit;font-size:16px;text-align:left;cursor:pointer}
.pkBtn .pkTxt{flex:1;min-width:0;display:flex;flex-direction:column;line-height:1.25}.pkBtn .pkG{font-size:12px;color:var(--muted,#777)}.pkBtn .pkN{overflow-wrap:anywhere}.pkBtn svg{flex:none;width:18px;height:18px;opacity:.6}
dialog.pkWrap{position:fixed;inset:0;z-index:1000;margin:0!important;padding:0!important;border:0!important;width:100%!important;height:100%!important;max-width:none!important;max-height:none!important;background:transparent!important;display:flex;align-items:flex-end;justify-content:center;overflow:hidden;animation:none!important;box-shadow:none!important}dialog.pkWrap::backdrop{background:rgba(20,10,5,.5)}
@media (min-width:600px){.pkWrap{align-items:center}}
.pk{background:var(--surface,#fff);color:var(--ink,#222);width:100%;max-width:520px;max-height:min(86vh,720px);border-radius:20px 20px 0 0;display:flex;flex-direction:column;box-shadow:0 -6px 30px rgba(0,0,0,.25);padding-bottom:env(safe-area-inset-bottom,0px)}
@media (min-width:600px){.pk{border-radius:20px}}
.pkHead{display:flex;align-items:center;gap:8px;padding:12px 12px 8px 16px}.pkHead h2{flex:1;min-width:0;margin:0;font-size:18px;line-height:1.25}
.pkX{flex:none;width:40px;height:40px;padding:0;min-height:0;display:grid;place-items:center;box-shadow:none;border-radius:99px;border:1px solid var(--line,#ddd);background:var(--surface,#fff);color:var(--ink,#222);font-size:18px;cursor:pointer}
.pkSearch{margin:0 16px 8px;width:calc(100% - 32px)!important}
.pkBack{align-self:flex-start;box-shadow:none;margin:0 12px 4px;background:none;border:0;color:var(--crema,#985718);font:inherit;font-weight:600;padding:8px 4px;min-height:40px;cursor:pointer}
.pkList{overflow:auto;padding:0 8px 12px;overscroll-behavior:contain}
.pkRow{box-shadow:none;border-radius:0;display:flex;align-items:center;gap:10px;width:100%;min-height:48px;padding:10px 10px;border:0;border-bottom:1px solid var(--line,#eee);background:none;color:inherit;font:inherit;font-size:16px;text-align:left;cursor:pointer}
.pkRow:last-child{border-bottom:0}.pkRow .pkL{flex:1;min-width:0;overflow-wrap:anywhere}.pkRow small{color:var(--muted,#777);font-size:13px;flex:none}
.pkRow.on{font-weight:700;color:var(--crema,#985718)}.pkRow.on::after{content:"✓";flex:none}
.pkRow.brand::after{content:"›";flex:none;font-size:20px;color:var(--muted,#777)}.pkRow.brand.on::after{content:"✓ ›"}
.pkSec{font-size:12px;font-weight:700;letter-spacing:.04em;text-transform:uppercase;color:var(--muted,#777);padding:12px 10px 4px}
.pkEmpty{padding:16px;color:var(--muted,#777)}
select.pkHidden,.clampHide{display:none!important}
.clampBtn{display:block;width:100%;margin-top:8px;min-height:44px;border:1px dashed var(--line,#ddd);border-radius:12px;background:transparent;color:var(--crema,#985718);font:inherit;font-weight:600;cursor:pointer}`;
 function css(){if(document.getElementById("uikitCss"))return;const s=document.createElement("style");s.id="uikitCss";s.textContent=CSS;document.head.appendChild(s)}
 const CHEV='<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M8 10l4 4 4-4"/></svg>';
 // read the select into groups: [{label, items:[{value,text,full}]}]; options outside a group become top-level items
 function model(sel){const top=[],groups=[];for(const el of sel.children){if(el.tagName==="OPTGROUP"){const items=[...el.children].filter(o=>o.tagName==="OPTION"&&!o.disabled).map(o=>({value:o.value,text:o.textContent,full:o.dataset.full||((el.dataset.brand==="0"?"":el.label+" ")+o.textContent)}));if(items.length)groups.push({label:el.label,special:el.dataset.brand==="0",items})}else if(el.tagName==="OPTION"&&!el.disabled)top.push({value:el.value,text:el.textContent,full:el.dataset.full||el.textContent})}return {top,groups}}
 function current(sel){const o=sel.options[sel.selectedIndex];if(!o)return {g:"",n:""};const p=o.parentElement;const full=o.dataset.full;if(p&&p.tagName==="OPTGROUP"&&p.dataset.brand!=="0")return {g:full?"":p.label,n:full||o.textContent,brand:p.label};return {g:"",n:full||o.textContent,brand:p&&p.tagName==="OPTGROUP"?p.label:""}}
 function attach(sel,opts={}){if(!sel||sel._pk)return;css();const btn=document.createElement("button");btn.type="button";btn.className="pkBtn";btn.setAttribute("aria-haspopup","dialog");sel.classList.add("pkHidden");sel.after(btn);sel._pk={btn,opts};
  const lab=sel.closest("label");if(lab){lab.addEventListener("click",e=>{if(e.target===lab||e.target.tagName==="SPAN"&&!btn.contains(e.target)){e.preventDefault()}})}
  const paint=()=>{const c=current(sel);btn.innerHTML=`<span class="pkTxt">${c.g?`<span class="pkG">${esc(c.g)}</span>`:""}<span class="pkN">${esc(c.n||TX("choose"))}</span></span>${CHEV}`;const t=opts.title||(lab&&lab.querySelector("span")?lab.querySelector("span").textContent:"");btn.setAttribute("aria-label",`${t}: ${c.g?c.g+" ":""}${c.n}`)};
  sel._pk.paint=paint;paint();
  // keep the button in step with the select, however it changes
  const own=Object.getOwnPropertyDescriptor(sel,"value"),proto=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,"value"),d=own||proto;
  Object.defineProperty(sel,"value",{get(){return d.get.call(this)},set(v){d.set.call(this,v);paint()},configurable:true});
  const pi=Object.getOwnPropertyDescriptor(HTMLSelectElement.prototype,"selectedIndex");Object.defineProperty(sel,"selectedIndex",{get(){return pi.get.call(this)},set(v){pi.set.call(this,v);paint()},configurable:true});
  sel.addEventListener("change",paint);new MutationObserver(paint).observe(sel,{childList:true,subtree:true,attributes:true,characterData:true});
  btn.addEventListener("click",()=>open(sel))}
 function open(sel){const {btn,opts}=sel._pk,m=model(sel),cur=sel.value,title=opts.title||((sel.closest("label")||{}).querySelector?.("span")?.textContent)||TX("choose");
  const wrap=document.createElement("dialog");wrap.className="pkWrap";wrap.innerHTML=`<div class="pk" role="dialog" aria-modal="true" aria-label="${esc(title)}"><div class="pkHead"><h2>${esc(title)}</h2><button type="button" class="pkX" aria-label="${esc(TX("close"))}">✕</button></div>${m.groups.length+m.top.length>8?`<input type="search" class="pkSearch" placeholder="${esc(TX("search"))}" aria-label="${esc(TX("search"))}" autocomplete="off">`:""}<div class="pkBackBox"></div><div class="pkList"></div></div>`;
  document.body.appendChild(wrap);try{wrap.showModal()}catch(e){wrap.setAttribute("open","")}const list=wrap.querySelector(".pkList"),back=wrap.querySelector(".pkBackBox"),q=wrap.querySelector(".pkSearch");const prevOverflow=document.documentElement.style.overflow;document.documentElement.style.overflow="hidden";
  const row=(it,brandLabel)=>`<button type="button" class="pkRow${it.value===cur?" on":""}" data-v="${esc(it.value)}"><span class="pkL">${esc(it.text)}</span></button>`;
  const inGroup=g=>g.items.some(i=>i.value===cur);
  const brands=()=>{back.innerHTML="";const special=m.groups.filter(g=>g.special),normal=m.groups.filter(g=>!g.special);
   list.innerHTML=(m.top.length?m.top.map(i=>row(i)).join(""):"")+special.map(g=>`<button type="button" class="pkRow brand${inGroup(g)?" on":""}" data-g="${m.groups.indexOf(g)}"><span class="pkL">${esc(g.label)}</span><small>${g.items.length}</small></button>`).join("")+(normal.length?(special.length||m.top.length?`<div class="pkSec">${esc(TX("all"))}</div>`:"")+normal.map(g=>`<button type="button" class="pkRow brand${inGroup(g)?" on":""}" data-g="${m.groups.indexOf(g)}"><span class="pkL">${esc(g.label)}</span><small>${g.items.length}</small></button>`).join(""):"");list.scrollTop=0};
  const group=i=>{const g=m.groups[i];back.innerHTML=`<button type="button" class="pkBack">‹ ${esc(TX("all"))}</button>`;list.innerHTML=`<div class="pkSec">${esc(g.label)}</div>`+g.items.map(it=>row(it)).join("");list.scrollTop=0;const b=back.querySelector(".pkBack");b.onclick=()=>{brands();(q||b).focus&&list.querySelector(".pkRow")?.focus()};const on=list.querySelector(".pkRow.on")||list.querySelector(".pkRow");on&&on.focus()};
  const search=s=>{s=s.trim().toLowerCase();if(!s)return brands();back.innerHTML="";const hits=[...m.top.map(i=>({...i,lab:i.text})),...m.groups.flatMap(g=>g.items.map(i=>({...i,lab:g.special?i.text:g.label+" "+i.text})))].filter(i=>i.lab.toLowerCase().includes(s)||i.full.toLowerCase().includes(s));const seen=new Set();list.innerHTML=hits.filter(h=>{const k=h.value+"|"+h.lab;if(seen.has(k))return false;seen.add(k);return true}).map(h=>row({value:h.value,text:h.lab})).join("")||`<p class="pkEmpty">${esc(TX("none"))}</p>`};
  const close=()=>{document.documentElement.style.overflow=prevOverflow;try{wrap.close()}catch(e){}wrap.remove();setTimeout(()=>{if(typeof window.unlockPage==="function")window.unlockPage()},0);document.removeEventListener("keydown",key,true);btn.focus()};
  const key=e=>{if(e.key==="Escape"){e.stopPropagation();e.preventDefault();close()}};document.addEventListener("keydown",key,true);wrap.addEventListener("cancel",e=>{e.preventDefault();close()});
  wrap.addEventListener("click",e=>{if(e.target===wrap||e.target.closest(".pkX"))return close();const r=e.target.closest(".pkRow");if(!r)return;if(r.dataset.g!=null)return group(+r.dataset.g);const v=r.dataset.v;sel.value=v;sel.dispatchEvent(new Event("input",{bubbles:true}));sel.dispatchEvent(new Event("change",{bubbles:true}));sel._pk.paint();close()});
  if(q)q.addEventListener("input",()=>search(q.value));
  // open inside the brand of the current choice when there is one, so a change of model is one tap
  const gi=m.groups.findIndex(g=>!g.special&&inGroup(g));if(gi>=0&&opts.openBrand!==false)group(gi);else brands();
  (wrap.querySelector(".pkRow.on")||wrap.querySelector(".pkX")).focus()}
 const expanded=new Set();
 function apply(box,n=3,key){if(!box)return;key=key||box.id;const kids=[...box.children].filter(c=>!c.classList.contains("clampBtn")&&!c.hasAttribute("data-noclamp")&&!/^H[1-6]$/.test(c.tagName));box.querySelectorAll(":scope>.clampBtn").forEach(b=>b.remove());
  if(kids.length<=n){kids.forEach(k=>k.classList.remove("clampHide"));return}css();const openNow=expanded.has(key);kids.forEach((k,i)=>k.classList.toggle("clampHide",!openNow&&i>=n));
  const b=document.createElement("button");b.type="button";b.className="clampBtn";b.textContent=openNow?TX("showLess"):TX("showAll").replace("{n}",kids.length);b.setAttribute("aria-expanded",String(openNow));
  b.onclick=()=>{if(expanded.has(key))expanded.delete(key);else expanded.add(key);apply(box,n,key);if(!expanded.has(key))box.scrollIntoView({block:"nearest"})};kids[kids.length-1].after(b)}
 const auto=()=>document.querySelectorAll("select[data-picker]").forEach(s=>attach(s,{title:s.dataset.picker||undefined}));
 if(document.readyState!=="loading")auto();else document.addEventListener("DOMContentLoaded",auto);
 new MutationObserver(ms=>{if(ms.some(m=>[...m.addedNodes].some(n=>n.nodeType===1&&(n.matches("select[data-picker]")||n.querySelector&&n.querySelector("select[data-picker]")))))auto()}).observe(document.documentElement,{childList:true,subtree:true});
 const clampAll=root=>{(root.matches&&root.matches("[data-clamp]")?[root]:[]).concat([...(root.querySelectorAll?root.querySelectorAll("[data-clamp]"):[])]).forEach(b=>apply(b,+b.dataset.clamp||3,b.dataset.clampKey||b.id))};
 new MutationObserver(ms=>{const todo=new Set();for(const m of ms){const ns=[...m.addedNodes,...m.removedNodes];if(ns.length&&ns.every(n=>n.nodeType===1&&n.classList.contains("clampBtn")))continue;const t=m.target;if(t.nodeType===1&&t.matches("[data-clamp]"))todo.add(t);for(const n of m.addedNodes)if(n.nodeType===1&&(n.matches("[data-clamp]")||n.querySelector("[data-clamp]")))todo.add(n)}todo.forEach(clampAll)}).observe(document.documentElement,{childList:true,subtree:true});
 if(document.readyState!=="loading")clampAll(document);else document.addEventListener("DOMContentLoaded",()=>clampAll(document));
 window.Picker={attach,open,refresh:sel=>sel&&sel._pk&&sel._pk.paint()};window.Clamp={apply};
})();
