const json = (data, status = 200) => Response.json(data, { status });

export async function onRequestPost({ env, request, params }) {
  const problemId = Number(params.id);
  if (!Number.isInteger(problemId) || problemId < 1) return json({ error: 'Invalid problem.' }, 400);

  let data;
  try { data = await request.json(); } catch { return json({ error: 'Invalid JSON.' }, 400); }

  const body = String(data.body || '').trim();
  const authorName = String(data.author_name || 'Anonymous').trim().slice(0, 40) || 'Anonymous';
  if (body.length < 2 || body.length > 5000) return json({ error: 'Answer must be 2-5000 characters.' }, 400);

  const exists = await env.DB.prepare('SELECT id FROM problems WHERE id = ?').bind(problemId).first();
  if (!exists) return json({ error: 'Problem not found.' }, 404);

  const result = await env.DB.prepare(
    'INSERT INTO answers (problem_id, author_name, body) VALUES (?, ?, ?)'
  ).bind(problemId, authorName, body).run();

  return json({ ok: true, id: result.meta.last_row_id }, 201);
}
