import React, { useEffect, useMemo, useState } from "react";
import {
  Box,
  Button,
  Divider,
  Flex,
  IconButton,
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

import { FaChevronLeft, FaChevronRight } from "react-icons/fa";

import { activityApi } from "../../../../api";

import MultipleChoiceActivityRunner from "./MultipleChoiceActivityRunner";
import FreeTextActivityRunner from "./FreeTextActivityRunner";
import FlashcardsActivityRunner from "./FlashcardsActivityRunner";

export const ActivityModal = ({ isOpen, onClose, activityId }) => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activityData, setActivityData] = useState(null);
  const [isStarted, setIsStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptResult, setAttemptResult] = useState(null);

  // Stored in a backend-friendly shape (question_id -> answer)
  const [
    multipleChoiceAnswersByQuestionId,
    setMultipleChoiceAnswersByQuestionId,
  ] = useState({});
  const [freeTextAnswersByQuestionId, setFreeTextAnswersByQuestionId] =
    useState({});

  const activity = activityData?.activity;
  const questions = Array.isArray(activityData?.questions)
    ? activityData.questions
    : [];

  const headerTitle = useMemo(() => {
    if (!activity) return "Activity";
    return activity.title || "Activity";
  }, [activity]);

  const activityType = activity?.type;
  const isMultipleChoice = activityType === "multiple-choice";
  const isFreeText = activityType === "text";
  const isFlashcards = activityType === "flashcards";

  const resultsByQuestionId = useMemo(() => {
    const results = Array.isArray(attemptResult?.results)
      ? attemptResult.results
      : [];
    return results.reduce((acc, r) => {
      acc[String(r.question_id)] = r;
      return acc;
    }, {});
  }, [attemptResult]);

  const questionCount = questions.length;
  const clampedIndex = Math.min(
    Math.max(currentQuestionIndex, 0),
    Math.max(questionCount - 1, 0)
  );
  const currentQuestion = questionCount ? questions[clampedIndex] : null;

  const submissionDraft = useMemo(() => {
    // This is intentionally not sent anywhere yet.
    // It collects all user responses in a shape ready for a backend "check" endpoint.
    const answerPayload = questions.map((q) => {
      const qid = String(q._id);
      if (isMultipleChoice) {
        return {
          question_id: qid,
          selected_answer_ids: multipleChoiceAnswersByQuestionId[qid] || [],
        };
      }
      if (isFreeText) {
        return {
          question_id: qid,
          text_answer: freeTextAnswersByQuestionId[qid] || "",
        };
      }
      // flashcards: no answers tracked
      return { question_id: qid };
    });

    return {
      activity_id: activityId,
      activity_type: activityType,
      answers: answerPayload,
    };
  }, [
    activityId,
    activityType,
    freeTextAnswersByQuestionId,
    isFreeText,
    isMultipleChoice,
    multipleChoiceAnswersByQuestionId,
    questions,
  ]);

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
    setIsStarted(false);
    setCurrentQuestionIndex(0);
    setMultipleChoiceAnswersByQuestionId({});
    setFreeTextAnswersByQuestionId({});
    setAttemptResult(null);
    setIsSubmitting(false);
    onClose();
  };

  const handleStart = () => {
    if (!activity || !questionCount) return;
    setIsStarted(true);
    setCurrentQuestionIndex(0);
  };

  const goPrev = () => {
    setCurrentQuestionIndex((idx) => {
      if (idx <= 0) {
        setIsStarted(false);
        return 0;
      }
      return idx - 1;
    });
  };

  const goNext = () => {
    setCurrentQuestionIndex((idx) => Math.min(idx + 1, questionCount - 1));
  };

  const handleFinish = async () => {
    if (!activityId || !activityType) return;
    if (isFlashcards) return;
    if (attemptResult || isSubmitting) return;

    setIsSubmitting(true);
    try {
      const response = await activityApi.submitAttempt(activityId, {
        answers: submissionDraft.answers,
      });
      if (!response?.status) {
        throw new Error(response?.message || "Failed to submit attempt");
      }
      setAttemptResult(response.data);
    } catch (err) {
      toast({
        title: "Error",
        description: err?.message || "Failed to submit attempt",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="4xl"
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent
        bg="#1E293B"
        borderColor="#334155"
        borderWidth="1px"
        h="calc(100vh - 8rem)"
        maxH="calc(100vh - 8rem)"
        display="flex"
        flexDirection="column"
      >
        <ModalHeader color="white">
          <Text noOfLines={1}>{headerTitle}</Text>
          <Flex align="center" justify={"center"} w="100%">
            {isStarted && questionCount > 0 && (
              <Text color="gray.300" fontSize="sm" whiteSpace="nowrap">
                {`Question ${clampedIndex + 1} / ${questionCount}`}
              </Text>
            )}

            <ModalCloseButton color="white" />
          </Flex>
        </ModalHeader>

        <ModalBody overflowY="auto" flex="1">
          {isLoading ? (
            <Flex align="center" justify="center" py={10}>
              <Spinner color="#3B82F6" thickness="3px" />
            </Flex>
          ) : !activity ? (
            <Text color="gray.400">No activity loaded.</Text>
          ) : !isStarted ? (
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
          ) : !currentQuestion ? (
            <Text color="gray.400">No questions available.</Text>
          ) : (
            <Box>
              {isMultipleChoice && (
                <MultipleChoiceActivityRunner
                  question={currentQuestion}
                  value={
                    multipleChoiceAnswersByQuestionId[
                      String(currentQuestion._id)
                    ] || []
                  }
                  isReadOnly={Boolean(attemptResult) || isSubmitting}
                  result={resultsByQuestionId[String(currentQuestion._id)]}
                  onChange={(nextSelectedIds) => {
                    if (attemptResult || isSubmitting) return;
                    setMultipleChoiceAnswersByQuestionId((prev) => ({
                      ...prev,
                      [String(currentQuestion._id)]: nextSelectedIds,
                    }));
                  }}
                />
              )}

              {isFreeText && (
                <FreeTextActivityRunner
                  question={currentQuestion}
                  value={
                    freeTextAnswersByQuestionId[String(currentQuestion._id)] ||
                    ""
                  }
                  isReadOnly={Boolean(attemptResult) || isSubmitting}
                  result={resultsByQuestionId[String(currentQuestion._id)]}
                  onChange={(nextText) => {
                    if (attemptResult || isSubmitting) return;
                    setFreeTextAnswersByQuestionId((prev) => ({
                      ...prev,
                      [String(currentQuestion._id)]: nextText,
                    }));
                  }}
                />
              )}

              {isFlashcards && (
                <FlashcardsActivityRunner question={currentQuestion} />
              )}
            </Box>
          )}
        </ModalBody>

        <ModalFooter>
          {isStarted && questionCount > 0 && (
            <Flex align="center" w="100%" justify="space-between" mt={5}>
              <Button
                colorScheme="blue"
                varianrt="solid"
                cursor="pointer"
                onClick={goPrev}
                transition="all 0.3s ease"
                marginLeft={2}
              >
                PREV
              </Button>

              {clampedIndex >= questionCount - 1 ? (
                <Button
                  colorScheme="blue"
                  varianrt="solid"
                  cursor="pointer"
                  onClick={goNext}
                  transition="all 0.3s ease"
                  marginLeft={2}
                >
                  FINISH
                </Button>
              ) : (
                <Button
                  colorScheme="blue"
                  varianrt="solid"
                  cursor="pointer"
                  onClick={goNext}
                  transition="all 0.3s ease"
                  marginLeft={2}
                >
                  NEXT
                </Button>
              )}
            </Flex>
          )}
          {!isStarted && (
            <Button
              colorScheme="blue"
              varianrt="solid"
              cursor="pointer"
              isDisabled={!activityId || isLoading || !questionCount}
              onClick={handleStart}
              transition="all 0.3s ease"
              marginLeft={2}
            >
              START
            </Button>
          )}
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default ActivityModal;
