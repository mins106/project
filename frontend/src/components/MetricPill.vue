<template>
  <div :class="pillClass" :title="label + ' ' + text">
    <span class="pill-icon">{{ icon }}</span>
    <span class="pill-label">{{ label }}</span>
    <span class="pill-value">{{ text }}</span>
    <div class="track">
      <div class="dot" :style="{ left: pos + '%' }"></div>
      <div class="tick t-0"></div>
      <div class="tick t-mid"></div>
      <div class="tick t-1"></div>
    </div>
  </div>
</template>

<script>
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));

export default {
  name: "MetricPill",
  props: {
    icon: String,
    label: String,
    value: Number, // -1 ~ 1 또는 null
  },
  computed: {
    // -1..1 -> 0..100 (트랙 위치)
    pos() {
      return this.value == null
        ? 50
        : Math.round(((clamp(this.value, -1, 1) + 1) / 2) * 100);
    },
    // 색 규칙
    // null -> neutral(회색), 0 -> good(초록),
    // -1< v <0 또는 0< v <1 -> mid(노랑),
    // v <= -1 또는 v >= 1 -> bad(빨강)
    pillClass() {
      const v = this.value;
      if (v == null) return "pill neutral";
      if (v === 0) return "pill good";
      if ((v > -1 && v < 0) || (v > 0 && v < 1)) return "pill mid";
      return v <= -1 || v >= 1 ? "pill bad" : "pill neutral";
    },
    text() {
      return this.value == null ? "—" : this.value.toFixed(1);
    },
  },
};
</script>

<style scoped>
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

/* 색 테마 */
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
</style>
