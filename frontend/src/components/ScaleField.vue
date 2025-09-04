<template>
  <div class="sf">
    <div class="sf-label">{{ label }}</div>
    <div class="sf-seg">
      <button
        v-for="opt in opts"
        :key="opt.key"
        type="button"
        :class="['seg', { active: modelValue === opt.key }]"
        @click="$emit('update:modelValue', opt.key)"
        :aria-pressed="modelValue === opt.key ? 'true' : 'false'"
      >
        {{ opt.text }}
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: "ScaleField",
  props: {
    label: { type: String, required: true },
    // ✅ key 로 바인딩합니다 (string)
    modelValue: { type: String, default: null },
    // ✅ [{ key: 'cold', value: -1, text: '차가움' }, ...] 형태만 지원
    opts: {
      type: Array,
      required: true,
      validator: (arr) =>
        Array.isArray(arr) &&
        arr.every(
          (o) =>
            o &&
            typeof o.key === "string" &&
            (o.value === -1 || o.value === 1) &&
            typeof o.text === "string"
        ),
    },
  },
};
</script>

<style scoped>
.sf {
  display: grid;
  gap: 6px;
}

.sf-label {
  font-size: 13px;
  font-weight: 700;
  color: #1f2b46;
}

.sf-seg {
  display: grid;
  grid-template-columns: repeat(3, minmax(0, 1fr));
  gap: 6px;
}

.seg {
  height: 36px;
  border: 1px solid #dbe2f0;
  background: #f7f9fe;
  color: #2b3a55;
  font-weight: 700;
  border-radius: 10px;
  transition: background 0.15s, box-shadow 0.2s;
}

.seg:hover {
  background: #eef3ff;
  box-shadow: 0 2px 8px rgba(59, 105, 255, 0.12);
}

.seg.active {
  background: #3b6dff;
  color: #fff;
  border-color: #3b6dff;
}
</style>
