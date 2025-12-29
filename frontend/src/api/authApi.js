import axiosInstance from "./axiosInstance";

const authApi = {
  register: async (userData) => {
    try {
      const response = await axiosInstance.post("auth/register", userData);

      if (response.data.token) {
        localStorage.setItem("authToken", response.data.token);
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  //login
  login: async (credentials) => {
    try {
      const response = await axiosInstance.post("auth/login", credentials);

      // Save token
      if (response.data.token) {
        localStorage.setItem("authToken", response.data.token);
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Verify user token
  verify: async () => {
    try {
      const response = await axiosInstance.get("auth/verify");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  //logout
  logout: () => {
    localStorage.removeItem("authToken");
    localStorage.removeItem("sessionToken");
    window.location.href = "/#";
  },

  isAuthenticated: () => {
    return !!localStorage.getItem("authToken");
  },

  //get token
  getToken: () => {
    return localStorage.getItem("authToken");
  },
};

export default authApi;

export const { register, login, verify, logout, isAuthenticated, getToken } =
  authApi;
