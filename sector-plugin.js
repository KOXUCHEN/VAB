/* Optional, read-only sector companion. No changes to screening or source records. */
(() => {
  const labels={'Information Technology':'資訊科技','Health Care':'醫療保健','Financials':'金融','Consumer Discretionary':'非必需消費','Consumer Staples':'必需消費','Industrials':'工業','Energy':'能源','Utilities':'公用事業','Real Estate':'房地產','Materials':'原材料','Communication Services':'通訊服務'};
  const host=document.createElement('aside');host.id='sector-plugin';host.setAttribute('aria-label','Sector 產業插件');
  const style=document.createElement('style');style.textContent='#sector-plugin{position:fixed;right:20px;bottom:20px;z-index:1000;font:14px system-ui;color:#eee}#sector-plugin button{cursor:pointer;background:#222936;color:#fff;border:1px solid #657183;border-radius:8px;padding:9px 13px}#sector-panel{background:#11151d;border:1px solid #465365;border-radius:12px;padding:16px;width:min(370px,calc(100vw - 72px));max-height:65vh;overflow:auto;box-shadow:0 8px 35px #0009;margin-bottom:8px}#sector-plugin ul{list-style:none;padding:0;margin:10px 0}#sector-plugin li{display:flex;justify-content:space-between;gap:12px;padding:8px 0;border-bottom:1px solid #303642}#sector-plugin small{color:#aeb8c7}#sector-plugin .sector-active{color:#6ee7ca}#sector-plugin [hidden]{display:none}';document.head.append(style);
  host.innerHTML='<section id="sector-panel" hidden><strong>候選標的 · Sector</strong><p><small>分類快照：2026-09-24 · GICS<br>非歷史逐日分類；未收錄者顯示未分類。</small></p><div id="sector-current"></div><ul id="sector-list"></ul></section><button id="sector-toggle" aria-expanded="false" aria-controls="sector-panel">Sector · 產業</button>';document.body.append(host);
  const panel=host.querySelector('section'),toggle=host.querySelector('button');
  let map={};
  const industries={'Regional Banks':'地區銀行','Diversified Banks':'綜合銀行','Consumer Finance':'消費金融／信用貸款','Investment Banking & Brokerage':'投資銀行／證券經紀','Asset Management & Custody Banks':'資產管理／託管銀行','Financial Exchanges & Data':'金融交易所／數據','Transaction & Payment Processing Services':'交易與支付處理','Insurance Brokers':'保險經紀','Property & Casualty Insurance':'財產與意外險','Life & Health Insurance':'人壽與健康保險','Multi-line Insurance':'綜合保險','Reinsurance':'再保險','Multi-Sector Holdings':'跨產業控股','Electric Utilities':'電力公用事業','Gas Utilities':'天然氣公用事業','Water Utilities':'水務公用事業','Multi-Utilities':'綜合公用事業','Independent Power Producers & Energy Traders':'獨立發電／能源交易','Semiconductors':'半導體','Semiconductor Materials & Equipment':'半導體材料／設備','Application Software':'應用軟體','Systems Software':'系統軟體','Technology Hardware, Storage & Peripherals':'電腦硬體／儲存設備','Internet Services & Infrastructure':'網路服務／基礎設施','Interactive Media & Services':'互動媒體／網路服務','Pharmaceuticals':'製藥','Biotechnology':'生物科技','Health Care Equipment':'醫療設備','Managed Health Care':'管理式醫療保險','Aerospace & Defense':'航太與國防','Oil & Gas Exploration & Production':'油氣探勘／生產','Integrated Oil & Gas':'綜合油氣','Restaurants':'餐飲','Broadline Retail':'綜合零售','Automobile Manufacturers':'汽車製造','Data Center REITs':'資料中心 REIT','Retail REITs':'零售地產 REIT','Industrial REITs':'工業地產 REIT'};
  const tip=document.createElement('div');tip.id='sector-tooltip';tip.role='tooltip';tip.hidden=true;document.body.append(tip);
  style.textContent+='#sector-tooltip{position:fixed;z-index:1100;box-sizing:border-box;max-width:min(330px,calc(100vw - 16px));padding:13px 16px;background:#141b25;color:#edf3fa;border:1px solid #596d86;border-radius:10px;box-shadow:0 8px 28px #0009;font:13px/1.5 system-ui;pointer-events:none}#sector-tooltip[hidden]{display:none}#sector-tooltip strong{display:block;font-size:16px;color:#6ee7ca}#sector-tooltip small{display:block;color:#a8b6c8;margin-top:5px}';
  let tipTarget=null,loadState='loading';
  function hideTip(){if(tipTarget)tipTarget.removeAttribute('aria-describedby');tipTarget=null;tip.hidden=true;}
  function showTip(button){
    hideTip();tipTarget=button;const symbol=button.querySelector('strong')?.textContent?.trim(),entry=map[symbol];
    tip.replaceChildren();
    const title=document.createElement('strong'),detail=document.createElement('div'),note=document.createElement('small');
    title.textContent=symbol+' · '+(labels[entry?.sector]||entry?.sector||'未分類');
    detail.textContent=entry?(industries[entry.industry]||entry.industry):(loadState==='loading'?'分類載入中…':loadState==='error'?'分類載入失敗':'來源未收錄細分產業');
    note.textContent=entry?'GICS 細分產業 · 2026-09-24 快照':'不根據公司名稱推測業務';
    tip.append(title,detail,note);tip.hidden=false;button.setAttribute('aria-describedby',tip.id);
    const rect=button.getBoundingClientRect(),box=tip.getBoundingClientRect();
    tip.style.left=Math.max(8,Math.min(rect.left,innerWidth-box.width-8))+'px';
    tip.style.top=Math.max(8,rect.bottom+8+box.height<innerHeight?rect.bottom+8:rect.top-box.height-8)+'px';
  }
  const table=document.getElementById('rows');
  table.addEventListener('pointerover',e=>{const b=e.target.closest('.ticker-btn');if(b&&b!==tipTarget)showTip(b);});
  table.addEventListener('pointerout',e=>{const b=e.target.closest('.ticker-btn');if(b&&!b.contains(e.relatedTarget))hideTip();});
  table.addEventListener('focusin',e=>{const b=e.target.closest('.ticker-btn');if(b)showTip(b);});
  table.addEventListener('focusout',hideTip);
  document.addEventListener('keydown',e=>{if(e.key==='Escape')hideTip();});
  document.addEventListener('scroll',hideTip,true);window.addEventListener('resize',hideTip);
  function render(){
    if(tipTarget&&!tipTarget.isConnected)hideTip();
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
  fetch('./sectors.json').then(r=>{if(!r.ok)throw Error();return r.json();}).then(data=>{map=data.symbols;loadState='ready';render();if(tipTarget)showTip(tipTarget);}).catch(()=>{loadState='error';host.querySelector('#sector-current').textContent='分類資料載入失敗，請重新整理';if(tipTarget)showTip(tipTarget);});
})();
