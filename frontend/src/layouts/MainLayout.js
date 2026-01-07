import React, { useState, useEffect, createContext, useContext } from "react";
import {
  Box,
  VStack,
  Text,
  Heading,
  Button,
  Input,
  useToast,
  Collapse,
  useDisclosure,
  Flex,
  IconButton,
  Tooltip,
  Icon,
  Divider,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  Drawer,
  DrawerBody,
  DrawerHeader,
  DrawerOverlay,
  DrawerContent,
  DrawerCloseButton,
} from "@chakra-ui/react";
import { FaPlus, FaBars } from "react-icons/fa";
import { RxHamburgerMenu } from "react-icons/rx";
import MainNavBar from "./components/MainNavBar";
import NewCategoryModal from "./components/NewCategoryModal";
import NewLessonModal from "./components/NewLessonModal";
import AcceptModal from "../components/AcceptModal";
import { FaChevronRight, FaChevronDown } from "react-icons/fa6";
import { categoryApi } from "../api";
import { useNavigate, useLocation } from "react-router-dom";
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

// Create Context for layout refresh
const LayoutRefreshContext = createContext(null);

export const useLayoutRefresh = () => {
  const context = useContext(LayoutRefreshContext);
  if (!context) {
    return { refreshLayout: () => {} };
  }
  return context;
};

