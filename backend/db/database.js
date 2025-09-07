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

  // 3) 인덱스 (댓글)
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

  // ──────────────────────────────────────────────────────────────
  // 5) 급식 메뉴별 리뷰 스키마 (하이브리드: 방법1+방법2)
  //    - dishes: 메뉴 사전
  //    - meal_dishes: 날짜별 제공 메뉴
  //    - dish_feedback: 사용자별 메뉴 피드백(좋/보/별 + 짠맛/온도/양/식감 + Keep/Improve)
  // ──────────────────────────────────────────────────────────────

  await db.run(`
    CREATE TABLE IF NOT EXISTS dishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS meal_dishes (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_date TEXT NOT NULL,          -- 'YYYY-MM-DD'
      dish_id INTEGER NOT NULL,
      FOREIGN KEY(dish_id) REFERENCES dishes(id) ON DELETE CASCADE,
      UNIQUE(meal_date, dish_id)        -- 같은 날 같은 메뉴 중복 방지
    )
  `);

  await db.run(`
    CREATE TABLE IF NOT EXISTS dish_feedback (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      meal_dish_id INTEGER NOT NULL,
      like_flag INTEGER,                -- -1(별로) 0(보통) +1(좋아요)
      salt_level INTEGER,               -- -1(싱거움) 0(적당) +1(조금 짬) +2(많이 짬)
      temp_level INTEGER,               -- -1(차가움) 0(적당) +1(뜨거움)
      portion_level INTEGER,            -- -1(부족) 0(적당) +1(많음)
      texture_level INTEGER,            -- -1(질김) 0(적당) +1(부드러움)
      keep_text TEXT,                   -- 좋았던 점
      improve_text TEXT,                -- 개선 제안
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY(meal_dish_id) REFERENCES meal_dishes(id) ON DELETE CASCADE,
      UNIQUE(user_id, meal_dish_id)     -- 1인 1메뉴 1회(업서트로 수정 허용)
    )
  `);

  // 인덱스 (급식/리뷰)
  if (!(await hasIndex('idx_meal_dishes_date'))) {
    await db.run(`CREATE INDEX idx_meal_dishes_date ON meal_dishes(meal_date)`);
  }
  if (!(await hasIndex('idx_meal_dishes_dish'))) {
    await db.run(`CREATE INDEX idx_meal_dishes_dish ON meal_dishes(dish_id)`);
  }
  if (!(await hasIndex('idx_feedback_meal'))) {
    await db.run(`CREATE INDEX idx_feedback_meal ON dish_feedback(meal_dish_id)`);
  }
  if (!(await hasIndex('idx_feedback_user'))) {
    await db.run(`CREATE INDEX idx_feedback_user ON dish_feedback(user_id)`);
  }

  await db.run(`
    CREATE TABLE IF NOT EXISTS post_images (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      post_id       INTEGER NOT NULL,
      url           TEXT    NOT NULL,
      original_name TEXT    NOT NULL,
      mime          TEXT    NOT NULL,
      size_bytes    INTEGER NOT NULL,
      width         INTEGER,
      height        INTEGER,
      sort_order    INTEGER NOT NULL DEFAULT 0,
      created_at    TEXT    NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY(post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `);

  await db.run(`CREATE INDEX IF NOT EXISTS idx_post_images_post_id ON post_images(post_id)`);
  await db.run(`CREATE INDEX IF NOT EXISTS idx_post_images_post_id_order ON post_images(post_id, sort_order)`);

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