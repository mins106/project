<template>
  <div class="mrc-card">
    <div class="mrc-header"></div>

    <!-- 선호도(필수) -->
    <div class="mrc-like">
      <button
        :class="['seg', { active: likeFlag === 1 }]"
        @click="likeFlag = 1"
      >
        좋아요
      </button>
      <button
        :class="['seg', { active: likeFlag === 0 }]"
        @click="likeFlag = 0"
      >
        보통
      </button>
      <button
        :class="['seg', { active: likeFlag === -1 }]"
        @click="likeFlag = -1"
      >
        별로
      </button>
    </div>

    <!-- 세부평가(선택) -->
    <details class="mrc-details">
      <summary>세부 평가(선택)</summary>

      <div class="mrc-grid">
        <ScaleField label="짠맛" v-model="saltKey" :opts="SALT_OPTS" />
        <ScaleField label="양" v-model="amountKey" :opts="AMOUNT_OPTS" />
        <ScaleField label="온도" v-model="tempKey" :opts="TEMP_OPTS" />
        <ScaleField label="맵기" v-model="spicyKey" :opts="SPICY_OPTS" />
      </div>

      <div class="mrc-texts">
        <textarea
          v-model="keepText"
          placeholder="좋았던 점 (선택)"
          class="w-full h-36 rounded-xl bg-slate-50 px-4 py-3 text-[14px] leading-relaxed placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 softarea"
        />
        <textarea
          v-model="improveText"
          placeholder="개선 제안 (가능하면 구체적으로)"
          class="w-full h-36 rounded-xl bg-slate-50 px-4 py-3 text-[14px] leading-relaxed placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-indigo-200 softarea"
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
import ScaleField from "@/components/ScaleField.vue";

const SALT_OPTS = [
  { key: "salt-low", value: -1, text: "싱거움" },
  { key: "salt-ok", value: 0, text: "적당" },
  { key: "salt-high", value: 1, text: "짬" },
];
const AMOUNT_OPTS = [
  { key: "amt-low", value: -1, text: "적음" },
  { key: "amt-ok", value: 0, text: "적당" },
  { key: "amt-high", value: 1, text: "많음" },
];
const TEMP_OPTS = [
  { key: "tmp-cold", value: -1, text: "차가움" },
  { key: "tmp-ok", value: 0, text: "적당" },
  { key: "tmp-hot", value: 1, text: "뜨거움" },
];
const SPICY_OPTS = [
  { key: "sp-mild", value: -1, text: "덜 매움" },
  { key: "sp-ok", value: 0, text: "적당" },
  { key: "sp-hot", value: 1, text: "매움" },
];

export default {
  name: "MealReviewCard",
  components: { ScaleField },
  props: {
    mealDishId: { type: Number, required: true },
    dishName: { type: String, required: true },
    dateYmd: { type: String, default: null },
  },
  data() {
    return {
      likeFlag: null, // 👍 필수 (1/0/-1)
      saltKey: null, // 아래 4개는 key로 바인딩
      amountKey: null,
      tempKey: null,
      spicyKey: null,
      keepText: "",
      improveText: "",
      submitting: false,
      SALT_OPTS,
      AMOUNT_OPTS,
      TEMP_OPTS,
      SPICY_OPTS,
    };
  },
  computed: {
    canSubmit() {
      return this.likeFlag !== null && !this.submitting;
    },
  },
  methods: {
    // key -> value 변환
    pick(opts, key) {
      return key ? opts.find((o) => o.key === key)?.value ?? null : null;
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
              // ✅ key를 value(-1/1)로 변환해서 전송
              salt_level: this.pick(SALT_OPTS, this.saltKey),
              portion_level: this.pick(AMOUNT_OPTS, this.amountKey),
              temp_level: this.pick(TEMP_OPTS, this.tempKey),
              texture_level: this.pick(SPICY_OPTS, this.spicyKey),
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
        // 선택 항목 초기화 (선호도 유지)
        this.saltKey = this.amountKey = this.tempKey = this.spicyKey = null;
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
/* 모바일(<= 480px)에서는 항목 블록을 1열로 쌓기 */
@media (max-width: 480px) {
  .mrc-grid {
    grid-template-columns: 1fr !important;
    gap: 12px; /* 항목들 사이 여백 살짝 키움 */
  }
}

.mrc-card {
  border: 1px solid #e9eef8;
  border-radius: 14px;
  padding: 14px;
  background: #fff;
  box-shadow: 0 4px 12px rgba(40, 63, 140, 0.06);
}

.mrc-header {
  display: flex;
  align-items: center;
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
  transition: background 0.15s, box-shadow 0.2s;
}

.seg:hover {
  background: #eff4ff;
  box-shadow: 0 2px 8px rgba(59, 105, 255, 0.12);
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

.mrc-texts {
  display: grid;
  gap: 10px;
  margin-top: 10px;
}

.mrc-texts textarea.softarea {
  border: 0 !important;
  outline: none !important;
  resize: none !important;
  -webkit-appearance: none;
  appearance: none;
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.08);
  min-height: 50px;
  max-height: 50px;
}

.mrc-texts textarea.softarea:focus {
  box-shadow: inset 0 2px 6px rgba(0, 0, 0, 0.12), 0 0 0 2px #c7d2fe;
}

.mrc-texts textarea.softarea::placeholder {
  color: #94a3b8;
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
