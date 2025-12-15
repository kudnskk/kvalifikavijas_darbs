import axiosInstance from "./axiosInstance";

// Category and Lesson API endpoints
const categoryApi = {
  // Get all categories with lessons and uncategorized lessons
  getAllCategoriesAndLessons: async () => {
    try {
      const response = await axiosInstance.get(
        "categories/get-all-categories-and-lessons"
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create a new category
  createCategory: async (categoryData) => {
    try {
      const response = await axiosInstance.post(
        "categories/create-category",
        categoryData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  // Create a new lesson (with optional category_id)
  createLesson: async (lessonData) => {
    try {
      const response = await axiosInstance.post(
        "lessons/create-lesson",
        lessonData
      );
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },

  getAllUserLessons: async () => {
    try {
      const response = await axiosInstance.post("lessons/get-all-user-lessons");
      return response.data;
    } catch (error) {
      throw error.response?.data || error.message;
    }
  },
};

export default categoryApi;

export const {
  getAllCategoriesAndLessons,
  createCategory,
  createLesson,
  getAllUserLessons,
} = categoryApi;
