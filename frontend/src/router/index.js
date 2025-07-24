import { createRouter, createWebHistory } from "vue-router";
import MainPage from "@/views/MainPage.vue";
import MealsPage from "@/views/MealsPage.vue";
import TimeTablePage from "@/views/TimeTablePage.vue";
import CalendarPage from "@/views/CalendarPage.vue";
import LoginPage from "@/views/LoginPage.vue";
import SignUpPage from "@/views/SignUpPage.vue";

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
    component: LoginPage
  },
  {
    path: "/signup",
    name: "SignUp",
    component: SignUpPage
  }
];

const router = createRouter({
  history: createWebHistory(process.env.BASE_URL),
  routes,
});

export default router;
