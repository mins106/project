<template>
  <TopBar v-if="!$route.meta.hideTopBar" />
  <router-view :key="$route.fullPath" />
</template>

<script>
import TopBar from "./views/TopBar.vue";

export default {
  components: { TopBar },
  name: "App",
};
</script>
<style>
html,
body {
  margin: 0;
  padding: 0;
}
</style>
