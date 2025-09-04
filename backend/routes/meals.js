// backend/routes/meals.js
const express = require('express');
const axios = require('axios');
const router = express.Router();
const db = require('../db/database'); // promisified sqlite3 (run/get/all)

// NEIS API 설정
const NEIS_KEY = 'dcfb8b0b9566467990aaaef78f1ff519';
const EDU_CODE = 'J10';         // 경기도교육청
const SCHOOL_CODE = '7751196';  // 동백중학교

// ──────────────────────────────────────────────────────────────
// 로그인 강제 미들웨어 (세션/패스포트 둘 다 지원)
function requireLogin(req, res, next) {
  const user = req.session?.user || req.user || null;
  if (!user || !user.id) return res.status(401).json({ error: '로그인이 필요합니다.' });
  req._userId = user.id;
  next();
}

// 유니크 인덱스 보장: (user_id, meal_dish_id) 1 계정 1회(재제출 = 덮어쓰기)
let _uniqueEnsured = false;
async function ensureUserUniqueIndex() {
  if (_uniqueEnsured) return;
  await db.run(`
    CREATE UNIQUE INDEX IF NOT EXISTS ux_df_user_meal
    ON dish_feedback(user_id, meal_dish_id)
  `);
  _uniqueEnsured = true;
}

// ──────────────────────────────────────────────────────────────
// 유틸: 날짜 포맷/파싱
function formatDate(date) {
  return date.toISOString().split('T')[0].replace(/-/g, '');
}
function onlyYmd(str) {
  return String(str || '').replace(/[^\d]/g, '').slice(0, 8);
}
function parseDate(yyyymmdd) {
  const s = onlyYmd(yyyymmdd);
  return new Date(`${s.slice(0, 4)}-${s.slice(4, 6)}-${s.slice(6, 8)}`);
}
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

// NEIS 한 주 조회 URL
function neisWeekUrl(from, to) {
  return `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${NEIS_KEY}&ATPT_OFCDC_SC_CODE=${EDU_CODE}&SD_SCHUL_CODE=${SCHOOL_CODE}&MLSV_FROM_YMD=${from}&MLSV_TO_YMD=${to}&Type=json`;
}

// 메뉴명 정규화(숫자 라벨/알레르기번호/별표 등 제거)
function normalizeDishName(raw) {
  if (!raw) return '';
  let s = String(raw).trim();

  // 줄 앞 번호/원형 숫자 제거
  s = s.replace(/^\s*\d+\.\s*/g, '').replace(/^\s*[①-⑳]\s*/g, '');

  // (1.2.5) / (1,2,5) 형태의 알레르기 번호 제거
  s = s.replace(/\((?:\s*\d+[.,]?\s*)+\)/g, '');

  // 태그/별표/중복공백
  s = s.replace(/<br\/?>/gi, ' ')
    .replace(/[＊*]/g, '')
    .replace(/\s{2,}/g, ' ')
    .trim();

  // 꼬리 구두점 제거
  s = s.replace(/[.,;:]\s*$/, '').trim();

  return s;
}

// DDISH_NM 문자열을 행 단위 배열로 분리
function splitNeisMenus(ddishNm) {
  if (!ddishNm) return [];
  const text = String(ddishNm).replace(/<br\/?>/gi, '\n');
  return text
    .split('\n')
    .map((x) => normalizeDishName(x))
    .filter((x) => x && x.length > 0);
}

// 날짜의 meal_dishes가 비어있으면 NEIS에서 동기화
async function ensureMealsForDate(dateYmd) {
  const ymd = onlyYmd(dateYmd);
  const existing = await db.get(
    `SELECT COUNT(*) AS cnt FROM meal_dishes WHERE meal_date = ?`,
    [ymd]
  );
  if (existing && existing.cnt > 0) return; // 이미 있음

  const url = neisWeekUrl(ymd, ymd);
  const resp = await axios.get(url);
  const info = resp.data.mealServiceDietInfo;
  const rows = Array.isArray(info) ? (info[1]?.row || []) : (info?.row || []);

  const menus = [];
  rows.forEach((item) => {
    if (item.MLSV_YMD === ymd) {
      menus.push(...splitNeisMenus(item.DDISH_NM));
    }
  });

  if (menus.length === 0) return; // 해당 날짜 급식 없음

  for (const name of menus) {
    try {
      await db.run(`INSERT OR IGNORE INTO dishes(name) VALUES (?)`, [name]);
      const dishRow = await db.get(`SELECT id FROM dishes WHERE name=?`, [name]);
      if (dishRow?.id) {
        await db.run(
          `INSERT OR IGNORE INTO meal_dishes(meal_date, dish_id) VALUES (?, ?)`,
          [ymd, dishRow.id]
        );
      }
    } catch (e) {
      console.error('dish upsert error:', name, e.message);
    }
  }
}

