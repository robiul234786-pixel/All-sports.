const DHAKA = 6 * 3600 * 1000; // Bangladesh is UTC+6, no daylight saving
const dhakaDay = (iso) => new Date(new Date(iso).getTime() + DHAKA).toISOString().slice(0, 10);
const dhakaClock = (iso) => new Date(new Date(iso).getTime() + DHAKA).toISOString().slice(11, 16);
const ymd = (d) => d.toISOString().slice(0, 10).replaceAll('-', '');
function safeLogo(u) { return typeof u === 'string' && /^https:\/\/a\.espncdn\.com\//.test(u) ? u : ''; }

// [sport, ESPN path, league name, region]. A feed ESPN does not have (HTTP 404) is skipped silently.
const FEEDS = [
  ['Football', 'soccer/uefa.champions', 'UEFA Champions League', 'Europe'],
  ['Football', 'soccer/eng.1', 'Premier League', 'England'],
  ['Football', 'soccer/eng.2', 'EFL Championship', 'England'],
  ['Football', 'soccer/eng.3', 'EFL League One', 'England'],
  ['Football', 'soccer/eng.fa', 'FA Cup', 'England'],
  ['Football', 'soccer/eng.league_cup', 'EFL Cup', 'England'],
  ['Football', 'soccer/esp.1', 'LaLiga', 'Spain'],
  ['Football', 'soccer/ger.1', 'Bundesliga', 'Germany'],
  ['Football', 'soccer/ita.1', 'Serie A', 'Italy'],
  ['Football', 'soccer/fra.1', 'Ligue 1', 'France'],
  ['Football', 'soccer/usa.1', 'MLS', 'USA & Canada'],
  ['Football', 'soccer/ksa.1', 'Saudi Pro League', 'Saudi Arabia'],
  ['Football', 'soccer/por.1', 'Liga Portugal', 'Portugal'],
  ['Football', 'soccer/ned.1', 'Eredivisie', 'Netherlands'],
  ['Football', 'soccer/bra.1', 'Brazil Serie A', 'Brazil'],
  ['Football', 'soccer/arg.1', 'Argentine Primera', 'Argentina'],
  // National teams
  ['Football', 'soccer/fifa.world', 'FIFA World Cup', 'World'],
  ['Football', 'soccer/fifa.friendly', 'International Friendlies', 'World'],
  ['Football', 'soccer/fifa.worldq.afc', 'World Cup Qualifiers 路 Asia', 'AFC'],
  ['Football', 'soccer/fifa.worldq.caf', 'World Cup Qualifiers 路 Africa', 'CAF'],
  ['Football', 'soccer/fifa.worldq.concacaf', 'World Cup Qualifiers 路 CONCACAF', 'CONCACAF'],
  ['Football', 'soccer/fifa.worldq.conmebol', 'World Cup Qualifiers 路 South America', 'CONMEBOL'],
  ['Football', 'soccer/fifa.worldq.ofc', 'World Cup Qualifiers 路 Oceania', 'OFC'],
  ['Football', 'soccer/fifa.worldq.uefa', 'World Cup Qualifiers 路 Europe', 'UEFA'],
  ['Football', 'soccer/uefa.nations', 'UEFA Nations League', 'Europe'],
  ['Football', 'soccer/uefa.euro', 'UEFA European Championship', 'Europe'],
  ['Football', 'soccer/uefa.euroq', 'Euro Qualifiers', 'Europe'],
  ['Football', 'soccer/conmebol.america', 'Copa Am茅rica', 'South America'],
  ['Football', 'soccer/concacaf.gold', 'CONCACAF Gold Cup', 'CONCACAF'],
  ['Football', 'soccer/concacaf.nations.league', 'CONCACAF Nations League', 'CONCACAF'],
  ['Football', 'soccer/caf.nations', 'Africa Cup of Nations', 'Africa'],
  ['Football', 'soccer/afc.asian.cup', 'AFC Asian Cup', 'Asia'],
  ['Basketball', 'basketball/nba', 'NBA', 'USA'],
  ['Ice hockey', 'hockey/nhl', 'NHL', 'USA & Canada'],
  ['Baseball', 'baseball/mlb', 'MLB', 'USA & Canada'],
];

async function getJson(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  return { ok: response.ok, status: response.status, data: response.ok ? await response.json() : null };
}
// Every feed uses the same rule: a match belongs to the day on which it kicks off in Bangladesh time.
async function eventsForDhakaDay(path, date) {
  const base = new Date(date + 'T00:00:00Z');
  const url = (dates, limit) => `https://site.api.espn.com/apis/site/v2/sports/${path}/scoreboard?dates=${dates}&limit=${limit}`;
  const day = (offset) => ymd(new Date(base.getTime() + offset * 864e5));
  let r = await getJson(url(`${day(-1)}-${day(1)}`, 300));
  let events;
  if (r.ok) {
    events = r.data?.events;
  } else if (r.status === 404) {
    return null; // this competition does not exist on ESPN
  } else {
    // Range not accepted: ask for the two ESPN days that can contain a Bangladesh day, then filter the same way.
    const [a, b] = await Promise.all([getJson(url(day(-1), 100)), getJson(url(day(0), 100))]);
    if (!a.ok && !b.ok) throw new Error('Feed unavailable');
    events = [...(a.data?.events || []), ...(b.data?.events || [])];
  }
  if (!Array.isArray(events)) throw new Error('Invalid feed');
  const seen = new Set();
  return events.filter((e) => e?.date && dhakaDay(e.date) === date && !seen.has(e.id) && seen.add(e.id));
}

export async function onRequestGet({ request }) {
  const date = new URL(request.url).searchParams.get('date') || dhakaDay(new Date().toISOString());
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0, 10) !== date) {
    return Response.json({ error: 'Invalid date' }, { status: 400 });
  }
  const results = await Promise.allSettled(FEEDS.map(async ([sport, path, name, region]) => {
    const events = await eventsForDhakaDay(path, date);
    if (events === null) return null;
    const matches = events.flatMap((event) => {
      const competition = event.competitions?.[0];
      const teams = competition?.competitors;
      if (!teams || teams.length !== 2) return [];
      const home = teams.find((t) => t.homeAway === 'home') || teams[0];
      const away = teams.find((t) => t !== home);
      const status = competition.status || event.status;
      const type = status?.type || {};
      // Delays, postponements and suspensions keep their provider label without appearing live.
      const live = type.state === 'in' && !/postpon|suspend|delay|cancel/i.test(type.name || '');
      const state = type.completed ? 'finished' : live ? 'live' : 'upcoming';
      const scheduled = type.name === 'STATUS_SCHEDULED';
      const label = scheduled ? dhakaClock(event.date) : type.shortDetail || type.description || status.displayClock || 'Scheduled';
      return [[home.team?.displayName || home.athlete?.displayName || 'Home', away.team?.displayName || away.athlete?.displayName || 'Away', type.state === 'pre' ? null : home.score ?? null, type.state === 'pre' ? null : away.score ?? null, label, state, home.team?.abbreviation || 'H', away.team?.abbreviation || 'A', String(event.id), safeLogo(home.team?.logo), safeLogo(away.team?.logo), String(home.team?.id || ''), String(away.team?.id || ''), event.date]];
    });
    return { name, region, sport, path, symbol: '鈼�', color: '', matches };
  }));
  const groups = results.flatMap((result) => (result.status === 'fulfilled' && result.value ? [result.value] : []));
  const unavailable = FEEDS.filter((_, i) => results[i].status === 'rejected').map((feed) => feed[2]);
  if (!groups.length) return Response.json({ error: 'Sports feed temporarily unavailable' }, { status: 502 });
  return Response.json({ date, groups, unavailable, updatedAt: new Date().toISOString(), source: 'ESPN' }, {
    headers: { 'Cache-Control': 'public, max-age=15, s-maxage=15' },
  });
}
