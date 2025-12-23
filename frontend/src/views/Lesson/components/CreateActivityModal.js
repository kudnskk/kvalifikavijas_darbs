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
  useToast,
  VStack,
  Box,
  SimpleGrid,
  Flex,
  Icon,
  Text,
  Select,
  Textarea,
} from "@chakra-ui/react";
import { FaListUl, FaKeyboard, FaClone } from "react-icons/fa";
import { activityApi } from "../../../api";

const activityTypes = [
  { label: "Multiple Choice", value: "multiple-choice", icon: FaListUl },
  { label: "Free text", value: "text", icon: FaKeyboard },
  { label: "Flashcards", value: "flashcards", icon: FaClone },
];

const CreateActivityModal = ({
  isOpen,
  onClose,
  lessonId,
  onActivityCreated,
  setMessages,
}) => {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [activityType, setActivityType] = useState("");
  const [questionCount, setQuestionCount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const toast = useToast();

  const handleSubmit = async () => {
    if (isLoading) return;

    if (
      !title.trim() ||
      !description.trim() ||
      !activityType ||
      !questionCount
    ) {
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
      const response = await activityApi.createActivity({
        lesson_id: lessonId,
        title: title.trim(),
        description: description.trim(),
        type: activityType,
        question_count: Number(questionCount),
      });

      if (response?.status) {
        toast({
          title: "Success",
          description: "Activity created successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });

        setTitle("");
        setDescription("");
        setActivityType("");
        setQuestionCount("");

        if (onActivityCreated) {
          onActivityCreated(response?.data);
        }

        setMessages((prev) => [...prev, response.data]);

        onClose();
      } else {
        toast({
          title: "Error",
          description: response?.message || "Failed to create activity",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      const message =
        error?.data?.message ||
        error?.message ||
        (typeof error === "string" ? error : null) ||
        "Failed to create activity";
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

  const handleClose = () => {
    setTitle("");
    setActivityType("");
    setDescription("");
    setQuestionCount("");
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="lg">
      <ModalOverlay />
      <ModalContent bg="#1E293B" borderColor="#334155" borderWidth="1px">
        <ModalHeader color="white">Create New Activity</ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody>
          <VStack spacing={5} align="stretch">
            <FormControl isRequired>
              <FormLabel color="gray.200">Title</FormLabel>
              <Input
                placeholder="Enter activity title"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={40}
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
            <FormControl isRequired>
              <FormLabel color="gray.200">Description</FormLabel>
              <Text color="gray.500" fontSize="sm" mb={1}>
                Provide a description of the activity, its purpose and content.
              </Text>
              <Textarea
                placeholder="Enter activity description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={3000}
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
            <FormControl isRequired>
              <FormLabel color="gray.200">Activity Type</FormLabel>
              <SimpleGrid columns={3} spacing={3}>
                {activityTypes.map((type) => (
                  <Box
                    key={type.value}
                    onClick={() => setActivityType(type.value)}
                    cursor="pointer"
                    borderRadius="md"
                    border="2px solid"
                    borderColor={
                      activityType === type.value ? "#3B82F6" : "#334155"
                    }
                    bg={activityType === type.value ? "#334155" : "#0F172A"}
                    _hover={{ borderColor: "#3B82F6", bg: "#334155" }}
                    transition="all 0.2s"
                    aspectRatio={1}
                    display="flex"
                    alignItems="center"
                    justifyContent="center"
                    p={4}
                    userSelect="none"
                  >
                    <Flex direction="column" align="center" gap={2}>
                      <Icon
                        as={type.icon}
                        boxSize={6}
                        color={
                          activityType === type.value ? "#3B82F6" : "gray.400"
                        }
                      />
                      <Text
                        fontSize="sm"
                        fontWeight="medium"
                        color="gray.200"
                        textAlign="center"
                      >
                        {type.label}
                      </Text>
                    </Flex>
                  </Box>
                ))}
              </SimpleGrid>
            </FormControl>

            <FormControl isRequired>
              <FormLabel color="gray.200">Question Count</FormLabel>
              <Select
                placeholder="Select question count"
                value={questionCount}
                onChange={(e) => setQuestionCount(e.target.value)}
                bg="#0F172A"
                color={questionCount ? "white" : "gray.500"}
                border="1px solid"
                borderColor="#334155"
                _placeholder={{ color: "gray.500" }}
                _hover={{ borderColor: "#3B82F6" }}
                _focus={{
                  borderColor: "#3B82F6",
                  boxShadow: "0 0 0 1px #3B82F6",
                }}
                sx={{
                  option: {
                    background: "#0F172A",
                    color: "white",
                  },
                }}
              >
                <option value="5">5</option>
                <option value="10">10</option>
                <option value="15">15</option>
                <option value="20">20</option>
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
            isDisabled={isLoading}
          >
            Create
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default CreateActivityModal;