// ──────────────────────────────────────────────────────────────
// (기존) 주간 급식 조회: 월~금만 반환
// GET /api/meals/week?from=YYYYMMDD&to=YYYYMMDD
router.get('/week', async (req, res) => {
  const from = onlyYmd(req.query.from) || formatDate(new Date());
  const to = onlyYmd(req.query.to) || formatDate(addDays(new Date(), 6));
  console.log('📡 백엔드 급식 요청:', { from, to });

  try {
    const response = await axios.get(neisWeekUrl(from, to));
    const info = response.data.mealServiceDietInfo;
    const rows = Array.isArray(info) ? info[1]?.row || [] : info?.row || [];
    console.log('🍽️ NEIS 데이터 개수:', rows.length);

    const mealMap = new Map();
    rows.forEach((item) => {
      mealMap.set(item.MLSV_YMD, {
        date: item.MLSV_YMD,
        menu: item.DDISH_NM?.replace(/<br\/?>/g, '\n') || '',
        cal: item.CAL_INFO?.replace(/\s/g, '').replace('kcal', 'Kcal') || '',
      });
    });

    const result = [];
    let curr = parseDate(from);
    const end = parseDate(to);

    while (curr <= end) {
      const key = formatDate(curr);
      const day = curr.getDay(); // 0(일)~6(토)
      if (day >= 1 && day <= 5) {
        result.push(mealMap.get(key) || { date: key, menu: null, cal: null });
      }
      curr.setDate(curr.getDate() + 1);
    }

    res.json(result);
  } catch (err) {
    console.error('❌ 급식 데이터 오류:', err.message);
    res.status(500).json({ error: '급식 데이터를 가져오지 못했습니다.' });
  }
});

// ──────────────────────────────────────────────────────────────
// 날짜별 메뉴 목록: 메뉴별 리뷰 입력용
// GET /api/meals/:date   (YYYY-MM-DD 또는 YYYYMMDD)
router.get('/:date', async (req, res) => {
  try {
    const dateParam = onlyYmd(req.params.date);
    await ensureMealsForDate(dateParam);

    const rows = await db.all(
      `
      SELECT md.id AS mealDishId, d.name AS dish
      FROM meal_dishes md
      JOIN dishes d ON d.id = md.dish_id
      WHERE md.meal_date = ?
      ORDER BY d.name
    `,
      [dateParam]
    );

    res.json({ date: dateParam, dishes: rows });
  } catch (e) {
    console.error('GET /:date error', e.message);
    res.status(500).json({ error: '메뉴를 불러오지 못했습니다.' });
  }
});

// 메뉴별 피드백 업서트 (로그인 필수, 계정당 1회 → 재제출 시 덮어쓰기)
// POST /api/meals/:date/feedback
// body: { items: [{ mealDishId, like_flag, salt_level, temp_level, portion_level, texture_level, keep_text, improve_text }] }
router.post('/:date/feedback', requireLogin, async (req, res) => {
  try {
    await ensureUserUniqueIndex();

    const userId = req._userId;
    const { items } = req.body || {};
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: 'items가 비었습니다.' });
    }

    const allow = (v, arr, { required = false } = {}) => {
      if (v === null || v === undefined || v === '') {
        return required ? '__INVALID_REQUIRED__' : null;
      }
      const n = Number(v);
      return Number.isFinite(n) && arr.includes(n) ? n : null;
    };

    // 금칙어 간단 필터
    const badWords = [/욕설1/i, /욕설2/i];
    const clean = (s) => (s || '').trim().slice(0, 500);
    const filterBad = (t) => badWords.reduce((s, re) => s.replace(re, '***'), t);

    const upsertSql = `
      INSERT INTO dish_feedback
      (user_id, meal_dish_id, like_flag, salt_level, temp_level, portion_level, texture_level, keep_text, improve_text)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      ON CONFLICT(user_id, meal_dish_id) DO UPDATE SET
        like_flag=excluded.like_flag,
        salt_level=excluded.salt_level,
        temp_level=excluded.temp_level,
        portion_level=excluded.portion_level,
        texture_level=excluded.texture_level,
        keep_text=excluded.keep_text,
        improve_text=excluded.improve_text
    `;

    await db.run('BEGIN');
    try {
      for (const it of items) {
        const likeFlag = allow(it.like_flag, [-1, 0, 1], { required: true });
        if (likeFlag === '__INVALID_REQUIRED__') {
          throw new Error('like_flag is required');
        }
        const salt = allow(it.salt_level, [-1, 0, 1, 2]);
        const temp = allow(it.temp_level, [-1, 0, 1]);
        const portion = allow(it.portion_level, [-1, 0, 1]);
        const texture = allow(it.texture_level, [-1, 0, 1]);

        await db.run(upsertSql, [
          userId,
          Number(it.mealDishId),
          likeFlag,
          salt, temp, portion, texture,
          filterBad(clean(it.keep_text)),
          filterBad(clean(it.improve_text)),
        ]);
      }
      await db.run('COMMIT');
    } catch (e) {
      await db.run('ROLLBACK');
      if (String(e.message).includes('like_flag is required')) {
        return res.status(400).json({ error: '선호도(like_flag)는 필수입니다.' });
      }
      throw e;
    }

    res.json({ ok: true });
  } catch (e) {
    console.error('POST /:date/feedback error', e.message);
    res.status(500).json({ error: '피드백 저장 실패' });
  }
});

