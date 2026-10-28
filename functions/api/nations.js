// National teams (all FIFA members) — list + squad, recent results and fixtures.
// Squad / fixture data comes from API-Football and needs the APIFOOTBALL_KEY secret.
const RAW = `# AFC
Afghanistan|AF
Australia|AU
Bahrain|BH
Bangladesh|BD
Bhutan|BT
Brunei Darussalam|BN|Brunei
Cambodia|KH
China PR|CN|China
Chinese Taipei|TW|Taiwan
Guam|GU
Hong Kong|HK|Hong Kong
India|IN
Indonesia|ID
IR Iran|IR|Iran
Iraq|IQ
Japan|JP
Jordan|JO
Korea DPR|KP|North Korea
Korea Republic|KR|South Korea
Kuwait|KW
Kyrgyz Republic|KG|Kyrgyzstan
Laos|LA
Lebanon|LB
Macau|MO|Macao
Malaysia|MY
Maldives|MV
Mongolia|MN
Myanmar|MM
Nepal|NP
Oman|OM
Pakistan|PK
Palestine|PS
Philippines|PH
Qatar|QA
Saudi Arabia|SA
Singapore|SG
Sri Lanka|LK
Syria|SY
Tajikistan|TJ
Thailand|TH
Timor-Leste|TL|East Timor
Turkmenistan|TM
United Arab Emirates|AE|UAE
Uzbekistan|UZ
Vietnam|VN
Yemen|YE
# CAF
Algeria|DZ
Angola|AO
Benin|BJ
Botswana|BW
Burkina Faso|BF
Burundi|BI
Cameroon|CM
Cabo Verde|CV|Cape Verde Islands;Cape Verde
Central African Republic|CF
Chad|TD
Comoros|KM
Congo|CG
Congo DR|CD|DR Congo
Côte d'Ivoire|CI|Ivory Coast
Djibouti|DJ
Egypt|EG
Equatorial Guinea|GQ
Eritrea|ER
Eswatini|SZ|Swaziland
Ethiopia|ET
Gabon|GA
Gambia|GM
Ghana|GH
Guinea|GN
Guinea-Bissau|GW
Kenya|KE
Lesotho|LS
Liberia|LR
Libya|LY
Madagascar|MG
Malawi|MW
Mali|ML
Mauritania|MR
Mauritius|MU
Morocco|MA
Mozambique|MZ
Namibia|NA
Niger|NE
Nigeria|NG
Rwanda|RW
São Tomé and Príncipe|ST|Sao Tome and Principe
Senegal|SN
Seychelles|SC
Sierra Leone|SL
Somalia|SO
South Africa|ZA
South Sudan|SS
Sudan|SD
Tanzania|TZ
Togo|TG
Tunisia|TN
Uganda|UG
Zambia|ZM
Zimbabwe|ZW
# CONCACAF
Anguilla|AI
Antigua and Barbuda|AG|Antigua And Barbuda
Aruba|AW
Bahamas|BS
Barbados|BB
Belize|BZ
Bermuda|BM
British Virgin Islands|VG
Canada|CA
Cayman Islands|KY
Costa Rica|CR
Cuba|CU
Curaçao|CW|Curacao
Dominica|DM
Dominican Republic|DO
El Salvador|SV
Grenada|GD
Guatemala|GT
Guyana|GY
Haiti|HT
Honduras|HN
Jamaica|JM
Mexico|MX
Montserrat|MS
Nicaragua|NI
Panama|PA
Puerto Rico|PR
St Kitts and Nevis|KN|Saint Kitts and Nevis;St. Kitts and Nevis
St Lucia|LC|Saint Lucia
St Vincent and the Grenadines|VC|Saint Vincent and the Grenadines
Suriname|SR
Trinidad and Tobago|TT
Turks and Caicos Islands|TC|Turks and Caicos
USA|US|United States
US Virgin Islands|VI
# CONMEBOL
Argentina|AR
Bolivia|BO
Brazil|BR
Chile|CL
Colombia|CO
Ecuador|EC
Paraguay|PY
Peru|PE
Uruguay|UY
Venezuela|VE
# OFC
American Samoa|AS
Cook Islands|CK
Fiji|FJ
New Caledonia|NC
New Zealand|NZ
Papua New Guinea|PG
Samoa|WS
Solomon Islands|SB
Tahiti|PF
Tonga|TO
Vanuatu|VU
# UEFA
Albania|AL
Andorra|AD
Armenia|AM
Austria|AT
Azerbaijan|AZ
Belarus|BY
Belgium|BE
Bosnia and Herzegovina|BA|Bosnia & Herzegovina;Bosnia
Bulgaria|BG
Croatia|HR
Cyprus|CY
Czechia|CZ|Czech Republic
Denmark|DK
England|ENG
Estonia|EE
Faroe Islands|FO
Finland|FI
France|FR
Georgia|GE
Germany|DE
Gibraltar|GI
Greece|GR
Hungary|HU
Iceland|IS
Israel|IL
Italy|IT
Kazakhstan|KZ
Kosovo|XK
Latvia|LV
Liechtenstein|LI
Lithuania|LT
Luxembourg|LU
Malta|MT
Moldova|MD
Montenegro|ME
Netherlands|NL
North Macedonia|MK|Macedonia
Northern Ireland|NIR
Norway|NO
Poland|PL
Portugal|PT
Republic of Ireland|IE|Ireland
Romania|RO
Russia|RU
San Marino|SM
Scotland|SCO
Serbia|RS
Slovakia|SK
Slovenia|SI
Spain|ES
Sweden|SE
Switzerland|CH
Türkiye|TR|Turkey
Ukraine|UA
Wales|WAL`;

