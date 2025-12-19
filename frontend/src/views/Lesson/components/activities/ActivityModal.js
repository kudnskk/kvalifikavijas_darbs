import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Divider,
  Flex,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalFooter,
  ModalHeader,
  ModalOverlay,
  Spinner,
  Text,
  VStack,
  useToast,
} from "@chakra-ui/react";

import { activityApi } from "../../../../api";

export const ActivityModal = ({ isOpen, onClose, activityId }) => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activityData, setActivityData] = useState(null);

  const activity = activityData?.activity;
  const questions = Array.isArray(activityData?.questions)
    ? activityData.questions
    : [];

  const headerTitle = useMemo(() => {
    if (!activity) return "Activity";
    return activity.title || "Activity";
  }, [activity]);

  useEffect(() => {
    if (!isOpen || !activityId) return;

    let cancelled = false;
    const load = async () => {
      setIsLoading(true);
      try {
        const response = await activityApi.getActivityById(activityId);
        if (!response?.status) {
          throw new Error(response?.message || "Failed to load activity");
        }
        if (!cancelled) setActivityData(response.data);
      } catch (err) {
        if (!cancelled) setActivityData(null);
        toast({
          title: "Error",
          description: err?.message || "Failed to load activity",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [isOpen, activityId, toast]);

  const handleClose = () => {
    setActivityData(null);
    onClose();
  };

  return (
    <Modal isOpen={isOpen} onClose={handleClose} size="xl">
      <ModalOverlay />
      <ModalContent bg="#1E293B" borderColor="#334155" borderWidth="1px">
        <ModalHeader color="white">{headerTitle}</ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody>
          {isLoading ? (
            <Flex align="center" justify="center" py={10}>
              <Spinner color="#3B82F6" thickness="3px" />
            </Flex>
          ) : !activity ? (
            <Text color="gray.400">No activity loaded.</Text>
          ) : (
            <VStack align="stretch" spacing={4}>
              <Box>
                <Text color="gray.300" fontSize="sm">
                  Description
                </Text>
                <Text color="white" whiteSpace="pre-wrap">
                  {activity.description || "(no description)"}
                </Text>
              </Box>

              <Divider borderColor="#334155" />

              <Flex gap={6} wrap="wrap">
                <Box>
                  <Text color="gray.300" fontSize="sm">
                    Type
                  </Text>
                  <Text color="white">{activity.type}</Text>
                </Box>
                <Box>
                  <Text color="gray.300" fontSize="sm">
                    Question count
                  </Text>
                  <Text color="white">{activity.question_count}</Text>
                </Box>
              </Flex>

              <Divider borderColor="#334155" />

              <Box>
                <Text color="gray.200" fontWeight="semibold" mb={2}>
                  Questions
                </Text>

                <VStack align="stretch" spacing={3}>
                  {questions.map((q, idx) => (
                    <Box
                      key={q._id || idx}
                      bg="#0F172A"
                      border="1px solid"
                      borderColor="#334155"
                      borderRadius="md"
                      p={3}
                    >
                      <Text color="gray.300" fontSize="sm" mb={2}>
                        {idx + 1}.
                      </Text>
                      <Text color="white" mb={2} whiteSpace="pre-wrap">
                        {q.question}
                      </Text>

                      {Array.isArray(q.answers) && q.answers.length > 0 && (
                        <VStack align="stretch" spacing={2}>
                          {q.answers.map((a, ai) => (
                            <Flex
                              key={a._id || ai}
                              align="center"
                              justify="space-between"
                              bg="#1E293B"
                              borderRadius="md"
                              px={3}
                              py={2}
                              border="1px solid"
                              borderColor="#334155"
                            >
                              <Text color="gray.200">{a.answer}</Text>
                              {a.is_correct ? (
                                <Text color="#3B82F6" fontSize="sm">
                                  correct
                                </Text>
                              ) : (
                                <Text color="gray.500" fontSize="sm"></Text>
                              )}
                            </Flex>
                          ))}
                        </VStack>
                      )}
                    </Box>
                  ))}
                </VStack>
              </Box>
            </VStack>
          )}
        </ModalBody>

        <ModalFooter>
          <Button
            variant="ghost"
            mr={3}
            onClick={handleClose}
            color="gray.300"
            _hover={{ bg: "#334155" }}
          >
            Close
          </Button>
          <Button
            bg="#3B82F6"
            color="white"
            _hover={{ bg: "#2563EB" }}
            isDisabled={!activityId || isLoading}
            onClick={() => {
              // no functionality for now
            }}
          >
            Start
          </Button>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ActivityModal;
