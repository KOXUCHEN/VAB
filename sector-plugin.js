/* Optional, read-only sector companion. No changes to screening or source records. */
(() => {
  const labels={'Information Technology':'資訊科技','Health Care':'醫療保健','Financials':'金融','Consumer Discretionary':'非必需消費','Consumer Staples':'必需消費','Industrials':'工業','Energy':'能源','Utilities':'公用事業','Real Estate':'房地產','Materials':'原材料','Communication Services':'通訊服務'};
  const host=document.createElement('aside');host.id='sector-plugin';host.setAttribute('aria-label','Sector 產業插件');
  const style=document.createElement('style');style.textContent='#sector-plugin{position:fixed;right:20px;bottom:20px;z-index:1000;font:14px system-ui;color:#eee}#sector-plugin button{cursor:pointer;background:#222936;color:#fff;border:1px solid #657183;border-radius:8px;padding:9px 13px}#sector-panel{background:#11151d;border:1px solid #465365;border-radius:12px;padding:16px;width:min(370px,calc(100vw - 72px));max-height:65vh;overflow:auto;box-shadow:0 8px 35px #0009;margin-bottom:8px}#sector-plugin ul{list-style:none;padding:0;margin:10px 0}#sector-plugin li{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #303642}#sector-plugin small{color:#aeb8c7}#sector-plugin .sector-active{color:#6ee7ca}#sector-plugin [hidden]{display:none}';document.head.append(style);
  host.innerHTML='<section id="sector-panel" hidden><strong>候選標的 · Sector</strong><p><small>分類快照：2026-09-24 · GICS<br>非歷史逐日分類；未收錄者顯示未分類。</small></p><div id="sector-current"></div><ul id="sector-list"></ul></section><button id="sector-toggle" aria-expanded="false" aria-controls="sector-panel">Sector · 產業</button>';document.body.append(host);
  const panel=host.querySelector('section'),toggle=host.querySelector('button');
  let map={};
  function render(){
    const list=host.querySelector('ul');list.replaceChildren();
    document.querySelectorAll('#rows tr').forEach(row=>{
      const symbol=row.querySelector('.ticker-btn strong')?.textContent;if(!symbol)return;
      const sector=map[symbol]?.sector,li=document.createElement('li'),name=document.createElement('span'),badge=document.createElement('span');
      name.textContent=symbol;badge.textContent=labels[sector]||sector||'未分類';badge.title=sector?sector+' / '+map[symbol].industry:'來源快照未收錄';
      if(row.classList.contains('selected'))li.classList.add('sector-active');li.append(name,badge);list.append(li);
    });
    if(!list.children.length)list.textContent='目前沒有候選標的';
    const symbol=document.querySelector('#rows tr.selected .ticker-btn strong')?.textContent;
    host.querySelector('#sector-current').textContent=symbol?'目前選取：'+symbol+' · '+(labels[map[symbol]?.sector]||map[symbol]?.sector||'未分類'):'';
  }
  toggle.onclick=()=>{panel.hidden=!panel.hidden;toggle.setAttribute('aria-expanded',String(!panel.hidden));try{localStorage.setItem('vab-sector-open',String(!panel.hidden));}catch{}render();};
  try{panel.hidden=localStorage.getItem('vab-sector-open')!=='true';toggle.setAttribute('aria-expanded',String(!panel.hidden));}catch{}
  new MutationObserver(render).observe(document.getElementById('rows'),{childList:true,subtree:true,attributes:true,attributeFilter:['class']});
  fetch('./sectors.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{map=data.symbols;render();}).catch(()=>{host.querySelector('#sector-current').textContent='分類資料載入失敗，請重新整理';});
})();
