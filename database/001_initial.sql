PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS users (
 id INTEGER PRIMARY KEY, name TEXT NOT NULL, email TEXT UNIQUE NOT NULL COLLATE NOCASE,
 password_hash TEXT NOT NULL, role TEXT NOT NULL CHECK(role IN ('student','parent','teacher','admin')),
 avatar TEXT NOT NULL DEFAULT 'orange', created_at INTEGER NOT NULL
);
CREATE TABLE IF NOT EXISTS sessions (token_hash TEXT PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE, expires_at INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS relations (adult_id INTEGER NOT NULL REFERENCES users(id), student_id INTEGER NOT NULL REFERENCES users(id), PRIMARY KEY(adult_id,student_id));
CREATE TABLE IF NOT EXISTS courses (id INTEGER PRIMARY KEY, title TEXT NOT NULL, description TEXT NOT NULL, subject TEXT NOT NULL DEFAULT 'Matematika', color TEXT NOT NULL DEFAULT 'orange');
CREATE TABLE IF NOT EXISTS modules (id INTEGER PRIMARY KEY, course_id INTEGER NOT NULL REFERENCES courses(id), title TEXT NOT NULL, position INTEGER NOT NULL);
CREATE TABLE IF NOT EXISTS lessons (id INTEGER PRIMARY KEY, module_id INTEGER NOT NULL REFERENCES modules(id), title TEXT NOT NULL, description TEXT NOT NULL DEFAULT '', slides_json TEXT NOT NULL, lab_type TEXT, position INTEGER NOT NULL DEFAULT 1);
CREATE TABLE IF NOT EXISTS progress (user_id INTEGER NOT NULL REFERENCES users(id), lesson_id INTEGER NOT NULL REFERENCES lessons(id), slide INTEGER NOT NULL DEFAULT 0, completed INTEGER NOT NULL DEFAULT 0, updated_at INTEGER NOT NULL, PRIMARY KEY(user_id,lesson_id));
CREATE TABLE IF NOT EXISTS assessments (id INTEGER PRIMARY KEY, lesson_id INTEGER REFERENCES lessons(id), module_id INTEGER NOT NULL REFERENCES modules(id), title TEXT NOT NULL, kind TEXT NOT NULL CHECK(kind IN ('test','exam')), duration_seconds INTEGER NOT NULL DEFAULT 600);
CREATE TABLE IF NOT EXISTS questions (id INTEGER PRIMARY KEY, assessment_id INTEGER NOT NULL REFERENCES assessments(id), prompt TEXT NOT NULL, options_json TEXT NOT NULL, correct_index INTEGER NOT NULL, explanation TEXT NOT NULL);
CREATE TABLE IF NOT EXISTS attempts (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), assessment_id INTEGER NOT NULL REFERENCES assessments(id), started_at INTEGER NOT NULL, deadline INTEGER NOT NULL, submitted_at INTEGER, questions_json TEXT NOT NULL, answers_json TEXT, score INTEGER, feedback_json TEXT);
CREATE UNIQUE INDEX IF NOT EXISTS one_open_attempt ON attempts(user_id,assessment_id) WHERE submitted_at IS NULL;
CREATE TABLE IF NOT EXISTS rewards (user_id INTEGER NOT NULL REFERENCES users(id), source TEXT NOT NULL, xp INTEGER NOT NULL, created_at INTEGER NOT NULL, PRIMARY KEY(user_id,source));
CREATE TABLE IF NOT EXISTS focus_sessions (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), lesson_id INTEGER NOT NULL REFERENCES lessons(id), goal TEXT NOT NULL, state TEXT NOT NULL CHECK(state IN ('running','paused','completed')), phase TEXT NOT NULL CHECK(phase IN ('study','break')), deadline INTEGER, remaining_ms INTEGER NOT NULL, active_seconds INTEGER NOT NULL DEFAULT 0, heartbeat_at INTEGER, heartbeat_active INTEGER NOT NULL DEFAULT 0, created_at INTEGER NOT NULL, updated_at INTEGER NOT NULL, finished_at INTEGER);
CREATE UNIQUE INDEX IF NOT EXISTS one_active_focus ON focus_sessions(user_id) WHERE state IN ('running','paused');
CREATE TABLE IF NOT EXISTS labs (id INTEGER PRIMARY KEY, user_id INTEGER NOT NULL REFERENCES users(id), lesson_id INTEGER NOT NULL REFERENCES lessons(id), numerator INTEGER NOT NULL, denominator INTEGER NOT NULL, conclusion TEXT NOT NULL, status TEXT NOT NULL CHECK(status IN ('draft','submitted')), updated_at INTEGER NOT NULL, UNIQUE(user_id,lesson_id));
CREATE TABLE IF NOT EXISTS support (id INTEGER PRIMARY KEY, student_id INTEGER NOT NULL REFERENCES users(id), lesson_id INTEGER NOT NULL REFERENCES lessons(id), question TEXT NOT NULL, answer TEXT, teacher_id INTEGER REFERENCES users(id), created_at INTEGER NOT NULL, answered_at INTEGER);
CREATE TABLE IF NOT EXISTS rate_limits (key TEXT PRIMARY KEY, count INTEGER NOT NULL, reset_at INTEGER NOT NULL);
