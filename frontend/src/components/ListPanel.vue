<template>
  <div>
    <h2 class="ttl">{{ title }}</h2>

    <div v-if="loading" class="skeleton">
      <div class="sk-card" v-for="n in 3" :key="n"></div>
    </div>

    <div v-else-if="!items?.length" class="empty">{{ emptyText }}</div>

    <div v-else class="list">
      <article
        v-for="it in items"
        :key="it.id"
        class="card"
        @click="$router.push(`/board/${it.id}`)"
      >
        <div class="c-top">
          <span class="badge">{{ it.category || "기타" }}</span>
          <h3 class="c-title">{{ it.title }}</h3>
        </div>
        <p class="c-snippet">{{ it.snippet }}</p>
        <div class="c-meta">
          <span>👍 {{ it.likes }}</span>
          <span>💬 {{ it.commentCount }}</span>
        </div>
      </article>

      <button v-if="hasMore" class="load-more" @click="$emit('load-more')">
        더 보기
      </button>
    </div>
  </div>
</template>

<script>
export default {
  name: "ListPanel",
  props: {
    title: String,
    items: Array,
    loading: Boolean,
    emptyText: String,
    hasMore: Boolean,
  },
  emits: ["load-more"],
};
</script>

<style scoped>
.ttl {
  margin: 6px 2px 12px;
  font-size: 16px;
  color: #333;
}

.empty {
  color: #8a8a8a;
  padding: 20px 8px;
}

.list {
  display: grid;
  gap: 12px;
}

.card {
  border: 1px solid #eee;
  border-radius: 14px;
  padding: 14px;
  background: #fff;
  cursor: pointer;
  transition: box-shadow 0.15s ease, transform 0.05s ease,
    border-color 0.15s ease;
}

.card:hover {
  box-shadow: 0 10px 22px rgba(110, 75, 255, 0.08);
  border-color: #e8e3ff;
  transform: translateY(-1px);
}

.c-top {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 6px;
}

.badge {
  font-size: 11px;
  font-weight: 700;
  color: #5a2fc9;
  background: #f2ecff;
  border: 1px solid #e8e3ff;
  padding: 3px 8px;
  border-radius: 999px;
}

.c-title {
  margin: 0;
  font-size: 15px;
  color: #222;
}

.c-snippet {
  margin: 6px 0 10px;
  color: #555;
  line-height: 1.5;
}

.c-meta {
  display: flex;
  gap: 12px;
  font-size: 12px;
  color: #777;
}

.load-more {
  margin: 6px auto 0;
  border: 1px solid #ded7ff;
  background: #fff;
  padding: 10px 14px;
  border-radius: 10px;
  font-weight: 700;
  color: #5a2fc9;
  cursor: pointer;
}

/* 로딩 스켈레톤 */
.skeleton {
  display: grid;
  gap: 12px;
}

.sk-card {
  height: 84px;
  border-radius: 14px;
  background: linear-gradient(90deg, #f3f0ff 25%, #ece8ff 37%, #f3f0ff 63%);
  background-size: 400% 100%;
  animation: shimmer 1.2s infinite;
}

@keyframes shimmer {
  0% {
    background-position: 100% 0;
  }

  100% {
    background-position: -100% 0;
  }
}
</style>
