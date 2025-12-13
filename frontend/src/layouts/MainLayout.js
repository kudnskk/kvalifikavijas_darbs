import React, { useState, useEffect } from "react";
import {
  Box,
  VStack,
  Text,
  Heading,
  Button,
  useToast,
  Collapse,
  useDisclosure,
} from "@chakra-ui/react";
import MainNavBar from "./components/MainNavBar";
import NewCategoryModal from "./components/NewCategoryModal";
import NewLessonModal from "./components/NewLessonModal";
import { categoryApi } from "../api";

const MainLayout = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [lessonsWithoutCategory, setLessonsWithoutCategory] = useState([]);
  const sidebarWidth = 275;
  const toast = useToast();
  // Mock data - replace with actual data from your backend
  // const categories = [
  //   { id: 1, name: "Mathematics", lessonsCount: 12 },
  //   { id: 2, name: "Science", lessonsCount: 8 },
  //   { id: 3, name: "History", lessonsCount: 15 },
  //   { id: 4, name: "Literature", lessonsCount: 10 },
  // ];
  const { isOpen, onToggle } = useDisclosure();
  const {
    isOpen: isNewCategoryModalOpen,
    onOpen: onNewCategoryModalOpen,
    onClose: onNewCategoryModalClose,
  } = useDisclosure();
  const {
    isOpen: isNewLessonModalOpen,
    onOpen: onNewLessonModalOpen,
    onClose: onNewLessonModalClose,
  } = useDisclosure();

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

  const getDataForDisplay = async () => {
    setIsLoading(true);
    try {
      const data = await categoryApi.getAllCategoriesAndLessons();
      if (data.status) {
        setCategories(data.data.categories);
        setLessonsWithoutCategory(data.data.uncategorizedLessons);
      } else {
        toast({
          title: "Failed fetching data",
          description: data.message || "failed",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.error("Error fetching categories and lessons:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getDataForDisplay();
  }, []);

  // data will have: { status, message, data: { categories, uncategorizedLessons } }

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
              <Button
                align="center"
                bg={"white"}
                border="1px solid"
                borderColor={"blue.300"}
                bgColor={"blue.50"}
                color="blue.700"
                borderRadius="md"
                p={4}
                boxShadow="sm"
                _hover={{ bg: "blue.100", borderColor: "blue.400" }}
                cursor="pointer"
                onClick={onNewCategoryModalOpen}
                transition="all 0.3s ease"
                mb="1"
              >
                <Text fontSize="sm" color={"gray.600"} flex="1">
                  + Create New Category
                </Text>
              </Button>
              {categories.map((category) => (
                <>
                  <Box
                    key={category._id}
                    p={4}
                    bg="#334155"
                    borderRadius="md"
                    cursor="pointer"
                    _hover={{
                      bg: "#475569",
                      transform: "translateX(4px)",
                      transition: "all 0.2s",
                    }}
                    onClick={onToggle}
                  >
                    <Text color="white" fontWeight="bold">
                      {category.title}
                    </Text>
                    <Text color="gray.400" fontSize="sm">
                      {category.lessonsCount} lessons
                    </Text>
                    <Button> + for adding lesson to category</Button>
                  </Box>
                  <Collapse in={isOpen} animateOpacity>
                    {category.lessons.map((lesson) => (
                      <Box key={lesson._id}></Box>
                    ))}
                  </Collapse>
                </>
              ))}
            </VStack>
          </Box>

          {/* Lessons Section */}
          <Box>
            <Heading size="md" color="white" mb={4}>
              Recent Lessons
            </Heading>
            <VStack spacing={3} align="stretch">
              <Button
                align="center"
                bg={"white"}
                border="1px solid"
                borderColor={"blue.300"}
                bgColor={"blue.50"}
                color="blue.700"
                borderRadius="md"
                p={4}
                boxShadow="sm"
                _hover={{ bg: "blue.100", borderColor: "blue.400" }}
                cursor="pointer"
                onClick={onNewLessonModalOpen}
                transition="all 0.3s ease"
                mb="1"
              >
                <Text fontSize="sm" color={"gray.600"} flex="1">
                  + Create New Lesson
                </Text>
              </Button>
              {lessonsWithoutCategory.map((lesson) => (
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

      {/* Modals */}
      <NewCategoryModal
        isOpen={isNewCategoryModalOpen}
        onClose={onNewCategoryModalClose}
        onCategoryCreated={getDataForDisplay}
      />
      <NewLessonModal
        isOpen={isNewLessonModalOpen}
        onClose={onNewLessonModalClose}
        onLessonCreated={getDataForDisplay}
        categories={categories}
      />
    </Box>
  );
};

export default MainLayout;
