<!-- src/components/MealReviewCard.vue -->
<template>
  <div class="mrc-card">
    <!-- 선호도: 이모지 + 툴팁 -->
    <div class="mrc-like">
      <button
        class="seg"
        :class="{ active: likeFlag === 1 }"
        @click="likeFlag = 1"
        title="좋아요"
      >
        👍 좋아요
      </button>
      <button
        class="seg"
        :class="{ active: likeFlag === 0 }"
        @click="likeFlag = 0"
        title="보통"
      >
        😐 보통
      </button>
      <button
        class="seg"
        :class="{ active: likeFlag === -1 }"
        @click="likeFlag = -1"
        title="싫어요"
      >
        👎 싫어요
      </button>
    </div>

    <!-- 세부평가(선택, 1~5점) -->
    <details class="mrc-details">
      <summary>세부 평가(선택)</summary>
      <div class="mrc-grid">
        <FiveScale label="짠맛" v-model="salt5" />
        <FiveScale label="양" v-model="portion5" />
        <FiveScale label="온도" v-model="temp5" />
        <FiveScale label="맵기" v-model="spicy5" />
      </div>

      <div class="mrc-texts">
        <textarea
          v-model="keepText"
          class="softarea"
          placeholder="좋았던 점 (선택)"
        />
        <textarea
          v-model="improveText"
          class="softarea"
          placeholder="개선 제안 (가능하면 구체적으로)"
        />
      </div>
    </details>

    <div class="mrc-submit">
      <button
        class="primary"
        @click="submit"
        :disabled="!canSubmit"
        :aria-busy="submitting ? 'true' : 'false'"
      >
        {{ submitting ? "제출 중…" : "제출" }}
      </button>
    </div>
  </div>
</template>

<script>
import FiveScale from "@/components/FiveScale.vue";

export default {
  name: "MealReviewCard",
  components: { FiveScale },
  props: {
    mealDishId: { type: Number, required: true },
    dishName: { type: String, required: true },
    dateYmd: { type: String, default: null },
  },
  data() {
    return {
      likeFlag: null,
      salt5: null,
      portion5: null,
      temp5: null,
      spicy5: null,
      keepText: "",
      improveText: "",
      submitting: false,
    };
  },
  computed: {
    canSubmit() {
      return this.likeFlag !== null && !this.submitting;
    },
  },
  methods: {
    scoreToLevel(s) {
      if (s == null) return null;
      if (s <= 2) return -1;
      if (s === 3) return 0;
      return 1;
    },
    async submit() {
      if (this.likeFlag === null) return;
      const ymd = this.dateYmd || (this.$route?.params?.date ?? "").toString();
      if (!ymd) {
        alert("날짜 정보가 없어요.");
        return;
      }

      this.submitting = true;
      try {
        const payload = {
          items: [
            {
              mealDishId: this.mealDishId,
              like_flag: this.likeFlag,
              // (신규) 1~5 점수
              salt_score: this.salt5,
              portion_score: this.portion5,
              temp_score: this.temp5,
              spicy_score: this.spicy5,
              // (구버전 호환) -1/0/1 level
              salt_level: this.scoreToLevel(this.salt5),
              portion_level: this.scoreToLevel(this.portion5),
              temp_level: this.scoreToLevel(this.temp5),
              texture_level: this.scoreToLevel(this.spicy5),
              keep_text: this.keepText,
              improve_text: this.improveText,
            },
          ],
        };

        const res = await fetch(`/api/meals/${ymd}/feedback`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify(payload),
        });

        if (res.status === 401) {
          alert("로그인이 필요해요.");
          this.$router.push({
            name: "Login",
            query: { redirect: this.$route.fullPath },
          });
          return;
        }
        if (!res.ok) throw new Error(`HTTP ${res.status}`);

        this.$emit("submitted", this.mealDishId);
        this.salt5 = this.portion5 = this.temp5 = this.spicy5 = null;
        this.keepText = this.improveText = "";
      } catch (e) {
        console.error(e);
        alert("제출 실패");
      } finally {
        this.submitting = false;
      }
    },
  },
};
</script>

<style scoped>
/* 기존 스타일 대부분 유지 */
.mrc-card {
  border: 1px solid #e9eef8;
  border-radius: 14px;
  padding: 14px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(40, 63, 140, 0.06);
}

.mrc-like {
  display: flex;
  gap: 8px;
  margin: 8px 0 10px;
}

.seg {
  border: 1px solid #d9e2f1;
  background: #f7f9fe;
  color: #2b3a55;
  padding: 8px 12px;
  border-radius: 10px;
  font-weight: 700;
}

.seg.active {
  background: #3b6dff;
  color: #fff;
  border-color: #3b6dff;
}

.mrc-details {
  margin: 6px 0 10px;
}

.mrc-details summary {
  list-style: none;
  cursor: pointer;
  user-select: none;
  color: #3b6dff;
  font-weight: 700;
}

.mrc-details summary::-webkit-details-marker {
  display: none;
}

.mrc-details summary:before {
  content: "▸";
  margin-right: 6px;
  display: inline-block;
  transform: translateY(-1px);
}

.mrc-details[open] summary:before {
  content: "▾";
}

.mrc-grid {
  display: grid;
  grid-template-columns: repeat(2, minmax(0, 1fr));
  gap: 10px;
  margin-top: 10px;
}

@media (max-width: 480px) {
  .mrc-grid {
    grid-template-columns: 1fr;
  }
}

.mrc-texts {
  display: grid;
  gap: 10px;
  margin-top: 10px;
}

.softarea {
  width: 100%;
  box-sizing: border-box;
  height: 84px;
  resize: none !important;
  overflow: auto;
  border: 0;
  background: #f8fafc;
  border-radius: 12px;
  padding: 10px;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.08);
}

.softarea:focus {
  outline: none;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.12), 0 0 0 2px #c7d2fe;
}

.mrc-submit {
  display: flex;
  justify-content: flex-end;
  margin-top: 10px;
}

.primary {
  background: #4b2aad;
  color: #fff;
  border: none;
  border-radius: 12px;
  padding: 10px 14px;
  font-weight: 800;
  cursor: pointer;
  box-shadow: 0 6px 14px rgba(75, 42, 173, 0.22);
}

.primary:disabled {
  filter: grayscale(1);
  opacity: 0.6;
  cursor: not-allowed;
}
</style>
