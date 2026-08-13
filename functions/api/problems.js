const json = (data, status = 200) => Response.json(data, { status });

function cleanName(value) {
  const name = String(value || 'Anonymous').trim().slice(0, 40);
  return name || 'Anonymous';
}

export async function onRequestGet({ env, request }) {
  const url = new URL(request.url);
  const q = (url.searchParams.get('q') || '').trim();
  const filter = url.searchParams.get('filter') || 'latest';
  const like = `%${q}%`;

  let orderBy = 'p.created_at DESC';
  let having = '';
  if (filter === 'popular') orderBy = 'helpful_score DESC, p.created_at DESC';
  if (filter === 'unanswered') having = 'HAVING answer_count = 0';

  const sql = `
    SELECT p.id, p.title, p.description, p.tags, p.author_name, p.created_at,
           COUNT(DISTINCT a.id) AS answer_count,
           COALESCE(SUM(v.value), 0) AS helpful_score
    FROM problems p
    LEFT JOIN answers a ON a.problem_id = p.id
    LEFT JOIN votes v ON v.answer_id = a.id
    WHERE (? = '' OR p.title LIKE ? OR p.description LIKE ? OR p.tags LIKE ?)
    GROUP BY p.id
    ${having}
    ORDER BY ${orderBy}
    LIMIT 100`;

  const problems = await env.DB.prepare(sql).bind(q, like, like, like).all();
  const problemRows = problems.results || [];
  if (!problemRows.length) return json({ problems: [] });

  const ids = problemRows.map(p => p.id);
  const placeholders = ids.map(() => '?').join(',');
  const answers = await env.DB.prepare(`
    SELECT a.id, a.problem_id, a.author_name, a.body, a.created_at,
           COALESCE(SUM(v.value), 0) AS votes,
           SUM(CASE WHEN v.value = 1 THEN 1 ELSE 0 END) AS positive_votes,
           COUNT(v.id) AS total_votes
    FROM answers a
    LEFT JOIN votes v ON v.answer_id = a.id
    WHERE a.problem_id IN (${placeholders})
    GROUP BY a.id
    ORDER BY votes DESC, a.created_at ASC
  `).bind(...ids).all();

  const byProblem = new Map();
  for (const a of answers.results || []) {
    const trust = a.total_votes ? Math.round((a.positive_votes / a.total_votes) * 100) : null;
    const item = { ...a, votes: Number(a.votes || 0), trust };
    if (!byProblem.has(a.problem_id)) byProblem.set(a.problem_id, []);
    byProblem.get(a.problem_id).push(item);
  }

  return json({
    problems: problemRows.map(p => ({
      ...p,
      tags: safeTags(p.tags),
      answer_count: Number(p.answer_count || 0),
      helpful_score: Number(p.helpful_score || 0),
      answers: byProblem.get(p.id) || []
    }))
  });
}

export async function onRequestPost({ env, request }) {
  let body;
  try { body = await request.json(); } catch { return json({ error: 'Invalid JSON.' }, 400); }

  const title = String(body.title || '').trim();
  const description = String(body.description || '').trim();
  const authorName = cleanName(body.author_name);
  const tags = Array.isArray(body.tags)
    ? body.tags.map(t => String(t).trim().slice(0, 30)).filter(Boolean).slice(0, 8)
    : [];

  if (title.length < 5 || title.length > 180) return json({ error: 'Title must be 5-180 characters.' }, 400);
  if (description.length < 10 || description.length > 5000) return json({ error: 'Description must be 10-5000 characters.' }, 400);

  const result = await env.DB.prepare(
    'INSERT INTO problems (title, description, tags, author_name) VALUES (?, ?, ?, ?)'
  ).bind(title, description, JSON.stringify(tags), authorName).run();

  return json({ ok: true, id: result.meta.last_row_id }, 201);
}

function safeTags(value) {
  try { const tags = JSON.parse(value); return Array.isArray(tags) ? tags : []; }
  catch { return []; }
}
