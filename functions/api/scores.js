function safeLogo(u) { return typeof u === 'string' && /^https:\/\/a\.espncdn\.com\//.test(u) ? u : ''; }
export async function onRequestGet({ request }) {
  const date = new URL(request.url).searchParams.get('date') || new Date().toISOString().slice(0, 10);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || Number.isNaN(Date.parse(date)) || new Date(date).toISOString().slice(0,10) !== date) {
    return Response.json({ error: 'Invalid date' }, { status: 400 });
  }
  const feeds = [
    ['Football', 'soccer/uefa.champions', 'UEFA Champions League', 'Europe'],
    ['Football', 'soccer/eng.1', 'Premier League', 'England'],
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
    ['Basketball', 'basketball/nba', 'NBA', 'USA'],
    ['Ice hockey', 'hockey/nhl', 'NHL', 'USA & Canada'],
    ['Baseball', 'baseball/mlb', 'MLB', 'USA & Canada'],
  ];
  const results = await Promise.allSettled(feeds.map(async ([sport, path, name, region]) => {
    const response = await fetch(`https://site.api.espn.com/apis/site/v2/sports/${path}/scoreboard?dates=${date.replaceAll('-', '')}&limit=100`, { signal: AbortSignal.timeout(8000) });
    if (!response.ok) throw new Error('Feed unavailable');
    const data = await response.json();
    if (!Array.isArray(data.events)) throw new Error('Invalid feed');
    const matches = data.events.flatMap((event) => {
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
      const label = scheduled ? new Date(event.date).toISOString().slice(11,16) : type.shortDetail || type.description || status.displayClock || 'Scheduled';
      return [[home.team?.displayName || home.athlete?.displayName || 'Home', away.team?.displayName || away.athlete?.displayName || 'Away', type.state === 'pre' ? null : home.score ?? null, type.state === 'pre' ? null : away.score ?? null, label, state, home.team?.abbreviation || 'H', away.team?.abbreviation || 'A', String(event.id), safeLogo(home.team?.logo), safeLogo(away.team?.logo), String(home.team?.id || ''), String(away.team?.id || '')]];
    });
    return { name, region, sport, path, symbol: '◉', color: '', matches };
  }));
  const groups = results.flatMap(result => result.status === 'fulfilled' ? [result.value] : []);
  const unavailable = feeds.filter((_, i) => results[i].status === 'rejected').map(feed => feed[2]);
  if (!groups.length) return Response.json({ error: 'Sports feed temporarily unavailable' }, { status: 502 });
  return Response.json({ date, groups, unavailable, updatedAt: new Date().toISOString(), source: 'ESPN' }, {
    headers: { 'Cache-Control': 'public, max-age=15, s-maxage=15' },
  });
        }
