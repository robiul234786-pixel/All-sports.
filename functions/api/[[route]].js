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
