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
  Flex,
  IconButton,
  Tooltip,
  Icon,
  Divider,
} from "@chakra-ui/react";
import { FaPlus } from "react-icons/fa";
import MainNavBar from "./components/MainNavBar";
import NewCategoryModal from "./components/NewCategoryModal";
import NewLessonModal from "./components/NewLessonModal";
import { FaChevronRight, FaChevronDown } from "react-icons/fa6";
import { categoryApi } from "../api";
import { useNavigate } from "react-router-dom";
import { FaBook, FaLaptopCode, FaCalculator, FaBrain } from "react-icons/fa";

const COLORS = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Green", value: "#10B981" },
];
const ICONS = [
  { name: "FaBook", component: FaBook },
  { name: "FaLaptopCode", component: FaLaptopCode },
  { name: "FaCalculator", component: FaCalculator },
  { name: "FaBrain", component: FaBrain },
];

const findTheIcon = (iconName) => {
  const iconObj = ICONS.find((icon) => icon.name === iconName);
  return iconObj ? iconObj.component : FaBook;
};

const MainLayout = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [expandedCategories, setExpandedCategories] = useState({});
  const [selectedCategoryForLesson, setSelectedCategoryForLesson] =
    useState(null);
  const [selectedLesson, setSelectedLesson] = useState("");
  const sidebarWidth = 275;
  const toast = useToast();
  const navigate = useNavigate();
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

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleOpenLessonModal = (categoryId = null) => {
    setSelectedCategoryForLesson(categoryId);
    onNewLessonModalOpen();
  };

  const handleCloseLessonModal = () => {
    setSelectedCategoryForLesson(null);
    onNewLessonModalClose();
  };

  const getDataForDisplay = async () => {
    setIsLoading(true);
    try {
      const data = await categoryApi.getAllCategoriesAndLessons();
      if (data.status) {
        setCategories(data.data.categories);
        setLessons(data.data.lessons);
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

  return (
    <Box bgColor="#0F172A" minH="100vh">
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
      >
        <VStack spacing={6} py={6} px={2} align="stretch">
          <Box>
            <Heading size="md" color="white" mb={4}>
              Categories
            </Heading>
            <VStack spacing={3} align="stretch">
              <Button
                onClick={onNewCategoryModalOpen}
                variant="outline"
                colorScheme="blue"
                _hover={{
                  transform: "scale(1.02)",
                  boxShadow: "md",
                }}
                transition="all 0.2s ease-in-out"
                mb="1"
              >
                + Create New Category
              </Button>
              <Divider />
              {categories.map((category) => (
                <Box key={category._id}>
                  <Flex
                    p={3}
                    borderRadius="md"
                    border="1px solid"
                    borderColor={category.color}
                    align="center"
                    onClick={() => toggleCategory(category._id)}
                  >
                    <Flex align="center" gap={2} flex={1}>
                      <Icon
                        as={findTheIcon(category.icon)}
                        boxSize={6}
                        color={category.color}
                      />
                      <Box>
                        <Text color="white" fontWeight="bold" fontSize="sm">
                          {category.title}
                        </Text>
                        <Text color="gray.100" fontSize="xs">
                          {category.lessonsCount} lessons
                        </Text>
                      </Box>
                    </Flex>

                    <Tooltip
                      label="Add lesson to this category"
                      placement="top"
                      hasArrow
                    >
                      <IconButton
                        icon={<FaPlus />}
                        size="xs"
                        variant="ghost"
                        color="gray.100"
                        _hover={{ color: category.color, bg: "transparent" }}
                        mr="2"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleOpenLessonModal(category._id);
                        }}
                        cursor="pointer"
                      />
                    </Tooltip>
                    <Icon
                      as={
                        expandedCategories[category._id]
                          ? FaChevronDown
                          : FaChevronRight
                      }
                      boxSize={3}
                      color="gray.100"
                      _hover={{ color: category.color }}
                      cursor="pointer"
                    />
                  </Flex>
                  <Collapse
                    in={expandedCategories[category._id]}
                    animateOpacity
                  >
                    <VStack spacing={2} align="stretch" mt={2} ml={2}>
                      {category.lessons.map((lesson) => (
                        <Flex
                          key={lesson._id}
                          p={2}
                          pl={4}
                          borderLeft="2px solid"
                          borderLeftColor={category.color}
                          borderRadius="md"
                          cursor="pointer"
                          _hover={{
                            bg: "#334155",
                            transition: "all 0.2s",
                          }}
                          bgColor={
                            selectedLesson === lesson._id
                              ? "#495974"
                              : "transparent"
                          }
                          onClick={() => {
                            setSelectedLesson(lesson._id);
                            navigate(`/lesson/${lesson._id}`);
                          }}
                          justify="space-between"
                          align="center"
                        >
                          <Text color="white" fontWeight="medium" fontSize="sm">
                            {lesson.title}
                          </Text>
                          <Text color="gray.400" fontSize="xs">
                            {lesson.status}
                          </Text>
                        </Flex>
                      ))}
                    </VStack>
                  </Collapse>
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
              <Button
                variant="outline"
                colorScheme="red"
                _hover={{
                  transform: "scale(1.02)",
                  boxShadow: "md",
                }}
                onClick={() => handleOpenLessonModal()}
                transition="all 0.2s ease-in-out"
                mb="1"
              >
                + Create New Lesson
              </Button>
              <Divider mb={3} />
              {lessons.map((lesson) => (
                <Box
                  key={lesson._id}
                  p={4}
                  bg="#334155"
                  borderLeft="2px solid"
                  borderLeftColor={lesson?.category_id?.color || "gray"}
                  borderRadius="md"
                  cursor="pointer"
                  bgColor={
                    selectedLesson === lesson._id ? "#495974" : "transparent"
                  }
                  _hover={{
                    bg: "#475569",
                    transform: "translateX(4px)",
                    transition: "all 0.2s",
                  }}
                  onClick={() => {
                    setSelectedLesson(lesson._id);
                    navigate(`/lesson/${lesson._id}`);
                  }}
                >
                  <Flex align="center" justify={"space-between"}>
                    <Text color="white" fontWeight="semibold" mb={1}>
                      {lesson?.title}
                    </Text>
                    <Text color="gray.400" fontSize="xs">
                      {lesson?.status}
                    </Text>
                  </Flex>
                  <Text color="gray.100" fontSize="sm">
                    Category: {lesson?.category_id?.title || "-"}
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
        <Box>{children}</Box>
      </Box>

      {/* Modals */}
      <NewCategoryModal
        isOpen={isNewCategoryModalOpen}
        onClose={onNewCategoryModalClose}
        onCategoryCreated={getDataForDisplay}
      />
      <NewLessonModal
        isOpen={isNewLessonModalOpen}
        onClose={handleCloseLessonModal}
        onLessonCreated={getDataForDisplay}
        categories={categories}
        selectedCategoryId={selectedCategoryForLesson}
      />
    </Box>
  );
};

export default MainLayout;
