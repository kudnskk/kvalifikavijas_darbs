import React, { useState, useEffect } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Stack,
  Flex,
  Icon,
  SimpleGrid,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  StatArrow,
  HStack,
  VStack,
  useDisclosure,
  useToast,
} from "@chakra-ui/react";
import {
  FiBook,
  FiUsers,
  FiTrendingUp,
  FiZap,
  FiPlus,
  FiFolder,
} from "react-icons/fi";
import { useNavigate } from "react-router-dom";
import NewCategoryModal from "../layouts/components/NewCategoryModal";
import NewLessonModal from "../layouts/components/NewLessonModal";
import { categoryApi } from "../api";

const Dashboard = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const [categories, setCategories] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const userStats = {
    totalLessons: 24,
    completedLessons: 18,
    inProgressLessons: 6,
    totalCategories: 4,
    studyTime: "45h 30m",
    weeklyProgress: 12,
  };

  const getDataForDisplay = async () => {
    setIsLoading(true);
    try {
      const data = await categoryApi.getAllCategoriesAndLessons();
      if (data.status) {
        setCategories(data.data.categories);
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
      console.error("Error fetching categories:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getDataForDisplay();
  }, []);

  const handleCreateLesson = () => {
    onNewLessonModalOpen();
  };

  const handleCreateCategory = () => {
    onNewCategoryModalOpen();
  };

  return (
    <Box color="white">
      <Container maxW="container.xl" py={8}>
        {/* Header with Actions */}
        <Flex justify="space-between" align="center" mb={8}>
          <Box>
            <Heading size="lg">Dashboard</Heading>
            <Text color="gray.400">
              Welcome back! Here's your learning overview
            </Text>
          </Box>
          <HStack spacing={4}>
            <Button
              variant="outline"
              colorScheme="red"
              onClick={handleCreateLesson}
              _hover={{
                transform: "scale(1.02)",
                boxShadow: "md",
              }}
              transition="all 0.2s ease-in-out"
            >
              + Create New Lesson
            </Button>

            <Button
              variant="outline"
              colorScheme="blue"
              onClick={handleCreateCategory}
              _hover={{
                transform: "scale(1.02)",
                boxShadow: "md",
              }}
              transition="all 0.2s ease-in-out"
            >
              + Create New Category
            </Button>
          </HStack>
        </Flex>

        {/* Stats Grid */}
        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={6} mb={8}>
          <Card bg="#1E293B" borderColor="#334155" borderWidth="1px">
            <CardBody>
              <Stat>
                <StatLabel color="gray.400">Total Lessons</StatLabel>
                <StatNumber color="white" fontSize="3xl">
                  {userStats.totalLessons}
                </StatNumber>
                <StatHelpText color="gray.500">
                  {userStats.completedLessons} completed
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg="#1E293B" borderColor="#334155" borderWidth="1px">
            <CardBody>
              <Stat>
                <StatLabel color="gray.400">In Progress</StatLabel>
                <StatNumber color="white" fontSize="3xl">
                  {userStats.inProgressLessons}
                </StatNumber>
                <StatHelpText color="green.400">
                  <StatArrow type="increase" />
                  {userStats.weeklyProgress}% this week
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg="#1E293B" borderColor="#334155" borderWidth="1px">
            <CardBody>
              <Stat>
                <StatLabel color="gray.400">Categories</StatLabel>
                <StatNumber color="white" fontSize="3xl">
                  {userStats.totalCategories}
                </StatNumber>
                <StatHelpText color="gray.500">
                  Active learning paths
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg="#1E293B" borderColor="#334155" borderWidth="1px">
            <CardBody>
              <Stat>
                <StatLabel color="gray.400">Study Time</StatLabel>
                <StatNumber color="white" fontSize="3xl">
                  {userStats.studyTime}
                </StatNumber>
                <StatHelpText color="gray.500">
                  Total time invested
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>
      </Container>

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

export default Dashboard;
