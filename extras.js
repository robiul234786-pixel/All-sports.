/* extras.js — জাতীয় দলের ম্যাচ (তারিখ অনুযায়ী) + বড় টুর্নামেন্ট আগে + লাইনআপ (সম্ভাব্য/অফিসিয়াল) */
(function(){
  var nat={},natTry={};
  var RK=[/world cup/i,/euro|european championship/i,/copa am|africa cup|asian cup|gold cup/i,/nations league/i,/champions league/i,/europa league/i,/conference league/i,/premier league|laliga|la liga|serie a|bundesliga|ligue 1/i,/fa cup|copa del rey|efl cup|coppa|dfb|coupe/i,/bangladesh/i,/friendl/i,/eredivisie|primeira|brasileir|saudi|mls|libertadores|super cup/i];
  function rank(g){var i=RK.findIndex(function(r){return r.test(g.name)});return i<0?99:i}
  function pair(m){return [m[0],m[1]].map(function(x){return String(x).toLowerCase().replace(/[^a-z0-9]/g,'')}).sort().join('|')}
  function ini(n){return String(n).split(/\s+/).map(function(w){return w[0]||''}).join('').slice(0,3).toUpperCase()}
  function toM(x){
    var st=x.status,live=['1H','2H','HT','ET','BT','P','LIVE','INT'].indexOf(st)>=0,fin=['FT','AET','PEN','AWD','WO'].indexOf(st)>=0;
    var state=live?'live':fin?'finished':'upcoming';
    var t=new Date(x.time).toLocaleTimeString('en-GB',{hour:'2-digit',minute:'2-digit',hour12:false,timeZone:'Asia/Dhaka'});
    var label=live?(st==='HT'?'HT':(x.minute||'')+"'"):fin?'FT':(st==='NS'||st==='TBD')?t:st;
    var up=state==='upcoming';
    return [x.home.name,x.away.name,up?null:x.home.goals,up?null:x.away.goals,label,state,ini(x.home.name),ini(x.away.name),'af:'+x.id,'','',String(x.home.id),String(x.away.id),x.time];
  }
  function loadNat(target){
    if(!target||(natTry[target]&&Date.now()-natTry[target]<60000))return;
    natTry[target]=Date.now();
    fetch('/api/matches?date='+target).then(function(r){return r.json()}).then(function(d){
      nat[target]=(d.matches||[]).filter(function(x){return x.national});
      if(feedDate===target)render();
    }).catch(function(){});
  }
  function inject(){
    for(var i=groups.length-1;i>=0;i--)if(groups[i].af)groups.splice(i,1);
    var list=nat[feedDate];
    if(list&&list.length){
      var have=new Set();groups.forEach(function(g){g.matches.forEach(function(m){have.add(pair(m))})});
      var by={};
      list.forEach(function(x){
        var m=toM(x);if(have.has(pair(m)))return;
        var g=by[x.league.name]||(by[x.league.name]={name:x.league.name,path:'af',region:x.league.country||'',sport:'Football',symbol:'\u25c9',color:'',matches:[],af:true});
        g.matches.push(m);
      });
      Object.keys(by).forEach(function(k){groups.push(by[k])});
    }
    groups.sort(function(a,b){return rank(a)-rank(b)});
  }
  var _render=render;
  render=function(){inject();_render();loadNat(feedDate)};

  function afLineup(id){
    return fetch('/api/lineup?fixture=' + encodeURIComponent(id)).then(function(r){ return r.json() });
  }
  window.afLineup = afLineup;

  /* desktop: national-team match opens a simple line-up dialog */
  var _md = matchDetails;
  matchDetails = function(k){
    if (String(k).indexOf('af:') !== 0) return _md(k);
    var m = null;
    groups.some(function(g){ return g.matches.some(function(x){ if (key(x) === k) { m = x; return true } }) });
    if (!m) return;
    show('<div class="eyebrow">NATIONAL TEAMS</div><h2>' + esc(m[0]) + ' ' + esc(m[2] == null ? '' : m[2]) + ' - ' + esc(m[3] == null ? '' : m[3]) + ' ' + esc(m[1]) + '</h2><div class="detail-loading">Loading line-ups\u2026</div>');
    afLineup(k.slice(3)).then(function(d){
      var h = '<div class="eyebrow">' + (d.official ? 'OFFICIAL LINE-UP' : 'PROBABLE LINE-UP') + '</div><h2>' + esc(m[0]) + ' vs ' + esc(m[1]) + '</h2>';
      if (!d.teams || !d.teams.length) h += '<div class="detail-empty">Line-ups are not available yet.</div>';
      else d.teams.forEach(function(t){
        h += '<h3>' + esc(t.team.name) + ' <small>' + esc(t.formation || '') + '</small></h3>' + t.startXI.map(function(p){ return '<div class="lineup-player"><span class="shirt-number">' + esc(p.number || '\u2014') + '</span><div>' + esc(p.name) + '<small>' + esc(p.pos || '') + '</small></div></div>' }).join('');
      });
      show(h);
    }).catch(function(){ show('<div class="detail-empty">Line-ups are unavailable.</div>') });
  };
})();
