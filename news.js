let fan={teams:[],readAt:new Date().toISOString()},fanReady=false,fanError='',newsItems=[],newsFailures=[],newsBusy=false,newsOpen=false,newsCheckedAt=null;
const announcedNews=new Set();
function followedTeam(id,league){return fan.teams.some(t=>t.id===String(id)&&t.league===league)}
function followTeamButton(id,name,league){const active=followedTeam(id,league);return `<button class="follow-team ${active?'following':''}" data-follow-team="${esc(id)}" data-follow-name="${esc(name)}" data-follow-league="${esc(league)}" aria-pressed="${active}" ${!fanReady?'disabled':''}>${active?'★ Following team':'☆ Follow team news'}</button>`}
const FAN_KEY='allsport_fan_v1',FAN_LEAGUES=['soccer/uefa.champions','soccer/eng.1','soccer/esp.1','soccer/ger.1','soccer/ita.1','soccer/fra.1','soccer/usa.1','soccer/ksa.1','soccer/por.1','soccer/ned.1','soccer/bra.1','soccer/arg.1','soccer/eng.2','soccer/eng.3','soccer/eng.fa','soccer/eng.league_cup','soccer/fifa.world','soccer/fifa.friendly','soccer/fifa.worldq.afc','soccer/fifa.worldq.caf','soccer/fifa.worldq.concacaf','soccer/fifa.worldq.conmebol','soccer/fifa.worldq.ofc','soccer/fifa.worldq.uefa','soccer/uefa.nations','soccer/uefa.euro','soccer/uefa.euroq','soccer/conmebol.america','soccer/concacaf.gold','soccer/concacaf.nations.league','soccer/caf.nations','soccer/afc.asian.cup','basketball/nba','hockey/nhl','baseball/mlb'];
function fanLoad(){try{const d=JSON.parse(localStorage.getItem(FAN_KEY)||'null');if(d&&Array.isArray(d.teams))return d}catch{}return{teams:[],readAt:new Date().toISOString()}}
function fanSave(d){try{localStorage.setItem(FAN_KEY,JSON.stringify(d))}catch{}return d}
async function fanRequest(body){const d=fanLoad();if(!body)return fanSave(d);
if(body.action==='read'){const at=new Date(body.at);if(!Number.isFinite(+at))throw Error('Invalid timestamp');d.readAt=at.toISOString();return fanSave(d)}
if(body.action==='follow'||body.action==='unfollow'){const t=body.team;if(!t||!FAN_LEAGUES.includes(t.league))throw Error('Invalid team');d.teams=d.teams.filter(v=>!(v.id===t.id&&v.league===t.league));if(body.action==='follow'){if(d.teams.length>=20)throw Error('You can follow up to 20 teams.');d.teams.push({id:String(t.id),league:t.league,name:String(t.name).slice(0,120)})}return fanSave(d)}
throw Error('Invalid action')}
function updateNewsBadge(){const unread=newsItems.filter(a=>Date.parse(a.published)>Date.parse(fan.readAt)).length;const badge=document.getElementById('news-count');badge.textContent=unread>99?'99+':unread;badge.hidden=!unread;document.getElementById('notifications').setAttribute('aria-label',`Team news notifications, ${unread} unread`)}
async function loadFan(){try{fan=await fanRequest();fanReady=true;fanError='';if(center?.data&&document.getElementById('detail').open&&!newsOpen)renderCenter();await refreshNews(false)}catch(e){fanError=e.message}if(newsOpen)renderNews()}
async function refreshNews(alert=true){
 if(newsBusy||!fanReady)return;
 newsBusy=true;if(newsOpen)renderNews();
 const teams=[...fan.teams];
 const results=await Promise.allSettled(teams.map(async t=>{const q=new URLSearchParams({id:t.id,league:t.league});const r=await fetch('/api/news?'+q,{signal:AbortSignal.timeout(12000)});if(!r.ok)throw Error();const d=await r.json();return d.articles.map(a=>({...a,team:t.name,teamKey:t.league+':'+t.id}))}));
 const items=new Map();newsFailures=[];
 results.forEach((r,i)=>{if(r.status==='fulfilled')r.value.forEach(a=>items.set(a.id,a));else{newsFailures.push(teams[i].name);newsItems.filter(a=>a.teamKey===teams[i].league+':'+teams[i].id).forEach(a=>items.set(a.id,a))}});
 newsItems=[...items.values()].sort((a,b)=>Date.parse(b.published)-Date.parse(a.published));newsCheckedAt=new Date().toISOString();newsBusy=false;updateNewsBadge();
 const fresh=newsItems.filter(a=>!announcedNews.has(a.id)&&Date.parse(a.published)>Date.parse(fan.readAt));
 if(alert&&fresh.length&&'Notification' in window&&Notification.permission==='granted'){
  try{const n=new Notification(fresh.length===1?fresh[0].team:`${fresh.length} team news updates`,{body:fresh[0].title,tag:'allsport-team-news'});n.onclick=()=>{window.focus();openNews();n.close()}}catch{}
 }
 newsItems.forEach(a=>announcedNews.add(a.id));if(newsOpen)renderNews();
}
function openNews(){const dialog=document.getElementById('detail');if(!dialog.open)show('');newsOpen=true;renderNews()}
function renderNews(){
 const enabled='Notification' in window&&Notification.permission==='granted';
 let html=`<div class="eyebrow">YOUR CLUBS. YOUR HEADLINES.</div><h2>Team news<span style="color:var(--green)">.</span></h2><p>Follow teams from a match’s Line-ups tab or team profile. Favorites are saved for this browser.</p><div class="news-toolbar"><button class="follow-team" data-enable-alerts>${enabled?'Browser alerts enabled':'Enable browser alerts'}</button><button class="follow-team" data-news-read ${!newsItems.length||newsBusy?'disabled':''}>Mark all read</button><button class="follow-team" data-news-refresh ${newsBusy?'disabled':''}>${newsBusy?'Checking…':'Refresh news'}</button></div><p class="coverage-note">Alerts check every minute while this app is open and visible. Closed-app push notifications are not enabled. ESPN coverage may not include every team story.</p>`;
 if(fanError)html+=`<div class="detail-error" role="status">${esc(fanError)} <button data-fan-retry>Retry</button></div>`;
 if(!fanReady&&!fanError)html+='<div class="detail-loading" role="status">Loading your favorite teams…</div>';
 html+=`<div class="followed-teams">${fan.teams.map(t=>`<span>${esc(t.name)} <button data-remove-team="${esc(t.id)}" data-remove-league="${esc(t.league)}" aria-label="Unfollow ${esc(t.name)}">×</button></span>`).join('')}</div>`;
 if(newsFailures.length)html+=`<div class="detail-error" role="status">News unavailable for ${esc(newsFailures.join(', '))}. Previously received headlines remain visible. Try refreshing.</div>`;
 if(!newsItems.length)html+=emptyDetail(!fan.teams.length?'No followed teams yet. Open a match, choose Line-ups, then Follow team news.':newsBusy?'Checking the latest team headlines…':'No recent team-tagged headlines are available from ESPN. Check again later.');
 else html+=`<div class="news-list">${newsItems.map(a=>`<article class="news-item ${Date.parse(a.published)>Date.parse(fan.readAt)?'unread':''}"><div class="eyebrow">${esc(a.team)} · ${Date.parse(a.published)>Date.parse(fan.readAt)?'UNREAD':'READ'}</div><a href="${esc(a.url)}" target="_blank" rel="noopener noreferrer">${esc(a.title)} ↗</a><p>${esc(a.description)}</p><small>ESPN · ${esc(new Date(a.published).toLocaleString())}</small></article>`).join('')}</div>`;
 if(newsCheckedAt)html+=`<p class="coverage-note">Last checked ${esc(new Date(newsCheckedAt).toLocaleTimeString())}</p>`;
 document.getElementById('dialog-content').innerHTML=html;
}
async function changeFollow(team,remove=false){
 const buttons=document.querySelectorAll('[data-follow-team], [data-remove-team]');buttons.forEach(b=>b.disabled=true);
 try{fan=await fanRequest({action:remove?'unfollow':'follow',team});fanError='';newsItems=newsItems.filter(a=>fan.teams.some(t=>t.league+':'+t.id===a.teamKey));if(!newsOpen&&center)renderCenter();await refreshNews(false)}catch(e){fanError=e.message;const toast=document.getElementById('toast');toast.textContent=e.message;toast.classList.add('show');setTimeout(()=>toast.classList.remove('show'),5000)}finally{buttons.forEach(b=>b.disabled=false);if(newsOpen)renderNews()}
}
document.getElementById('notifications').onclick=openNews;
document.getElementById('detail').addEventListener('close',()=>newsOpen=false);
document.addEventListener('click',async e=>{
 const follow=e.target.closest('[data-follow-team]');
 if(follow){const t={id:follow.dataset.followTeam,name:follow.dataset.followName,league:follow.dataset.followLeague};await changeFollow(t,followedTeam(t.id,t.league));return}
 const remove=e.target.closest('[data-remove-team]');if(remove){const t=fan.teams.find(t=>t.id===remove.dataset.removeTeam&&t.league===remove.dataset.removeLeague);if(t)await changeFollow(t,true);return}
 if(e.target.closest('[data-enable-alerts]')){if(!('Notification'in window))fanError='Browser alerts are not supported here. Use this inbox for updates.';else if(Notification.permission==='denied')fanError='Browser alerts are blocked. You can change this in your browser’s site permissions.';else{const permission=await Notification.requestPermission();fanError=permission==='granted'?'':'Browser alerts were not enabled. Team news remains available in this inbox.'}renderNews()}
 if(e.target.closest('[data-news-refresh]'))await refreshNews(false);
 if(e.target.closest('[data-fan-retry]'))await loadFan();
 if(e.target.closest('[data-news-read]')){try{fan=await fanRequest({action:'read',at:newsCheckedAt||new Date().toISOString()});updateNewsBadge()}catch(e){fanError=e.message}renderNews()}
});
setInterval(()=>{if(!document.hidden)refreshNews()},60000);
document.addEventListener('visibilitychange',()=>{if(!document.hidden)refreshNews()});
loadFan();
