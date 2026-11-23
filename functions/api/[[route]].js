// GitHub: functions/api/[[route]].js
// Endpoints:
//   /api/matches?date=YYYY-MM-DD   -> all matches (clubs + national teams) of that date (Dhaka time)
//   /api/lineup?fixture=ID         -> official lineup, else probable XI from team's last match
// Needs Cloudflare secret: APIFOOTBALL_KEY

const API = "https://v3.football.api-sports.io";

// গুরুত্বপূর্ণ টুর্নামেন্ট (ক্রম = অগ্রাধিকার, আগে মানে উপরে)
const NAT = [1,4,5,6,7,9,10,22,29,30,31,32,33,34,960]; // জাতীয় দলের টুর্নামেন্ট
const TOP = [1,4,9,6,7,5,960,32,34,29,30,31,33,2,3,848,39,140,135,78,61,45,143,48,88,71,307,13,17,531,15,10];

async function af(path, env) {
  const r = await fetch(API + path, { headers: { "x-apisports-key": env.APIFOOTBALL_KEY } });
  return r.json();
}

// cache helper: same request within `ttl` seconds costs 0 API calls
async function cached(request, ttl, producer) {
  const cache = caches.default;
  const key = new Request(request.url, { method: "GET" });
  let res = await cache.match(key);
  if (res) return res;
  const data = await producer();
  res = new Response(JSON.stringify(data), {
    headers: {
      "Content-Type": "application/json",
      "Access-Control-Allow-Origin": "*",
      "Cache-Control": `public, max-age=${ttl}, s-maxage=${ttl}`,
    },
  });
  await cache.put(key, res.clone());
  return res;
}

function ttlForDate(date) {
  const today = new Date(Date.now() + 6 * 3600e3).toISOString().slice(0, 10); // Dhaka date
  if (date === today) return 60;       // today: live, refresh every minute
  if (date < today) return 6 * 3600;   // past: rarely changes
  return 1800;                         // future: 30 min
}

const dhakaDay = (iso) => new Date(new Date(iso).getTime() + 6 * 3600e3).toISOString().slice(0, 10);
const JSON_HEAD = (ttl) => ({ "Content-Type": "application/json", "Access-Control-Allow-Origin": "*", "Cache-Control": `public, max-age=${ttl}, s-maxage=${ttl}` });
const shapeLineup = (x) => ({
  team: { id: x.team?.id, name: x.team?.name },
  formation: x.formation || "",
  startXI: (x.startXI || []).map((p) => ({ name: p.player?.name, number: p.player?.number, pos: p.player?.pos, grid: p.player?.grid, photo: p.player?.id ? `https://media.api-sports.io/football/players/${p.player.id}.png` : '' })),
  subs: (x.substitutes || []).map((p) => ({ name: p.player?.name, number: p.player?.number, pos: p.player?.pos })),
});

export async function onRequestGet({ request, env }) {
  const url = new URL(request.url);
  const path = url.pathname;
  if (!env.APIFOOTBALL_KEY) return new Response(JSON.stringify({ error: "no-key", matches: [] }), { headers: JSON_HEAD(60) });

  // ---------- /api/matches?date=YYYY-MM-DD (national team matches of that Dhaka date) ----------
  if (path.endsWith("/matches")) {
    const date = url.searchParams.get("date") || "";
    if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return new Response(JSON.stringify({ matches: [] }), { status: 400, headers: JSON_HEAD(60) });
    return cached(request, ttlForDate(date), async () => {
      try {
        const prev = new Date(new Date(date + "T00:00:00Z").getTime() - 864e5).toISOString().slice(0, 10);
        const [a, b] = await Promise.all([af(`/fixtures?date=${prev}`, env), af(`/fixtures?date=${date}`, env)]);
        const all = [...(a.response || []), ...(b.response || [])];
        const seen = new Set();
        const matches = all
          .filter((f) => NAT.includes(f.league?.id) && dhakaDay(f.fixture.date) === date && !seen.has(f.fixture.id) && seen.add(f.fixture.id))
          .sort((x, y) => TOP.indexOf(x.league.id) - TOP.indexOf(y.league.id) || new Date(x.fixture.date) - new Date(y.fixture.date))
          .map((f) => ({
            id: f.fixture.id, time: f.fixture.date, status: f.fixture.status?.short, minute: f.fixture.status?.elapsed,
            home: { id: f.teams.home.id, name: f.teams.home.name, goals: f.goals.home },
            away: { id: f.teams.away.id, name: f.teams.away.name, goals: f.goals.away },
            league: { id: f.league.id, name: f.league.name, country: f.league.country }, national: true,
          }));
        return { matches, date };
      } catch { return { matches: [], error: true }; }
    });
  }

  // ---------- /api/lineup?fixture=ID (official lineup, else probable XI from each team's last match) ----------
  if (path.endsWith("/lineup")) {
    const id = url.searchParams.get("fixture") || "";
    if (!/^\d{1,12}$/.test(id)) return new Response(JSON.stringify({ error: "bad-id" }), { status: 400, headers: JSON_HEAD(60) });
    return cached(request, 900, async () => {
      try {
        const off = await af(`/fixtures/lineups?fixture=${id}`, env);
        if ((off.response || []).length) return { official: true, teams: off.response.map(shapeLineup) };
        const fx = (await af(`/fixtures?id=${id}`, env)).response?.[0];
        if (!fx) return { official: false, teams: [] };
        const teams = [];
        for (const t of [fx.teams.home, fx.teams.away]) {
          const last = (await af(`/fixtures?team=${t.id}&last=3&status=FT`, env)).response || [];
          for (const g of last.filter((g) => g.fixture.id !== fx.fixture.id).sort((x, y) => new Date(y.fixture.date) - new Date(x.fixture.date))) {
            const l = ((await af(`/fixtures/lineups?fixture=${g.fixture.id}`, env)).response || []).find((r) => r.team?.id === t.id);
            if (l) { teams.push(shapeLineup(l)); break; }
          }
        }
        return { official: false, teams };
      } catch { return { official: false, teams: [], error: true }; }
    });
  }
  return new Response(JSON.stringify({ error: "not-found" }), { status: 404, headers: JSON_HEAD(60) });
}
