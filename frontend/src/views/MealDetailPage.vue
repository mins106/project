<template>
  <div class="meal-detail">
    <button class="back-btn" @click="$router.back()">← 돌아가기</button>
    <h2>{{ formatDate(dateYmd) }} 급식</h2>

    <DayMealPanel :date-ymd="dateYmd" />
  </div>
</template>

<script>
import DayMealPanel from "@/components/DayMealPanel.vue";

export default {
  name: "MealDetailPage",
  components: { DayMealPanel },
  props: { date: { type: String, required: true } },
  computed: {
    dateYmd() {
      return this.date;
    },
  },
  methods: {
    formatDate(s) {
      return `${s.slice(0, 4)}년 ${+s.slice(4, 6)}월 ${+s.slice(6, 8)}일`;
    },
  },
};
</script>

<style scoped>
.meal-detail {
  padding: 20px;
  max-width: 800px;
  margin: auto;
}

.back-btn {
  background: none;
  border: none;
  color: #4b2aad;
  font-weight: 600;
  margin-bottom: 10px;
  cursor: pointer;
}
</style>
