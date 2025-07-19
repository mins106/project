import { createRouter, createWebHistory } from "vue-router";
import MainPage from "@/views/MainPage.vue";
import MealsPage from "@/views/MealsPage.vue";

const routes = [
  {
    path: "/",
    name: "MainPage",
    component: MainPage,
  },
  {
    path: "/meals",
    name: "Meals",
    component: MealsPage,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
