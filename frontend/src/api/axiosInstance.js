import axios from "axios";
import config from "../config";

// Create axios instance with default config
const axiosInstance = axios.create({
  baseURL: config.WS_BASE_URL,
  timeout: 10000,
  // Don't force Content-Type globally; it breaks FormData (multipart) requests.
});

// Request interceptor - adds auth token to every request
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
