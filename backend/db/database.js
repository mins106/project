const sqlite3 = require('sqlite3').verbose()
const path = require('path')
const { promisify } = require('util')

// DB 연결 (db 파일은 backend/db/mydb.sqlite3)
const db = new sqlite3.Database(path.join(__dirname, 'mydb.sqlite3'), (err) => {
  if (err) console.error('DB 연결 실패:', err.message)
  else console.log('✅ SQLite DB 연결 성공')
})

// 외래키 활성화
db.serialize(() => {
  db.run(`PRAGMA foreign_keys = ON;`)
  db.run(`PRAGMA journal_mode = WAL;`)
})

// sqlite3 콜백 API → Promise 화
// (주의) run을 promisify하면 this.lastID 접근은 어려움. lastID가 꼭 필요하면 별도 함수 쓰기.
db.run = promisify(db.run.bind(db))
db.get = promisify(db.get.bind(db))
db.all = promisify(db.all.bind(db))

// 유틸
async function hasColumn(table, col) {
  const rows = await db.all(`PRAGMA table_info(${table});`)
  return rows.some(r => r.name === col)
}
async function hasIndex(name) {
  const row = await db.get(`SELECT name FROM sqlite_master WHERE type='index' AND name=?;`, [name])
  return !!row
}
async function hasTrigger(name) {
  const row = await db.get(`SELECT name FROM sqlite_master WHERE type='trigger' AND name=?;`, [name])
  return !!row
}
async function hasTable(name) {
  const row = await db.get(`SELECT name FROM sqlite_master WHERE type='table' AND name=?;`, [name])
  return !!row
}

