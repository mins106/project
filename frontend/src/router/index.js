import { createRouter, createWebHistory } from "vue-router";
import MainPage from "@/views/MainPage.vue";
import MealsPage from "@/views/MealsPage.vue";
import TimeTablePage from "@/views/TimeTablePage.vue";
import CalendarPage from "@/views/CalendarPage.vue";
import LoginPage from "@/views/LoginPage.vue";
import SignUpPage from "@/views/SignUpPage.vue";
import BoardPage from "@/views/BoardPage.vue";
import BoardWritePage from "@/views/BoardWritePage.vue";
import BoardDetailPage from "@/views/BoardDetailPage.vue";
import MealDetailPage from "@/views/MealDetailPage.vue";
import MyPage from "@/views/MyPage.vue";

const routes = [
  {
    path: "/",
    name: "Main",
    component: MainPage,
  },
  {
    path: "/meals",
    name: "Meals",
    component: MealsPage,
  },
  {
    path: "/meals/:date",
    name: "MealDetail",
    component: MealDetailPage,
    props: true,
    meta: { hideTopBar: true },
  },
  {
    path: "/meals/:date?",
    name: "Meals",
    component: MealsPage,
    props: (route) => ({ initialDate: route.params.date ?? null }),
  },
  {
    path: "/timetable",
    name: "TimeTable",
    component: TimeTablePage,
  },
  {
    path: "/calendar",
    name: "Calendar",
    component: CalendarPage,
  },
  {
    path: "/login",
    name: "Login",
    component: LoginPage,
    meta: { hideTopBar: true },
  },
  {
    path: "/signup",
    name: "SignUp",
    component: SignUpPage,
    meta: { hideTopBar: true },
  },
  {
    path: "/board",
    name: "Board",
    component: BoardPage,
  },
  {
    path: "/board/write",
    name: "BoardWrite",
    component: BoardWritePage,
    meta: { hideTopBar: true },
  },
  {
    path: "/board/:id",
    name: "BoardDetail",
    component: BoardDetailPage,
    meta: { hideTopBar: true },
  },
  {
    path: "/me",
    name: "MyPage",
    component: MyPage,
  },
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
