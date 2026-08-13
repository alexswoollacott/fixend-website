PRAGMA foreign_keys = ON;

CREATE TABLE IF NOT EXISTS problems (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL CHECK(length(title) BETWEEN 5 AND 180),
  description TEXT NOT NULL CHECK(length(description) BETWEEN 10 AND 5000),
  tags TEXT NOT NULL DEFAULT '[]',
  author_name TEXT NOT NULL DEFAULT 'Anonymous' CHECK(length(author_name) <= 40),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now'))
);

CREATE TABLE IF NOT EXISTS answers (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  problem_id INTEGER NOT NULL,
  author_name TEXT NOT NULL DEFAULT 'Anonymous' CHECK(length(author_name) <= 40),
  body TEXT NOT NULL CHECK(length(body) BETWEEN 2 AND 5000),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (problem_id) REFERENCES problems(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS votes (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  answer_id INTEGER NOT NULL,
  voter_key TEXT NOT NULL CHECK(length(voter_key) BETWEEN 16 AND 100),
  value INTEGER NOT NULL CHECK(value IN (-1, 1)),
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE(answer_id, voter_key),
  FOREIGN KEY (answer_id) REFERENCES answers(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_problems_created_at ON problems(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_answers_problem_id ON answers(problem_id);
CREATE INDEX IF NOT EXISTS idx_answers_author_name ON answers(author_name);
CREATE INDEX IF NOT EXISTS idx_votes_answer_id ON votes(answer_id);
