import React, { useEffect, useState } from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalFooter,
  ModalBody,
  ModalCloseButton,
  Button,
  FormControl,
  FormLabel,
  Input,
  Textarea,
  useToast,
  VStack,
  SimpleGrid,
  Box,
  Flex,
  Icon,
  Text,
  Checkbox,
} from "@chakra-ui/react";
import { FaBook, FaLaptopCode, FaCalculator, FaBrain } from "react-icons/fa";
import { categoryApi } from "../../api";

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

const NewCategoryModal = ({
  isOpen,
  onClose,
  onCategoryCreated,
  category,
  lessons,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0].name);
  const [lessonsToAdd, setLessonsToAdd] = useState([]);
  const [lessonsToRemove, setLessonsToRemove] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const isEditMode = !!category;

  useEffect(() => {
    if (!isOpen) return;

    if (category) {
      setTitle(category?.title || "");
      setDescription(category?.description || "");
      setSelectedColor(category?.color || COLORS[0].value);
      setSelectedIcon(category?.icon || ICONS[0].name);
      setLessonsToAdd([]);
      setLessonsToRemove([]);
      return;
    }

    setTitle("");
    setDescription("");
    setSelectedColor(COLORS[0].value);
    setSelectedIcon(ICONS[0].name);
    setLessonsToAdd([]);
    setLessonsToRemove([]);
  }, [isOpen, category]);

  const lessonsInCategory = isEditMode ? category?.lessons || [] : [];
  const uncategorizedLessons = isEditMode
    ? (lessons || []).filter((l) => !l?.category_id)
    : [];

  const toggleLessonToAdd = (lessonId) => {
    setLessonsToAdd((prev) =>
      prev.includes(lessonId)
        ? prev.filter((id) => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  const toggleLessonToRemove = (lessonId) => {
    setLessonsToRemove((prev) =>
      prev.includes(lessonId)
        ? prev.filter((id) => id !== lessonId)
        : [...prev, lessonId]
    );
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: "Error",
        description: "Not all required input fields are filled in!",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      let response;
      if (isEditMode) {
        response = await categoryApi.updateCategory(category._id, {
          title: title.trim(),
          description: description.trim(),
          color: selectedColor,
          icon: selectedIcon,
          addedLessons: lessonsToAdd,
          removedLessons: lessonsToRemove,
        });
      } else {
        response = await categoryApi.createCategory({
          title: title.trim(),
          description: description.trim(),
          color: selectedColor,
          icon: selectedIcon,
        });
      }

      if (response.status) {
        toast({
          title: "Success",
          description:
            response.message ||
            (isEditMode
              ? "Category updated successfully! (Kategorija atjaunināta veiksmīgi!)"
              : "Category created successfully! (Kategorija izveidota veiksmīgi!)"),
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        setLessonsToAdd([]);
        setLessonsToRemove([]);

        onClose();

        if (onCategoryCreated) {
          await onCategoryCreated();
        }
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create category",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      const errorMessage =
        typeof error === "string" ? error : error?.message || "Failed";
      toast({
        title: "Error",
        description: errorMessage,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setTitle("");
    setDescription("");
    setSelectedColor(COLORS[0].value);
    setSelectedIcon(ICONS[0].name);
    setLessonsToAdd([]);
    setLessonsToRemove([]);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent bg="#1E293B" borderColor="#334155" borderWidth="1px">
        <ModalHeader color="white">
          {isEditMode ? "Edit Category" : "Create New Category"}
        </ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody>
          <VStack spacing={5} align="stretch">
            <FormControl isRequired>
              <FormLabel color="gray.200">Title</FormLabel>
              <Input
                placeholder="Enter category title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={20}
                bg="#0F172A"
                border="1px solid"
                borderColor="#334155"
                color="white"
                _placeholder={{ color: "gray.500" }}
                _hover={{ borderColor: "#3B82F6" }}
                _focus={{
                  borderColor: "#3B82F6",
                  boxShadow: "0 0 0 1px #3B82F6",
                }}
              />
            </FormControl>

            <FormControl>
              <FormLabel color="gray.200">Description</FormLabel>
              <Textarea
                placeholder="Enter category description (optional)"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={100}
                rows={3}
                bg="#0F172A"
                border="1px solid"
                borderColor="#334155"
                color="white"
                _placeholder={{ color: "gray.500" }}
                _hover={{ borderColor: "#3B82F6" }}
                _focus={{
                  borderColor: "#3B82F6",
                  boxShadow: "0 0 0 1px #3B82F6",
                }}
              />
            </FormControl>

            <FormControl>
              <FormLabel color="gray.200">Color</FormLabel>
              <SimpleGrid columns={5} spacing={3}>
                {COLORS.map((color) => (
                  <Box
                    key={color.value}
                    onClick={() => setSelectedColor(color.value)}
                    cursor="pointer"
                    p={3}
                    borderRadius="md"
                    border="2px solid"
                    borderColor={
                      selectedColor === color.value ? "#3B82F6" : "#334155"
                    }
                    bg={selectedColor === color.value ? "#334155" : "#0F172A"}
                    _hover={{ borderColor: "#3B82F6", bg: "#334155" }}
                    transition="all 0.2s"
                  >
                    <Flex direction="column" align="center" gap={2}>
                      <Box
                        w="24px"
                        h="24px"
                        borderRadius="full"
                        bg={color.value}
                        boxShadow="md"
                      />
                      <Text fontSize="xs" fontWeight="medium" color="gray.300">
                        {color.name}
                      </Text>
                    </Flex>
                  </Box>
                ))}
              </SimpleGrid>
            </FormControl>

            <FormControl>
              <FormLabel color="gray.200">Icon</FormLabel>
              <SimpleGrid columns={4} spacing={3}>
                {ICONS.map((icon) => (
                  <Box
                    key={icon.name}
                    onClick={() => setSelectedIcon(icon.name)}
                    cursor="pointer"
                    p={4}
                    borderRadius="md"
                    border="2px solid"
                    borderColor={
                      selectedIcon === icon.name ? "#3B82F6" : "#334155"
                    }
                    bg={selectedIcon === icon.name ? "#334155" : "#0F172A"}
                    _hover={{ borderColor: "#3B82F6", bg: "#334155" }}
                    transition="all 0.2s"
                    display="flex"
                    justifyContent="center"
                    alignItems="center"
                  >
                    <Icon
                      as={icon.component}
                      boxSize={6}
                      color={
                        selectedIcon === icon.name ? "#3B82F6" : "gray.400"
                      }
                    />
                  </Box>
                ))}
              </SimpleGrid>
            </FormControl>

            {isEditMode ? (
              <FormControl>
                <FormLabel color="gray.200">Lessons</FormLabel>
                <Flex direction={"column"} gap={2}>
                  <Box
                    p={3}
                    borderRadius="md"
                    border="1px solid"
                    borderColor="#334155"
                    bg="#0F172A"
                  >
                    <Text color="gray.300" fontSize="sm" mb={2}>
                      Remove from this category
                    </Text>
                    <VStack align="stretch" spacing={2}>
                      {lessonsInCategory.length === 0 ? (
                        <Text color="gray.500" fontSize="sm">
                          -
                        </Text>
                      ) : (
                        lessonsInCategory.map((l) => (
                          <Checkbox
                            key={l._id}
                            colorScheme="red"
                            isChecked={lessonsToRemove.includes(l._id)}
                            onChange={() => toggleLessonToRemove(l._id)}
                            color="white"
                          >
                            {l.title}
                          </Checkbox>
                        ))
                      )}
                    </VStack>
                  </Box>
                  <Box
                    p={3}
                    borderRadius="md"
                    border="1px solid"
                    borderColor="#334155"
                    bg="#0F172A"
                  >
                    <Text color="gray.300" fontSize="sm" mb={2}>
                      Add to this category
                    </Text>
                    <VStack align="stretch" spacing={2}>
                      {uncategorizedLessons.length === 0 ? (
                        <Text color="gray.500" fontSize="sm">
                          -
                        </Text>
                      ) : (
                        uncategorizedLessons.map((l) => (
                          <Checkbox
                            key={l._id}
                            colorScheme="green"
                            isChecked={lessonsToAdd.includes(l._id)}
                            onChange={() => toggleLessonToAdd(l._id)}
                            color="white"
                          >
                            {l.title}
                          </Checkbox>
                        ))
                      )}
                    </VStack>
                  </Box>
                </Flex>
              </FormControl>
            ) : null}
          </VStack>
        </ModalBody>

        <ModalFooter>
          <Button
            variant="ghost"
            mr={3}
            onClick={handleClose}
            color="gray.300"
            _hover={{ bg: "#334155" }}
          >
            Cancel
          </Button>
          <Button
            bg="#3B82F6"
            color="white"
            _hover={{ bg: "#2563EB" }}
            onClick={handleSubmit}
            isLoading={isLoading}
          >
            Save
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default NewCategoryModal;