const cp = (...c) => String.fromCodePoint(...c);
const TAG = (s) => cp(0x1F3F4, ...[...s].map((ch) => 0xE0000 + ch.charCodeAt(0)), 0xE007F);
function flag(iso) {
  if (iso === 'ENG') return TAG('gbeng');
  if (iso === 'SCO') return TAG('gbsct');
  if (iso === 'WAL') return TAG('gbwls');
  if (iso === 'NIR') return cp(0x1F1EC, 0x1F1E7);
  return cp(...[...iso].map((ch) => 0x1F1E6 + ch.charCodeAt(0) - 65));
}
const NATIONS = [];
{ let conf = '';
  for (const line of RAW.split('\n')) {
    if (line.startsWith('# ')) { conf = line.slice(2).trim(); continue; }
    const [name, iso, alts] = line.split('|');
    NATIONS.push({ name, iso, conf, flag: flag(iso), alts: alts ? alts.split(';') : [] });
  }
}
const FEATURED = ['Bangladesh', 'Argentina', 'Brazil'];

const AF = 'https://v3.football.api-sports.io';
const norm = (s) => String(s || '').normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, ' ').trim();
async function cached(key, ttl, fn) {
  let cache = null;
  const req = new Request('https://nations.cache.internal/' + encodeURIComponent(key));
  try { cache = caches.default; const hit = await cache.match(req); if (hit) return await hit.json(); } catch { cache = null; }
  const value = await fn();
  if (cache && value !== undefined) { try { await cache.put(req, new Response(JSON.stringify(value), { headers: { 'Cache-Control': `public, max-age=${ttl}` } })); } catch {} }
  return value;
}
async function afGet(env, path) {
  const r = await fetch(AF + path, { headers: { 'x-apisports-key': env.APIFOOTBALL_KEY }, signal: AbortSignal.timeout(8000) });
  if (!r.ok) throw new Error('AF unavailable');
  const j = await r.json();
  const failed = j.errors && (Array.isArray(j.errors) ? j.errors.length : Object.keys(j.errors).length);
  if (failed || !Array.isArray(j.response)) throw new Error('AF error');
  return j;
}
const youth = /\b(u\s?\d{2}|women|w|olympic|b team|ii)\b/i;
async function resolveTeam(env, n) {
  return cached('team:' + n.name, 30 * 86400, async () => {
    const queries = [n.name, ...n.alts].filter((q, i, a) => q.length >= 3 && a.indexOf(q) === i);
    for (const q of queries) {
      let j; try { j = await afGet(env, `/teams?search=${encodeURIComponent(q)}`); } catch { continue; }
      const nat = j.response.filter((x) => x.team?.national && !youth.test(x.team.name || ''));
      const wanted = new Set([n.name, ...n.alts].map(norm));
      const hit = nat.find((x) => wanted.has(norm(x.team.name))) || nat.find((x) => norm(x.team.country) && wanted.has(norm(x.team.country)));
      if (hit) return { id: hit.team.id, name: hit.team.name, logo: hit.team.logo, founded: hit.team.founded || null };
    }
    return null;
  });
}
const okImg = (u, kind) => typeof u === 'string' && u.startsWith('https://media.api-sports.io/football/' + kind + '/') ? u : '';
const POS = ['Goalkeeper', 'Defender', 'Midfielder', 'Attacker'];
function shapeFixture(f) {
  return { id: f.fixture?.id, date: f.fixture?.date, status: f.fixture?.status?.short || '', league: f.league?.name || '', round: f.league?.round || '',
    home: { name: f.teams?.home?.name || '', logo: okImg(f.teams?.home?.logo, 'teams') }, away: { name: f.teams?.away?.name || '', logo: okImg(f.teams?.away?.logo, 'teams') },
    hg: f.goals?.home ?? null, ag: f.goals?.away ?? null };
}
export async function onRequestGet({ request, env }) {
  const q = new URL(request.url).searchParams;
  const name = q.get('team');
  if (!name) {
    return Response.json({ confederations: ['AFC', 'CAF', 'CONCACAF', 'CONMEBOL', 'OFC', 'UEFA'], featured: FEATURED, nations: NATIONS.map((n) => ({ name: n.name, flag: n.flag, conf: n.conf })), configured: !!env?.APIFOOTBALL_KEY },
      { headers: { 'Cache-Control': 'public, max-age=3600' } });
  }
  const n = NATIONS.find((x) => x.name === name);
  if (!n) return Response.json({ error: 'Unknown team' }, { status: 400 });
  if (!env?.APIFOOTBALL_KEY) return Response.json({ error: 'not-configured' }, { status: 503 });
  try {
    const team = await resolveTeam(env, n);
    if (!team) return Response.json({ error: 'team-not-found', name: n.name, flag: n.flag }, { status: 404 });
    const settle = (p) => p.then((v) => v, () => null);
    const [squadJ, lastJ, nextJ] = await Promise.all([
      settle(cached(`squad:${team.id}`, 6 * 3600, () => afGet(env, `/players/squads?team=${team.id}`))),
      settle(cached(`last:${team.id}`, 1800, () => afGet(env, `/fixtures?team=${team.id}&last=5`))),
      settle(cached(`next:${team.id}`, 3600, () => afGet(env, `/fixtures?team=${team.id}&next=5`))),
    ]);
    const players = squadJ?.response?.[0]?.players || [];
    const groups = POS.map((pos) => ({ pos, players: players.filter((p) => p.position === pos).map((p) => ({ id: p.id, name: p.name, age: p.age ?? null, number: p.number ?? null, photo: okImg(p.photo, 'players') })) })).filter((g) => g.players.length);
    return Response.json({
      team: { id: team.id, name: n.name, apiName: team.name, flag: n.flag, conf: n.conf, logo: okImg(team.logo, 'teams'), founded: team.founded },
      squad: groups, squadCount: players.length,
      last: (lastJ?.response || []).map(shapeFixture).sort((a, b) => new Date(b.date) - new Date(a.date)),
      next: (nextJ?.response || []).map(shapeFixture).sort((a, b) => new Date(a.date) - new Date(b.date)),
      missing: { squad: !squadJ, last: !lastJ, next: !nextJ },
      source: 'API-Football', checkedAt: new Date().toISOString(),
    }, { headers: { 'Cache-Control': 'public, max-age=300' } });
  } catch { return Response.json({ error: 'unavailable' }, { status: 502 }); }
}
