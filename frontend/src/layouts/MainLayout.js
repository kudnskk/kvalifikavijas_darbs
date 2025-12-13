import React from "react";
import { Box, VStack, Text, Heading } from "@chakra-ui/react";
import MainNavBar from "./components/MainNavBar";

const MainLayout = ({ children }) => {
  const sidebarWidth = 275;

  // Mock data - replace with actual data from your backend
  const categories = [
    { id: 1, name: "Mathematics", lessonsCount: 12 },
    { id: 2, name: "Science", lessonsCount: 8 },
    { id: 3, name: "History", lessonsCount: 15 },
    { id: 4, name: "Literature", lessonsCount: 10 },
  ];

  const lessons = [
    {
      id: 1,
      title: "Introduction to Algebra",
      category: "Mathematics",
      progress: 75,
    },
    { id: 2, title: "Geometry Basics", category: "Mathematics", progress: 50 },
    { id: 3, title: "Physics Fundamentals", category: "Science", progress: 30 },
    { id: 4, title: "Chemistry 101", category: "Science", progress: 60 },
    { id: 5, title: "World War II", category: "History", progress: 90 },
    {
      id: 6,
      title: "Ancient Civilizations",
      category: "History",
      progress: 45,
    },
    { id: 7, title: "Shakespeare Works", category: "Literature", progress: 20 },
    { id: 8, title: "Modern Poetry", category: "Literature", progress: 80 },
  ];

  return (
    <Box bgColor="#0F172A" minH="100vh">
      {/* Fixed Left Sidebar */}
      <Box
        position="fixed"
        top="0"
        left="0"
        w={`${sidebarWidth}px`}
        h="100vh"
        bg="#1E293B"
        borderRight="1px solid"
        borderColor="#334155"
        overflowY="auto"
        css={{
          "&::-webkit-scrollbar": {
            width: "8px",
          },
          "&::-webkit-scrollbar-track": {
            background: "#1E293B",
          },
          "&::-webkit-scrollbar-thumb": {
            background: "#475569",
            borderRadius: "4px",
          },
          "&::-webkit-scrollbar-thumb:hover": {
            background: "#64748b",
          },
        }}
      >
        <VStack spacing={6} p={6} align="stretch">
          {/* Categories Section */}
          <Box>
            <Heading size="md" color="white" mb={4}>
              Categories
            </Heading>
            <VStack spacing={3} align="stretch">
              {categories.map((category) => (
                <Box
                  key={category.id}
                  p={4}
                  bg="#334155"
                  borderRadius="md"
                  cursor="pointer"
                  _hover={{
                    bg: "#475569",
                    transform: "translateX(4px)",
                    transition: "all 0.2s",
                  }}
                >
                  <Text color="white" fontWeight="bold">
                    {category.name}
                  </Text>
                  <Text color="gray.400" fontSize="sm">
                    {category.lessonsCount} lessons
                  </Text>
                </Box>
              ))}
            </VStack>
          </Box>

          {/* Lessons Section */}
          <Box>
            <Heading size="md" color="white" mb={4}>
              Recent Lessons
            </Heading>
            <VStack spacing={3} align="stretch">
              {lessons.map((lesson) => (
                <Box
                  key={lesson.id}
                  p={4}
                  bg="#334155"
                  borderRadius="md"
                  cursor="pointer"
                  _hover={{
                    bg: "#475569",
                    transform: "translateX(4px)",
                    transition: "all 0.2s",
                  }}
                >
                  <Text color="white" fontWeight="semibold" mb={1}>
                    {lesson.title}
                  </Text>
                  <Text color="gray.400" fontSize="sm" mb={2}>
                    {lesson.category}
                  </Text>
                  <Box bg="#1E293B" borderRadius="full" h="6px" w="100%">
                    <Box
                      bg="blue.500"
                      h="100%"
                      borderRadius="full"
                      w={`${lesson.progress}%`}
                    />
                  </Box>
                  <Text color="gray.400" fontSize="xs" mt={1}>
                    {lesson.progress}% complete
                  </Text>
                </Box>
              ))}
            </VStack>
          </Box>
        </VStack>
      </Box>

      {/* Main Content Area with Navbar */}
      <Box
        ml={`${sidebarWidth}px`}
        w={{
          base: "100%",
          xl: `calc(100% - ${sidebarWidth}px)`,
        }}
      >
        {/* Navbar */}
        <MainNavBar />

        {/* Main Content */}
        <Box p={6}>{children}</Box>
      </Box>
    </Box>
  );
};

export default MainLayout;
