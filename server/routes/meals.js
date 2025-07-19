const express = require('express');
const axios = require('axios');
const router = express.Router();

const NEIS_KEY = 'dcfb8b0b9566467990aaaef78f1ff519';
const EDU_CODE = 'J10';         // 경기도교육청
const SCHOOL_CODE = '7530568';  // 동백중학교

router.get('/week', async (req, res) => {
    const from = req.query.from || formatDate(new Date());
    const to = req.query.to || formatDate(addDays(new Date(), 6));
    console.log("백엔드 요청 도착! from:", from, "to:", to);

    const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${NEIS_KEY}&ATPT_OFCDC_SC_CODE=${EDU_CODE}&SD_SCHUL_CODE=${SCHOOL_CODE}&MLSV_FROM_YMD=${from}&MLSV_TO_YMD=${to}&Type=json`;

    try {
        const response = await axios.get(url);
        console.log(JSON.stringify(response.data, null, 2)); // 여기!

        const rows = response.data.mealServiceDietInfo?.[1]?.row || [];

        // 급식 날짜 맵핑
        const mealMap = new Map();
        rows.forEach(item => {
            mealMap.set(item.MLSV_YMD, {
                date: item.MLSV_YMD,
                menu: item.DDISH_NM.replace(/<br\/?>/g, '\n'),
                cal: item.CAL_INFO.replace(/\s/g, '').replace('kcal', 'Kcal'),
            });
        });

        // from ~ to 사이 날짜 전부 생성
        let currDate = parseDate(from);
        const endDate = parseDate(to);
        const result = [];

        while (currDate <= endDate) {
            const key = formatDate(currDate);
            result.push(mealMap.get(key) || { date: key, menu: null, cal: null });

            // 날짜 객체 복제하면서 다음 날로 이동 (누적 오류 방지)
            currDate = addDays(currDate, 1);
        }

        console.log("급식 최종 반환 데이터:", result);
        res.json(result);
    } catch (error) {
        console.error('급식 정보 불러오기 실패:', error.message);
        res.status(500).json({ error: '급식 데이터를 가져오지 못했습니다.' });
    }
});

function formatDate(date) {
    return date.toISOString().split('T')[0].replace(/-/g, '');
}
function parseDate(yyyymmdd) {
    return new Date(`${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`);
}
function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

module.exports = router;
