import axiosInstance from "./axiosInstance";

const userApi = {
  getStats: async () => {
    try {
      const response = await axiosInstance.get("users/stats");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getMe: async () => {
    try {
      const response = await axiosInstance.get("users/me");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  deleteMe: async ({ password }) => {
    try {
      const response = await axiosInstance.delete("users/me", {
        data: { password },
      });
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  adminGetUsers: async () => {
    try {
      const response = await axiosInstance.get("users/admin/get-users");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  adminChangeUserStatus: async ({ userId }) => {
    try {
      const response = await axiosInstance.patch(
        `users/admin/users/change-status/${userId}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  adminDeleteUser: async ({ userId }) => {
    try {
      const response = await axiosInstance.delete(
        `users/admin/users/${userId}`
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default userApi;

export const {
  getStats,
  getMe,
  deleteMe,
  adminGetUsers,
  adminChangeUserStatus,
  adminDeleteUser,
} = userApi;
