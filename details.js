let center=null, centerVersion=0;
function emptyDetail(text){return `<div class="detail-empty">${esc(text)}</div>`}
function statGrid(stats){return stats?.length?`<div class="stat-grid">${stats.map(s=>`<div><small>${esc(s.label||s.displayName||s.name)}</small><b>${esc(s.value??s.displayValue??'\u2014')}</b></div>`).join('')}</div>`:emptyDetail('Statistics are not available from the provider for this selection.')}
function playerPortrait(a,large=false){
 const name=a?.displayName||a?.fullName||'Player';
 const supplied=a?.apiPhoto||a?.headshot?.href||a?.headshot;
 const sportPath=center?.path?.split('/')[0];
 const photo=typeof supplied==='string'&&/^https:\/\//.test(supplied)?supplied:(a?.id&&sportPath?`https://a.espncdn.com/i/headshots/${sportPath==='basketball'?'nba':sportPath==='hockey'?'nhl':sportPath==='baseball'?'mlb':sportPath}/players/full/${encodeURIComponent(a.id)}.png`:null);
 return `<span class="player-portrait ${large?'large':''}" role="img" aria-label="${esc(name)} portrait" data-name="${esc(name)}" data-id="${esc(a?.id||'')}"><span>${esc(name.split(/\s+/).map(n=>n[0]).slice(0,2).join(''))}</span>${photo?`<img src="${esc(photo)}" alt="" loading="lazy" referrerpolicy="no-referrer">`:''}</span>`;
}
document.addEventListener('error',e=>{if(e.target.matches?.('.player-portrait img')){e.target.remove();enhancePhotos();}},true);
function statVal(p,...names){for(const n of names){const s=p.stats?.find(x=>x.name===n);if(s&&Number.isFinite(+s.value))return +s.value}return 0}
function teamCtx(t){const cs=center?.data?.header?.competitions?.[0]?.competitors||[];const id=String(t?.team?.id);const me=cs.find(c=>String(c.id)===id||String(c.team?.id)===id);const op=cs.find(c=>c!==me);if(!me||!op)return null;const a=Number(me.score),b=Number(op.score);if(!Number.isFinite(a)||!Number.isFinite(b))return null;return{result:Math.sign(a-b),conceded:b,gd:Math.abs(a-b)}}
function extraRating(p){
 const a=p.api;const espn=(rx)=>{const s=p.stats?.find(s=>rx.test(s.name));return s&&Number.isFinite(+s.value)?+s.value:0};
 const passes=a?.passes?.total??espn(/^(totalPasses|passes)$/i),acc=a?.passes?.acc??null;
 const key=a?.passes?.key??espn(/^(keyPasses|chancesCreated)$/i);
 const tk=a?.tackles?.total??espn(/^(totalTackles|tackles|effectiveTackles)$/i);
 const ic=a?.tackles?.interceptions??espn(/^interceptions$/i);
 const bl=a?.tackles?.blocks??espn(/^(blockedShots|blocks)$/i);
 const dr=a?.dribbles?.success??espn(/^(dribblesWon|successfulDribbles|takeOnsWon)$/i);
 const da=a?.dribbles?.attempts??null,dw=a?.duels?.won??null,dt=a?.duels?.total??null;
 let x=0;
 if(passes>=15&&acc!=null)x+=(acc-80)/100;
 x+=key*0.25+Math.min(tk,6)*0.12+ic*0.1+bl*0.08+dr*0.2;
 if(da!=null)x-=Math.max(0,da-dr)*0.05;
 if(dt>=6&&dw!=null)x+=(dw/dt-0.5)*0.6;
 return Math.max(-1,Math.min(1.2,x))}
