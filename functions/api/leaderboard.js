export async function onRequestGet({ env }) {
  const rows = await env.DB.prepare(`
    SELECT a.author_name,
           COUNT(DISTINCT a.id) AS answers,
           COALESCE(SUM(v.value), 0) AS score,
           SUM(CASE WHEN v.value = 1 THEN 1 ELSE 0 END) AS positive_votes,
           COUNT(v.id) AS total_votes
    FROM answers a
    LEFT JOIN votes v ON v.answer_id = a.id
    GROUP BY a.author_name
    ORDER BY score DESC, answers DESC
    LIMIT 10
  `).all();

  return Response.json({ helpers: (rows.results || []).map(r => ({
    name: r.author_name,
    answers: Number(r.answers || 0),
    score: Number(r.score || 0),
    trust: r.total_votes ? Math.round((r.positive_votes / r.total_votes) * 100) : null
  })) });
}
