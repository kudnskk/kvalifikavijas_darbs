import axiosInstance from "./axiosInstance";

// File API endpoints
const fileApi = {
  // Upload file
  upload: async (file, onUploadProgress) => {
    try {
      const formData = new FormData();
      formData.append("file", file);

      const response = await axiosInstance.post("files/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          if (onUploadProgress) {
            const percentCompleted = Math.round(
              (progressEvent.loaded * 100) / progressEvent.total
            );
            onUploadProgress(percentCompleted);
          }
        },
      });

      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Get file content
  getFile: async (filename) => {
    try {
      const response = await axiosInstance.get(`files/${filename}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Delete file
  deleteFile: async (filename) => {
    try {
      const response = await axiosInstance.delete(`files/${filename}`);
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default fileApi;