function hasDetail(p){return !!p.api||!!p.stats?.some(s=>/^(totalPasses|passes|keyPasses|totalTackles|tackles|interceptions|dribblesWon|successfulDribbles)$/i.test(s.name))}
function estRating(p,ctx){if(!p||!p.stats?.length||!(p.starter||p.subbedIn))return null;
const g=statVal(p,'totalGoals','goals'),a=statVal(p,'goalAssists','assists'),sot=statVal(p,'shotsOnTarget'),sh=statVal(p,'totalShots','shots'),fc=statVal(p,'foulsCommitted'),fs=statVal(p,'foulsSuffered'),yc=statVal(p,'yellowCards'),rc=statVal(p,'redCards'),og=statVal(p,'ownGoals'),off=statVal(p,'offsides'),sv=statVal(p,'saves'),gc=statVal(p,'goalsConceded');
const pos=(p.position?.displayName||p.position?.name||'').toLowerCase();const gk=(p.position?.abbreviation||'')==='G'||/goalkeeper/.test(pos);const def=/back|defend/.test(pos);
let r=6.6+g*1+a*0.7+sot*0.2+Math.max(0,sh-sot)*0.04+fs*0.05-fc*0.1-yc*0.4-rc*2-og-off*0.1;
if(gk)r+=sv*0.3-gc*0.4;
if(ctx){const w=p.starter?1:0.6;r+=w*ctx.result*(0.45+0.08*Math.min(ctx.gd||0,3));if(gk){if(ctx.conceded===0)r+=0.4}else if(def&&p.starter)r+=ctx.conceded===0?0.5:-0.1*Math.min(ctx.conceded,3)}
r+=extraRating(p);if(r>8)r=8+(r-8)*0.5;
return Math.min(10,Math.max(4.5,r)).toFixed(1)}
function playerRatingText(pl){const t=center?.data?.rosters?.find(t=>(t.roster||[]).includes(pl));const r=matchRating(pl,teamCtx(t));return r?r.value+(r.est?' (estimated from match stats)':r.api?' (API-Football)':''):'Unavailable'}
function apiStatList(p){const a=p?.api;if(!a)return[];const L=[];const add=(label,value)=>{if(value!==null&&value!==undefined&&value!=='')L.push({label,value})};
add('Minutes',a.minutes);add('Passes',a.passes?.total!=null?a.passes.total+(a.passes.acc!=null?` (${Math.round(a.passes.acc)}%)`:''):null);add('Key passes',a.passes?.key);add('Tackles',a.tackles?.total);add('Interceptions',a.tackles?.interceptions);add('Blocks',a.tackles?.blocks);
add('Duels won',a.duels?.total!=null?`${a.duels.won??0}/${a.duels.total}`:null);add('Dribbles',a.dribbles?.attempts!=null?`${a.dribbles.success??0}/${a.dribbles.attempts}`:null);add('Fouls drawn',a.fouls?.drawn);add('Fouls committed',a.fouls?.committed);add('Shots (on target)',a.shots?.total!=null?`${a.shots.total} (${a.shots.on??0})`:null);add('Saves',a.goals?.saves);return L}
function providerNote(d){const p=d?.provider;if(!p)return '';if(p.used)return ` Extra stats: API-Football (${p.matched}/${p.total} players matched).`;const why={'not-started':'', 'fixture-not-found':' API-Football: this match was not found.','teams-missing':'', error:' API-Football: no data (key, plan limit or season not covered).'}[p.reason];return why||''}
function playerEst(pl){const t=center?.data?.rosters?.find(t=>(t.roster||[]).includes(pl));return estRating(pl,teamCtx(t))}
function matchRating(p,ctx){const pr=p.stats?.find(s=>/^(rating|ratingFromDataFeed|ratingFromCorrespondent)$/.test(s.name)&&Number(s.value)>0);if(pr)return{value:Number(pr.value).toFixed(1),est:false};if(p.api?.rating)return{value:Number(p.api.rating).toFixed(1),est:false,api:true};const e=estRating(p,ctx);return e?{value:e,est:true}:null}
function ratingClass(v){v=+v;return v>=7?'r-green':v>=6?'r-amber':'r-red'}
let motmCache=new WeakMap();
function motm(){const d=center?.data;if(!d?.rosters)return null;if(motmCache.has(d))return motmCache.get(d);let best=null,bv=-1;d.rosters.forEach(t=>{const ctx=teamCtx(t);(t.roster||[]).forEach(p=>{const r=matchRating(p,ctx);if(r&&+r.value>bv){bv=+r.value;best=p}})});motmCache.set(d,best);return best}
function lateralRank(p){const a=(p.position?.abbreviation||'').toUpperCase();if(/^(LB|LWB|LM|LW|LF)$/.test(a))return -2;if(/^(RB|RWB|RM|RW|RF)$/.test(a))return 2;if(/^L|-L$/.test(a))return -1;if(/^R|-R$/.test(a))return 1;return 0}
function hasGA(p){return !!p.stats?.some(s=>s.name==='totalGoals'||s.name==='goalAssists'||s.name==='goals'||s.name==='assists')}
function pitchIcons(p){const pl=p.plays||[];let s='';const g=statVal(p,'totalGoals','goals'),a=statVal(p,'goalAssists','assists');if(g)s+='\u26bd'+(g>1?'\u00d7'+g:'');if(a)s+='\ud83d\udc5f'+(a>1?'\u00d7'+a:'');if(!hasGA(p)&&pl.some(e=>e.scoringPlay))s+='\u26bd';if(pl.some(e=>e.yellowCard))s+='\ud83d\udfe8';if(pl.some(e=>e.redCard))s+='\ud83d\udfe5';if(p.starter&&(p.subbedOut||pl.some(e=>e.substitution)))s+='\ud83d\udd3b';return s}
function playSummary(p){const g=statVal(p,'totalGoals','goals'),a=statVal(p,'goalAssists','assists');const parts=[];if(g)parts.push('Goal'+(g>1?' \u00d7'+g:''));if(a)parts.push('Assist'+(a>1?' \u00d7'+a:''));(p.plays||[]).forEach(e=>{const c=e.clock?.displayValue||'';if(e.redCard)parts.push(c+' Red card');else if(e.yellowCard)parts.push(c+' Yellow card');else if(e.substitution)parts.push(c+' Substitution');else if(e.scoringPlay){if(!hasGA(p))parts.push(c+' Goal/assist')}else parts.push(c+' Event')});return parts.map(x=>x.trim()).join(' \u00b7 ')}
function playerButton(a,label){return a?.id?`<button class="player-link" data-player="${esc(a.id)}">${playerPortrait(a)}<span>${esc(label||a.displayName||a.fullName||'Player')}</span></button>`:esc(label||a?.displayName||'Player')}
function positionPitch(t){
 const starters=(t.roster||[]).filter(p=>p.starter);
 if(!starters.length||!center.path.startsWith('soccer/'))return '';
 const rows=[[],[],[],[],[]];
 starters.forEach(p=>{const pos=(p.position?.displayName||p.position?.name||'').toLowerCase();const row=/goalkeeper/.test(pos)?0:/back|defend/.test(pos)?1:/midfield/.test(pos)?2:/forward|striker|wing|attack/.test(pos)?3:4;rows[row].push(p)});
 rows.forEach(r=>r.sort((a,b)=>lateralRank(a)-lateralRank(b)));
 const ctx=teamCtx(t);const rated=starters.map(p=>({p,r:matchRating(p,ctx)})).filter(x=>x.r);
 const avg=rated.length?(rated.reduce((s,x)=>s+ +x.r.value,0)/rated.length).toFixed(1):null;
 const top=rated.slice().sort((a,b)=>b.r.value-a.r.value)[0];const mvp=motm();
 return `<div class="pitch-caption"><span>Starting XI \u00b7 ${esc(t.formation||'position groups')}</span>${avg?`<span class="pitch-avg">Team avg ${avg}${rated.some(x=>x.r.est)?' est.':''}</span>`:''}</div><div class="lineup-pitch"><div class="pitch-center"></div>${rows.map((players,i)=>players.length?`<div class="pitch-row"><span class="position-label">${['GK','DEF','MID','FWD','OTHER'][i]}</span>${players.map(p=>{const r=matchRating(p,ctx),ev=pitchIcons(p);return `<button class="pitch-player" data-player="${esc(p.athlete.id)}"><span class="pp-wrap">${playerPortrait(p.athlete)}${r?`<i class="pp-rating ${p===mvp?'r-blue':ratingClass(r.value)}${top&&top.p===p?' top':''}" title="${p===mvp?'Player of the match \u00b7 ':''}${r.est?'Estimated rating':'Provider rating'}">${r.value}${p===mvp?' \u2605':''}</i>`:''}${ev?`<i class="pp-evt">${ev}</i>`:''}</span><b>${esc(p.jersey||'\u2013')} \u00b7 ${esc(p.athlete.shortName||p.athlete.displayName)}</b><small>${esc(p.position?.abbreviation||p.position?.name||'Position unavailable')}</small></button>`}).join('')}</div>`:'').join('')}</div>${top?`<p class="coverage-note">Top rated: ${esc(top.p.athlete?.shortName||top.p.athlete?.displayName||'Player')} ${top.r.value}${top.r.est?' (est.)':''}</p>`:''}<p class="coverage-note">Players grouped by reported position and placed left to right. Ratings marked est. are estimated from match statistics, not an official rating.</p>`;
}

