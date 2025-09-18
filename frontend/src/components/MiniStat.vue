<!-- src/components/MiniStat.vue -->
<template>
  <div class="stat" :title="help">
    <span class="emoji">{{ icon }}</span>
    <span class="val">{{ display }}</span>
  </div>
</template>

<script>
export default {
  name: "MiniStat",
  props: {
    icon: { type: String, required: true },
    value: { type: [Number, String], default: null },
    digits: { type: Number, default: 1 },
    help: { type: String, required: true },
  },
  computed: {
    display() {
      if (
        this.value === null ||
        this.value === undefined ||
        Number.isNaN(+this.value)
      )
        return "-";
      return (+this.value).toFixed(this.digits);
    },
  },
};
</script>

<style scoped>
.stat {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 10px;
  border-radius: 8px;
  background: #f7f9ff;
  font-weight: 700;
  font-size: 14px;
  color: #1e2a44;
}

.emoji {
  font-size: 16px;
  line-height: 1;
}

.val {
  font-variant-numeric: tabular-nums;
}
</style>
