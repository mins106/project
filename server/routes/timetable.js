const express = require('express');
const router = express.Router();
const Comcigan = require('comcigan-parser');

const comcigan = new Comcigan();

let schoolId = null;
let schoolSet = false;

// 날짜 파싱 유틸
function parseDateString(yyyymmdd) {
  const y = parseInt(yyyymmdd.slice(0, 4), 10);
  const m = parseInt(yyyymmdd.slice(4, 6), 10) - 1;
  const d = parseInt(yyyymmdd.slice(6, 8), 10);
  return new Date(y, m, d);
}

router.get('/', async (req, res) => {
  const { grade, classNum, date } = req.query;

  if (!grade || !classNum || !date) {
    return res.status(400).json({ error: "grade, classNum, date는 필수입니다." });
  }

  const parsedGrade = parseInt(grade, 10);
  const parsedClass = parseInt(classNum, 10);
  const parsedDate = parseDateString(date);
  const weekday = parsedDate.getDay(); // 0(일)~6(토)

  if (weekday === 0 || weekday === 6) {
    return res.json({ timetable: [] }); // 주말은 공강
  }

  try {
    if (!schoolSet) {
      schoolId = await comcigan.searchSchool("동백중학교");
      if (!schoolId) throw new Error("학교 ID를 찾을 수 없습니다.");
      await comcigan.setSchool(schoolId);
      schoolSet = true;
    }

    const fullTimetable = await comcigan.getTimetable(); // 전체 시간표
    const weekTimetable = fullTimetable?.[parsedGrade]?.[parsedClass];

    if (!weekTimetable) {
      return res.json({ timetable: [] });
    }

    const todaySubjects = weekTimetable[weekday - 1]; // 월~금 (0~4)

    res.json({ timetable: todaySubjects || [] });
  } catch (err) {
    console.error("시간표 가져오기 실패:", err);
    res.status(500).json({ error: "시간표를 가져오는 중 오류가 발생했습니다." });
  }
});

module.exports = router;