async function detailRequest(kind,id,season){const q=new URLSearchParams({kind,id,league:center.path,season:String(season||center.season)});const r=await fetch('/api/details?'+q,{signal:AbortSignal.timeout(15000)});if(!r.ok)throw Error('Unavailable');return r.json()}
function matchDetails(k){let group,match;for(const g of [...groups,...(window.favGroups||[])]){const m=g.matches.find(m=>key(m)===k);if(m){group=g;match=m;break}}if(!match)return;activeMatch=k;center={path:group.path,group,match,tab:'events',view:'match',season:Number(feedDate.slice(0,4))||new Date().getUTCFullYear()};document.getElementById('detail').classList.add('match-dialog');show('<div class="eyebrow">MATCH CENTER</div><h2>Reading the game\u2026</h2><div class="detail-loading" role="status">Loading line-ups, events and statistics\u2026</div>');loadMatch(false)}
async function loadMatch(quiet){const version=++centerVersion;const current=center;try{const data=await detailRequest('match',key(current.match));if(version!==centerVersion||center!==current)return;center.data=data;center.season=data.season||center.season;center.error=false;renderCenter()}catch{if(version!==centerVersion||center!==current)return;center.error=true;if(!quiet||center.view==='match')renderCenter()}}
function refreshMatchCenter(){if(center?.view==='match'&&center.match[5]==='live')loadMatch(true)}
function renderCenter(){if(typeof newsOpen!=='undefined'&&newsOpen)return;if(!document.getElementById('detail').open)return;const c=center,d=c.data,m=c.match;let html=`<div class="eyebrow">${esc(c.group.name)} \u00b7 MATCH CENTER</div>`;
if(c.view!=='match'){renderEntity();return}
const competitors=d?.header?.competitions?.[0]?.competitors||[];html+=`<div class="center-score">${[0,1].map((i)=>{const t=competitors.find(t=>t.homeAway===(i?'away':'home'));return `<div>${crestImg(m[9+i],'big')}${t?.id?`<button data-team="${esc(t.id)}">${esc(m[i])} \u2197</button>${followTeamButton(t.id,m[i],c.path)}`:esc(m[i])}</div>${i===0?`<strong>${esc(competitors.find(t=>t.homeAway==='home')?.score??m[2]??'\u2013')} : ${esc(competitors.find(t=>t.homeAway==='away')?.score??m[3]??'\u2013')}</strong>`:''}`}).join('')}</div><div class="center-meta">${m[13]?esc(bdFull(m[13]))+' \u00b7 ':''}${esc(d?.header?.competitions?.[0]?.status?.type?.shortDetail||m[4])} \u00b7 ${esc(d?.venue||c.group.region)}</div><div class="center-tabs" role="tablist">${[['events','Timeline'],['lineups','Line-ups'],['stats','Match stats'],['commentary','Commentary']].map(([v,l])=>`<button role="tab" aria-selected="${c.tab===v}" data-center-tab="${v}" class="${c.tab===v?'active':''}">${l}</button>`).join('')}</div>`;
if(c.error)html+=`<div class="detail-error" role="status">${d?'Updates interrupted. Showing last received details.':'Match details are temporarily unavailable.'} <button data-center-retry>Retry</button></div>`;
if(d){if(c.tab==='events')html+=eventList(d.events);if(c.tab==='commentary')html+=eventList(d.commentary,true);if(c.tab==='lineups')html+=lineups(d);if(c.tab==='stats')html+=matchStats(d);html+=`<p class="coverage-note">ESPN \u00b7 Checked ${esc(new Date(d.updatedAt).toLocaleTimeString('en-GB',{timeZone:'Asia/Dhaka'}))} BD time. Live match details refresh every 30 seconds. Coverage varies by competition; ratings and minutes appear when supplied.${providerNote(d)}</p>`}
html+=`<button class="subtle-button" data-guide="${esc(c.group.sport)}">Learn the rules of ${esc(c.group.sport)} \u2197</button>`;document.getElementById('dialog-content').innerHTML=html;enhancePhotos()}
function eventList(events,commentary=false){if(!events.length)return emptyDetail('No '+(commentary?'commentary':'match events')+' published yet. Details appear as the provider reports them.');return `<div class="event-list">${events.map(e=>{const p=e.play||e;const type=p.type?.text||'Match update';const cls=/red|yellow/i.test(type)?(/red/i.test(type)?'red':'yellow'):/goal/i.test(type)?'goal':'';return `<article class="event-item"><time>${esc(e.time?.displayValue||p.clock?.displayValue||'\u2014')}</time><div><span class="event-label ${cls}">${esc(commentary?'Commentary':type)}</span><p>${esc(e.text||p.text||type)}</p>${!commentary&&p.participants?.length?`<div class="event-players">${p.participants.map(a=>playerButton(a.athlete)).join(' \u00b7 ')}</div>`:''}<small>${esc(p.team?.displayName||'')}</small></div></article>`}).join('')}</div>`}
function playingTime(player){
 const id=player.athlete?.id;
 const events=center.data?.events||[];
 const changes=events.filter(e=>/substitution/i.test(e.type?.text||''));
 const incoming=changes.find(e=>e.participants?.[0]?.athlete?.id===id);
 const outgoing=changes.find(e=>e.participants?.[1]?.athlete?.id===id);
 const dismissal=events.find(e=>/red card|second yellow/i.test(e.type?.text||'')&&e.participants?.[0]?.athlete?.id===id);
 const labels=[];
 if(player.starter)labels.push('On at kick-off');
 if(incoming)labels.push('On '+(incoming.clock?.displayValue||'time unavailable'));
 if(outgoing)labels.push('Off '+(outgoing.clock?.displayValue||'time unavailable'));
 if(dismissal)labels.push('Sent off '+(dismissal.clock?.displayValue||'time unavailable'));
 if(!player.starter&&!incoming)labels.push(player.subbedIn?'Entry time unavailable':'Substitute');
 return labels.join(' \u00b7 ');
}
function lineups(d){if(!d.rosters.length){if(d.players.length)return d.players.map(t=>`<h3>${esc(t.team?.displayName||'Team')}</h3>${(t.statistics||[]).map(s=>`<div class="table-scroll"><table><thead><tr><th>Player</th>${(s.labels||[]).map(l=>`<th>${esc(l)}</th>`).join('')}</tr></thead><tbody>${(s.athletes||[]).map(a=>`<tr><td>${playerButton(a.athlete)}</td>${(a.stats||[]).map(v=>`<td>${esc(v)}</td>`).join('')}</tr>`).join('')}</tbody></table></div>`).join('')}`).join('');return emptyDetail('Line-ups have not been published for this match. Check again closer to kick-off.')}
return `<div class="lineup-columns">${d.rosters.map(t=>`<section><h3><button data-team="${esc(t.team.id)}">${esc(t.team.displayName)} \u2197</button></h3>${followTeamButton(t.team.id,t.team.displayName,center.path)}<p class="center-meta">${esc(t.formation||'Match squad')}</p>${positionPitch(t)}${[true,false].map(start=>`<h4>${start?'Starting line-up':'Substitutes'}</h4>${(t.roster||[]).filter(p=>!!p.starter===start).map(p=>{const rating=p.stats?.find(s=>/^(rating|ratingFromDataFeed|ratingFromCorrespondent)$/.test(s.name)&&Number(s.value)>0);const minutes=p.stats?.find(s=>s.name==='minutes');return `<div class="lineup-player"><span class="shirt-number">${esc(p.jersey||'\u2014')}</span><div>${playerButton(p.athlete)}<small>${esc(p.position?.displayName||p.position?.name||'')}${minutes?' \u00b7 '+esc(minutes.displayValue??minutes.value)+' min':''}</small><small>${esc(playingTime(p))}</small><small>${esc(playSummary(p))}</small></div>${(mr=>mr?`<span class="rating${mr.est?' est':''}" title="${mr.est?'Estimated from match statistics, not an official rating':mr.api?'Match rating from API-Football':'Provider match rating'}">${mr.value}</span>`:`<span class="rating">\u2014</span>`)(matchRating(p,teamCtx(t)))}</div>`}).join('')}`).join('')}</section>`).join('')}</div><p class="coverage-note">Ratings without \u201cest.\u201d come from the data provider. Ratings marked \u201cest.\u201d are estimated from match statistics (goals, assists, shots, passes, tackles, dribbles, fouls, cards, saves) and are not official. \u2014 means the player did not play or no statistics are available. Select a player for their match statistics and season breakdown.</p>`}
function matchStats(d){if(!d.teams.length)return emptyDetail('Match statistics have not been published.');return d.teams.map(t=>`<h3>${esc(t.team?.displayName||'Team')}</h3>${statGrid((t.statistics||[]).map(s=>({label:s.label||s.name,value:s.displayValue})))}`).join('')}
async function openEntity(kind,id,season){const c=center;c.view=kind;c.entityId=id;c.entity=null;c.entityError=false;if(season)c.season=+season;renderEntity();const version=++centerVersion;try{const data=await detailRequest(kind,id);if(version!==centerVersion||center!==c)return;c.entity=data;renderEntity()}catch{if(version!==centerVersion||center!==c)return;c.entityError=true;renderEntity()}}
function pstat(p,...names){for(const n of names){const s=p.stats?.find(x=>x.name===n);if(s&&Number.isFinite(+s.value))return +s.value}return null}
function playerHighlights(pl){
 const all=(center?.data?.rosters||[]).flatMap(t=>t.roster||[]);const out=[];const a=pl.api;
 const best=(f,min)=>{const vals=all.map(f);const mx=Math.max(...vals);return mx>=min&&f(pl)===mx&&vals.filter(v=>v===mx).length<=2?mx:0};
 if(pl===motm())out.push('Player of the match');
 const g=pstat(pl,'totalGoals','goals')||0,as=pstat(pl,'goalAssists','assists')||0;
 if(g)out.push('Scored '+g+' goal'+(g>1?'s':''));if(as)out.push('Provided '+as+' assist'+(as>1?'s':''));
 if(a){const kp=best(x=>x.api?.passes?.key||0,2);if(kp)out.push('Most key passes in the match ('+kp+')');
  const tk=best(x=>x.api?.tackles?.total||0,3);if(tk)out.push('Most tackles in the match ('+tk+')');
  const dr=best(x=>x.api?.dribbles?.success||0,2);if(dr)out.push('Most successful dribbles ('+dr+')');
  if(a.duels?.total>=6&&a.duels.won/a.duels.total>=0.65)out.push('Won '+a.duels.won+' of '+a.duels.total+' duels');
  if(a.passes?.total>=30&&a.passes.acc>=90)out.push(Math.round(a.passes.acc)+'% pass accuracy on '+a.passes.total+' passes')}
 const sv=pstat(pl,'saves')||a?.goals?.saves||0;if(sv>=3)out.push('Made '+sv+' saves');
 return out.slice(0,3)}
