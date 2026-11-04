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
    var dlg=document.getElementById('detail');
    if(typeof center!=='undefined')center=null;
    dlg.classList.remove('match-dialog');
    var x=null;Object.keys(nat).forEach(function(k){(nat[k]||[]).forEach(function(y){if(String(y.id)===String(id))x=y})});
    var head=x?'<div class="eyebrow">'+esc(x.league.name)+'</div><h2>'+esc(x.home.name)+' vs '+esc(x.away.name)+'</h2><p class="coverage-note">'+esc(bdFull(x.time))+'</p>':'';
    show(head+'<div class="detail-loading" role="status">\u09b2\u09be\u0987\u09a8\u0986\u09aa \u09b2\u09cb\u09a1 \u09b9\u099a\u09cd\u099b\u09c7\u2026</div>');
    fetch('/api/lineup?fixture='+id).then(function(r){return r.json()}).then(function(r){
      var box=document.getElementById('dialog-content');
      if(!r.teams||!r.teams.length){box.innerHTML=head+'<div class="detail-empty">\u09b2\u09be\u0987\u09a8\u0986\u09aa \u098f\u0996\u09a8\u09cb \u09aa\u09be\u0993\u09af\u09bc\u09be \u09af\u09be\u09af\u09bc\u09a8\u09bf\u0964 \u09ae\u09cd\u09af\u09be\u099a\u09c7\u09b0 \u0995\u09be\u099b\u09be\u0995\u09be\u099b\u09bf \u09b8\u09ae\u09af\u09bc\u09c7 \u0986\u09b8\u09ac\u09c7\u0964</div>';return}
      var title=r.type==='official'?'\u0985\u09ab\u09bf\u09b8\u09bf\u09af\u09bc\u09be\u09b2 \u09b2\u09be\u0987\u09a8\u0986\u09aa':'\u09b8\u09ae\u09cd\u09ad\u09be\u09ac\u09cd\u09af \u09b2\u09be\u0987\u09a8\u0986\u09aa';
      var html=head+'<h3>'+title+'</h3>'+(r.type==='probable'?'<p class="coverage-note">'+esc(r.note)+'</p>':'');
      r.teams.forEach(function(t){
        html+='<h4>'+esc(t.team)+(t.formation?' ('+esc(t.formation)+')':'')+'</h4>'+t.xi.map(function(p){return '<div class="squad-row"><span class="shirt-number">'+(p.n==null?'\u2014':esc(p.n))+'</span><b>'+esc(p.name)+'</b><small>'+esc(p.pos||'')+'</small></div>'}).join('');
      });
      box.innerHTML=html;
    }).catch(function(){document.getElementById('dialog-content').innerHTML=head+'<div class="detail-error">\u09b2\u09be\u0987\u09a8\u0986\u09aa \u09b2\u09cb\u09a1 \u0995\u09b0\u09be \u09af\u09be\u09af\u09bc\u09a8\u09bf\u0964</div>'});
  }
  document.addEventListener('click',function(e){
    var r=e.target.closest('[data-match]');
    if(r&&r.dataset.match.indexOf('af:')===0&&!e.target.closest('[data-save]')){e.stopImmediatePropagation();afLineup(r.dataset.match.slice(3))}
  },true);
  document.addEventListener('keydown',function(e){
    if(e.key==='Enter'&&e.target.matches&&e.target.matches('[data-match]')&&e.target.dataset.match.indexOf('af:')===0){e.stopImmediatePropagation();afLineup(e.target.dataset.match.slice(3))}
  },true);
  render();
})();
