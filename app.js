const $=id=>document.getElementById(id);
const STATIC_MODE=window.VWAP_STATIC===true;
const defaults={mode:'between',target:'either',distance:1,side:'any',spreadEnabled:false,maxSpread:1.5,excludeShort:false,groups:['SP500','NDX100','DJIA'],search:''};
let rows=[],matches=[],date='',sortKey='spread_pct',ascending=true,active=null,history=null,historyRequest=0;
const money=n=>Number(n).toLocaleString('en-US',{minimumFractionDigits:2,maximumFractionDigits:2});
const pct=n=>(n>0?'+':'')+n.toFixed(2)+'%';
const pretty=d=>d.slice(0,4)+'-'+d.slice(4,6)+'-'+d.slice(6);
const escapeHTML=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
function config(){return {mode:$('mode').value,target:$('target').value,distance:Number($('distance').value),side:$('side').value,
  spreadEnabled:$('spreadEnabled').checked,maxSpread:Number($('maxSpread').value),excludeShort:$('excludeShort').checked,
  groups:[...document.querySelectorAll('input[name=group]:checked')].map(x=>x.value),search:$('search').value.trim()};}
function applyConfig(f){for(const k of ['mode','target','distance','side','maxSpread','search'])$(k).value=f[k];
  for(const k of ['spreadEnabled','excludeShort'])$(k).checked=f[k];
  document.querySelectorAll('input[name=group]').forEach(x=>x.checked=f.groups.includes(x.value));}
