import axios from "axios";
import config from "../config";

const axiosInstance = axios.create({
  baseURL: config.WS_BASE_URL,
  timeout: 60000, // 60 secinds
});

axiosInstance.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem("sessionToken");
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default axiosInstance;
