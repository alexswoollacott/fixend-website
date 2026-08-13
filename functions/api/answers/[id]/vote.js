const json = (data, status = 200) => Response.json(data, { status });

export async function onRequestPost({ env, request, params }) {
  const answerId = Number(params.id);
  if (!Number.isInteger(answerId) || answerId < 1) return json({ error: 'Invalid answer.' }, 400);

  let data;
  try { data = await request.json(); } catch { return json({ error: 'Invalid JSON.' }, 400); }

  const voterKey = String(data.voter_key || '').trim();
  const value = Number(data.value);
  if (voterKey.length < 16 || voterKey.length > 100) return json({ error: 'Invalid voter key.' }, 400);
  if (![1, -1].includes(value)) return json({ error: 'Vote must be 1 or -1.' }, 400);

  const answer = await env.DB.prepare('SELECT id FROM answers WHERE id = ?').bind(answerId).first();
  if (!answer) return json({ error: 'Answer not found.' }, 404);

  await env.DB.prepare(`
    INSERT INTO votes (answer_id, voter_key, value)
    VALUES (?, ?, ?)
    ON CONFLICT(answer_id, voter_key)
    DO UPDATE SET value = excluded.value, updated_at = strftime('%Y-%m-%dT%H:%M:%fZ','now')
  `).bind(answerId, voterKey, value).run();

  const score = await env.DB.prepare(`
    SELECT COALESCE(SUM(value), 0) AS votes,
           SUM(CASE WHEN value = 1 THEN 1 ELSE 0 END) AS positive_votes,
           COUNT(*) AS total_votes
    FROM votes WHERE answer_id = ?
  `).bind(answerId).first();

  return json({
    ok: true,
    votes: Number(score.votes || 0),
    trust: score.total_votes ? Math.round((score.positive_votes / score.total_votes) * 100) : null
  });
}