function updateControls(f){
  const near=['near','or','and'].includes(f.mode);
  $('nearOptions').disabled=!near;$('spreadOptions').disabled=f.mode==='legacy';$('maxSpread').disabled=!f.spreadEnabled||f.mode==='legacy';
  $('modeHint').textContent={between:'收盤價介於較低與較高 VWAP，含邊界。沒有自動套用合併線規則。',near:'選擇參考線與允許的百分比距離。',or:'兩線之間或附近，符合其中一項即可。',and:'需同時位於兩線之間，且符合附近條件。',legacy:'Spread ≤0.8% 且低於兩線平均值；或 0.8%～1.5% 且在兩線之間。附近與額外 Spread 設定不套用。'}[f.mode];
}
function filter(){
  const f=config(); updateControls(f);
  const needsDistance=['near','or','and'].includes(f.mode),needsSpread=f.spreadEnabled&&f.mode!=='legacy';
  if((needsDistance&&(!$('distance').value||!$('distance').checkValidity()))||(needsSpread&&(!$('maxSpread').value||!$('maxSpread').checkValidity()))){
    $('error').hidden=false;$('error').textContent='請輸入 0～100 的有效百分比。';$('export').disabled=true;return;
  }
  $('error').hidden=true;
  try{localStorage.setItem('vwap-lab-filters-v1',JSON.stringify(f));}catch(e){$('saved').textContent='瀏覽器不允許儲存設定；本次仍可使用。';}
  matches=rows.filter(r=>VwapFilters.evaluate(r,f).pass);
  const value=r=>sortKey==='annualDistance'?VwapFilters.metrics(r).annual:sortKey==='rollingDistance'?VwapFilters.metrics(r).rolling:r[sortKey];
  matches.sort((a,b)=>{const x=value(a),y=value(b);return (typeof x==='string'?x.localeCompare(y):x-y)*(ascending?1:-1);});
  const spreads=matches.map(r=>VwapFilters.metrics(r).spread).sort((a,b)=>a-b),n=spreads.length;
  $('matchCount').textContent=n;$('countBadge').textContent=n;$('totalCount').textContent=rows.length;
  $('ratio').textContent=`占核心池 ${rows.length?(n/rows.length*100).toFixed(1):0}%`;
  $('median').textContent=n?((spreads[Math.floor((n-1)/2)]+spreads[Math.floor(n/2)])/2).toFixed(2)+'%':'—';
  const targetNames={either:'任一條',annual:'年度',rolling:'Rolling',both:'兩條皆',mid:'兩線平均值'};
  const sideNames={any:'上下',below:'下方',above:'上方'};
  const nearText=`${targetNames[f.target]} VWAP ${sideNames[f.side]} ${f.distance}% 以內`;
  let desc={between:'收盤價在兩線之間',near:nearText,or:`兩線之間 或 ${nearText}`,and:`兩線之間 且 ${nearText}`,legacy:'原始策略：合併線下方／兩線之間，0.8%／1.5% 門檻'}[f.mode];
  if(f.mode!=='legacy')desc+=f.spreadEnabled?` · Spread ≤ ${f.maxSpread}%`:' · 不限制 Spread';
  $('ruleText').textContent=desc;
  $('rows').innerHTML=matches.map(r=>{const m=VwapFilters.metrics(r),loc=m.between?'兩線之間':r.close<Math.min(r.annual_vwap,r.rolling_vwap)?'兩線下方':'兩線上方';return `<tr data-id="${r.conid}" class="${active?.conid===r.conid?'selected':''}"><td><button class="ticker-btn" aria-label="查看 ${escapeHTML(r.symbol)} 圖表"><strong>${escapeHTML(r.symbol)}</strong></button>${r.history_under_365_days?'<span class="short-tag">短歷史</span>':''}<div class="company" title="${escapeHTML(r.name)}">${escapeHTML(r.name)}</div></td><td>${money(r.close)}</td><td>${money(r.annual_vwap)}</td><td>${money(r.rolling_vwap)}</td><td class="${m.annual>=0?'pos':'neg'}">${pct(m.annual)}</td><td class="${m.rolling>=0?'pos':'neg'}">${pct(m.rolling)}</td><td>${m.spread.toFixed(3)}%</td><td><span class="pill ${m.between?'inside':''}">${loc}</span></td></tr>`;}).join('');
  $('empty').hidden=n>0;$('export').disabled=n===0;
  $('rows').querySelectorAll('tr').forEach(tr=>tr.addEventListener('click',()=>selectStock(matches.find(r=>r.conid===Number(tr.dataset.id)))));
  if(active&&!matches.some(r=>r.conid===active.conid)){active=null;history=null;historyRequest++;}
  if(!active&&n)selectStock(matches[0]);
  if(!n){active=null;history=null;historyRequest++;$('chartTitle').textContent='沒有候選股票';$('chartSubtitle').textContent='調整條件後，可從清單查看圖表';$('chart').innerHTML='<div class="empty">目前條件沒有符合標的</div>';$('chartNote').textContent='';}
}
async function json(url){
  if(STATIC_MODE){
    const request=new URL(url,location.origin);
    if(request.pathname==='/api/data'){
      const manifestResponse=await fetch('./data/manifest.json',{cache:'no-store'});
      if(!manifestResponse.ok)throw new Error('無法讀取網站資料快照');
      const manifest=await manifestResponse.json();
      const day=request.searchParams.get('date')||manifest.dates[0];
      if(!manifest.dates.includes(day))throw new Error('找不到指定日期');
      url=`./data/${day}/data.json`;
    }else if(request.pathname==='/api/history'){
      url=`./data/${request.searchParams.get('date')}/history/${request.searchParams.get('conid')}.json`;
    }
  }
  const response=await fetch(url);const data=await response.json();if(!response.ok)throw new Error(data.error||'讀取失敗');return data;
}
async function load(selectedDate){
  $('refresh').disabled=true;$('refresh').textContent='讀取中…';
  try{const data=await json('/api/data'+(selectedDate?'?date='+encodeURIComponent(selectedDate):''));rows=data.rows;date=data.date;
    $('dataset').innerHTML=data.dates.map(d=>`<option value="${d}">${pretty(d)}</option>`).join('');$('dataset').value=date;$('priceDate').textContent=pretty(date);
    active=null;history=null;historyRequest++;filter();
  }catch(e){$('error').textContent=e.message;$('error').hidden=false;}
  finally{$('refresh').disabled=false;$('refresh').textContent=STATIC_MODE?'↻ 重新讀取網站快照':'↻ 重新讀取本機資料';}
}
async function selectStock(r){
  active=r;history=null;const token=++historyRequest;
  $('rows').querySelectorAll('tr').forEach(tr=>tr.classList.toggle('selected',Number(tr.dataset.id)===r.conid));
  $('chartTitle').textContent=`${r.symbol} · ${r.name}`;$('chartSubtitle').textContent=`${pretty(date)} 收盤 $${money(r.close)}　／　年度 $${money(r.annual_vwap)}　／　Rolling $${money(r.rolling_vwap)}`;
  $('chart').innerHTML='<div class="empty">讀取日 K…</div>';$('chartNote').textContent='';
  try{const result=await json(`/api/history?conid=${r.conid}&date=${date}`);if(token!==historyRequest)return;history=result.rows;$('chartNote').textContent=result.note;drawChart();}
  catch(e){if(token===historyRequest)$('chart').innerHTML=`<div class="empty">${escapeHTML(e.message)}</div>`;}
}
function drawChart(){
  if(!history||!active)return;
  const data=history.slice(-Number($('chartRange').value)),W=1000,H=335,left=12,right=65,top=16,bottom=36;
  const values=data.flatMap(r=>[r.low,r.high,r.annual,r.rolling].filter(x=>x!=null));
  let low=Math.min(...values),high=Math.max(...values),pad=(high-low||1)*.07;low-=pad;high+=pad;
  const width=W-left-right,height=H-top-bottom,step=width/data.length,x=i=>left+(i+.5)*step,y=v=>top+(high-v)/(high-low)*height;
  let svg=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="${escapeHTML(active.symbol)} 日K與年度、Rolling VWAP">`;
  for(let i=0;i<5;i++){const v=low+(high-low)*i/4,yy=y(v);svg+=`<line x1="${left}" x2="${W-right}" y1="${yy}" y2="${yy}" stroke="#edf0f4"/><text x="${W-right+10}" y="${yy+4}" fill="#8b98a3" font-size="11">${money(v)}</text>`;}
  data.forEach((r,i)=>{const color=r.close>=r.open?'#42a48d':'#d18a8e',xx=x(i),body=Math.max(Math.abs(y(r.open)-y(r.close)),1),bw=Math.max(1,Math.min(step*.55,9));
    svg+=`<g><title>${pretty(r.date)}　開 ${money(r.open)}　高 ${money(r.high)}　低 ${money(r.low)}　收 ${money(r.close)}　年度 ${r.annual==null?'—':money(r.annual)}　Rolling ${r.rolling==null?'—':money(r.rolling)}</title><line x1="${xx}" x2="${xx}" y1="${y(r.high)}" y2="${y(r.low)}" stroke="${color}"/><rect x="${xx-bw/2}" y="${Math.min(y(r.open),y(r.close))}" width="${bw}" height="${body}" fill="${color}"/></g>`;});
  for(const [key,color] of [['annual','#087f75'],['rolling','#8271d0']]){
    let points=[];data.forEach((r,i)=>{if(r[key]!=null)points.push(`${x(i)},${y(r[key])}`);});
    svg+=`<polyline points="${points.join(' ')}" fill="none" stroke="${color}" stroke-width="2.3"/>`;
  }
  [...new Set([0,Math.floor(data.length/3),Math.floor(data.length*2/3),data.length-1])].forEach(i=>{svg+=`<text x="${x(i)}" y="${H-9}" text-anchor="${i===0?'start':i===data.length-1?'end':'middle'}" fill="#8b98a3" font-size="11">${pretty(data[i].date)}</text>`;});
  $('chart').innerHTML=svg+'</svg>';
}
function exportCSV(){
  if(STATIC_MODE){
    const cols=['symbol','name','groups','date','close','annual_vwap','rolling_vwap','annual_distance_pct','rolling_distance_pct','spread_pct','filter_settings'];
    const encode=value=>{let s=String(value??'');if(typeof value==='string'&&/^[=+@-]/.test(s))s="'"+s;return '"'+s.replace(/"/g,'""')+'"';};
    const lines=[cols,...matches.map(r=>{const m=VwapFilters.metrics(r);return [r.symbol,r.name,r.groups,date,r.close,r.annual_vwap,r.rolling_vwap,m.annual,m.rolling,m.spread,JSON.stringify(config())];})];
    const a=document.createElement('a');a.href='data:text/csv;charset=utf-8,'+encodeURIComponent('\ufeff'+lines.map(line=>line.map(encode).join(',')).join('\r\n'));
    a.download=`VWAP_${date}_filtered.csv`;document.body.appendChild(a);a.click();a.remove();return;
  }
  const query=new URLSearchParams({date,ids:matches.map(r=>r.conid).join(','),settings:JSON.stringify(config())});
  const a=document.createElement('a');a.href='/api/export?'+query.toString();a.download=`VWAP_${date}_filtered.csv`;
  document.body.appendChild(a);a.click();a.remove();
}
try{const stored=JSON.parse(localStorage.getItem('vwap-lab-filters-v1')||'null');applyConfig(stored?{...defaults,...stored}:defaults);}catch(e){applyConfig(defaults);}
['mode','target','distance','side','spreadEnabled','maxSpread','excludeShort','search'].forEach(id=>$(id).addEventListener('input',filter));
document.querySelectorAll('input[name=group]').forEach(x=>x.addEventListener('change',filter));
document.querySelectorAll('[data-sort]').forEach(b=>b.addEventListener('click',()=>{ascending=sortKey===b.dataset.sort?!ascending:true;sortKey=b.dataset.sort;filter();}));
$('reset').addEventListener('click',()=>{applyConfig(defaults);filter();});$('refresh').addEventListener('click',()=>load());$('dataset').addEventListener('change',()=>load($('dataset').value));$('export').addEventListener('click',exportCSV);$('chartRange').addEventListener('change',drawChart);load();
