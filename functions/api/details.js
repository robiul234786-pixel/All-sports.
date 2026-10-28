function stats(data) {
  return (data?.splits?.categories || []).flatMap((c) => c.stats || []).map((s) => ({ name: s.name, label: s.displayName || s.name, value: s.displayValue ?? s.value }));
}
async function get(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error('Unavailable');
  return response.json();
}
// ---------- Optional API-Football enrichment (passes, tackles, dribbles, rating, photos) ----------
// Enabled only when the Cloudflare variable APIFOOTBALL_KEY is set. Without it nothing changes.
const AF = 'https://v3.football.api-sports.io';
const STOP = new Set(['fc','cf','ac','as','afc','sc','ssc','us','ud','cd','club','calcio','de','the','fk','sk','sv']);
const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
const toks = (s) => norm(s).split(' ').filter((x) => x && !STOP.has(x));
function sameTeam(a, b) {
  const A = toks(a), B = toks(b);
  if (!A.length || !B.length) return false;
  const sa = A.join(' '), sb = B.join(' ');
  if (sa === sb || sa.includes(sb) || sb.includes(sa)) return true;
  return A.filter((x) => B.includes(x)).length / Math.max(A.length, B.length) >= 0.6;
}
async function afGet(env, path, ttl) {
  let cache = null;
  const key = new Request('https://af.cache.internal' + path);
  try { cache = caches.default; const hit = await cache.match(key); if (hit) return await hit.json(); } catch { cache = null; }
  const r = await fetch(AF + path, { headers: { 'x-apisports-key': env.APIFOOTBALL_KEY }, signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error('AF unavailable');
  const j = await r.json();
  const failed = j.errors && (Array.isArray(j.errors) ? j.errors.length : Object.keys(j.errors).length);
  if (failed || !Array.isArray(j.response)) throw new Error('AF error');
  if (cache) { try { await cache.put(key, new Response(JSON.stringify(j), { headers: { 'Cache-Control': `public, max-age=${ttl}` } })); } catch {} }
  return j;
}
const num = (v) => { const n = parseFloat(v); return Number.isFinite(n) ? n : null; };
function shapePlayer(x) {
  const s = x.statistics?.[0] || {};
  const total = num(s.passes?.total), raw = num(s.passes?.accuracy);
  const acc = raw === null ? null : (total && raw <= total ? (raw / total) * 100 : raw <= 100 ? raw : null);
  const photo = typeof x.player?.photo === 'string' && x.player.photo.startsWith('https://media.api-sports.io/') ? x.player.photo : '';
  const rating = num(s.games?.rating);
  return {
    rating: rating && rating > 0 ? rating : null, minutes: num(s.games?.minutes), number: num(s.games?.number),
    passes: { total, key: num(s.passes?.key), acc },
    tackles: { total: num(s.tackles?.total), blocks: num(s.tackles?.blocks), interceptions: num(s.tackles?.interceptions) },
    duels: { total: num(s.duels?.total), won: num(s.duels?.won) },
    dribbles: { attempts: num(s.dribbles?.attempts), success: num(s.dribbles?.success) },
    fouls: { drawn: num(s.fouls?.drawn), committed: num(s.fouls?.committed) },
    shots: { total: num(s.shots?.total), on: num(s.shots?.on) },
    goals: { total: num(s.goals?.total), assists: num(s.goals?.assists), saves: num(s.goals?.saves), conceded: num(s.goals?.conceded) },
    photo,
  };
}
function findPlayer(idx, p) {
  const full = norm(p.athlete?.fullName || p.athlete?.displayName);
  if (!full) return null;
  const last = full.split(' ').pop();
  const jersey = String(p.jersey || '');
  const nameOk = (e) => {
    if (!e.n) return false;
    if (e.n === full) return true;
    const ep = e.n.split(' ');
    const initial = ep.length > 1 && ep[0].length === 1;
    const rest = initial ? ep.slice(1).join(' ') : e.n;
    if (rest && (full === rest || full.endsWith(' ' + rest))) return initial ? full[0] === ep[0] : true;
    return last.length > 2 && ep.includes(last);
  };
  const hits = idx.filter(nameOk);
  if (hits.length === 1) return hits[0];
  if (hits.length > 1 && jersey) return hits.find((e) => String(e.num) === jersey) || null;
  if (!hits.length && jersey) {
    const e = idx.find((x) => String(x.num) === jersey);
    if (e && e.n.split(' ').some((w) => w.length > 2 && full.split(' ').includes(w))) return e;
  }
  return null;
}
async function enrichWithApiFootball(env, summary, rosters) {
  const comp = summary.header?.competitions?.[0];
  const state = comp?.status?.type?.state;
  if (!comp?.date || state === 'pre') return { used: false, reason: 'not-started' };
  const cs = comp.competitors || [];
  const home = cs.find((c) => c.homeAway === 'home')?.team?.displayName;
  const away = cs.find((c) => c.homeAway === 'away')?.team?.displayName;
  if (!home || !away) return { used: false, reason: 'teams-missing' };
  const day = new Date(comp.date).toISOString().slice(0, 10);
  const list = await afGet(env, `/fixtures?date=${day}`, 600);
  const fx = list.response.find((f) => sameTeam(f.teams?.home?.name, home) && sameTeam(f.teams?.away?.name, away));
  if (!fx) return { used: false, reason: 'fixture-not-found' };
  const pl = await afGet(env, `/fixtures/players?fixture=${fx.fixture.id}`, state === 'post' ? 21600 : 60);
  let matched = 0, total = 0;
  for (const t of rosters) {
    const side = pl.response.find((x) => sameTeam(x.team?.name, t.team?.displayName));
    if (!side) continue;
    const idx = (side.players || []).map((x) => ({ n: norm(x.player?.name), num: x.statistics?.[0]?.games?.number, x }));
    for (const p of t.roster || []) {
      total++;
      const hit = findPlayer(idx, p);
      if (!hit) continue;
      p.api = shapePlayer(hit.x);
      if (p.api.photo && p.athlete) p.athlete.apiPhoto = p.api.photo;
      matched++;
    }
  }
  return { used: true, matched, total, source: 'API-Football' };
}
export async function onRequestGet({ request, env }) {
  const q = new URL(request.url).searchParams;
  const path = q.get('league') || '';
  const id = q.get('id') || '';
  const kind = q.get('kind') || 'match';
  const season = q.get('season') || String(new Date().getUTCFullYear());
  if (!['soccer/uefa.champions','soccer/eng.1','soccer/esp.1','soccer/ger.1','soccer/ita.1','soccer/fra.1','soccer/usa.1','soccer/ksa.1','soccer/por.1','soccer/ned.1','soccer/bra.1','soccer/arg.1','basketball/nba','hockey/nhl','baseball/mlb'].includes(path) || !/^\d{1,12}$/.test(id) || !['match','team','player'].includes(kind) || !/^\d{4}$/.test(season) || +season < 1990 || +season > new Date().getUTCFullYear()+1) return Response.json({ error: 'Invalid request' }, { status: 400 });
  const base = `https://site.api.espn.com/apis/site/v2/sports/${path}`;
  try {
    let result;
    if (kind === 'match') {
      const d = await get(`${base}/summary?event=${id}`);
      if (!d.header) throw new Error('Unavailable');
      result = { header: d.header, rosters: d.rosters || [], teams: d.boxscore?.teams || [], players: d.boxscore?.players || [], events: d.keyEvents || d.scoringPlays || d.plays || [], commentary: d.commentary || [], venue: d.gameInfo?.venue?.fullName || '', season: d.header.season?.year };
      if (path.startsWith('soccer/') && env?.APIFOOTBALL_KEY) {
        try { result.provider = await enrichWithApiFootball(env, d, result.rosters); } catch { result.provider = { used: false, reason: 'error' }; }
      }
    } else {
      const [sport, league] = path.split('/');
      const entity = kind === 'team' ? 'teams' : 'athletes';
      const outcomes = await Promise.allSettled([
        get(kind === 'team' ? `${base}/teams/${id}?season=${season}` : `https://site.web.api.espn.com/apis/common/v3/sports/${path}/athletes/${id}`),
        get(`https://sports.core.api.espn.com/v2/sports/${sport}/leagues/${league}/seasons/${season}/types/1/${entity}/${id}/statistics`),
        kind === 'team' ? get(`${base}/teams/${id}/roster?season=${season}`) : Promise.resolve(null),
      ]);
      const values = outcomes.map(r => r.status === 'fulfilled' ? r.value : null);
      if (!values.some(Boolean)) throw new Error('Unavailable');
      result = { profile: values[0]?.team || values[0]?.athlete || null, statistics: stats(values[1]), roster: values[2]?.athletes || [], season, unavailable: outcomes.map((r,i)=>r.status==='rejected'?['profile','statistics','roster'][i]:null).filter(Boolean) };
    }
    return Response.json({ ...result, source: 'ESPN', updatedAt: new Date().toISOString() }, { headers: { 'Cache-Control': kind === 'match' ? 'public, max-age=15, s-maxage=15' : 'public, max-age=300, s-maxage=300' } });
  } catch { return Response.json({ error: 'Details are temporarily unavailable. Please retry.' }, { status: 502 }); }
}
