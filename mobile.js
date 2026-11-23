/* mobile.js — dark-green mobile UI on top of the existing data (groups, saved, fan, news).
   Active when screen <= 820px (or ?m=1). Add ?desktop=1 once to force desktop. */
(function(){
  var forceDesk=false,forceMob=false;
  try{var qs=new URLSearchParams(location.search);if(qs.get('desktop')==='1')localStorage.setItem('allsport_desktop','1');if(qs.get('m')==='1')localStorage.removeItem('allsport_desktop');forceDesk=localStorage.getItem('allsport_desktop')==='1';forceMob=qs.get('m')==='1'}catch(e){}
  var mq=window.matchMedia('(max-width:820px)');
  function wantMobile(){return forceMob||(!forceDesk&&mq.matches)}
  var root=document.createElement('div');root.id='m-app';document.body.appendChild(root);
  var M={tab:'home',sub:'',sport:'All',favTab:'Teams',q:'',det:null,sheet:'',toast:'',live:false};
  var favLg=[];try{favLg=JSON.parse(localStorage.getItem('allsport_m_favleagues')||'[]')}catch(e){}
  try{root.dataset.mtheme=localStorage.getItem('allsport_m_theme')||'dark'}catch(e){root.dataset.mtheme='dark'}
  var I={
    menu:'<path d="M4 6h16M4 12h16M4 18h16"/>',search:'<circle cx="10.5" cy="10.5" r="6.5"/><path d="m16 16 4 4"/>',bell:'<path d="M18 8a6 6 0 0 0-12 0c0 7-3 7-3 9h18c0-2-3-2-3-9M10 21h4"/>',
    back:'<path d="m15 5-7 7 7 7"/>',cal:'<rect x="3" y="5" width="18" height="16" rx="2"/><path d="M7 3v4m10-4v4M3 11h18"/>',share:'<circle cx="6" cy="12" r="2.5"/><circle cx="18" cy="6" r="2.5"/><circle cx="18" cy="18" r="2.5"/><path d="m8.2 10.8 7.6-3.6m-7.6 6 7.6 3.6"/>',
    home:'<path d="M3 11 12 3l9 8v9a1 1 0 0 1-1 1h-5v-6H9v6H4a1 1 0 0 1-1-1Z"/>',ball:'<circle cx="12" cy="12" r="9"/><path d="m12 7 5 4-2 6H9l-2-6Zm0 0V3M7 11l-4-1m6 7-2 3m8-3 2 3m0-9 4-1"/>',
    star:'<path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3-5.7-3-5.7 3 1.1-6.3L2.8 9.7l6.4-.9Z"/>',news:'<rect x="4" y="3" width="16" height="18" rx="2"/><path d="M8 8h8M8 12h8M8 16h5"/>',dots:'<circle cx="5" cy="12" r="1.6"/><circle cx="12" cy="12" r="1.6"/><circle cx="19" cy="12" r="1.6"/>',
    chev:'<path d="m9 5 7 7-7 7"/>',bars:'<path d="M6 20V12m6 8V4m6 16v-6"/>',trash:'<path d="M4 7h16M9 7V4h6v3m-8 0 1 13h8l1-13"/>',plus:'<path d="M12 5v14M5 12h14"/>',
    gear:'<circle cx="12" cy="12" r="3"/><path d="M12 2v3m0 14v3M2 12h3m14 0h3M5 5l2 2m10 10 2 2M5 19l2-2m10-10 2-2"/>',globe:'<circle cx="12" cy="12" r="9"/><ellipse cx="12" cy="12" rx="4" ry="9"/><path d="M3 12h18"/>',
    moon:'<path d="M20 14A8 8 0 1 1 10 4a6.5 6.5 0 0 0 10 10Z"/>',info:'<circle cx="12" cy="12" r="9"/><path d="M12 11v6m0-10h.01"/>',rate:'<path d="m12 3 2.8 5.8 6.4.9-4.6 4.5 1.1 6.3-5.7-3-5.7 3 1.1-6.3L2.8 9.7l6.4-.9Z"/>',
    chat:'<path d="M4 5h16v11H9l-5 4Z"/>',desk:'<rect x="3" y="4" width="18" height="12" rx="2"/><path d="M8 20h8m-4-4v4"/>',x:'<path d="M6 6l12 12M18 6 6 18"/>'
  };
  function ic(n){return '<svg viewBox="0 0 24 24">'+I[n]+'</svg>'}
  function sp(n){return typeof icon==='function'?icon(n):''}
  var SPORTS=[['Football','football','Live Scores & Results'],['Cricket','cricket','Live Scores & Updates'],['Basketball','basketball','Live Scores & Stats'],['Tennis','tennis','Live Scores & Results']];
  var MORE=[['F1 Racing','globe'],['Rugby','rugby'],['Hockey','hockey'],['Volleyball','volleyball']];
  var TROPHY='<svg class="t" viewBox="0 0 100 100"><defs><linearGradient id="tg" x1="0" x2="1"><stop offset="0" stop-color="#dfe6ee"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#9aa7b8"/></linearGradient></defs><path d="M30 12h40v26c0 14-9 24-20 24S30 52 30 38Z" fill="url(#tg)"/><path d="M30 18H16c0 16 6 24 16 26M70 18h14c0 16-6 24-16 26" fill="none" stroke="#cfd8e3" stroke-width="5"/><rect x="44" y="60" width="12" height="16" fill="#c4cdd9"/><rect x="32" y="76" width="36" height="9" rx="2" fill="#aeb9c8"/><rect x="26" y="85" width="48" height="8" rx="2" fill="#8d99aa"/></svg>';

  function allM(){var o=[];(typeof groups!=='undefined'?groups:[]).forEach(function(g){g.matches.forEach(function(m){o.push({g:g,m:m})})});return o}
  function mc(url,ab,big){var im=(typeof crestImg==='function'&&url)?crestImg(url):'';return '<span class="mc'+(big?' big':'')+'">'+esc(ab||'')+im+'</span>'}
  function stat(m){return m[5]==='finished'?'FT':m[4]}
  function find(k){var a=allM();for(var i=0;i<a.length;i++)if(key(a[i].m)===k)return a[i];var fg=window.favGroups||[];for(var j=0;j<fg.length;j++)for(var x=0;x<fg[j].matches.length;x++)if(key(fg[j].matches[x])===k)return{g:fg[j],m:fg[j].matches[x]};return null}
  function toast(t){M.toast=t;draw();clearTimeout(toast.t);toast.t=setTimeout(function(){M.toast='';draw()},2200)}
  function unread(){try{return newsItems.filter(function(a){return Date.parse(a.published)>Date.parse(fan.readAt)}).length}catch(e){return 0}}
  function sportOK(g){if(M.sport==='All')return true;return g.sport===M.sport}

  /* ---------- shared pieces ---------- */
  function liveCard(o){var m=o.m,live=m[5]==='live';
    return '<div class="m-card"><button class="m-live" data-mm="'+esc(key(m))+'"><div class="mid"><div class="m-lg">'+(live?'<span class="m-tag">LIVE</span>':'')+esc(o.g.name)+'</div>'+
      [0,1].map(function(t){return '<div class="m-tl">'+mc(m[9+t],m[6+t])+'<span class="n">'+esc(m[t])+'</span><span class="s">'+esc(m[2+t]==null?'':m[2+t])+'</span></div>'}).join('')+'</div>'+
      '<div class="m-min">'+esc(stat(m))+(live?ic('bars'):'')+'</div></button></div>'}
  function rowM(m){var live=m[5]==='live',fin=m[5]==='finished',nos=m[2]==null;
    return '<button class="m-row" data-mm="'+esc(key(m))+'"><span class="h">'+esc(m[0])+'</span>'+mc(m[9],m[6])+'<span class="sc">'+(nos?'– : –':esc(m[2])+' - '+esc(m[3]))+'</span>'+mc(m[10],m[7])+'<span class="a">'+esc(m[1])+'</span><span class="st'+(live?' lv':fin?' ft':'')+'">'+esc(stat(m))+(live?' ▶':'')+'</span></button>'}
  function feedNote(){return feedState==='loading'?'<div class="m-feed">Loading matches…</div>':feedState==='error'?'<div class="m-feed">Connection interrupted — showing last received scores.</div>':''}
  function empty(i,t,p){return '<div class="m-empty">'+ic(i)+'<b>'+esc(t)+'</b>'+esc(p||'')+'</div>'}
  function emptyFor(){if(feedState==='loading')return empty('ball','Loading matches…','');if(M.sport==='Cricket'||M.sport==='Tennis')return empty('ball','Live coverage unavailable','Public feed covers football, basketball, hockey and baseball.');return empty('cal','No matches found','Try another date.')}

  /* ---------- screens ---------- */
  function home(){
    var a=allM(),live=a.filter(function(o){return o.m[5]==='live'}),list=live.length?live:a.filter(function(o){return o.m[5]!=='finished'}).concat(a.filter(function(o){return o.m[5]==='finished'})).slice(0,4);
    return '<div class="m-scr m-pop"><div class="m-top"><button class="m-ic" data-ma="sports" aria-label="Menu">'+ic('menu')+'</button><div class="m-logo"><i>A</i><div><b>All Sports</b><small>One App. All Sports.</small></div></div><button class="m-ic" data-ma="search" aria-label="Search">'+ic('search')+'</button><button class="m-ic" data-ma="news" aria-label="Notifications">'+ic('bell')+(unread()?'<span class="b">'+unread()+'</span>':'')+'</button></div>'+
    '<div class="m-chips">'+['For You','Football','Cricket','Basketball'].map(function(c){return '<button class="m-chip'+((c==='For You'&&M.sport==='All')||c===M.sport?' on':'')+'" data-mhs="'+c+'">'+c+'</button>'}).join('')+'</div>'+
    '<div class="m-banner"><h3>UEFA Champions League</h3><p>Live on All Sports</p><button class="m-btn" data-ma="watch"><svg viewBox="0 0 24 24"><path d="M6 4v16l14-8Z"/></svg>Watch Live</button>'+TROPHY+'</div>'+
    '<div class="m-sports">'+SPORTS.map(function(s){return '<button class="m-sp" data-msp="'+s[0]+'"><span>'+sp(s[1])+'</span>'+s[0]+'</button>'}).join('')+'<button class="m-sp" data-ma="sports"><span>'+ic('dots')+'</span>More</button></div>'+
    '<div class="m-sec"><h2>Live Matches</h2><button data-ma="matches">See All →</button></div>'+feedNote()+
    (list.length?list.filter(function(o){return M.sport==='All'||o.g.sport===M.sport}).map(liveCard).join('')||emptyFor():emptyFor())+'</div>'}

  function matches(){
    var off=typeof date==='number'?date:0,days=[];
    for(var i=-2;i<=4;i++){var o=off+i,d=new Date(selectedDate(o)+'T00:00:00Z');days.push('<button class="m-d'+(i===0?' on':'')+'" data-md="'+o+'"><small>'+d.toLocaleDateString('en-GB',{weekday:'short',timeZone:'UTC'})+'</small><b>'+d.toLocaleDateString('en-GB',{month:'short',day:'numeric',timeZone:'UTC'}).split(' ').reverse().join(' ')+'</b></button>')}
    var gs=(typeof groups!=='undefined'?groups:[]).filter(function(g){return sportOK(g)&&g.matches.length});
    var html='<div class="m-scr m-pop"><div class="m-top"><button class="m-ic" data-ma="home">'+ic('back')+'</button><h1>Matches</h1><button class="m-ic" data-ma="cal">'+ic('cal')+'</button></div>'+
      '<div class="m-dates" id="m-dates">'+days.join('')+'</div>'+
      '<div class="m-chips"><button class="m-chip'+(M.live?' on':'')+'" data-mlive="1">● Live</button>'+['All','Football','Cricket','Basketball','Tennis'].map(function(c){return '<button class="m-chip'+(M.sport===c?' on':'')+'" data-mhs="'+c+'">'+c+'</button>'}).join('')+'</div>'+feedNote();
    if(M.live)gs=gs.map(function(g){return Object.assign({},g,{matches:g.matches.filter(function(m){return m[5]==='live'})})}).filter(function(g){return g.matches.length});
    html+=gs.length?gs.map(function(g){var fv=favLg.indexOf(g.name)>=0;return '<div class="m-card"><div class="m-gh"><span class="sy">'+esc(g.symbol||'⚽')+'</span>'+esc(g.name)+'<button class="fv'+(fv?' on':'')+'" data-mfl="'+esc(g.name)+'" aria-label="Favourite league">'+(fv?'★':'☆')+'</button></div>'+g.matches.map(rowM).join('')+'</div>'}).join(''):emptyFor();
    return html+'</div>'}

  function sports(){
    return '<div class="m-scr m-pop"><div class="m-top"><button class="m-ic" data-ma="home">'+ic('back')+'</button><div class="m-logo"><i>A</i><div><b>All Sports</b><small>One App. All Sports.</small></div></div><button class="m-ic" data-ma="search">'+ic('search')+'</button></div><div class="m-sec"><h2>Sports</h2></div>'+
    '<div class="m-grid2">'+SPORTS.map(function(s){return '<button class="m-sc" data-msp="'+s[0]+'"><span>'+sp(s[1])+'</span><div><b>'+s[0]+'</b><small>'+s[2]+' →</small></div></button>'}).join('')+'</div>'+
    '<div class="m-banner"><h3>Champions League</h3><p>Live on All Sports</p><button class="m-btn" data-ma="watch">Watch Now ▶</button>'+TROPHY+'</div>'+
    '<button class="m-sc" data-ma="nations" style="width:100%;margin-bottom:12px"><span>'+ic('globe')+'</span><div><b>National Teams</b><small>Squads, matches & fixtures →</small></div></button><div class="m-sec"><h2>More Sports</h2><button data-ma="explore">See All →</button></div><div class="m-more6">'+MORE.map(function(s){return '<div>'+sp(s[1])+s[0]+'</div>'}).join('')+'</div></div>'}

  function favs(){
    var t=M.favTab,body='';
    if(t==='Teams'){body=fan.teams&&fan.teams.length?'<div class="m-card">'+fan.teams.map(function(x){return '<div class="m-lrow"><span class="mc big" style="width:40px;height:40px">'+esc(String(x.name).slice(0,2).toUpperCase())+'</span><button class="mid" data-mteam="'+esc(x.id)+'|'+esc(x.league)+'|'+esc(x.name)+'" style="text-align:left"><b>'+esc(x.name)+'</b><small>'+esc(leagueName(x.league))+'</small></button><button class="bell" data-mut="'+esc(x.id)+'|'+esc(x.league)+'" aria-label="Unfollow">'+ic('bell')+'</button></div>'}).join('')+'</div>':empty('star','No favourite teams yet','Tap “Add More Favourites” to follow a team.')}
    if(t==='Leagues'){body=favLg.length?'<div class="m-card">'+favLg.map(function(n){return '<div class="m-lrow"><span class="mc" style="width:34px;height:34px">⚽</span><div class="mid"><b>'+esc(n)+'</b></div><button class="ch" data-mfl="'+esc(n)+'">'+ic('x')+'</button></div>'}).join('')+'</div>':empty('star','No favourite leagues','Tap ☆ beside a league in Matches.')}
    if(t==='Matches'){var k=[...saved],ms=k.map(find).filter(Boolean);body=ms.length?'<div class="m-card">'+ms.map(function(o){return rowM(o.m)}).join('')+'</div>':empty('star','No saved matches','Open a match and tap the bell to save it.')}
    return '<div class="m-scr m-pop"><div class="m-top"><span style="color:var(--gold);width:30px;display:grid">'+ic('star').replace('fill="none"','')+'</span><h1 class="l">Favourites</h1></div><div class="m-chips">'+['Teams','Leagues','Matches'].map(function(c){return '<button class="m-chip'+(t===c?' on':'')+'" data-mft="'+c+'" style="flex:1">'+c+'</button>'}).join('')+'</div>'+body+
    (t==='Teams'?'<button class="m-btn w" data-ma="addfav" style="margin-top:6px">'+ic('plus')+' Add More Favourites</button>':'')+'</div>'}
  function leagueName(p){var g=(typeof groups!=='undefined'?groups:[]).find(function(x){return x.path===p});return g?g.name:String(p).split('/').pop()}

  function news(){
    var it=typeof newsItems!=='undefined'?newsItems:[];
    return '<div class="m-scr m-pop"><div class="m-top"><button class="m-ic" data-ma="home">'+ic('back')+'</button><h1>News</h1><button class="m-ic" data-ma="readnews" aria-label="Mark all read">'+ic('bell')+'</button></div>'+
    (it.length?'<div class="m-card">'+it.map(function(a){var un=Date.parse(a.published)>Date.parse(fan.readAt);return '<a class="m-news'+(un?' un':'')+'" href="'+esc(a.url)+'" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none"><small>'+esc(a.team)+'</small><b>'+esc(a.title)+'</b><p>'+esc((a.description||'').slice(0,120))+'</p></a>'}).join('')+'</div>':empty('news','No team news yet',fan.teams&&fan.teams.length?(newsBusy?'Checking the latest headlines…':'No recent headlines from ESPN.'):'Follow teams in Favourites to get their headlines here.'))+'</div>'}

  function more(){
    var dark=root.dataset.mtheme!=='light',u=unread();
    function r(i,l,v,a,x){return '<button class="m-lrow" data-ma="'+a+'"><span style="color:var(--mu)">'+ic(i)+'</span><div class="mid"><b style="font-weight:500">'+l+'</b></div>'+(x||'')+(v?'<span class="m-val">'+v+'</span>':'')+'<span class="ch">'+ic('chev').replace('<svg','<svg style="width:16px;height:16px"')+'</span></button>'}
    return '<div class="m-scr m-pop"><div class="m-top"><h1 class="l">More</h1><button class="m-ic" data-ma="settings">'+ic('gear')+'</button></div>'+
    '<button class="m-prof" data-ma="about"><div class="m-av">'+esc((typeof ABOUT_NAME!=='undefined'&&ABOUT_NAME?ABOUT_NAME[0]:'A').toUpperCase())+'</div><div style="flex:1"><b style="font:700 18px Manrope,system-ui,sans-serif">All Sports</b><div style="color:var(--mu)">Sports Fan</div></div><span class="ch">'+ic('chev')+'</span></button>'+
    '<div class="m-prem"><span style="font-size:30px">👑</span><div class="mid"><b>Go Premium</b><small>Unlock more features!</small></div><button data-ma="premium">Upgrade</button></div>'+
    '<div class="m-card">'+r('bell','Notifications',u?'<span style="background:var(--red);color:#fff;border-radius:50%;min-width:20px;height:20px;display:inline-grid;place-items:center;font-size:11px">'+u+'</span>':'','news')+r('globe','Language','English','lang')+
    '<div class="m-lrow" data-ma="theme" role="button"><span style="color:var(--mu)">'+ic('moon')+'</span><div class="mid"><b style="font-weight:500">Dark Mode</b></div><span class="m-sw'+(dark?' on':'')+'"></span></div>'+
    r('globe','National Teams','','nations')+r('info','About App','','about')+r('share','Share App','','share')+r('rate','Rate Us','','rate')+r('chat','Feedback','','feedback')+r('desk','Desktop version','','desktop')+'</div></div>'}

  function nationsScr(){return '<div class="m-scr m-pop"><div class="m-top"><button class="m-ic" data-ma="gomore">'+ic('back')+'</button><h1>National Teams</h1></div><div id="m-host" class="m-host"></div></div>'}
  function search(){
    var q=M.q.toLowerCase().trim(),res=q?allM().filter(function(o){return [o.g.name,o.m[0],o.m[1]].join(' ').toLowerCase().indexOf(q)>=0}).slice(0,40):[];
    return '<div class="m-scr m-pop"><div class="m-top"><button class="m-ic" data-ma="home">'+ic('back')+'</button><input id="m-q" class="m-in" style="margin:0;flex:1" placeholder="Search teams, leagues…" value="'+esc(M.q)+'"></div>'+
    (res.length?'<div class="m-card">'+res.map(function(o){return rowM(o.m)}).join('')+'</div>':'')+'<div class="m-host">'+(function(){try{return playerSearchPanel()}catch(e){return ''}})()+'</div>'+(!res.length&&q.length<3?empty('search','Search','Type 3+ letters to find matches, players and national teams.'):'')+'</div>'}

  /* ---------- match details ---------- */
  function comp(d,side){return (d&&d.header&&d.header.competitions&&d.header.competitions[0]&&d.header.competitions[0].competitors||[]).find(function(c){return c.homeAway===side})}
  function detail(){
    var D=M.det,o=find(D.k);if(!o)return '<div class="m-scr full"><div class="m-top"><button class="m-ic" data-ma="closedet">'+ic('back')+'</button><h1>Match Details</h1></div>'+empty('ball','Match not found','It may be on another date.')+'</div>';
    var m=o.m,g=o.g,d=D.data,live=m[5]==='live',hc=comp(d,'home'),ac=comp(d,'away');
    var hs=hc&&hc.score!=null?hc.score:m[2],as=ac&&ac.score!=null?ac.score:m[3];
    var st=d&&d.header&&d.header.competitions&&d.header.competitions[0]&&d.header.competitions[0].status&&d.header.competitions[0].status.type&&d.header.competitions[0].status.type.shortDetail;
    var tm=live?(m[4]||st||''):m[5]==='finished'?'Full Time':(m[4]||'');
    var saved_=saved.has(key(m));
    var html='<div class="m-scr full m-pop"><div class="m-top"><button class="m-ic" data-ma="closedet">'+ic('back')+'</button><h1>Match Details</h1><button class="m-ic" data-ma="shr">'+ic('share')+'</button><button class="m-ic" data-ma="savem" style="color:'+(saved_?'var(--g)':'inherit')+'">'+ic('bell')+'</button></div>'+
    '<div class="m-card" style="padding:14px 10px 4px"><div class="m-dh"><div class="lg">'+esc(g.name)+'<small>'+esc(d&&d.venue?d.venue:g.region)+'</small></div><div class="m-big"><div class="t"'+(hc&&hc.id?' data-mt="'+esc(hc.id)+'"':'')+'>'+mc(m[9],m[6],1)+esc(m[0])+'</div><div class="sc">'+(m[2]==null?'– : –':esc(hs)+' - '+esc(as))+'<span class="tm'+(live?'':' dim')+'">'+esc(tm)+'</span></div><div class="t"'+(ac&&ac.id?' data-mt="'+esc(ac.id)+'"':'')+'>'+mc(m[10],m[7],1)+esc(m[1])+'</div></div></div>'+
    '<div class="m-dtabs">'+[['ov','Overview'],['st','Statistics'],['lu','Lineups'],['h2','H2H'],['sd','Standings']].map(function(t){return '<button class="'+(D.tab===t[0]?'on':'')+'" data-mdt="'+t[0]+'">'+t[1]+'</button>'}).join('')+'</div></div>';
    html+='<div style="padding-top:6px">';
    if(String(key(m)).indexOf('af:')===0)html+=D.tab==='lu'?lineupTab({}):'<div class="m-note">Only line-ups are available for national team matches.</div>';
    else if(D.err&&!d)html+=empty('info','Details unavailable','Please try again shortly.');
    else if(!d)html+='<div class="m-note">Loading match details…</div>';
    else html+=tab(D.tab,d,m,live);
    html+='<button class="m-btn w" data-ma="watch" style="margin-top:14px"><svg viewBox="0 0 24 24"><path d="M6 4v16l14-8Z"/></svg>Watch Live (if available)</button></div></div>';return html}
  function pickStat(d,re){var out=[null,null];(d.teams||[]).forEach(function(t,i){var s=(t.statistics||[]).find(function(x){return re.test(x.name||'')});var idx=t.homeAway==='away'?1:t.homeAway==='home'?0:i;if(s)out[idx]=s.displayValue});return out}
  function bar(l,a,b){var x=parseFloat(a)||0,y=parseFloat(b)||0,t=x+y||1;return '<div class="m-bar"><div class="t"><b>'+esc(a==null?'–':a)+'</b><span>'+esc(l)+'</span><b>'+esc(b==null?'–':b)+'</b></div><div class="m-trk"><i style="width:'+(x/t*100)+'%"></i><i style="width:'+(y/t*100)+'%;background:#ffffff80"></i></div></div>'}
  function tab(t,d,m,live){
    if(t==='ov'){
      var hid=(comp(d,'home')||{}).id,evs=(d.events||[]).map(function(e){var p=e.play||e,ty=(p.type&&p.type.text)||'';return{p:p,ty:ty,time:(e.time&&e.time.displayValue)||(p.clock&&p.clock.displayValue)||'',e:e}}).filter(function(x){return /goal|card|substitution|penalty/i.test(x.ty)&&!/kickoff|halftime/i.test(x.ty)});
      var h='<div class="m-card" style="padding:6px 14px">'+(evs.length?evs.map(function(x){var p=x.p,pl=(p.participants&&p.participants[0]&&p.participants[0].athlete&&p.participants[0].athlete.displayName)||x.e.text||x.ty,home=p.team&&String(p.team.id)===String(hid),ico=/red/i.test(x.ty)?'🟥':/yellow/i.test(x.ty)?'🟨':/substitution/i.test(x.ty)?'🔁':'⚽';
        return '<div class="m-ev'+(home?'':' r')+'"><span class="tm">'+esc(x.time)+'</span><span>'+ico+'</span><span>'+esc(pl)+'</span></div>'}).join(''):'<div class="m-note">No match events published yet.</div>')+'</div>';
      h+='<div class="m-pitch">'+(live?'<span class="lv">LIVE</span>':'')+'</div><div class="m-h3">Match Stats</div><div class="m-card" style="padding:4px 14px">';
      var ps=pickStat(d,/^possessionPct$|possession/i),so=pickStat(d,/^shotsOnTarget$/i),ts=pickStat(d,/^totalShots$|^shots$/i);
      if(ps[0]==null&&so[0]==null&&ts[0]==null)h+='<div class="m-note">Statistics have not been published.</div>';
      else{h+=bar('Possession',ps[0]!=null?Math.round(parseFloat(ps[0]))+'%':null,ps[1]!=null?Math.round(parseFloat(ps[1]))+'%':null)+bar('Shots on Target',so[0],so[1])+bar('Total Shots',ts[0],ts[1])}
      return h+'</div>'}
    if(t==='st'){var ts2=d.teams||[];if(ts2.length<2)return '<div class="m-note">Match statistics have not been published.</div>';
      var a=ts2.find(function(x){return x.homeAway==='home'})||ts2[0],b=ts2.find(function(x){return x.homeAway==='away'})||ts2[1];
      return '<div class="m-card" style="padding:4px 14px">'+(a.statistics||[]).map(function(s){var o=(b.statistics||[]).find(function(y){return y.name===s.name});return bar(s.label||s.name,s.displayValue,o?o.displayValue:null)}).join('')+'</div>'}
    if(t==='lu')return lineupTab(d);
    if(t==='h2'){
      var H=(d.provider&&d.provider.h2h)||[];
      if(!H.length&&(d.h2h||[]).length){(d.h2h||[]).forEach(function(x,i){if(i===0)(x.events||[]).forEach(function(e){H.push({date:e.gameDate||e.date,league:e.leagueName||'',home:x.team&&x.team.displayName,away:e.opponent&&e.opponent.displayName,hg:(e.score||'').split('-')[0],ag:(e.score||'').split('-')[1]})})})}
      if(!H.length)return '<div class="m-note">'+(d.provider?'No previous meetings found.':'Head-to-head needs the API-Football key (APIFOOTBALL_KEY) on the server.')+'</div>';
      var hn=m[0],w=0,dr=0,l=0;H.forEach(function(x){var hg=+x.hg,ag=+x.ag;if(hg===ag)dr++;else{var homeWon=hg>ag;var mine=x.home===hn?homeWon:!homeWon;if(x.home!==hn&&x.away!==hn)return;mine?w++:l++}});
      return '<div class="m-sum"><div><b>'+w+'</b><small>'+esc(m[0])+' wins</small></div><div><b>'+dr+'</b><small>Draws</small></div><div><b>'+l+'</b><small>'+esc(m[1])+' wins</small></div></div><div class="m-card">'+H.map(function(x){return '<div class="m-h2"><small>'+esc(String(x.date||'').slice(0,10))+'</small><div class="t"><span>'+esc(x.home)+'</span><b>'+esc(x.hg==null?'':x.hg)+' - '+esc(x.ag==null?'':x.ag)+'</b><span>'+esc(x.away)+'</span></div></div>'}).join('')+'</div>'}
    if(t==='sd'){var S=M.det.std;if(S===undefined)return '<div class="m-note">Loading standings…</div>';if(!S||!S.tables||!S.tables.length)return '<div class="m-note">Standings are not available for this competition.</div>';
      var ids=[String((comp(d,'home')||{}).id),String((comp(d,'away')||{}).id)],tb=S.tables.find(function(x){return x.entries.some(function(e){return ids.indexOf(String(e.id))>=0})})||S.tables[0];
      return '<div class="m-card" style="padding:4px 8px"><table class="m-tbl"><thead><tr><th>#</th><th style="text-align:left">Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>Pts</th></tr></thead><tbody>'+tb.entries.map(function(e,i){var s=e.stats||{};return '<tr class="'+(ids.indexOf(String(e.id))>=0?'me':'')+'"><td>'+esc(s.rank||i+1)+'</td><td class="n">'+tlogo(e)+esc(e.name)+'</td><td>'+esc(s.gamesPlayed||'')+'</td><td>'+esc(s.wins||'')+'</td><td>'+esc(s.ties||s.draws||'')+'</td><td>'+esc(s.losses||'')+'</td><td><b>'+esc(s.points||'')+'</b></td></tr>'}).join('')+'</tbody></table></div>'}
    return ''}

  function tlogo(e){var im=e.logo&&/^https:\/\/a\.espncdn\.com\//.test(e.logo)?'<img src="'+esc(e.logo)+'" alt="" referrerpolicy="no-referrer">':'';return '<span class="mc">'+esc(String(e.name||'').slice(0,2).toUpperCase())+im+'</span>'}

  /* ---------- Sofascore-style line-up pitch ---------- */
  function depth(p){var a=(p.position&&p.position.abbreviation||'').toUpperCase(),n=(p.position&&(p.position.displayName||p.position.name)||'').toLowerCase();
    if(a==='G'||/goalkeeper/.test(n))return 0;if(/^(CD|LB|RB|SW|LWB|RWB|D)/.test(a)||/back|defend/.test(n))return 1;if(a==='DM'||a==='CDM')return 2;if(/^(AM|CAM)/.test(a))return 4;
    if(/^(LW|RW|F|CF|ST|SS)/.test(a)||/forward|striker|attack|wing/.test(n))return 5;return 3}
  function sv(p){try{return statVal.apply(null,arguments)}catch(e){return 0}}
  function ratingOf(p,ctx){try{var r=matchRating(p,ctx);return r?r.value:''}catch(e){return ''}}
  function espnRows(r){
    var ctx=null;try{ctx=teamCtx(r)}catch(e){}
    var st=(r.roster||[]).filter(function(p){return p.starter}).map(function(p,i){return{p:p,i:i}}).sort(function(a,b){return depth(a.p)-depth(b.p)||a.i-b.i}).map(function(x){return x.p});
    if(!st.length)return null;
    var f=String(r.formation||'').split('-').map(Number).filter(function(n){return n>0});
    var sum=f.reduce(function(a,b){return a+b},0);
    if(sum!==st.length-1){var c=[0,0,0];st.slice(1).forEach(function(p){var d=depth(p);c[d<=1?0:d<=4?1:2]++});f=c.filter(Boolean)}
    var rows=[[st[0]]],k=1;f.forEach(function(n){rows.push(st.slice(k,k+n));k+=n});
    return rows.map(function(row,i){if(i>0){try{row=row.slice().sort(function(a,b){return lateralRank(a)-lateralRank(b)})}catch(e){}}
      return row.map(function(p){var a=p.athlete||{},pl=p.plays||[],g=sv(p,'totalGoals','goals');
        var ph=a.apiPhoto||(a.headshot&&(a.headshot.href||a.headshot))||(a.id?'https://a.espncdn.com/i/headshots/soccer/players/full/'+encodeURIComponent(a.id)+'.png':'');
        return{id:a.id,num:p.jersey,name:a.shortName||a.displayName||'',photo:ph,rating:ratingOf(p,ctx),goals:g,yc:pl.some(function(e){return e.yellowCard}),rc:pl.some(function(e){return e.redCard}),sub:!!(p.subbedOut||pl.some(function(e){return e.substitution}))}})})}
  function afRows(t){var st=t.startXI||[];if(!st.length||!st.every(function(p){return p.grid}))return null;var by={};st.forEach(function(p){var g=String(p.grid).split(':');(by[g[0]]=by[g[0]]||[]).push({c:+g[1],p:p})});
    return Object.keys(by).sort(function(a,b){return a-b}).map(function(k){return by[k].sort(function(a,b){return a.c-b.c}).map(function(x){return{num:x.p.number,name:x.p.name,photo:x.p.photo,rating:'',goals:0}})})}
  function rcls(v){v=+v;return v>=8?'b':v>=7?'g':v>=6?'o':'r'}
  function pitchHTML(rows){var n=rows.length;
    return '<div class="m-lp" style="height:'+Math.max(380,n*116)+'px"><i class="bx"></i><i class="cc"></i>'+rows.map(function(r,i){return r.map(function(p,j){
      var ini=String(p.name||'').split(/\s+/).map(function(w){return w[0]||''}).join('').slice(0,2).toUpperCase(),im=p.photo&&/^https:\/\//.test(p.photo)?'<img src="'+esc(p.photo)+'" alt="" loading="lazy" referrerpolicy="no-referrer">':'';
      return '<div class="lp"'+(p.id?' data-mp="'+esc(p.id)+'"':'')+' style="top:'+(n>1?10+i*(80/(n-1)):50)+'%;left:'+((j+1)/(r.length+1)*100)+'%"><span class="pp">'+esc(ini)+im+(p.rc?'<u class="cd rc"></u>':p.yc?'<u class="cd yc"></u>':'')+(p.sub?'<u class="sb">⇄</u>':'')+(p.goals?'<u class="gl">⚽'+(p.goals>1?p.goals:'')+'</u>':'')+'</span>'+(p.rating?'<em class="rt '+rcls(p.rating)+'">'+esc(p.rating)+'</em>':'')+'<b><s>'+esc(p.num||'')+'</s> '+esc(p.name)+'</b></div>'}).join('')}).join('')+'</div>'}
  function lineupTab(d){
    var af=String(M.det.k).indexOf('af:')===0,teams;
    if(af){var A=M.det.af;if(A===undefined)return '<div class="m-note">Loading line-ups…</div>';if(!A||!A.teams||!A.teams.length)return '<div class="m-note">Line-ups are not available yet. They usually appear about an hour before kick-off.</div>';teams=A.teams}
    else{if(!(d.rosters||[]).length)return '<div class="m-note">Line-ups have not been published yet.</div>';teams=d.rosters}
    var i=Math.min(M.det.lt||0,teams.length-1),t=teams[i],name=af?t.team.name:t.team.displayName;
    var rows=af?afRows(t):espnRows(t),o=find(M.det.k),m=o&&o.m;
    var html='<div class="m-chips" style="padding-bottom:6px">'+teams.map(function(x,j){var nm=af?x.team.name:x.team.displayName;return '<button class="m-chip'+(j===i?' on':'')+'" data-mlt="'+j+'" style="flex:1">'+esc(nm)+'</button>'}).join('')+'</div>'+
      '<div class="m-note" style="padding:2px 0 8px">'+esc(name)+(t.formation?' · '+esc(t.formation):'')+(af?(M.det.af.official?' · Official':' · Probable (last match)'):'')+'</div>';
    html+=rows?pitchHTML(rows):'<div class="m-card">'+(af?t.startXI:(t.roster||[]).filter(function(p){return p.starter})).map(function(p){return '<div class="m-pl"><span class="j">'+esc(af?p.number:p.jersey||'–')+'</span>'+esc(af?p.name:p.athlete&&p.athlete.displayName||'')+'</div>'}).join('')+'</div>';
    var subs=af?(t.subs||[]).map(function(p){return{num:p.number,name:p.name,rating:''}}):(function(){var ctx=null;try{ctx=teamCtx(t)}catch(e){}return(t.roster||[]).filter(function(p){return !p.starter}).map(function(p){return{id:p.athlete&&p.athlete.id,num:p.jersey,name:p.athlete&&(p.athlete.shortName||p.athlete.displayName)||'',rating:ratingOf(p,ctx)}})})();
    if(subs.length)html+='<div class="m-h3" style="font-size:15px">Substitutes</div><div class="m-card">'+subs.map(function(p){return '<div class="m-pl"'+(p.id?' data-mp="'+esc(p.id)+'" style="cursor:pointer"':'')+'><span class="j">'+esc(p.num||'–')+'</span>'+esc(p.name)+(p.rating?'<em class="rt '+rcls(p.rating)+'" style="margin-left:auto;position:static">'+esc(p.rating)+'</em>':'')+'</div>'}).join('')+'</div>';
    return html}

  /* ---------- Player & team pages ---------- */
  function fmtD(iso,o){try{return new Date(iso).toLocaleDateString('en-GB',o||{day:'numeric',month:'short'})}catch(e){return ''}}
  function fmtT(iso){try{return new Date(iso).toLocaleTimeString('en-GB',{hour:'numeric',minute:'2-digit',hour12:true})}catch(e){return ''}}
  function img(u,cls){return u&&/^https:\/\//.test(u)?'<img class="'+(cls||'')+'" src="'+esc(u)+'" alt="" loading="lazy" referrerpolicy="no-referrer">':''}
  function logo(u,ab,big){return '<span class="mc'+(big?' big':'')+'">'+esc(ab||'')+img(u)+'</span>'}
  function gridStats(list,n){list=(list||[]).filter(function(x){return x.value!==''&&x.value!=null});if(!list.length)return '<div class="m-note">Statistics are not available from the provider for this season.</div>';
    return '<div class="m-gs">'+list.slice(0,n||60).map(function(x){return '<div><b>'+esc(x.value)+'</b><small>'+esc(x.label)+'</small></div>'}).join('')+'</div>'}
  function pickS(list,re){var x=(list||[]).find(function(s){return re.test(s.name||'')});return x?x.value:null}
  var POS={G:[50,88],GK:[50,88],CD:[50,72],'CD-L':[36,72],'CD-R':[64,72],SW:[50,76],LB:[14,66],RB:[86,66],LWB:[14,58],RWB:[86,58],DM:[50,58],CM:[50,46],LM:[14,44],RM:[86,44],AM:[50,32],CAM:[50,32],LW:[16,20],RW:[84,20],F:[50,12],CF:[50,12],ST:[50,12],SS:[50,20]};
  function posMap(ab,name){var a=String(ab||'').toUpperCase(),xy=POS[a]||POS[a.split('-')[0]];if(!xy){var n=String(name||'').toLowerCase();xy=/goalkeeper/.test(n)?POS.G:/defend|back/.test(n)?POS.CD:/midfield/.test(n)?POS.CM:/forward|striker|attack/.test(n)?POS.ST:null}
    if(!xy)return '';return '<div class="m-card" style="padding:14px"><div class="m-h3" style="margin:0 0 8px">Position</div><div style="display:flex;gap:14px;align-items:center"><div style="flex:1"><small style="color:var(--red)">Primary</small><div style="font-size:16px">'+esc(name||ab)+'</div></div><div class="m-pm"><i class="mid"></i><b style="left:'+xy[0]+'%;top:'+xy[1]+'%">'+esc(ab||'')+'</b></div></div></div>'}
  function entity(){
    var E=M.ent,d=E.data,isT=E.kind==='team',p=d&&d.profile||{};
    var nm=p.displayName||p.name||'',lg=(p.logos&&p.logos[0]&&p.logos[0].href)||p.logo||(p.headshot&&p.headshot.href)||'';
    var tabs=isT?[['ov','Overview'],['nw','News'],['mt','Matches'],['tb','Table'],['st','Stats'],['sq','Squad']]:[['pf','Profile'],['mt','Matches'],['st','Stats'],['cr','Career']];
    var follow='';try{if(isT&&d)follow=followTeamButton(E.id,nm,E.path)}catch(e){}
    var head='<div class="m-scr full m-pop"><div class="m-top"><button class="m-ic" data-ma="closeent">'+ic('back')+'</button><div style="flex:1"></div>'+follow+'</div>';
    if(!d)return head+(E.err?empty('info','Details unavailable','Please try again shortly.'):'<div class="m-note">Loading…</div>')+'</div>';
    var sub=isT?(p.location||p.standingSummary||''):((p.team&&p.team.displayName)||'');
    var photo=isT?img(lg,'eh'):(function(){var u=(p.headshot&&p.headshot.href)||'';return u?img(u,'eh r'):''})();
    head+='<div class="m-eh"><span class="ehw'+(isT?'':' r')+'">'+(photo||esc(nm.slice(0,2).toUpperCase()))+'</span><div><h2 style="margin:0;font:700 24px \'Manrope\',system-ui,sans-serif;color:inherit">'+esc(nm)+'</h2><div class="m-sb">'+esc(sub)+'</div></div></div>'+
      '<div class="m-dtabs" style="margin:0 -14px;padding:10px 14px">'+tabs.map(function(t){return '<button class="'+(E.tab===t[0]?'on':'')+'" data-met="'+t[0]+'">'+t[1]+'</button>'}).join('')+'</div><div style="padding-top:10px">';
    return head+(isT?teamTab(E,d,p):playerTab(E,d,p))+'</div></div>'}
  function teamTab(E,d,p){var t=E.tab,sch=d.schedule||[],done=sch.filter(function(x){return x.done}).sort(function(a,b){return new Date(a.date)-new Date(b.date)}),up=sch.filter(function(x){return !x.done}).sort(function(a,b){return new Date(a.date)-new Date(b.date)});
    function res(x){return x.win===true?'w':x.win===false&&x.my!=null&&String(x.my)!==String(x.their)?'l':'d'}
    function mrow(x){return '<div class="m-mr"><small>'+esc(fmtD(x.date,{weekday:'short',day:'numeric',month:'short'}))+'<br>'+(x.done?'':esc(fmtT(x.date)))+'</small><div class="mid">'+logo(x.oppLogo,String(x.opp).slice(0,3).toUpperCase())+'<span>'+esc((x.home?'':'@ ')+x.opp)+'</span></div>'+(x.done?'<b class="sc '+res(x)+'">'+esc(x.my)+' - '+esc(x.their)+'</b>':'<small>'+esc(x.league)+'</small>')+'</div>'}
    if(t==='ov'){var nx=up[0],h='';
      h+='<div class="m-card" style="padding:14px"><div class="m-h3" style="margin:0 0 6px">Next match</div>'+(nx?'<div style="color:var(--mu);font-size:13px;margin-bottom:8px">'+esc(fmtD(nx.date,{weekday:'short',day:'numeric',month:'short'}))+' · '+esc(fmtT(nx.date))+(nx.league?' · '+esc(nx.league):'')+'</div><div class="m-nm"><span>'+esc(nx.home?p.displayName:nx.opp)+'</span>'+logo(nx.home?(p.logos&&p.logos[0]&&p.logos[0].href):nx.oppLogo,'')+'<b>'+esc(fmtT(nx.date))+'</b>'+logo(nx.home?nx.oppLogo:(p.logos&&p.logos[0]&&p.logos[0].href),'')+'<span>'+esc(nx.home?nx.opp:p.displayName)+'</span></div>':'<div class="m-note">No upcoming match scheduled.</div>')+'</div>';
      var l5=done.slice(-5);h+='<div class="m-card" style="padding:14px"><div class="m-h3" style="margin:0 0 10px">Last '+(l5.length||5)+' matches</div>'+(l5.length?'<div class="m-l5">'+l5.map(function(x){return '<div><b class="sc '+res(x)+'">'+esc(x.my)+' - '+esc(x.their)+'</b>'+logo(x.oppLogo,String(x.opp).slice(0,3).toUpperCase())+'</div>'}).join('')+'</div>':'<div class="m-note">No results yet this season.</div>')+'</div>';
      h+='<div class="m-card" style="padding:14px"><div class="m-h3" style="margin:0 0 8px">Season stats</div>'+gridStats(d.statistics,9)+'</div>';return h}
    if(t==='nw')return (d.news&&d.news.length)?'<div class="m-card">'+d.news.map(function(a){return '<a class="m-news" href="'+esc(a.url)+'" target="_blank" rel="noopener noreferrer" style="color:inherit;text-decoration:none"><small>'+esc(fmtD(a.published,{day:'numeric',month:'short'}))+'</small><b>'+esc(a.title)+'</b><p>'+esc((a.description||'').slice(0,110))+'</p></a>'}).join('')+'</div>':'<div class="m-note">No recent headlines from ESPN.</div>';
    if(t==='mt')return sch.length?'<div class="m-card">'+sch.sort(function(a,b){return new Date(b.date)-new Date(a.date)}).map(mrow).join('')+'</div>':'<div class="m-note">No matches found for this season.</div>';
    if(t==='tb'){var S=E.std;if(S===undefined)return '<div class="m-note">Loading table…</div>';if(!S||!S.tables||!S.tables.length)return '<div class="m-note">The table is not available for this competition.</div>';
      var tb=S.tables.find(function(x){return x.entries.some(function(e){return String(e.id)===E.id})})||S.tables[0];
      return '<div class="m-card" style="padding:4px 8px"><table class="m-tbl"><thead><tr><th>#</th><th style="text-align:left">Team</th><th>P</th><th>W</th><th>D</th><th>L</th><th>Pts</th></tr></thead><tbody>'+tb.entries.map(function(e,i){var s=e.stats||{};return '<tr class="'+(String(e.id)===E.id?'me':'')+'"><td>'+esc(s.rank||i+1)+'</td><td class="n">'+tlogo(e)+esc(e.name)+'</td><td>'+esc(s.gamesPlayed||'')+'</td><td>'+esc(s.wins||'')+'</td><td>'+esc(s.ties||s.draws||'')+'</td><td>'+esc(s.losses||'')+'</td><td><b>'+esc(s.points||'')+'</b></td></tr>'}).join('')+'</tbody></table></div>'}
    if(t==='st')return '<div class="m-card" style="padding:14px">'+gridStats(d.statistics)+'</div>';
    if(t==='sq'){var rs=d.roster||[],groups=rs.length&&rs[0].items?rs.map(function(g){return{n:g.position||'',l:g.items||[]}}):[{n:'',l:rs}];
      if(!groups.some(function(g){return g.l.length}))return '<div class="m-note">No squad is available for this season.</div>';
      return groups.filter(function(g){return g.l.length}).map(function(g){return (g.n?'<div class="m-h3" style="font-size:14px;color:var(--mu);text-transform:capitalize">'+esc(g.n)+'</div>':'')+'<div class="m-card">'+g.l.map(function(a){return '<div class="m-pl" data-mp="'+esc(a.id)+'" style="cursor:pointer"><span class="j">'+esc(a.jersey||'–')+'</span>'+logo((a.headshot&&a.headshot.href)||'',String(a.displayName||'').slice(0,2).toUpperCase())+esc(a.displayName||a.fullName)+'<small>'+esc((a.position&&a.position.abbreviation)||'')+(a.age?' · '+esc(a.age):'')+'</small></div>'}).join('')+'</div>'}).join('')}
    return ''}
  function playerTab(E,d,p){var t=E.tab,S=d.statistics||[];
    if(t==='pf'){var facts=[[p.displayHeight,'Height'],[p.age?p.age+' years':'',p.dateOfBirth?fmtD(p.dateOfBirth,{day:'numeric',month:'short',year:'numeric'}):'Age'],[p.citizenship||(p.birthPlace&&p.birthPlace.country)||'','Country'],[p.jersey,'Shirt'],[p.displayWeight,'Weight'],[p.position&&p.position.displayName,'Position']].filter(function(x){return x[0]});
      var ap=pickS(S,/^appearances$/i),g=pickS(S,/^totalGoals$|^goals$/i),as=pickS(S,/^goalAssists$|^assists$/i);
      var h='<div class="m-card" style="padding:14px">'+(facts.length?'<div class="m-gs g3">'+facts.map(function(x){return '<div><b style="font-size:16px">'+esc(x[0])+'</b><small>'+esc(x[1])+'</small></div>'}).join('')+'</div>':'<div class="m-note">No profile details from the provider.</div>')+
        ((ap||g||as)?'<div class="m-gs g3" style="border-top:1px solid var(--line);margin-top:12px;padding-top:12px">'+[[ap,'Matches'],[g,'Goals'],[as,'Assists']].map(function(x){return '<div><b>'+esc(x[0]==null?'–':x[0])+'</b><small>'+x[1]+'</small></div>'}).join('')+'</div>':'')+'</div>';
      h+=posMap(p.position&&p.position.abbreviation,p.position&&p.position.displayName);return h}
    if(t==='mt'){var G=d.gamelog;if(!G||!G.items.length)return '<div class="m-note">Match log is not available for this player.</div>';
      var L=G.labels||[],ix=function(re){for(var i=0;i<L.length;i++)if(re.test(L[i]))return i;return -1},im=ix(/^MIN|minutes/i),ig=ix(/^G$|goals/i),ia=ix(/^A$|assists/i);
      return '<div class="m-card">'+G.items.map(function(x){var st=x.stats||[];return '<div class="m-mr"><small>'+esc(fmtD(x.date,{day:'numeric',month:'short'}))+'<br>'+esc(x.league)+'</small><div class="mid">'+logo(x.oppLogo,String(x.opp).slice(0,3).toUpperCase())+'<span>'+esc(x.ha+' '+x.opp)+'</span></div><b class="sc '+(x.res==='W'?'w':x.res==='L'?'l':'d')+'">'+esc(x.score)+'</b><small style="width:84px;text-align:right">'+(im>=0?esc(st[im])+'\' ':'')+(ig>=0&&+st[ig]?'⚽'+esc(st[ig])+' ':'')+(ia>=0&&+st[ia]?'🅰'+esc(st[ia]):'')+'</small></div>'}).join('')+'</div>'}
    if(t==='st')return '<div class="m-card" style="padding:14px">'+gridStats(S)+'</div>';
    if(t==='cr'){var C=d.career;if(!C)return '<div class="m-note">Career and trophies need the API-Football key (APIFOOTBALL_KEY) on the server, or no record was found for this player.</div>';
      var h='';h+='<div class="m-h3" style="margin-top:0">Transfers</div>'+(C.transfers.length?'<div class="m-card">'+C.transfers.map(function(x){return '<div class="m-mr"><small>'+esc(String(x.date||'').slice(0,7))+'</small><div class="mid">'+logo(x.fromLogo,'')+'<span>'+esc(x.from||'—')+'</span></div><span style="color:var(--mu)">→</span><div class="mid" style="justify-content:flex-end">'+logo(x.toLogo,'')+'<span>'+esc(x.to||'—')+'</span></div></div>'}).join('')+'</div>':'<div class="m-note">No transfers recorded.</div>');
      h+='<div class="m-h3">Trophies</div>'+(C.trophies.length?'<div class="m-card">'+C.trophies.map(function(x){return '<div class="m-pl">🏆 '+esc(x.league)+'<small>'+esc(x.season)+'</small></div>'}).join('')+'</div>':'<div class="m-note">No trophies recorded.</div>');return h}
    return ''}
  function openDet(k){var o=find(k);if(!o)return;M.det={k:k,tab:String(k).indexOf('af:')===0?'lu':'ov',data:null,std:undefined,err:false,g:o.g};loadDet();draw()}
  function loadDet(){var D=M.det;if(!D)return;var o=find(D.k);if(!o)return;if(String(D.k).indexOf('af:')===0){var kk=D.k;fetch('/api/lineup?fixture='+encodeURIComponent(kk.slice(3)),{signal:AbortSignal.timeout(20000)}).then(function(r){return r.json()}).then(function(j){if(M.det&&M.det.k===kk){M.det.af=j;draw()}}).catch(function(){if(M.det&&M.det.k===kk){M.det.af=null;draw()}});return}var k=D.k,season=Number((typeof feedDate!=='undefined'&&feedDate||'').slice(0,4))||new Date().getUTCFullYear();
    fetch('/api/details?'+new URLSearchParams({kind:'match',id:k,league:o.g.path,season:String(season)}),{signal:AbortSignal.timeout(15000)}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){if(M.det&&M.det.k===k){M.det.data=j;M.det.err=false;try{center={path:o.g.path,group:o.g,match:o.m,data:j,view:'match',tab:'events',season:j.season}}catch(er){}draw()}}).catch(function(){if(M.det&&M.det.k===k){M.det.err=true;draw()}})}
  function loadStd(){var D=M.det;if(!D||D.std!==undefined||D.stdBusy)return;var o=find(D.k);if(!o)return;D.stdBusy=1;var k=D.k;
    fetch('/api/details?'+new URLSearchParams({kind:'standings',id:'0',league:o.g.path,season:String(new Date().getUTCFullYear())}),{signal:AbortSignal.timeout(15000)}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){if(M.det&&M.det.k===k){M.det.std=j;draw()}}).catch(function(){if(M.det&&M.det.k===k){M.det.std=null;draw()}})}

  /* ---------- sheets ---------- */
  function sheet(){
    if(M.sheet==='about')return '<div class="m-sheet" data-ma="closesheet"><div data-stop><h3>About All Sports</h3><p style="color:var(--mu)">Live scores, match details and team news in one app. Scores via the public ESPN feed, checked every 30 seconds. Times shown in Bangladesh time (UTC+6).</p></div></div>';
    if(M.sheet==='addfav'){var seen={},list=[];allM().forEach(function(o){if(!/^soccer|basketball|hockey|baseball/.test(o.g.path))return;[0,1].forEach(function(t){var id=o.m[11+t],n=o.m[t];if(!id||seen[o.g.path+id])return;seen[o.g.path+id]=1;list.push({id:String(id),name:n,league:o.g.path,ln:o.g.name,logo:o.m[9+t],ab:o.m[6+t]})})});
      var q=(M.fq||'').toLowerCase();list=list.filter(function(x){return !q||x.name.toLowerCase().indexOf(q)>=0}).slice(0,60);
      return '<div class="m-sheet" data-ma="closesheet"><div data-stop><h3>Add Favourite Team</h3><input id="m-fq" class="m-in" placeholder="Search teams…" value="'+esc(M.fq||'')+'">'+(list.length?'<div class="m-card">'+list.map(function(x){var on=fan.teams.some(function(t){return t.id===x.id&&t.league===x.league});return '<button class="m-lrow" data-muf="'+esc(x.id)+'|'+esc(x.league)+'|'+esc(x.name)+'">'+mc(x.logo,x.ab)+'<div class="mid"><b>'+esc(x.name)+'</b><small>'+esc(x.ln)+'</small></div><span class="bell">'+(on?'★':'☆')+'</span></button>'}).join('')+'</div>':empty('search','No teams found','Teams from today’s matches appear here.'))+'</div></div>'}
    return ''}

  /* ---------- render ---------- */
  var scrollKeep={};
  function draw(){
    if(!root.isConnected||!document.documentElement.classList.contains('m'))return;
    var sc=root.querySelector('.m-scr'),sy=sc?sc.scrollTop:0;
    var fi=document.activeElement&&document.activeElement.id,fs=fi&&document.activeElement.selectionStart;
    var body=M.ent?entity():M.det?detail():M.tab==='nations'?nationsScr():M.sub==='sports'?sports():M.sub==='search'?search():M.tab==='home'?home():M.tab==='matches'?matches():M.tab==='fav'?favs():M.tab==='news'?news():more();
    var nk=M.tab+(M.sub||'')+(M.det?M.det.k+M.det.tab:'')+(M.ent?M.ent.kind+M.ent.id+M.ent.tab:''),changed=nk!==scrollKeep.k;
    if(!changed)body=body.replace(' m-pop','');
    var nav=[['home','Home','home'],['matches','Matches','ball'],['fav','Favourites','star'],['news','News','news'],['more','More','dots']].map(function(n){return '<button class="'+((M.tab===n[0]||(n[0]==='more'&&M.tab==='nations'))&&!M.det?'on':'')+'" data-mn="'+n[0]+'">'+ic(n[2])+n[1]+'</button>'}).join('');
    var out=body+((M.det||M.ent)?'':'<nav class="m-nav">'+nav+'</nav>')+sheet()+(M.toast?'<div class="m-toast">'+esc(M.toast)+'</div>':'');
    if(!changed&&out===M.last)return;
    M.last=out;root.innerHTML=out;scrollKeep.k=nk;
    var ns=root.querySelector('.m-scr');if(ns&&!changed)ns.scrollTop=sy;
    if(fi){var el=document.getElementById(fi);if(el&&el.tagName==='INPUT'){el.focus();try{el.setSelectionRange(fs,fs)}catch(e){}}}
    if(M.det&&M.det.tab==='sd')loadStd();if(M.ent&&M.ent.tab==='tb')loadEntStd();
    var host=document.getElementById('m-host');if(host&&M.tab==='nations'&&typeof content!=='undefined')host.appendChild(content);
    var dt=document.getElementById('m-dates');if(dt){var on=dt.querySelector('.on');if(on)dt.scrollLeft=on.offsetLeft-dt.clientWidth/2+on.offsetWidth/2}
  }
  function go(tab){if(typeof page!=='undefined'&&page!=='scores'){page='scores';favoriteView=false;league=null}M.live=false;M.tab=tab;M.sub='';M.det=null;M.sheet='';draw()}
  function setDate(o){date=o;M.det=null;render();draw()}

  root.addEventListener('click',function(e){
    var t=e.target;
    var x=t.closest('[data-stop]');if(x){var hit=t.closest('[data-ma],[data-muf],[data-mm],[data-mfl]');if(!hit||!x.contains(hit))return}
    var el;
    if((el=t.closest('[data-mn]')))return go(el.dataset.mn);
    if((el=t.closest('[data-mm]')))return openDet(el.dataset.mm);
    if((el=t.closest('[data-md]')))return setDate(Number(el.dataset.md));
    if((el=t.closest('[data-mlive]'))){M.live=!M.live;return draw()}
    if((el=t.closest('[data-mhs]'))){var v=el.dataset.mhs;M.sport=v==='For You'?'All':v;if(M.tab==='home'&&!M.sub)return draw();return draw()}
    if((el=t.closest('[data-msp]'))){M.sport=el.dataset.msp;M.tab='matches';M.sub='';return draw()}
    if((el=t.closest('[data-mft]'))){M.favTab=el.dataset.mft;return draw()}
    if((el=t.closest('[data-met]'))){M.ent.tab=el.dataset.met;return draw()}
    if((el=t.closest('[data-mp]')))return openEnt('player',el.dataset.mp);
    if((el=t.closest('[data-mt]')))return openEnt('team',el.dataset.mt);
    if((el=t.closest('[data-mteam]'))){var tp=el.dataset.mteam.split('|');return openEnt('team',tp[0],tp[1])}
    if((el=t.closest('[data-mlt]'))){M.det.lt=Number(el.dataset.mlt);return draw()}
    if((el=t.closest('[data-mdt]'))){M.det.tab=el.dataset.mdt;return draw()}
    if((el=t.closest('[data-mfl]'))){var n=el.dataset.mfl,i=favLg.indexOf(n);i>=0?favLg.splice(i,1):favLg.push(n);try{localStorage.setItem('allsport_m_favleagues',JSON.stringify(favLg))}catch(er){}return draw()}
    if((el=t.closest('[data-mut]'))){var p=el.dataset.mut.split('|');fanRequest({action:'unfollow',team:{id:p[0],league:p[1],name:''}}).then(function(f){fan=f;draw()}).catch(function(er){toast(er.message)});return}
    if((el=t.closest('[data-muf]'))){var q=el.dataset.muf.split('|'),on=fan.teams.some(function(tm){return tm.id===q[0]&&tm.league===q[1]});fanRequest({action:on?'unfollow':'follow',team:{id:q[0],league:q[1],name:q[2]}}).then(function(f){fan=f;if(!on&&typeof refreshNews==='function')refreshNews(false);draw()}).catch(function(er){toast(er.message)});return}
    if(!(el=t.closest('[data-ma]')))return;
    var a=el.dataset.ma;
    switch(a){
      case 'nations':M.det=null;M.sub='';M.tab='nations';page='nations';favoriteView=false;league=null;render();break;
      case 'gomore':go('more');return;
      case 'home':M.det=null;M.sub='';M.tab='home';M.live=false;break;
      case 'sports':M.sub='sports';break;
      case 'search':M.sub='search';M.q='';break;
      case 'news':M.det=null;M.sub='';M.tab='news';break;
      case 'matches':M.tab='matches';M.sub='';M.live=true;M.sport='All';break;
      case 'watch':toast('Live streaming needs a video source — coming soon.');return;
      case 'explore':toast('More sports coming soon.');return;
      case 'closedet':M.det=null;M.ent=null;M.stack=[];break;
      case 'closeent':closeEnt();return;
      case 'closesheet':M.sheet='';break;
      case 'addfav':M.sheet='addfav';M.fq='';break;
      case 'cal':var inp=document.createElement('input');inp.type='date';inp.value=selectedDate(date);inp.style.cssText='position:fixed;opacity:0;pointer-events:none';root.appendChild(inp);inp.addEventListener('change',function(){if(inp.value){var b=new Date(selectedDate(0)+'T00:00:00Z').getTime(),c=new Date(inp.value+'T00:00:00Z').getTime();setDate(Math.round((c-b)/864e5))}inp.remove()});try{inp.showPicker?inp.showPicker():inp.click()}catch(er){inp.click()}return;
      case 'savem':var kk=M.det.k;saved.has(kk)?saved.delete(kk):saved.add(kk);persistSaved();toast(saved.has(kk)?'Match saved to Favourites':'Removed from Favourites');return;
      case 'shr':try{if(navigator.share){navigator.share({title:'All Sports',url:location.href});return}}catch(er){}toast('Sharing is not supported here.');return;
      case 'readnews':fanRequest({action:'read',at:new Date().toISOString()}).then(function(f){fan=f;draw()}).catch(function(){});return;
      case 'theme':root.dataset.mtheme=root.dataset.mtheme==='light'?'dark':'light';try{applyTheme(root.dataset.mtheme==='light'?'light':'night')}catch(er){};try{localStorage.setItem('allsport_m_theme',root.dataset.mtheme)}catch(er){}break;
      case 'about':M.sheet='about';break;
      case 'share':try{if(navigator.share){navigator.share({title:'All Sports',url:location.origin});return}navigator.clipboard.writeText(location.origin);toast('Link copied');}catch(er){toast(location.origin)}return;
      case 'premium':toast('Premium is coming soon.');return;
      case 'lang':toast('More languages coming soon.');return;
      case 'rate':toast('Thanks! Rating will open once the app is on the store.');return;
      case 'feedback':toast(typeof ABOUT_CONTACT!=='undefined'&&ABOUT_CONTACT?ABOUT_CONTACT:'Feedback form coming soon.');return;
      case 'settings':M.tab='more';break;
      case 'desktop':try{localStorage.setItem('allsport_desktop','1')}catch(er){}location.href=location.pathname+'?desktop=1';return;
    }
    draw();
  });
  root.addEventListener('input',function(e){if(e.target.id==='m-q'){M.q=e.target.value;try{query=M.q.toLowerCase().trim();if(M.sport!=='All')sport=M.sport;else sport='Football';schedulePlayerSearch()}catch(er){}draw()}if(e.target.id==='m-fq'){M.fq=e.target.value;draw()}});


  function openEnt(kind,id,path){
    var p=path||(M.ent&&M.ent.path)||(M.det&&find(M.det.k)&&find(M.det.k).g.path);
    if(!p)return toast('Details unavailable');
    (M.stack=M.stack||[]);if(M.ent)M.stack.push(M.ent);
    M.ent={kind:kind,id:String(id),path:p,season:new Date().getUTCFullYear(),tab:kind==='team'?'ov':'pf',data:null,err:false,std:undefined};
    loadEnt();draw();
  }
  function closeEnt(){M.ent=M.stack&&M.stack.length?M.stack.pop():null;draw()}
  function loadEnt(){var E=M.ent;if(!E)return;var k=E.kind+E.id;
    fetch('/api/details?'+new URLSearchParams({kind:E.kind,id:E.id,league:E.path,season:String(E.season)}),{signal:AbortSignal.timeout(20000)}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){if(M.ent&&M.ent.kind+M.ent.id===k){M.ent.data=j;draw()}}).catch(function(){if(M.ent&&M.ent.kind+M.ent.id===k){M.ent.err=true;draw()}})}
  function loadEntStd(){var E=M.ent;if(!E||E.std!==undefined||E.stdBusy)return;E.stdBusy=1;var k=E.kind+E.id;
    fetch('/api/details?'+new URLSearchParams({kind:'standings',id:'0',league:E.path,season:String(E.season)}),{signal:AbortSignal.timeout(15000)}).then(function(r){if(!r.ok)throw 0;return r.json()}).then(function(j){if(M.ent&&M.ent.kind+M.ent.id===k){M.ent.std=j;draw()}}).catch(function(){if(M.ent&&M.ent.kind+M.ent.id===k){M.ent.std=null;draw()}})}
  document.addEventListener('click',function(e){var b=e.target.closest&&e.target.closest('[data-center-back]');if(b&&document.documentElement.classList.contains('m')){e.stopImmediatePropagation();e.preventDefault();document.getElementById('detail').close()}},true);
  document.getElementById('detail').addEventListener('close',function(){if(M.det&&M.det.data){var o=find(M.det.k);if(o)center={path:o.g.path,group:o.g,match:o.m,data:M.det.data,view:'match',tab:'events',season:M.det.data.season}}M.last='';draw()});
  root.addEventListener('error',function(e){if(e.target&&e.target.tagName==='IMG'&&e.target.closest('.pp,.mc'))e.target.remove()},true);
  function sync(){var on=wantMobile();document.documentElement.classList.toggle('m',on);if(on){try{var wantT=root.dataset.mtheme==='light'?'light':'night';if(document.documentElement.dataset.theme!==wantT)applyTheme(wantT)}catch(er){}document.querySelector('meta[name=theme-color]')&&document.querySelector('meta[name=theme-color]').setAttribute('content','#06150a');draw()}}
  if(mq.addEventListener)mq.addEventListener('change',sync);
  /* redraw whenever the shared data re-renders */
  var _r=render;render=function(){_r();if(document.documentElement.classList.contains('m')){if(M.det&&M.det.data&&find(M.det.k)&&find(M.det.k).m[5]==='live')loadDet();draw()}};
  /* keep news/fan state in sync */
  setInterval(function(){if(document.documentElement.classList.contains('m')&&!document.hidden&&!M.sheet&&document.activeElement.tagName!=='INPUT')draw()},20000);
  sync();
})();