function playerStatRows(pl){
 const a=pl.api,R=[];const add=(l,v)=>{if(v!==null&&v!==undefined&&v!==''&&!(typeof v==='number'&&Number.isNaN(v)))R.push([l,v])};
 const mr=matchRating(pl,teamCtx((center?.data?.rosters||[]).find(t=>(t.roster||[]).includes(pl))));
 if(mr)add('Rating',mr.value+(mr.est?' (est.)':''));
 add('Minutes played',a?.minutes??pstat(pl,'minutes'));
 add('Goals',pstat(pl,'totalGoals','goals')??a?.goals?.total);add('Assists',pstat(pl,'goalAssists','assists')??a?.goals?.assists);
 const sh=a?.shots?.total??pstat(pl,'totalShots','shots'),so=a?.shots?.on??pstat(pl,'shotsOnTarget');if(sh!==null&&sh!==undefined)add('Shots (on target)',sh+' ('+(so??0)+')');
 if(a?.passes?.total!=null){const ok=a.passes.acc!=null?Math.round(a.passes.total*a.passes.acc/100):null;add('Accurate passes',(ok!==null?ok+'/':'')+a.passes.total+(a.passes.acc!=null?' ('+Math.round(a.passes.acc)+'%)':''))}
 add('Key passes',a?.passes?.key);add('Tackles',a?.tackles?.total);add('Interceptions',a?.tackles?.interceptions);add('Blocks',a?.tackles?.blocks);
 if(a?.duels?.total!=null)add('Duels won',(a.duels.won??0)+'/'+a.duels.total);if(a?.dribbles?.attempts!=null)add('Successful dribbles',(a.dribbles.success??0)+'/'+a.dribbles.attempts);
 add('Fouls committed',a?.fouls?.committed??pstat(pl,'foulsCommitted'));add('Was fouled',a?.fouls?.drawn??pstat(pl,'foulsSuffered'));
 add('Saves',a?.goals?.saves??pstat(pl,'saves'));const yc=pstat(pl,'yellowCards'),rc=pstat(pl,'redCards');if(yc)add('Yellow cards',yc);if(rc)add('Red cards',rc);
 return R}
