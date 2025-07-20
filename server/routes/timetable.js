const express = require('express');
const router = express.Router();
const Comcigan = require('comcigan-parser');

const comcigan = new Comcigan();

router.get('/', async (req, res) => {
  const { grade, classNum, date } = req.query;

  try {
    // 1. 학교 데이터 로드 (한 번만 하면 됨. 서버 시작 시 미리 해두는 것도 가능)
    await comcigan.load();

    // 2. 학교 검색
    const schoolName = "동백중학교"; // 네가 원하는 학교명
    const schoolId = await comcigan.searchSchool(schoolName);
    await comcigan.setSchool(schoolId);

    // 3. 시간표 불러오기
    const timetable = await comcigan.getTimetable(); // 전체 학년 시간표
    const weekTable = timetable[grade][classNum];    // [월~금][교시] 형태

    // 4. 날짜 정보로 해당 요일 추출
    const jsDate = parseDateString(date); // "20240720" → JS Date
    const weekday = jsDate.getDay();      // 일:0 ~ 토:6

    if (weekday < 1 || weekday > 5) {
      return res.json({ timetable: [] }); // 주말은 공강
    }

    const todaySubjects = weekTable[weekday - 1]; // 0~4 인덱스

    res.json({ timetable: todaySubjects });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: '시간표를 가져오는 중 오류 발생' });
  }
});

// "20240720" → Date 객체
function parseDateString(yyyymmdd) {
  const y = parseInt(yyyymmdd.slice(0, 4), 10);
  const m = parseInt(yyyymmdd.slice(4, 6), 10) - 1;
  const d = parseInt(yyyymmdd.slice(6, 8), 10);
  return new Date(y, m, d);
}

module.exports = router;