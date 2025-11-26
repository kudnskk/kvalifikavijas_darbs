import axiosInstance from "./axiosInstance";

// Auth API endpoints
const authApi = {
  // Register new user
  register: async (userData) => {
    try {
      const response = await axiosInstance.post("auth/register", userData);

      // Save token to localStorage
      if (response.data.token) {
        localStorage.setItem("authToken", response.data.token);
      }

      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Login user
  login: async (credentials) => {
    try {
      const response = await axiosInstance.post("auth/login", credentials);

      // Save token to localStorage
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

  // Logout user
  logout: () => {
    localStorage.removeItem("authToken");
    window.location.href = "/login";
  },

  // Check if user is authenticated
  isAuthenticated: () => {
    return !!localStorage.getItem("authToken");
  },

  // Get stored token
  getToken: () => {
    return localStorage.getItem("authToken");
  },
};

// Export as default for backward compatibility
export default authApi;

// Also export individual functions for named imports
export const { register, login, verify, logout, isAuthenticated, getToken } =
  authApi;