function playerMatchCard(pl,prof){
 const team=(center?.data?.rosters||[]).find(t=>(t.roster||[]).includes(pl));const ctx=teamCtx(team);const mr=matchRating(pl,ctx);const mv=pl===motm();
 const ath=pl.athlete||{};const name=prof?.displayName||ath.displayName||'Player';
 const country=prof?.citizenship||prof?.birthPlace?.country||'\u2014';const age=prof?.age??ath.age??'\u2014';
 const crest=crestImg(team?.team?.logo||team?.team?.logos?.[0]?.href,'pcard-crest');
 const hl=playerHighlights(pl),rows=playerStatRows(pl);
 return `<div class="pcard"><div class="pcard-head"><span class="pcard-photo">${playerPortrait(Object.assign({},ath,prof?.headshot?{headshot:prof.headshot}:{}),true)}${mr?`<i class="pp-rating pcard-rating ${mv?'r-blue':ratingClass(mr.value)}">${mr.value}${mv?' \u2605':''}</i>`:''}${crest}</span><h2>${esc(name)}</h2></div><div class="pcard-meta"><div><b>${esc(pl.position?.abbreviation||pl.position?.displayName||'\u2014')}</b><small>Position</small></div><div><b>${esc(country)}</b><small>Country</small></div><div><b>${esc(age)}</b><small>Age</small></div></div></div>${hl.length?`<div class="phl"><span class="phl-chip">Highlights</span>${hl.map(x=>`<p>${esc(x)}</p>`).join('')}</div>`:''}<h3>Top stats</h3><div class="pstats">${rows.map(r=>`<div><span>${esc(r[0])}</span><b>${esc(r[1])}</b></div>`).join('')||'<div class="detail-empty">No match statistics were published for this player.</div>'}</div><p class="coverage-note">${esc(playingTime(pl))}. Heatmaps and xG are not available from our data sources.</p>`}