// 스키마 생성 + 마이그레이션
async function ensureSchema() {
  // ──────────────────────────
  // 1) users
  // ──────────────────────────
  await db.run(`
    CREATE TABLE IF NOT EXISTS users (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      student_id  TEXT    NOT NULL,         -- 학교 학번(문자형)
      name        TEXT    NOT NULL,
      user_id     TEXT    NOT NULL UNIQUE,  -- 로그인용 아이디
      password    TEXT    NOT NULL          -- 해시 비밀번호
    )
  `)
  // 자주 조회되는 user_id / student_id 인덱스
  if (!(await hasIndex('idx_users_user_id'))) {
    await db.run(`CREATE INDEX idx_users_user_id ON users(user_id)`)
  }
  if (!(await hasIndex('idx_users_student_id'))) {
    await db.run(`CREATE INDEX idx_users_student_id ON users(student_id)`)
  }

  // ──────────────────────────
  // 2) posts (게시글)
  //    - author: 표시명(닉네임/이름)
  //    - studentId: 작성자 학번 (users.student_id와 연결)
  // ──────────────────────────
  await db.run(`
    CREATE TABLE IF NOT EXISTS posts (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      title       TEXT    NOT NULL,
      content     TEXT    NOT NULL,
      tag         TEXT    NOT NULL,  -- 카테고리/태그
      author      TEXT    NOT NULL,  -- 표시명
      studentId   TEXT    NOT NULL,  -- 작성자 학번(문자), users.student_id 참조
      createdAt   TEXT    NOT NULL DEFAULT (datetime('now','localtime')),
      likes       INTEGER DEFAULT 0,
      dislikes    INTEGER DEFAULT 0,
      comments    INTEGER DEFAULT 0,
      isBest      INTEGER DEFAULT 0,
      FOREIGN KEY (studentId) REFERENCES users(student_id) ON DELETE SET NULL
    )
  `)
  if (!(await hasIndex('idx_posts_author_student'))) {
    await db.run(`CREATE INDEX idx_posts_author_student ON posts(studentId)`)
  }
  if (!(await hasIndex('idx_posts_created'))) {
    await db.run(`CREATE INDEX idx_posts_created ON posts(createdAt DESC)`)
  }
  if (!(await hasIndex('idx_posts_tag'))) {
    await db.run(`CREATE INDEX idx_posts_tag ON posts(tag)`)
  }

  // ──────────────────────────
  // 3) comments (댓글 + 대댓글)
  //    - parentId: 대댓글(부모 댓글)
  //    - studentId: 댓글 작성자 학번
  // ──────────────────────────
  await db.run(`
    CREATE TABLE IF NOT EXISTS comments (
      id          INTEGER PRIMARY KEY AUTOINCREMENT,
      postId      INTEGER NOT NULL,
      text        TEXT    NOT NULL,
      author      TEXT    DEFAULT '익명',
      studentId   TEXT    DEFAULT '',  -- 작성자 학번(문자)
      createdAt   TEXT    DEFAULT (datetime('now','localtime')),
      parentId    INTEGER REFERENCES comments(id) ON DELETE CASCADE,
      likes       INTEGER DEFAULT 0,
      dislikes    INTEGER DEFAULT 0,
      updatedAt   TEXT,
      FOREIGN KEY (postId)    REFERENCES posts(id)         ON DELETE CASCADE,
      FOREIGN KEY (studentId) REFERENCES users(student_id) ON DELETE SET NULL
    )
  `)
  if (!(await hasIndex('idx_comments_post'))) {
    await db.run(`CREATE INDEX idx_comments_post ON comments(postId)`)
  }
  if (!(await hasIndex('idx_comments_parent'))) {
    await db.run(`CREATE INDEX idx_comments_parent ON comments(parentId)`)
  }
  if (!(await hasIndex('idx_comments_created'))) {
    await db.run(`CREATE INDEX idx_comments_created ON comments(createdAt)`)
  }

  // 게시글 삭제 시 대댓글까지 정리(보강 트리거)
  if (!(await hasTrigger('trg_comments_delete_when_post_deleted'))) {
    await db.run(`
      CREATE TRIGGER trg_comments_delete_when_post_deleted
      AFTER DELETE ON posts
      FOR EACH ROW
      BEGIN
        DELETE FROM comments WHERE postId = OLD.id;
      END;
    `)
  }

  // ──────────────────────────
  // 4) post_reactions (게시글 반응: 좋아요/싫어요 1인 1회)
  // ──────────────────────────
  await db.run(`
    CREATE TABLE IF NOT EXISTS post_reactions (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL,                       -- users.id
      post_id    INTEGER NOT NULL,                       -- posts.id
      reaction   TEXT    NOT NULL CHECK (reaction IN ('like','dislike')),
      created_at TEXT    DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, post_id),
      FOREIGN KEY (user_id) REFERENCES users(id)   ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES posts(id)   ON DELETE CASCADE
    )
  `)
  if (!(await hasIndex('idx_post_reactions_user'))) {
    await db.run(`CREATE INDEX idx_post_reactions_user ON post_reactions(user_id)`)
  }
  if (!(await hasIndex('idx_post_reactions_post'))) {
    await db.run(`CREATE INDEX idx_post_reactions_post ON post_reactions(post_id)`)
  }

  // ──────────────────────────
  // 5) meals 리뷰(네가 이전에 설계한 하이브리드 스키마)
  // ──────────────────────────
  await db.run(`
    CREATE TABLE IF NOT EXISTS dishes (
      id   INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE
    )
  `)

  await db.run(`
    CREATE TABLE IF NOT EXISTS meal_dishes (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      meal_date  TEXT NOT NULL,   -- YYYY-MM-DD
      dish_id    INTEGER NOT NULL,
      UNIQUE(meal_date, dish_id),
      FOREIGN KEY (dish_id) REFERENCES dishes(id) ON DELETE CASCADE
    )
  `)
  if (!(await hasIndex('idx_meal_dishes_date'))) {
    await db.run(`CREATE INDEX idx_meal_dishes_date ON meal_dishes(meal_date)`)
  }
  if (!(await hasIndex('idx_meal_dishes_dish'))) {
    await db.run(`CREATE INDEX idx_meal_dishes_dish ON meal_dishes(dish_id)`)
  }

  await db.run(`
    CREATE TABLE IF NOT EXISTS dish_feedback (
      id            INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id       INTEGER NOT NULL,                 -- users.id
      meal_dish_id  INTEGER NOT NULL,                 -- meal_dishes.id
      like_flag     INTEGER,                          -- -1/0/+1
      salt_level    INTEGER,                          -- -1/0/+1/+2
      temp_level    INTEGER,                          -- -1/0/+1
      portion_level INTEGER,                          -- -1/0/+1
      texture_level INTEGER,                          -- -1/0/+1
      keep_text     TEXT,
      improve_text  TEXT,
      created_at    TEXT DEFAULT CURRENT_TIMESTAMP,
      UNIQUE(user_id, meal_dish_id),
      FOREIGN KEY (user_id)      REFERENCES users(id)         ON DELETE CASCADE,
      FOREIGN KEY (meal_dish_id) REFERENCES meal_dishes(id)   ON DELETE CASCADE
    )
  `)
  if (!(await hasIndex('idx_feedback_meal'))) {
    await db.run(`CREATE INDEX idx_feedback_meal ON dish_feedback(meal_dish_id)`)
  }
  if (!(await hasIndex('idx_feedback_user'))) {
    await db.run(`CREATE INDEX idx_feedback_user ON dish_feedback(user_id)`)
  }

  // ──────────────────────────
  // 6) post_images (게시글 이미지)
  // ──────────────────────────
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
      FOREIGN KEY (post_id) REFERENCES posts(id) ON DELETE CASCADE
    )
  `)
  if (!(await hasIndex('idx_post_images_post_id'))) {
    await db.run(`CREATE INDEX idx_post_images_post_id ON post_images(post_id)`)
  }
  if (!(await hasIndex('idx_post_images_post_id_order'))) {
    await db.run(`CREATE INDEX idx_post_images_post_id_order ON post_images(post_id, sort_order)`)
  }

  // ──────────────────────────
  // 7) favorites (즐겨찾기)
  //    - 1인 1글 1회 (UNIQUE(user_id, post_id))
  // ──────────────────────────
  await db.run(`
    CREATE TABLE IF NOT EXISTS favorites (
      id         INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id    INTEGER NOT NULL,     -- users.id
      post_id    INTEGER NOT NULL,     -- posts.id
      created_at TEXT NOT NULL DEFAULT (datetime('now','localtime')),
      UNIQUE(user_id, post_id),
      FOREIGN KEY (user_id) REFERENCES users(id)  ON DELETE CASCADE,
      FOREIGN KEY (post_id) REFERENCES posts(id)  ON DELETE CASCADE
    )
  `)
  if (!(await hasIndex('idx_favorites_user'))) {
    await db.run(`CREATE INDEX idx_favorites_user ON favorites(user_id)`)
  }
  if (!(await hasIndex('idx_favorites_post'))) {
    await db.run(`CREATE INDEX idx_favorites_post ON favorites(post_id)`)
  }

  console.log('✅ 스키마/마이그레이션 완료')

  // ──────────────────────────
  // (선택) 개발용 시드 데이터 한 번만 주입
  // ──────────────────────────
  const userCount = (await db.get(`SELECT COUNT(*) AS c FROM users`))?.c || 0
  if (userCount === 0) {
    await db.run(`
      INSERT INTO users (student_id, name, user_id, password)
      VALUES ('2025-0001', '테스트', 'testuser', 'hash');
    `)
    console.log('🌱 users 시드 주입 완료')
  }

  const postCount = (await db.get(`SELECT COUNT(*) AS c FROM posts`))?.c || 0
  if (postCount === 0) {
    await db.run(`
      INSERT INTO posts (title, content, tag, author, studentId)
      VALUES ('첫 글', '안녕하세요! 첫 글입니다.', '공지', '테스트', '2025-0001');
    `)
    console.log('🌱 posts 시드 주입 완료')
  }
}

// 초기화(서버에서 await 가능)
db.ready = (async () => {
  try {
    await ensureSchema()
  } catch (e) {
    console.error('스키마 초기화 에러:', e)
  }
})()

module.exports = db
