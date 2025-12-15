import React, { useState, useEffect } from "react";
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
  Select,
  useToast,
  VStack,
} from "@chakra-ui/react";
import { categoryApi } from "../../api";

const NewLessonModal = ({
  isOpen,
  onClose,
  onLessonCreated,
  categories,
  selectedCategoryId = null,
}) => {
  const [title, setTitle] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  // Set category when modal opens with a pre-selected category
  useEffect(() => {
    if (isOpen && selectedCategoryId) {
      setCategoryId(selectedCategoryId);
    }
  }, [isOpen, selectedCategoryId]);

  const handleSubmit = async () => {
    if (!title.trim()) {
      toast({
        title: "Validation Error",
        description: "Lesson title is required",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    setIsLoading(true);
    try {
      const lessonData = {
        title: title.trim(),
      };

      // Only add category_id if one is selected
      if (categoryId) {
        lessonData.category_id = categoryId;
      }

      const response = await categoryApi.createLesson(lessonData);

      if (response.status) {
        toast({
          title: "Success",
          description: "Lesson created successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        // Reset form
        setTitle("");
        setCategoryId("");

        // Call callback to refresh data
        if (onLessonCreated) {
          onLessonCreated();
        }

        onClose();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to create lesson",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to create lesson",
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
    setCategoryId("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="md">
      <ModalOverlay />
      <ModalContent bg="#1E293B" borderColor="#334155" borderWidth="1px">
        <ModalHeader color="white">Create New Lesson</ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody>
          <VStack spacing={4}>
            <FormControl isRequired>
              <FormLabel color="gray.200">Title</FormLabel>
              <Input
                placeholder="Enter lesson title"
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
              <FormLabel color="gray.200">Category (Optional)</FormLabel>
              <Select
                placeholder="Select a category (optional)"
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                bg="#0F172A"
                border="1px solid"
                borderColor="#334155"
                color="white"
                _hover={{ borderColor: "#3B82F6" }}
                _focus={{
                  borderColor: "#3B82F6",
                  boxShadow: "0 0 0 1px #3B82F6",
                }}
              >
                {categories?.map((category) => (
                  <option
                    key={category._id}
                    value={category._id}
                    style={{ background: "#0F172A", color: "white" }}
                  >
                    {category.title}
                  </option>
                ))}
              </Select>
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

export default NewLessonModal;