function renderEntity(){if(typeof newsOpen!=='undefined'&&newsOpen)return;const c=center,d=c.entity,p=d?.profile;const player=c.data?.rosters.flatMap(t=>t.roster||[]).find(p=>p.athlete?.id===c.entityId);const years=Array.from({length:new Date().getUTCFullYear()-1990+2},(_,i)=>new Date().getUTCFullYear()+1-i);const cardMode=c.view==='player'&&!!player;let html=`<button class="back-link" data-center-back>\u2190 Back to match</button>${cardMode?playerMatchCard(player,p):''}<div class="eyebrow">${c.view==='team'?'TEAM & SQUAD':'PLAYER PROFILE'} \u00b7 ${esc(c.group.name)}</div>${cardMode?'':`<h2>${esc(p?.displayName||player?.athlete?.displayName||(c.view==='team'?'Team details':'Player details'))}</h2>`}${c.view==='team'?crestImg(p?.logos?.[0]?.href||p?.logo,'big'):''}`;
html+=`<label class="season-select">Season starting <select id="detail-season" aria-label="Season starting year">${years.map(y=>`<option value="${y}" ${y===+c.season?'selected':''}>${y}</option>`).join('')}</select></label><p class="coverage-note">League season totals for the selected starting year. Profile information reflects the provider\u2019s current record.</p>`;
if(!d)html+=c.entityError?'<div class="detail-error">Details are unavailable. <button data-entity-retry>Retry</button></div>':'<div class="detail-loading" role="status">Loading profile and season statistics\u2026</div>';
else{if(c.view==='team'&&p)html+=followTeamButton(p.id||c.entityId,p.displayName,c.path);if(c.view==='player'&&!cardMode)html+=playerPortrait(p||player?.athlete||{id:c.entityId,displayName:'Player'},true);if(p&&!cardMode)html+=`<div class="profile-facts">${[p.position?.displayName,p.age?p.age+' years old':null,p.displayHeight,p.displayWeight,p.birthPlace?.country,p.citizenship,p.jersey?'Shirt '+p.jersey:null].filter(Boolean).map(x=>`<span>${esc(x)}</span>`).join('')}</div>`;
html+=`<h3>${esc(c.season)} season breakdown</h3>${statGrid(d.statistics)}${c.view==='team'?`<h3>Team player list</h3>${d.roster.length?d.roster.map(a=>a.items?`<h4>${esc(a.position||'Squad')}</h4>${a.items.map(p=>`<div class="squad-row">${playerButton(p)}<small>${esc(p.position?.displayName||'')}</small></div>`).join('')}`:`<div class="squad-row">${playerButton(a)}<small>${esc(a.position?.displayName||'')}</small></div>`).join(''):emptyDetail('No squad is available for this season.')}`:''}<p class="coverage-note">Source: ESPN. Unavailable statistics are never estimated.</p>`}document.getElementById('dialog-content').innerHTML=html;enhancePhotos()}
document.addEventListener('click',e=>{const tab=e.target.closest('[data-center-tab]');if(tab&&center){center.tab=tab.dataset.centerTab;renderCenter()}const team=e.target.closest('[data-team]');if(team&&center)openEntity('team',team.dataset.team);const player=e.target.closest('[data-player]');if(player&&center)openEntity('player',player.dataset.player);if(e.target.closest('[data-center-back]')){++centerVersion;center.view='match';renderCenter()}if(e.target.closest('[data-center-retry]'))loadMatch(false);if(e.target.closest('[data-entity-retry]'))openEntity(center.view,center.entityId)});
document.addEventListener('change',e=>{if(e.target.id==='detail-season')openEntity(center.view,center.entityId,e.target.value)});
document.getElementById('detail').addEventListener('close',()=>{++centerVersion;activeMatch=null;center=null;document.getElementById('detail').classList.remove('match-dialog')});

