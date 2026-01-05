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
import { userApi } from "../api";
import { useLayoutRefresh } from "../layouts/MainLayout";

const Dashboard = () => {
  const navigate = useNavigate();
  const toast = useToast();
  const { refreshLayout } = useLayoutRefresh();
  const [categories, setCategories] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [dashboardStats, setDashboardStats] = useState({
    activityAttemptCount: 0,
    inProgressUpdatedThisWeek: 0,
  });

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

  const totalLessons = Array.isArray(lessons) ? lessons.length : 0;
  const completedLessons = Array.isArray(lessons)
    ? lessons.filter((l) => l?.status === "completed").length
    : 0;
  const inProgressLessons = Array.isArray(lessons)
    ? lessons.filter((l) => l?.status === "in-progress").length
    : 0;
  const totalCategories = Array.isArray(categories) ? categories.length : 0;

  const getDataForDisplay = async () => {
    setIsLoading(true);
    try {
      const [data, stats] = await Promise.all([
        categoryApi.getAllCategoriesAndLessons(),
        userApi.getStats(),
      ]);

      if (data?.status) {
        setCategories(data.data.categories || []);
        setLessons(data.data.lessons || []);
      } else {
        toast({
          title: "Failed fetching data",
          description: data?.message || "failed",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }

      if (stats?.status) {
        setDashboardStats({
          activityAttemptCount: Number(stats?.data?.activityAttemptCount || 0),
          inProgressUpdatedThisWeek: Number(
            stats?.data?.inProgressUpdatedThisWeek || 0
          ),
        });
      }
    } catch (error) {
      console.error("Error fetching categories:", error);
      toast({
        title: "Failed fetching data",
        description: error?.message || "failed",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDataRefresh = async () => {
    await getDataForDisplay();
    if (refreshLayout) {
      await refreshLayout();
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
                  {totalLessons}
                </StatNumber>
                <StatHelpText color="gray.500">
                  {completedLessons} completed
                </StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg="#1E293B" borderColor="#334155" borderWidth="1px">
            <CardBody>
              <Stat>
                <StatLabel color="gray.400">In Progress</StatLabel>
                <StatNumber color="white" fontSize="3xl">
                  {inProgressLessons}
                </StatNumber>
                {/* <StatHelpText color="green.400">
                  {dashboardStats.inProgressUpdatedThisWeek} updated (last 7
                  days)
                </StatHelpText> */}
                <StatHelpText color="gray.500">lessons</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg="#1E293B" borderColor="#334155" borderWidth="1px">
            <CardBody>
              <Stat>
                <StatLabel color="gray.400">Categories</StatLabel>
                <StatNumber color="white" fontSize="3xl">
                  {totalCategories}
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
                <StatLabel color="gray.400">Activity Attempts</StatLabel>
                <StatNumber color="white" fontSize="3xl">
                  {dashboardStats.activityAttemptCount}
                </StatNumber>
                <StatHelpText color="gray.500">
                  Total submitted attempts
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
        onCategoryCreated={handleDataRefresh}
      />
      <NewLessonModal
        isOpen={isNewLessonModalOpen}
        onClose={onNewLessonModalClose}
        onLessonCreated={handleDataRefresh}
        categories={categories}
      />
    </Box>
  );
};

export default Dashboard;
