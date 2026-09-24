(function(root){
  function metrics(r){
    const a=r.annual_vwap,b=r.rolling_vwap,p=r.close,m=(a+b)/2;
    return {annual:(p/a-1)*100,rolling:(p/b-1)*100,mid:(p/m-1)*100,
      spread:Math.abs(a-b)/m*100,between:p>=Math.min(a,b)&&p<=Math.max(a,b)};
  }
  function evaluate(r,f){
    const m=metrics(r), distances=f.target==='either'||f.target==='both'?[m.annual,m.rolling]:[m[f.target]];
    const distanceOK=d=>Math.abs(d)<=f.distance+1e-10&&(f.side==='any'||(f.side==='below'?d<=0:d>=0));
    const near=f.target==='both'?distances.every(distanceOK):distances.some(distanceOK);
    let pass=f.mode==='between'?m.between:f.mode==='near'?near:f.mode==='or'?(m.between||near):f.mode==='and'?(m.between&&near):
      (m.spread<=0.8?r.close<(r.annual_vwap+r.rolling_vwap)/2:m.spread<=1.5&&m.between);
    if(f.mode!=='legacy'&&f.spreadEnabled)pass=pass&&m.spread<=f.maxSpread;
    if(f.excludeShort&&r.history_under_365_days)pass=false;
    if(!f.groups.some(g=>r.groups.split('|').includes(g)))pass=false;
    if(f.search&&!`${r.symbol} ${r.name}`.toLowerCase().includes(f.search.toLowerCase()))pass=false;
    return {...m,near,pass};
  }
  const api={metrics,evaluate}; root.VwapFilters=api;
  if(typeof module!=='undefined')module.exports=api;
})(typeof window==='undefined'?globalThis:window);