// 공개 요약: 비율/평균만(개인 코멘트 X)
// GET /api/meals/:date/summary
router.get('/:date/summary', async (req, res) => {
  try {
    const dateParam = onlyYmd(req.params.date);
    await ensureMealsForDate(dateParam);

    const rows = await db.all(
      `
      SELECT
        md.id AS mealDishId, d.name AS dish,
        COUNT(df.id) AS n,
        SUM(CASE WHEN df.like_flag =  1 THEN 1 ELSE 0 END) AS like_cnt,
        SUM(CASE WHEN df.like_flag =  0 THEN 1 ELSE 0 END) AS neutral_cnt,
        SUM(CASE WHEN df.like_flag = -1 THEN 1 ELSE 0 END) AS dislike_cnt,
        AVG(df.salt_level)    AS salt_avg,
        AVG(df.temp_level)    AS temp_avg,
        AVG(df.portion_level) AS portion_avg,
        AVG(df.texture_level) AS texture_avg
      FROM meal_dishes md
      JOIN dishes d ON d.id = md.dish_id
      LEFT JOIN dish_feedback df ON df.meal_dish_id = md.id
      WHERE md.meal_date = ?
      GROUP BY md.id
      ORDER BY d.name
    `,
      [dateParam]
    );

    const summary = rows.map((r) => {
      const n = r.n || 0;
      const pct = (x) => (n ? Math.round((x / n) * 100) : 0);
      const round1 = (v) => (v == null ? null : Math.round(v * 10) / 10);
      return {
        mealDishId: r.mealDishId,
        dish: r.dish,
        samples: n,
        ratio: {
          like: pct(r.like_cnt || 0),
          neutral: pct(r.neutral_cnt || 0),
          dislike: pct(r.dislike_cnt || 0),
        },
        averages: {
          salt: round1(r.salt_avg),
          temp: round1(r.temp_avg),
          portion: round1(r.portion_avg),
          texture: round1(r.texture_avg),
        },
      };
    });

    res.json({ date: dateParam, summary });
  } catch (e) {
    console.error('GET /:date/summary error', e.message);
    res.status(500).json({ error: '요약을 불러오지 못했습니다.' });
  }
});

// 관리자 코멘트 열람(비공개 + 필터)
// GET /api/meals/:date/admin/comments?dish=불고기&flag=1
router.get('/:date/admin/comments', async (req, res) => {
  try {
    const admin = req.session?.user?.isAdmin || req.user?.isAdmin;
    if (!admin) return res.status(403).json({ error: 'forbidden' });

    const dateParam = onlyYmd(req.params.date);
    const { dish, flag } = req.query;

    const rows = await db.all(
      `
      SELECT d.name AS dish, df.like_flag, df.keep_text, df.improve_text, df.created_at
      FROM meal_dishes md
      JOIN dishes d ON d.id = md.dish_id
      JOIN dish_feedback df ON df.meal_dish_id = md.id
      WHERE md.meal_date = ?
        AND (? IS NULL OR d.name = ?)
        AND (? IS NULL OR df.like_flag = ?)
      ORDER BY d.name, df.created_at DESC
    `,
      [dateParam, dish || null, dish || null, flag ?? null, flag ?? null]
    );

    res.json({ date: dateParam, comments: rows });
  } catch (e) {
    console.error('GET /:date/admin/comments error', e.message);
    res.status(500).json({ error: '코멘트를 불러오지 못했습니다.' });
  }
});

module.exports = router;