const MainLayout = ({ children }) => {
  const [isLoading, setIsLoading] = useState(false);
  const [categories, setCategories] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [categorySearch, setCategorySearch] = useState("");
  const [lessonSearch, setLessonSearch] = useState("");
  const [expandedCategories, setExpandedCategories] = useState({});
  const [selectedCategoryForLesson, setSelectedCategoryForLesson] =
    useState(null);
  const [selectedLesson, setSelectedLesson] = useState("");
  const [selectedLessonForEdit, setSelectedLessonForEdit] = useState(null);
  const [selectedLessonForDelete, setSelectedLessonForDelete] = useState(null);
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

  const {
    isOpen: isEditCategoryModalOpen,
    onOpen: onEditCategoryModalOpen,
    onClose: onEditCategoryModalClose,
  } = useDisclosure();

  const [selectedCategoryForEdit, setSelectedCategoryForEdit] = useState(null);
  const [selectedCategoryForDelete, setSelectedCategoryForDelete] =
    useState(null);

  const {
    isOpen: isDeleteCategoryModalOpen,
    onOpen: onDeleteCategoryModalOpen,
    onClose: onDeleteCategoryModalClose,
  } = useDisclosure();

  const {
    isOpen: isDeleteLessonModalOpen,
    onOpen: onDeleteLessonModalOpen,
    onClose: onDeleteLessonModalClose,
  } = useDisclosure();

  const {
    isOpen: isMobileMenuOpen,
    onOpen: onMobileMenuOpen,
    onClose: onMobileMenuClose,
  } = useDisclosure();

  const toggleCategory = (categoryId) => {
    setExpandedCategories((prev) => ({
      ...prev,
      [categoryId]: !prev[categoryId],
    }));
  };

  const handleOpenLessonModal = (categoryId = null) => {
    setSelectedCategoryForLesson(categoryId);
    setSelectedLessonForEdit(null);
    onNewLessonModalOpen();
  };

  const handleCloseLessonModal = () => {
    setSelectedCategoryForLesson(null);
    setSelectedLessonForEdit(null);
    onNewLessonModalClose();
  };

  const handleOpenEditCategoryModal = (category) => {
    setSelectedCategoryForEdit(category);
    onEditCategoryModalOpen();
  };

  const handleCloseEditCategoryModal = () => {
    setSelectedCategoryForEdit(null);
    onEditCategoryModalClose();
  };

  const handleOpenDeleteCategoryModal = (category) => {
    setSelectedCategoryForDelete(category);
    onDeleteCategoryModalOpen();
  };

  const handleCloseDeleteCategoryModal = () => {
    setSelectedCategoryForDelete(null);
    onDeleteCategoryModalClose();
  };

  const handleOpenEditLesson = (lesson) => {
    setSelectedLessonForEdit(lesson);
    setSelectedCategoryForLesson(null);
    onNewLessonModalOpen();
  };

  const handleOpenDeleteLessonModal = (lesson) => {
    setSelectedLessonForDelete(lesson);
    onDeleteLessonModalOpen();
  };

  const handleCloseDeleteLessonModal = () => {
    setSelectedLessonForDelete(null);
    onDeleteLessonModalClose();
  };

  const handleDeleteLesson = async () => {
    if (!selectedLessonForDelete?._id) return;
    setIsLoading(true);
    try {
      const response = await categoryApi.deleteLesson(
        selectedLessonForDelete._id
      );

      if (response.status) {
        toast({
          title: "Success",
          description: response.message || "Lesson deleted successfully!",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        handleCloseDeleteLessonModal();
        getDataForDisplay();
        navigate("/dashboard");
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete lesson",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      const message =
        typeof error === "string" ? error : error?.message || "Request failed";
      toast({
        title: "Error",
        description: message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCategory = async () => {
    if (!selectedCategoryForDelete?._id) return;
    setIsLoading(true);
    try {
      const response = await categoryApi.deleteCategory(
        selectedCategoryForDelete._id
      );

      if (response.status) {
        toast({
          title: "Success",
          description: response.message || "",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        handleCloseDeleteCategoryModal();
        getDataForDisplay();
        navigate("/dashboard");
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete category",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
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

  const filteredCategories = categorySearch.trim().toLowerCase()
    ? categories.filter((category) =>
        (category?.title || "")
          .toLowerCase()
          .includes(categorySearch.trim().toLowerCase())
      )
    : categories;

  const filteredLessons = lessonSearch.trim().toLowerCase()
    ? lessons.filter((lesson) =>
        (lesson?.title || "")
          .toLowerCase()
          .includes(lessonSearch.trim().toLowerCase())
      )
    : lessons;

  const SidebarContent = () => (
    <VStack spacing={6} py={6} px={2} align="stretch">
      <Box>
        <Heading size="md" color="white" mb={4}>
          Categories
        </Heading>
        <VStack spacing={3} align="stretch">
          <Input
            placeholder="Search categories"
            value={categorySearch}
            onChange={(e) => setCategorySearch(e.target.value)}
            bg="#0F172A"
            border="1px solid"
            borderColor="#334155"
            color="white"
          />
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
          {filteredCategories.length === 0 ? (
            <Text color="gray.300" fontSize="sm" px={2}>
              No category found!
            </Text>
          ) : (
            filteredCategories.map((category) => (
              <Box key={category._id}>
                <Flex
                  p={3}
                  borderRadius="md"
                  border="1px solid"
                  borderColor={category.color}
                  align="center"
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

                  <Menu>
                    <MenuButton
                      as={IconButton}
                      icon={<RxHamburgerMenu />}
                      size="xs"
                      variant="ghost"
                      color="gray.100"
                      _hover={{
                        color: category.color,
                        bg: "transparent",
                      }}
                      mr="2"
                    />
                    <MenuList bg="#0F172A" borderColor="#334155">
                      <MenuItem
                        bg="#0F172A"
                        _hover={{ bg: "#334155" }}
                        color="white"
                        onClick={() => handleOpenLessonModal(category._id)}
                      >
                        Add new lesson
                      </MenuItem>
                      <MenuItem
                        bg="#0F172A"
                        _hover={{ bg: "#334155" }}
                        color="white"
                        onClick={() => handleOpenEditCategoryModal(category)}
                      >
                        Edit category
                      </MenuItem>
                      <MenuItem
                        bg="#0F172A"
                        _hover={{ bg: "#334155" }}
                        color="red.500"
                        onClick={() => handleOpenDeleteCategoryModal(category)}
                      >
                        Delete category
                      </MenuItem>
                    </MenuList>
                  </Menu>

                  <Icon
                    as={
                      expandedCategories[category._id]
                        ? FaChevronDown
                        : FaChevronRight
                    }
                    boxSize={3}
                    color="gray.100"
                    onClick={() => toggleCategory(category._id)}
                    _hover={{ color: category.color }}
                    cursor="pointer"
                  />
                </Flex>
                <Collapse in={expandedCategories[category._id]} animateOpacity>
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
                          onMobileMenuClose();
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
            ))
          )}
        </VStack>
      </Box>

      <Box>
        <Heading size="md" color="white" mb={4}>
          Recent Lessons
        </Heading>

        <VStack spacing={3} align="stretch">
          <Input
            autoComplete="off"
            placeholder="Search lessons"
            name="lesson"
            value={lessonSearch}
            onChange={(e) => setLessonSearch(e.target.value)}
            bg="#0F172A"
            border="1px solid"
            borderColor="#334155"
            color="white"
          />
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
          {filteredLessons.length === 0 ? (
            <Text color="gray.300" fontSize="sm" px={2}>
              No lesson found!
            </Text>
          ) : (
            filteredLessons.map((lesson) => (
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
                onClick={() => {
                  setSelectedLesson(lesson._id);
                  navigate(`/lesson/${lesson._id}`);
                  onMobileMenuClose();
                }}
                _hover={{
                  bg: "#495974",
                }}
              >
                <Flex align="center" justify={"space-between"}>
                  <Text color="white" fontWeight="semibold" mb={1}>
                    {lesson?.title}
                  </Text>

                  <Flex align="center" gap={2}>
                    <Menu>
                      <MenuButton
                        as={IconButton}
                        icon={<RxHamburgerMenu />}
                        size="xs"
                        variant="ghost"
                        color="gray.100"
                        _hover={{
                          color: lesson?.category_id?.color || "#3B82F6",
                          bg: "transparent",
                        }}
                        onClick={(e) => e.stopPropagation()}
                      />
                      <MenuList
                        bg="#0F172A"
                        borderColor="#334155"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <MenuItem
                          bg="#0F172A"
                          _hover={{ bg: "#334155" }}
                          color="white"
                          onClick={() => handleOpenEditLesson(lesson)}
                        >
                          Edit lesson
                        </MenuItem>
                        <MenuItem
                          bg="#0F172A"
                          _hover={{ bg: "#334155" }}
                          color="red.500"
                          onClick={() => handleOpenDeleteLessonModal(lesson)}
                        >
                          Delete lesson
                        </MenuItem>
                      </MenuList>
                    </Menu>

                    <Text color="gray.400" fontSize="xs">
                      {lesson?.status}
                    </Text>
                  </Flex>
                </Flex>
                <Text color="gray.100" fontSize="sm">
                  Category: {lesson?.category_id?.title || "-"}
                </Text>
              </Box>
            ))
          )}
        </VStack>
      </Box>
    </VStack>
  );

  return (
    <LayoutRefreshContext.Provider value={{ refreshLayout: getDataForDisplay }}>
      <Box bgColor="#0F172A" minH="100vh">
        {/* Desktop Sidebar - Hidden on mobile/tablet */}
        <Box
          display={{ base: "none", lg: "block" }}
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
          <SidebarContent />
        </Box>

        {/* Mobile Drawer */}
        <Drawer
          isOpen={isMobileMenuOpen}
          placement="left"
          onClose={onMobileMenuClose}
          size="xs"
        >
          <DrawerOverlay />
          <DrawerContent bg="#1E293B">
            <DrawerCloseButton color="white" />
            <DrawerHeader
              color="white"
              borderBottomWidth="1px"
              borderColor="#334155"
            >
              Menu
            </DrawerHeader>
            <DrawerBody p={0} overflowY="auto">
              <SidebarContent />
            </DrawerBody>
          </DrawerContent>
        </Drawer>

        <Box
          ml={{ base: 0, lg: `${sidebarWidth}px` }}
          w={{
            base: "100%",
            lg: `calc(100% - ${sidebarWidth}px)`,
          }}
        >
          <Flex
            align="center"
            gap={2}
            bg="#1E293B"
            borderBottom="1px solid"
            borderColor="#334155"
          >
            <IconButton
              display={{ base: "flex", lg: "none" }}
              icon={<FaBars />}
              onClick={onMobileMenuOpen}
              variant="ghost"
              color="white"
              fontSize="20px"
              ml={2}
              _hover={{ color: "#3B82F6" }}
              aria-label="Open menu"
            />
            <Box flex="1">
              <MainNavBar />
            </Box>
          </Flex>

          {/* Main Content */}
          <Box>{children}</Box>
        </Box>

        {/* Modals */}
        <NewCategoryModal
          isOpen={isNewCategoryModalOpen}
          onClose={onNewCategoryModalClose}
          onCategoryCreated={getDataForDisplay}
        />
        <NewCategoryModal
          isOpen={isEditCategoryModalOpen}
          onClose={handleCloseEditCategoryModal}
          onCategoryCreated={getDataForDisplay}
          category={selectedCategoryForEdit}
          lessons={lessons}
        />
        <NewLessonModal
          isOpen={isNewLessonModalOpen}
          onClose={handleCloseLessonModal}
          onLessonCreated={getDataForDisplay}
          categories={categories}
          selectedCategoryId={selectedCategoryForLesson}
          lesson={selectedLessonForEdit}
        />

        <AcceptModal
          isOpen={isDeleteCategoryModalOpen}
          onClose={handleCloseDeleteCategoryModal}
          title="Delete category"
          description="Are you sure you want to permanently delete this category? Lessons in this category will be also deleted with all their data."
          handleAction={handleDeleteCategory}
          confirmText="DELETE"
          isLoading={isLoading}
        />

        <AcceptModal
          isOpen={isDeleteLessonModalOpen}
          onClose={handleCloseDeleteLessonModal}
          title="Delete lesson"
          description="Are you sure you want to permanently delete this lesson and all it's data?"
          handleAction={handleDeleteLesson}
          confirmText="DELETE"
          isLoading={isLoading}
        />
      </Box>
    </LayoutRefreshContext.Provider>
  );
};

export default MainLayout;
