const express = require('express');
const axios = require('axios');
const router = express.Router();

// NEIS API 설정
const NEIS_KEY = 'dcfb8b0b9566467990aaaef78f1ff519';
const EDU_CODE = 'J10';         // 경기도교육청
const SCHOOL_CODE = '7751196';  // 동백중학교

// 주간 급식 조회
router.get('/week', async (req, res) => {
    const from = req.query.from || formatDate(new Date());
    const to = req.query.to || formatDate(addDays(new Date(), 6));

    console.log("📡 백엔드 급식 요청:", { from, to });

    const url = `https://open.neis.go.kr/hub/mealServiceDietInfo?KEY=${NEIS_KEY}&ATPT_OFCDC_SC_CODE=${EDU_CODE}&SD_SCHUL_CODE=${SCHOOL_CODE}&MLSV_FROM_YMD=${from}&MLSV_TO_YMD=${to}&Type=json`;

    try {
        const response = await axios.get(url);
        const info = response.data.mealServiceDietInfo;

        // 응답 형식 확인
        const rows = Array.isArray(info) ? info[1]?.row || [] : info?.row || [];
        console.log("🍽️ NEIS 데이터 개수:", rows.length);

        // 급식 데이터를 날짜별로 정리
        const mealMap = new Map();
        rows.forEach(item => {
            mealMap.set(item.MLSV_YMD, {
                date: item.MLSV_YMD,
                menu: item.DDISH_NM?.replace(/<br\/?>/g, '\n') || '',
                cal: item.CAL_INFO?.replace(/\s/g, '').replace('kcal', 'Kcal') || '',
            });
        });

        // 월~금에 해당하는 날짜만 필터링해서 결과 생성
        const result = [];
        let curr = parseDate(from);
        const end = parseDate(to);

        while (curr <= end) {
            const key = formatDate(curr);
            const day = curr.getDay(); // 0(일) ~ 6(토)
            if (day >= 1 && day <= 5) {
                result.push(mealMap.get(key) || { date: key, menu: null, cal: null });
            }
            curr.setDate(curr.getDate() + 1);
        }

        res.json(result);
    } catch (err) {
        console.error("❌ 급식 데이터 오류:", err.message);
        res.status(500).json({ error: '급식 데이터를 가져오지 못했습니다.' });
    }
});

// 날짜 포맷 함수: YYYYMMDD
function formatDate(date) {
    return date.toISOString().split('T')[0].replace(/-/g, '');
}

// YYYYMMDD → Date 객체
function parseDate(yyyymmdd) {
    return new Date(`${yyyymmdd.slice(0, 4)}-${yyyymmdd.slice(4, 6)}-${yyyymmdd.slice(6, 8)}`);
}

// 일수 추가
function addDays(date, days) {
    const d = new Date(date);
    d.setDate(d.getDate() + days);
    return d;
}

module.exports = router;