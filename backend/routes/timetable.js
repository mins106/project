const express = require('express');
const router = express.Router();
const Timetable = require('comcigan-parser');

const tt = new Timetable();

// 경기 동백중 코드 고정
const DONGBAEK_CODE = 64562;

// init을 한 번만 수행하도록 Promise로 보호
let readyPromise = null;

function ensureReady() {
  if (!readyPromise) {
    readyPromise = (async () => {
      await tt.init({ cache: 1000 * 60 * 10 });
      tt.setSchool(DONGBAEK_CODE);
      console.log('[TT] init done. school=', DONGBAEK_CODE);
    })().catch(err => {
      // 실패 시 다시 시도할 수 있게 초기화
      readyPromise = null;
      throw err;
    });
  }
  return readyPromise;
}

const toInt = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};

function parseYMD(ymd) {
  const y = ymd.slice(0, 4);
  const m = ymd.slice(4, 6);
  const d = ymd.slice(6, 8);
  return new Date(`${y}-${m}-${d}T00:00:00`);
}

router.get('/', async (req, res) => {
  try {
    const { grade, classNum, date } = req.query;
    const g = toInt(grade);
    const c = toInt(classNum);

    if (!g || !c || !date || date.length !== 8) {
      return res.status(400).json({ error: 'grade, classNum, date(yyyymmdd) 필요' });
    }

    // 범위 검증 (1,2학년 1~13 / 3학년 1~11)
    const maxClass = g === 3 ? 11 : 13;
    if (g < 1 || g > 3 || c < 1 || c > maxClass) {
      return res.status(400).json({ error: '유효하지 않은 학년/반' });
    }

    // 준비 (단일 초기화)
    await ensureReady();

    const dt = parseYMD(date);
    const wd = dt.getDay(); // 0(일)~6(토)
    if (wd === 0 || wd === 6) {
      return res.json({ timetable: [], message: '주말에는 수업이 없습니다.' });
    }
    const dayIdx = wd - 1; // 월~금 -> 0~4

    // **중요**: 라이브러리 내부 구조가 0‑based일 수 있음
    const gIdx = g - 1;
    const cIdx = c - 1;

    const full = await tt.getTimetable();

    // 구조 탐색(배열/객체 모두 커버)
    const byGrade =
      (Array.isArray(full) ? full[gIdx] : (full[g] || full[String(g)] || full[gIdx])) ?? null;
    if (!byGrade) {
      console.warn(`[TT] gradeTable null. g=${g} (gIdx=${gIdx}) keys=${Object.keys(full || {})}`);
      return res.json({ timetable: [] });
    }

    const byClass =
      (Array.isArray(byGrade) ? byGrade[cIdx] : (byGrade[c] || byGrade[String(c)] || byGrade[cIdx])) ?? null;
    if (!byClass) {
      console.warn(`[TT] classTable null. g=${g}, c=${c} (cIdx=${cIdx})`);
      return res.json({ timetable: [] });
    }

    const today = byClass[dayIdx] || [];
    if (!Array.isArray(today) || today.length === 0) {
      console.warn(`[TT] empty day. g=${g}, c=${c}, dayIdx=${dayIdx}`);
      return res.json({ timetable: [] });
    }

    // 항목 포맷 정규화
    const subjects = today.map(x => {
      if (typeof x === 'string') return x;
      if (x && typeof x === 'object') return x.subject || x.name || x.title || '';
      return '';
    });

    res.json({ timetable: subjects });
  } catch (err) {
    console.error('시간표 가져오기 실패:', err);
    res.status(500).json({ error: '시간표 가져오기 실패' });
  }
});

module.exports = router;