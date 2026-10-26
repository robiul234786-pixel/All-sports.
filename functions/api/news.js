function teamArticles(articles,id){
 return articles.filter(a=>(a.categories||[]).some((c)=>c.type==='team'&&String(c.teamId??c.team?.id)===id)).map(a=>({id:String(a.id),title:a.headline,description:a.description||'',published:a.published,url:a.links?.web?.href})).filter(a=>a.id&&a.title&&Number.isFinite(Date.parse(a.published))&&/^https:\/\/([a-z0-9-]+\.)*espn\.com\//i.test(a.url||''));
}
export async function onRequestGet({ request }) {
 const q=new URL(request.url).searchParams,id=q.get('id')||'',league=q.get('league')||'';
 if(!/^\d{1,12}$/.test(id)||!['soccer/uefa.champions','soccer/eng.1','soccer/esp.1','soccer/ger.1','soccer/ita.1','soccer/fra.1','soccer/usa.1','soccer/ksa.1','soccer/por.1','soccer/ned.1','soccer/bra.1','soccer/arg.1','basketball/nba','hockey/nhl','baseball/mlb'].includes(league))return Response.json({error:'Invalid team'},{status:400});
 try{
  const r=await fetch(`https://site.api.espn.com/apis/site/v2/sports/${league}/news?team=${id}&limit=50`,{signal:AbortSignal.timeout(8000)});
  if(!r.ok)throw Error();
  const d=await r.json();
  return Response.json({articles:teamArticles(d.articles||[],id),checkedAt:new Date().toISOString(),source:'ESPN'},{headers:{'Cache-Control':'public, max-age=60, s-maxage=60'}});
 }catch{return Response.json({error:'Team news is temporarily unavailable.'},{status:502});}
}
