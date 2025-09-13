import axios from "axios";

axios.defaults.withCredentials = true;

const api = axios.create({
  baseURL: import.meta?.env?.VITE_API || process.env.VUE_APP_API || "",
  withCredentials: true,
});

api.interceptors.request.use((cfg) => {
  const token = localStorage.getItem("token");
  if (token) cfg.headers.Authorization = `Bearer ${token}`;
  console.log(
    "[API]",
    cfg.method?.toUpperCase(),
    cfg.url,
    "Auth?",
    !!token,
    cfg.headers.Authorization
  );
  return cfg;
});

export default api;
