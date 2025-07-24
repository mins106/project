const express = require('express');
const router = express.Router();
const Timetable = require('comcigan-parser');

const timetable = new Timetable();
let isReady = false;

router.get('/', async (req, res) => {
  const { grade, classNum, date } = req.query;
  if (!grade || !classNum || !date)
    return res.status(400).json({ error: 'grade, classNum, date는 필수입니다.' });

  const parsedDate = new Date(`${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`);
  const weekday = parsedDate.getDay();
  if (weekday === 0 || weekday === 6)
    return res.json({ timetable: [], message: '주말에는 수업이 없습니다.' });

  try {
    if (!isReady) {
      await timetable.init({ cache: 1000 * 60 * 10 });

      // ⬇ 동백중학교 코드 직접 지정
      const dongbaekCode = 64562;
      timetable.setSchool(dongbaekCode);

      isReady = true;
    }

    const full = await timetable.getTimetable();
    const todaySubjects = full[parseInt(grade)][parseInt(classNum)][weekday - 1] || [];

    if (todaySubjects.length === 0) {
      return res.json({ timetable: [], message: '오늘은 수업이 없어요.' });
    }

    res.json({
      timetable: todaySubjects.map(x => x.subject),
    });
  } catch (err) {
    console.error('시간표 가져오기 실패:', err);
    res.status(500).json({ error: '시간표 가져오기 실패' });
  }
});

module.exports = router;