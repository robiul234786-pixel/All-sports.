// GitHub repo "All-sports" → functions/api/adda-sports.js
// Uses existing secret APIFOOTBALL_KEY. Cached to save free API limit.
const H = { 'Access-Control-Allow-Origin': '*', 'Content-Type': 'application/json;charset=utf-8' };

async function af(path, env) {
  const r = await fetch('https://v3.football.api-sports.io/' + path, {
    headers: { 'x-apisports-key': env.APIFOOTBALL_KEY }
  });
  return r.json();
}

export async function onRequest({ request, env, waitUntil }) {
  if (request.method === 'OPTIONS') {
    return new Response(null, { headers: { ...H, 'Access-Control-Allow-Methods': 'GET' } });
  }
  const cache = caches.default;
  const hit = await cache.match(request);
  if (hit) return hit;

  const q = new URL(request.url).searchParams;
  const type = q.get('type') || 'matches';
  let data, ttl = 60;

  try {
    if (type === 'matches') {
      const d = q.get('date') || new Date(Date.now() + 6 * 3600e3).toISOString().slice(0, 10);
      const j = await af(`fixtures?date=${d}&timezone=Asia/Dhaka`, env);
      data = (j.response || []).map(f => ({
        id: f.fixture.id,
        time: f.fixture.date,
        status: f.fixture.status.short,
        min: f.fixture.status.elapsed,
        league: f.league.name,
        lLogo: f.league.logo,
        country: f.league.country,
        home: f.teams.home.name,
        away: f.teams.away.name,
        hLogo: f.teams.home.logo,
        aLogo: f.teams.away.logo,
        hg: f.goals.home,
        ag: f.goals.away
      }));
    } else if (type === 'events') {
      ttl = 30;
      const j = await af(`fixtures/events?fixture=${encodeURIComponent(q.get('id'))}`, env);
      data = (j.response || []).map(e => ({
        min: e.time.elapsed,
        extra: e.time.extra,
        team: e.team.name,
        player: e.player && e.player.name,
        assist: e.assist && e.assist.name,
        type: e.type,
        detail: e.detail
      }));
    } else if (type === 'news') {
      ttl = 600;
      const r = await fetch('https://site.api.espn.com/apis/site/v2/sports/soccer/all/news');
      const j = await r.json();
      data = (j.articles || []).map(a => ({
        title: a.headline,
        desc: a.description,
        link: a.links && a.links.web && a.links.web.href,
        img: a.images && a.images[0] && a.images[0].url,
        time: a.published
      }));
    } else {
      data = { error: 'unknown type' };
    }
  } catch (e) {
    return new Response(JSON.stringify({ error: String(e) }), { status: 502, headers: H });
  }

  const res = new Response(JSON.stringify(data), {
    headers: { ...H, 'Cache-Control': `public, max-age=${ttl}` }
  });
  waitUntil(cache.put(request, res.clone()));
  return res;
}
