import axiosInstance from "./axiosInstance";

const authApi = {
  // Forgot password: request reset code
  forgotPasswordRequest: async (email) => {
    try {
      const response = await axiosInstance.post("auth/forgot-password", {
        email,
      });
      return response.data;
    } catch (error) {
      return error.response?.data || { status: false, message: error.message };
    }
  },
  // Forgot password: compare code
  comparePasswordToken: async ({ email, code }) => {
    try {
      const response = await axiosInstance.post("auth/compare-password-token", {
        email,
        code,
      });
      return response.data;
    } catch (error) {
      return error.response?.data || { status: false, message: error.message };
    }
  },
  // Forgot password: reset password
  resetPassword: async ({ userId, password }) => {
    try {
      const response = await axiosInstance.post("auth/reset-password", {
        userId,
        password,
      });
      return response.data;
    } catch (error) {
      return error.response?.data || { status: false, message: error.message };
    }
  },
  // Verify email with code
  verifyEmail: async (data) => {
    try {
      const response = await axiosInstance.post("auth/verify-email", data);
      return response.data;
    } catch (error) {
      return error.response?.data || { status: false, message: error.message };
    }
  },
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
