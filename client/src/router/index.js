import { createRouter, createWebHistory } from "vue-router";
import MainPage from "@/views/MainPage.vue";
import MealsPage from "@/views/MealsPage.vue";
import TimeTablePage from "@/views/TimeTablePage.vue";

const routes = [
  {
    path: "/main",
    name: "Main",
    component: MainPage
  },
  {
    path: "/meals",
    name: "Meals",
    component: MealsPage
  },
  {
    path: "/timetable",
    name: "TimeTable",
    component: TimeTablePage
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
