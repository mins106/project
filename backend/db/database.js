const sqlite3 = require('sqlite3').verbose();
const path = require('path');
const { promisify } = require('util');

// DB 연결
const db = new sqlite3.Database(path.join(__dirname, 'mydb.sqlite3'), (err) => {
  if (err) {
    console.error('DB 연결 실패:', err.message);
  } else {
    console.log('✅ SQLite DB 연결 성공');
  }
});

// foreign key 활성화
db.serialize(() => {
  db.run(`PRAGMA foreign_keys = ON;`);
});

// ──────────────────────────────────────────────────────────────
// Promisify (주의: sqlite3의 run을 promisify하면 this.lastID 접근이 어렵습니다)
db.run = promisify(db.run.bind(db));
db.get = promisify(db.get.bind(db));
db.all = promisify(db.all.bind(db));
// ──────────────────────────────────────────────────────────────

// 유틸
async function hasColumn(table, col) {
  const rows = await db.all(`PRAGMA table_info(${table});`);
  return rows.some(r => r.name === col);
}
async function hasIndex(name) {
  const row = await db.get(
    `SELECT name FROM sqlite_master WHERE type='index' AND name=?;`,
    [name]
  );
  return !!row;
}
async function hasTrigger(name) {
  const row = await db.get(
    `SELECT name FROM sqlite_master WHERE type='trigger' AND name=?;`,
    [name]
  );
  return !!row;
}

// 스키마 생성 + 마이그레이션
async function ensureSchema() {
  // 1) 기본 테이블 생성
  await db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id TEXT NOT NULL,
      name TEXT NOT NULL,
      user_id TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      title TEXT NOT NULL,
      content TEXT NOT NULL,
      tag TEXT NOT NULL,
      author TEXT NOT NULL,
      studentId TEXT NOT NULL,
      createdAt TEXT NOT NULL,
      likes INTEGER DEFAULT 0,
      dislikes INTEGER DEFAULT 0,
      comments INTEGER DEFAULT 0,
      isBest INTEGER DEFAULT 0
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      postId INTEGER NOT NULL,
      text TEXT NOT NULL,
      author TEXT DEFAULT '익명',
      studentId TEXT DEFAULT '',
      createdAt TEXT DEFAULT (datetime('now', 'localtime')),
      FOREIGN KEY (postId) REFERENCES posts(id)
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS post_reactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      post_id INTEGER NOT NULL,
      reaction TEXT NOT NULL CHECK (reaction IN ('like','dislike')),
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, post_id)
    )
  `);

  // 2) comments 테이블 마이그레이션 (대댓글/반응/수정시간)
  if (!(await hasColumn('comments', 'parentId'))) {
    await db.run(`
      ALTER TABLE comments
      ADD COLUMN parentId INTEGER REFERENCES comments(id) ON DELETE CASCADE
    `);
  }
  if (!(await hasColumn('comments', 'likes'))) {
    await db.run(`ALTER TABLE comments ADD COLUMN likes INTEGER DEFAULT 0`);
  }
  if (!(await hasColumn('comments', 'dislikes'))) {
    await db.run(`ALTER TABLE comments ADD COLUMN dislikes INTEGER DEFAULT 0`);
  }
  if (!(await hasColumn('comments', 'updatedAt'))) {
    await db.run(`ALTER TABLE comments ADD COLUMN updatedAt TEXT`);
  }

  // 3) 인덱스
  if (!(await hasIndex('idx_comments_post'))) {
    await db.run(`CREATE INDEX idx_comments_post ON comments(postId)`);
  }
  if (!(await hasIndex('idx_comments_parent'))) {
    await db.run(`CREATE INDEX idx_comments_parent ON comments(parentId)`);
  }
  if (!(await hasIndex('idx_comments_created'))) {
    await db.run(`CREATE INDEX idx_comments_created ON comments(createdAt)`);
  }

  // 4) 트리거(게시글 삭제 시 댓글 전체 삭제) - postId FK에 ON DELETE CASCADE가 없으므로 트리거로 보완
  if (!(await hasTrigger('trg_comments_delete_when_post_deleted'))) {
    await db.run(`
      CREATE TRIGGER trg_comments_delete_when_post_deleted
      AFTER DELETE ON posts
      FOR EACH ROW
      BEGIN
        DELETE FROM comments WHERE postId = OLD.id;
      END;
    `);
  }

  console.log('✅ 스키마/마이그레이션 완료');
}

// 비동기 초기화 시작(필요하면 서버 시작 전에 await)
db.ready = (async () => {
  try {
    await ensureSchema();
  } catch (e) {
    console.error('스키마 초기화 에러:', e);
  }
})();

module.exports = db;