function stats(data) {
  return (data?.splits?.categories || []).flatMap((c) => c.stats || []).map((s) => ({ name: s.name, label: s.displayName || s.name, value: s.displayValue ?? s.value }));
}
async function get(url) {
  const response = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw new Error('Unavailable');
  return response.json();
}
export async function onRequestGet({ request }) {
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
