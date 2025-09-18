<template>
  <div class="fs">
    <span class="fs-label">{{ label }}</span>

    <div
      class="fs-dots"
      role="radiogroup"
      :aria-label="label"
      @keydown.left.prevent="step(-1)"
      @keydown.right.prevent="step(1)"
      tabindex="0"
    >
      <button
        v-for="n in 5"
        :key="n"
        class="dot"
        :class="{ on: modelValue >= n }"
        :title="`${label} ${n}점`"
        role="radio"
        :aria-checked="modelValue === n ? 'true' : 'false'"
        @click="$emit('update:modelValue', n)"
      />
    </div>
  </div>
</template>

<script>
export default {
  name: "FiveScale",
  props: {
    modelValue: { type: Number, default: null },
    label: { type: String, required: true },
  },
  methods: {
    step(dir) {
      const cur = this.modelValue || 0;
      const next = Math.min(5, Math.max(1, cur + dir));
      this.$emit("update:modelValue", next);
    },
  },
};
</script>

<style scoped>
.fs {
  display: grid;
  grid-template-columns: 80px 1fr 48px;
  align-items: center;
  gap: 12px;
  padding: 10px 12px;
  border: 1px solid #e8edfb;
  border-radius: 14px;
  background: #fbfdff;
}

.fs-label {
  font-weight: 800;
  color: #1e2a44;
}

.fs-dots {
  display: flex;
  gap: 10px;
  outline: none;
}

.dot {
  width: 22px;
  height: 22px;
  border-radius: 50%;
  border: 2px solid #cfe0ff;
  background: radial-gradient(
    circle at 50% 50%,
    rgba(120, 150, 255, 0.12) 0%,
    rgba(120, 150, 255, 0) 60%
  );
  cursor: pointer;
  transition: 0.15s ease;
  box-shadow: inset 0 0 0 2px #ffffff;
}

.dot:hover {
  transform: translateY(-1px);
  border-color: #9ab7ff;
}

.dot.on {
  background: radial-gradient(
    circle at 50% 50%,
    #3b6dff 0%,
    #3b6dff 40%,
    rgba(59, 109, 255, 0.15) 70%
  );
  border-color: #3b6dff;
  box-shadow: 0 2px 8px rgba(59, 109, 255, 0.25), inset 0 0 0 2px #ffffff;
}

.fs:focus-within {
  box-shadow: 0 0 0 2px #c7d2fe;
  border-color: #c7d2fe;
}

.fs-val {
  font-weight: 800;
  color: #1e2a44;
  text-align: right;
  font-variant-numeric: tabular-nums;
}
</style>
