// GitHub: functions/api/[[route]].js
// Endpoints:
//   /api/matches?date=YYYY-MM-DD   -> all matches (clubs + national teams) of that date (Dhaka time)
//   /api/lineup?fixture=ID         -> official lineup, else probable XI from team's last match
// Needs Cloudflare secret: APIFOOTBALL_KEY

const API = "https://v3.football.api-sports.io";

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

export async function onRequest({ request, env }) {
  const url = new URL(request.url);
  const route = url.pathname.replace("/api/", "");

  // ---------- MATCHES BY DATE ----------
  if (route === "matches") {
    const date =
      url.searchParams.get("date") ||
      new Date(Date.now() + 6 * 3600e3).toISOString().slice(0, 10);
    return cached(request, ttlForDate(date), async () => {
      const j = await af(`/fixtures?date=${date}&timezone=Asia/Dhaka`, env);
      const list = (j.response || []).map((m) => ({
        id: m.fixture.id,
        time: m.fixture.date,            // already Dhaka time (+06:00)
        status: m.fixture.status.short,  // NS, 1H, HT, 2H, FT ...
        minute: m.fixture.status.elapsed,
        league: { id: m.league.id, name: m.league.name, country: m.league.country, logo: m.league.logo },
        home: { id: m.teams.home.id, name: m.teams.home.name, logo: m.teams.home.logo, goals: m.goals.home },
        away: { id: m.teams.away.id, name: m.teams.away.name, logo: m.teams.away.logo, goals: m.goals.away },
        // national team games: league name has "World Cup", "Nations League", "Friendlies", "Euro", "Qualif" etc.
        national: /world cup|nations league|friendl|euro|copa america|africa cup|asian cup|qualif/i.test(m.league.name) &&
                  !/club|u\d\d|women/i.test(m.league.name),
      }));
      return { date, count: list.length, matches: list };
    });
  }

  // ---------- LINEUP (official or probable) ----------
  if (route === "lineup") {
    const id = url.searchParams.get("fixture");
    if (!id) return new Response("fixture required", { status: 400 });
    return cached(request, 900, async () => {
      // 1) official lineup (usually appears ~1 hour before kickoff)
      const off = await af(`/fixtures/lineups?fixture=${id}`, env);
      if (off.response && off.response.length) {
        return { type: "official", teams: off.response.map(fmt) };
      }
      // 2) probable XI = lineup of each team's previous match
      const fx = await af(`/fixtures?id=${id}&timezone=Asia/Dhaka`, env);
      const f = fx.response && fx.response[0];
      if (!f) return { type: "none", teams: [] };
      const out = [];
      for (const t of [f.teams.home, f.teams.away]) {
        const last = await af(`/fixtures?team=${t.id}&last=1`, env);
        const lf = last.response && last.response[0];
        if (!lf) continue;
        const lu = await af(`/fixtures/lineups?fixture=${lf.fixture.id}`, env);
        const mine = (lu.response || []).find((x) => x.team.id === t.id);
        if (mine) out.push(fmt(mine));
      }
      return { type: "probable", note: "শেষ ম্যাচের লাইনআপের ভিত্তিতে সম্ভাব্য একাদশ", teams: out };
    });
  }

  return new Response("Not found", { status: 404 });
}

function fmt(x) {
  return {
    team: x.team.name,
    logo: x.team.logo,
    formation: x.formation,
    coach: x.coach && x.coach.name,
    xi: (x.startXI || []).map((p) => ({ n: p.player.number, name: p.player.name, pos: p.player.pos })),
    bench: (x.substitutes || []).map((p) => ({ n: p.player.number, name: p.player.name })),
  };
}