const PH_KEY='allsport_photos_v2',PH_KW={soccer:/footballer|soccer player/,basketball:/basketball/,hockey:/ice hockey/,baseball:/baseball/},PH_Q={soccer:'footballer',basketball:'basketball player',hockey:'ice hockey player',baseball:'baseball player'};
let phCache=null,phTimer=0,phActive=0;const phQueue=[],phQueued=new Set();
function phLoad(){if(!phCache){try{phCache=JSON.parse(localStorage.getItem(PH_KEY)||'{}')||{}}catch{phCache={}}}return phCache}
function phSave(){try{const k=Object.keys(phCache);if(k.length>700)k.slice(0,k.length-700).forEach(x=>delete phCache[x]);localStorage.setItem(PH_KEY,JSON.stringify(phCache))}catch{}}
const phNorm=s=>String(s||'').normalize('NFD').replace(/[\u0300-\u036f]/g,'').toLowerCase();
function phSport(){return center?.path?.split('/')[0]||'soccer'}
function phTeamOf(id){const t=center?.data?.rosters?.find(t=>(t.roster||[]).some(p=>String(p.athlete?.id)===String(id)));return t?.team?.displayName||''}
function phApply(el,url){if(url&&/^https:\/\/upload\.wikimedia\.org\//.test(url)&&!el.querySelector('img'))el.insertAdjacentHTML('beforeend',`<img src="${esc(url)}" alt="" loading="lazy" referrerpolicy="no-referrer">`)}
function enhancePhotos(){clearTimeout(phTimer);phTimer=setTimeout(()=>{const sport=phSport();const cache=phLoad();document.querySelectorAll('.player-portrait[data-name]').forEach(el=>{if(el.querySelector('img'))return;const name=el.dataset.name;if(!name||name==='Player')return;const key=sport+'|'+phNorm(name)+'|'+phNorm(phTeamOf(el.dataset.id));if(key in cache){phApply(el,cache[key]);return}el.dataset.phkey=key;if(!phQueued.has(key)){phQueued.add(key);phQueue.push({key,name,team:phTeamOf(el.dataset.id),sport})}});phPump()},120)}
function phPump(){while(phActive<3&&phQueue.length){const job=phQueue.shift();phActive++;phLookup(job).catch(()=>null).then(url=>{if(url!==undefined){phLoad()[job.key]=url||'';phSave()}phQueued.delete(job.key);phActive--;document.querySelectorAll('.player-portrait[data-phkey]').forEach(el=>{if(el.dataset.phkey===job.key){phApply(el,url);}});phPump()})}}
async function phLookup(job){
 const q=encodeURIComponent(job.name+' '+(PH_Q[job.sport]||''));
 const r=await fetch(`https://en.wikipedia.org/w/api.php?action=query&format=json&origin=*&generator=search&gsrsearch=${q}&gsrlimit=6&prop=pageimages|extracts&piprop=thumbnail&pithumbsize=160&exintro=1&explaintext=1&exchars=400&exlimit=6`,{signal:AbortSignal.timeout(8000)});
 if(!r.ok)return undefined;
 const pages=Object.values((await r.json())?.query?.pages||{}).sort((a,b)=>a.index-b.index);
 const kw=PH_KW[job.sport]||/./;
 const tokens=phNorm(job.name).split(/[^a-z0-9]+/).filter(x=>x.length>=3);
 if(!tokens.length)return '';
 const surname=tokens[tokens.length-1];
 const ok=pages.filter(p=>p.thumbnail?.source&&phNorm(p.title).includes(surname)&&kw.test(phNorm(p.extract)));
 const teamTokens=phNorm(job.team).split(/[^a-z0-9]+/).filter(x=>x.length>=4);
 const byTeam=ok.find(p=>teamTokens.some(t=>phNorm(p.extract).includes(t)));
 const pick=byTeam||(ok.length===1?ok[0]:null);
 return pick?pick.thumbnail.source:'';
}
