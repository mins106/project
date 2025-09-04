<template>
  <div class="day-panel">
    <div v-if="loading" class="muted">불러오는 중…</div>
    <div v-else-if="error" class="error">{{ error }}</div>

    <div v-else>
      <div v-if="dishes.length === 0" class="muted">메뉴 데이터가 없어요.</div>

      <div v-for="d in dishes" :key="d.mealDishId" class="dish-card">
        <!-- 헤더 -->
        <div class="dp-header">
          <h3 class="dp-title">{{ d.dish }}</h3>
        </div>

        <!-- 비율(숫자만) -->
        <div class="dp-ratio" v-if="statFor(d.mealDishId)">
          <div class="dp-ratio-legend">
            <span>👍 {{ statFor(d.mealDishId).ratio.like }}%</span>
            <span>😐 {{ statFor(d.mealDishId).ratio.neutral }}%</span>
            <span>👎 {{ statFor(d.mealDishId).ratio.dislike }}%</span>
          </div>
        </div>

        <!-- ✅ 미니 미터 -->
        <div v-if="statFor(d.mealDishId)" class="dp-meters">
          <MetricPill
            icon="🧂"
            label="짠맛"
            :value="statFor(d.mealDishId).averages.salt"
          />
          <MetricPill
            icon="🥄"
            label="양"
            :value="statFor(d.mealDishId).averages.portion"
          />
          <MetricPill
            icon="🌡️"
            label="온도"
            :value="statFor(d.mealDishId).averages.temp"
          />
          <MetricPill
            icon="🌶️"
            label="맵기"
            :value="statFor(d.mealDishId).averages.texture"
          />
        </div>

        <!-- 리뷰 카드 -->
        <div class="dp-review">
          <MealReviewCard
            :meal-dish-id="d.mealDishId"
            :dish-name="d.dish"
            :date-ymd="dateYmd"
            @submitted="onSubmitted"
          />
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import MealReviewCard from "@/components/MealReviewCard.vue";
import MetricPill from "@/components/MetricPill.vue";

export default {
  name: "DayMealPanel",
  components: {
    MealReviewCard,
    // 소형 지표 컴포넌트
    MetricPill,
  },
  props: { dateYmd: { type: String, required: true } },
  data() {
    return { loading: true, dishes: [], summary: [], error: "" };
  },
  async mounted() {
    await this.load();
  },
  methods: {
    async load() {
      this.loading = true;
      this.error = "";
      try {
        const [a, b] = await Promise.all([
          fetch(`/api/meals/${this.dateYmd}`).then((r) => r.json()),
          fetch(`/api/meals/${this.dateYmd}/summary`).then((r) => r.json()),
        ]);
        this.dishes = a.dishes || [];
        this.summary = b.summary || [];
      } catch (e) {
        console.error(e);
        this.error = "불러오기 실패";
      } finally {
        this.loading = false;
      }
    },
    onSubmitted() {
      this.load();
      this.$emit("refresh");
    },
    statFor(id) {
      return this.summary.find((s) => s.mealDishId === id);
    },
  },
};
</script>

<style scoped>
.day-panel {
  background: #f7f9ff;
  border: 1px solid #e7ecf7;
  border-radius: 16px;
  padding: 18px;
}

.dish-card {
  background: #fff;
  border: 1px solid #edf1fa;
  border-radius: 14px;
  padding: 16px;
  box-shadow: 0 6px 14px rgba(33, 56, 125, 0.06);
  margin-bottom: 16px;
}

/* 헤더 */
.dp-header {
  display: flex;
  align-items: center;
  gap: 10px;
}

.dp-title {
  margin: 0;
  font-size: 18px;
  font-weight: 800;
  color: #1e2a44;
  letter-spacing: 0.2px;
}

/* 비율(숫자만) */
.dp-ratio {
  margin: 10px 0 6px;
}

.dp-ratio-legend {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #5c6787;
  margin-top: 6px;
}

/* 미터 */
.dp-meters {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin: 10px 0 12px;
}

@media (max-width: 480px) {
  .dp-meters {
    grid-template-columns: 1fr;
  }
}

.pill {
  position: relative;
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 12px;
  border-radius: 14px;
  border: 1px solid var(--bd, #e6eaf2);
  background: var(--bg, #f7f9ff);
  box-shadow: 0 4px 10px rgba(33, 56, 125, 0.06) inset;
}

.pill-icon {
  font-size: 16px;
  line-height: 1;
}

.pill-label {
  font-weight: 800;
  color: #1e2a44;
}

.pill-value {
  margin-left: auto;
  font-weight: 800;
  color: #1e2a44;
}

/* 트랙 */
.track {
  position: relative;
  height: 6px;
  width: 120px;
  margin-left: 8px;
  border-radius: 999px;
  background: #eef2f8;
}

.dot {
  position: absolute;
  top: 50%;
  width: 10px;
  height: 10px;
  border-radius: 50%;
  transform: translate(-50%, -50%);
  background: currentColor;
  box-shadow: 0 0 0 2px rgba(255, 255, 255, 0.9);
}

.tick {
  position: absolute;
  top: 50%;
  width: 2px;
  height: 6px;
  background: #d8deea;
  transform: translateY(-50%);
  opacity: 0.8;
}

.tick.t-0 {
  left: 0%;
}

.tick.t-mid {
  left: 50%;
}

.tick.t-1 {
  right: 0%;
}

/* 색 테마 (요구사항 반영) */
.pill.good {
  --bg: #e8f6ef;
  --bd: #cfead9;
  color: #1c6c3d;
}

/* 0 */
.pill.mid {
  --bg: #fdf5df;
  --bd: #ffe2a9;
  color: #7a4e12;
}

/* -1~1 사이(0 제외) */
.pill.bad {
  --bg: #ffe8e8;
  --bd: #ffd3d3;
  color: #8a2020;
}

/* <=-1, >=1 */
.pill.neutral {
  --bg: #f3f5f9;
  --bd: #e6eaf2;
  color: #6a748b;
}

/* 값 없음 */

.dp-review {
  margin-top: 10px;
}

.muted {
  color: #7b849a;
  font-size: 14px;
}

.error {
  color: #c0392b;
  font-size: 14px;
}
</style>
