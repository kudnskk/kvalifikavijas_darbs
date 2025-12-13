import React, { useState } from "react";
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
} from "@chakra-ui/react";
import {
  FaBook,
  FaLaptopCode,
  FaFlask,
  FaCalculator,
  FaGlobe,
  FaPalette,
  FaMusic,
  FaFootballBall,
  FaHeart,
  FaRocket,
  FaStar,
  FaBrain,
} from "react-icons/fa";
import { categoryApi } from "../../api";

// Available colors with names
const COLORS = [
  { name: "Blue", value: "#3B82F6" },
  { name: "Purple", value: "#8B5CF6" },
  { name: "Pink", value: "#EC4899" },
  { name: "Red", value: "#EF4444" },
  { name: "Orange", value: "#F97316" },
  { name: "Yellow", value: "#EAB308" },
  { name: "Green", value: "#10B981" },
  { name: "Teal", value: "#14B8A6" },
  { name: "Cyan", value: "#06B6D4" },
  { name: "Indigo", value: "#6366F1" },
];

// Available icons
const ICONS = [
  { name: "FaBook", component: FaBook },
  { name: "FaLaptopCode", component: FaLaptopCode },
  { name: "FaFlask", component: FaFlask },
  { name: "FaCalculator", component: FaCalculator },
  { name: "FaGlobe", component: FaGlobe },
  { name: "FaPalette", component: FaPalette },
  { name: "FaMusic", component: FaMusic },
  { name: "FaFootballBall", component: FaFootballBall },
  { name: "FaHeart", component: FaHeart },
  { name: "FaRocket", component: FaRocket },
  { name: "FaStar", component: FaStar },
  { name: "FaBrain", component: FaBrain },
];

const NewCategoryModal = ({ isOpen, onClose, onCategoryCreated }) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [selectedColor, setSelectedColor] = useState(COLORS[0].value);
  const [selectedIcon, setSelectedIcon] = useState(ICONS[0].name);
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Category title is required",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const response = await categoryApi.createCategory({
        title: title.trim(),
        description: description.trim(),
        color: selectedColor,
        icon: selectedIcon,
      });

      if (response.status) {
        toast({
          title: "Success",
          description: "Category created successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        // Reset form
        setTitle("");
        setDescription("");
        setSelectedColor(COLORS[0].value);
        setSelectedIcon(ICONS[0].name);

        // Call callback to refresh data
        if (onCategoryCreated) {
          onCategoryCreated();
        }

        onClose();
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
      toast({
        title: "Error",
        description: error.message || "Failed to create category",
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
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay bg="blackAlpha.600" />
      <ModalContent bg="#1E293B" borderColor="#334155" borderWidth="1px">
        <ModalHeader color="white">Create New Category</ModalHeader>
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
            Create
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default NewCategoryModal;
