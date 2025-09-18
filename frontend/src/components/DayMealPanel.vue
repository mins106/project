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

        <!-- 👍😐👎 비율 -->
        <!-- 👍😐👎 비율 + 세부평균칩 같이 묶기 -->
        <div v-if="statFor(d.mealDishId)" class="dp-stats">
          <span title="좋아요 비율"
            >👍 {{ statFor(d.mealDishId).ratio.like }}%</span
          >
          <span title="보통 비율"
            >😐 {{ statFor(d.mealDishId).ratio.neutral }}%</span
          >
          <span title="싫어요 비율"
            >👎 {{ statFor(d.mealDishId).ratio.dislike }}%</span
          >

          <MiniStat
            icon="🧂"
            :value="toScore5(statFor(d.mealDishId).averages.salt)"
            help="짠맛 (평균 1~5)"
          />
          <MiniStat
            icon="🥄"
            :value="toScore5(statFor(d.mealDishId).averages.portion)"
            help="양 (평균 1~5)"
          />
          <MiniStat
            icon="🌡️"
            :value="toScore5(statFor(d.mealDishId).averages.temp)"
            help="온도 (평균 1~5)"
          />
          <MiniStat
            icon="🌶️"
            :value="toScore5(statFor(d.mealDishId).averages.texture)"
            help="맵기 (평균 1~5)"
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
import MiniStat from "@/components/MiniStat.vue";

export default {
  name: "DayMealPanel",
  components: { MealReviewCard, MiniStat },
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
    // -1~1 평균값을 1~5로 보이게 변환 (-1→1, 0→3, 1→5)
    toScore5(avg) {
      if (avg === null || avg === undefined || Number.isNaN(+avg)) return null;
      return +avg * 2 + 3;
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

.dp-stats {
  display: flex;
  flex-wrap: wrap;
  gap: 10px;
  margin: 8px 0 12px;
  font-size: 14px;
  font-weight: 700;
  color: #1e2a44;
}
.dp-stats span {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  background: #f7f9ff;
  padding: 4px 10px;
  border-radius: 8px;
}

/* 이모지 칩 행 */
.dp-minis {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
  margin: 8px 0 12px;
}

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
