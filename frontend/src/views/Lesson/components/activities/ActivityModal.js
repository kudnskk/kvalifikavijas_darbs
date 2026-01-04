import React, { useEffect, useMemo, useState } from "react";
import {
  Accordion,
  AccordionButton,
  AccordionIcon,
  AccordionItem,
  AccordionPanel,
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
  useDisclosure,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
} from "@chakra-ui/react";

import { FaChevronLeft, FaChevronRight } from "react-icons/fa";
import { RxHamburgerMenu } from "react-icons/rx";

import { activityApi } from "../../../../api";
import AcceptModal from "../../../../components/AcceptModal";

import MultipleChoiceActivityRunner from "./MultipleChoiceActivityRunner";
import FreeTextActivityRunner from "./FreeTextActivityRunner";
import FlashcardsActivityRunner from "./FlashcardsActivityRunner";

export const ActivityModal = ({
  isOpen,
  onClose,
  activityId,
  onActivityDeleted,
}) => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [activityData, setActivityData] = useState(null);
  const [attemptHistory, setAttemptHistory] = useState([]);
  const [isHistoryLoading, setIsHistoryLoading] = useState(false);
  const [isStarted, setIsStarted] = useState(false);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [attemptResult, setAttemptResult] = useState(null);

  const [isExplaining, setIsExplaining] = useState(false);
  const [mistakeExplanations, setMistakeExplanations] = useState(null);
  const [mistakesAttemptId, setMistakesAttemptId] = useState(null);

  const [isDeleting, setIsDeleting] = useState(false);
  const {
    isOpen: isDeleteModalOpen,
    onOpen: onDeleteModalOpen,
    onClose: onDeleteModalClose,
  } = useDisclosure();

  const [isRegenerating, setIsRegenerating] = useState(false);
  const {
    isOpen: isRegenerateModalOpen,
    onOpen: onRegenerateModalOpen,
    onClose: onRegenerateModalClose,
  } = useDisclosure();

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

  const isShowingResults = Boolean(attemptResult);

  const attemptResultsByQuestionId = useMemo(() => {
    const results = Array.isArray(attemptResult?.results)
      ? attemptResult.results
      : [];
    return results.reduce((acc, r) => {
      acc[String(r.question_id)] = r;
      return acc;
    }, {});
  }, [attemptResult]);

  const questionCount = questions.length;
  const maxScore =
    activity?.max_score ?? activity?.question_count ?? questionCount;
  const isShowingMistakes = Boolean(mistakesAttemptId);
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

        const loadedType = response?.data?.activity?.type;
        if (loadedType === "multiple-choice" || loadedType === "text") {
          if (!cancelled)
            setAttemptHistory(
              Array.isArray(response?.data?.attempts)
                ? response.data.attempts
                : []
            );
        } else {
          if (!cancelled) setAttemptHistory([]);
        }
      } catch (err) {
        if (!cancelled) setActivityData(null);
        if (!cancelled) setAttemptHistory([]);
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
    setAttemptHistory([]);

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

  const handleBackToStart = () => {
    setIsStarted(false);
    setCurrentQuestionIndex(0);
    setMultipleChoiceAnswersByQuestionId({});
    setFreeTextAnswersByQuestionId({});
    setAttemptResult(null);
    setIsSubmitting(false);

    setMistakeExplanations(null);
    setMistakesAttemptId(null);
    setIsExplaining(false);

    if (!activityId) return;

    (async () => {
      setIsHistoryLoading(true);
      try {
        const response = await activityApi.getActivityById(activityId);
        if (!response?.status) {
          throw new Error(response?.message || "Failed to load activity");
        }

        setActivityData(response.data);

        const loadedType = response?.data?.activity?.type;
        if (loadedType === "multiple-choice" || loadedType === "text") {
          setAttemptHistory(
            Array.isArray(response?.data?.attempts)
              ? response.data.attempts
              : []
          );
        } else {
          setAttemptHistory([]);
        }
      } catch (err) {
        toast({
          title: "Error",
          description: err?.message || "Failed to load activity",
          status: "error",
          duration: 4000,
          isClosable: true,
        });
      } finally {
        setIsHistoryLoading(false);
      }
    })();
  };

  const handleExplainMistakes = async (attemptId) => {
    if (!activityId || !attemptId) return;
    if (isFlashcards) return;
    if (!(isMultipleChoice || isFreeText)) return;
    if (isExplaining) return;

    setIsExplaining(true);
    setMistakeExplanations(null);
    setMistakesAttemptId(String(attemptId));
    try {
      console.log("Calling explainMistakes API with:", {
        activityId,
        attemptId,
      });
      const response = await activityApi.explainMistakes(activityId, attemptId);
      console.log("API response received:", response);

      if (!response?.status) {
        console.error("Response status is falsy:", response);
        throw new Error(response?.message || "Failed to explain mistakes");
      }

      console.log("Response data:", response?.data);
      const explanations = Array.isArray(response?.data?.explanations)
        ? response.data.explanations
        : [];

      console.log("Extracted explanations:", explanations);

      if (!explanations.length) {
        throw new Error("No explanations returned");
      }

      setMistakeExplanations(explanations);
      console.log("Mistake explanations set successfully");
    } catch (err) {
      console.error("Error in handleExplainMistakes:", err);
      console.error("Error details:", {
        message: err?.message,
        response: err?.response,
        data: err?.response?.data,
      });
      toast({
        title: "Error",
        description:
          err?.message ||
          err?.response?.data?.message ||
          "Failed to explain mistakes",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
      setMistakeExplanations(null);
      setMistakesAttemptId(null);
    } finally {
      setIsExplaining(false);
    }
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

  const handleDeleteActivity = async () => {
    if (!activityId) return;
    setIsDeleting(true);
    try {
      const response = await activityApi.deleteActivity(activityId);
      if (response.status) {
        toast({
          title: "Success",
          description: response.message || "Activity deleted successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        onDeleteModalClose();
        handleClose();
        if (onActivityDeleted) {
          onActivityDeleted(activityId);
        }
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to delete activity",
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
      setIsDeleting(false);
    }
  };

  const handleRegenerateActivity = async () => {
    if (!activityId) return;
    setIsRegenerating(true);
    try {
      const response = await activityApi.regenerateActivity(activityId);
      if (response.status) {
        toast({
          title: "Success",
          description: response.message || "Activity regenerated successfully",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        onRegenerateModalClose();

        // Reload activity data
        setIsLoading(true);
        try {
          const freshData = await activityApi.getActivityById(activityId);
          if (freshData?.status && freshData?.data) {
            setActivityData(freshData.data);
          }
        } catch (err) {
          console.error("Failed to reload activity:", err);
        } finally {
          setIsLoading(false);
        }

        // Reset state to start view
        handleBackToStart();
      } else {
        toast({
          title: "Error",
          description: response.message || "Failed to regenerate activity",
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
        "Failed to regenerate activity";
      toast({
        title: "Error",
        description: message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsRegenerating(false);
    }
  };

  return (
    <>
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
          <ModalHeader
            color="white"
            borderBottomWidth={"1px"}
            borderColor="#334155"
          >
            <Flex align="center" justify="space-between" w="100%">
              <Text noOfLines={1} flex="1">
                {headerTitle}
              </Text>

              {!isStarted && !isShowingMistakes && activity && (
                <>
                  <Button
                    bg="#3B82F6"
                    color="white"
                    _hover={{ bg: "#2563EB" }}
                    variant="solid"
                    size="sm"
                    cursor="pointer"
                    onClick={onRegenerateModalOpen}
                    transition="all 0.3s ease"
                    mr={2}
                  >
                    REGENERATE
                  </Button>
                  <Button
                    colorScheme="red"
                    variant="solid"
                    size="sm"
                    cursor="pointer"
                    onClick={onDeleteModalOpen}
                    transition="all 0.3s ease"
                    mr={2}
                  >
                    DELETE ACTIVITY
                  </Button>
                </>
              )}

              <ModalCloseButton
                color="white"
                position="relative"
                top="0"
                right="0"
              />
            </Flex>

            <Flex align="center" justify={"center"} w="100%" mt={2}>
              {isStarted && !isShowingResults && questionCount > 0 && (
                <Text color="gray.300" fontSize="sm" whiteSpace="nowrap">
                  {`Question ${clampedIndex + 1} / ${questionCount}`}
                </Text>
              )}
            </Flex>
          </ModalHeader>

          <ModalBody overflowY="auto" flex="1">
            {isLoading ? (
              <Flex align="center" justify="center" py={10}>
                <Spinner color="#3B82F6" thickness="3px" />
              </Flex>
            ) : !activity ? (
              <Text color="gray.400">No activity loaded.</Text>
            ) : isShowingMistakes && (isMultipleChoice || isFreeText) ? (
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Text color="gray.200" fontWeight="semibold" mb={2}>
                    Mistakes explanation
                  </Text>

                  {isExplaining ? (
                    <Flex align="center" justify="center" py={6}>
                      <Spinner color="#3B82F6" thickness="3px" />
                    </Flex>
                  ) : !mistakeExplanations ||
                    mistakeExplanations.length === 0 ? (
                    <Text color="gray.400" fontSize="sm">
                      No mistakes to explain.
                    </Text>
                  ) : (
                    <VStack align="stretch" spacing={3}>
                      {mistakeExplanations.map((ex, idx) => {
                        const qid = String(ex?.question_id || "");
                        const q = questions.find(
                          (qq) => String(qq._id) === qid
                        );

                        return (
                          <Box
                            key={qid || idx}
                            bg="#0F172A"
                            border="1px solid"
                            borderColor="#334155"
                            borderRadius="md"
                            p={4}
                          >
                            <Text color="gray.300" fontSize="sm" mb={2}>
                              {q ? q.question : `Question ${idx + 1}`}
                            </Text>
                            <Divider borderColor="#334155" mb={3} />
                            <Text color="white" whiteSpace="pre-wrap" mb={3}>
                              {String(ex?.explanation || "")}
                            </Text>
                            <Text color="gray.300" fontSize="sm" mb={1}>
                              Correct answer
                            </Text>
                            <Text color="gray.200" whiteSpace="pre-wrap">
                              {String(ex?.correct_answer || "")}
                            </Text>
                          </Box>
                        );
                      })}
                    </VStack>
                  )}
                </Box>
              </VStack>
            ) : isStarted &&
              isShowingResults &&
              (isMultipleChoice || isFreeText) ? (
              <VStack align="stretch" spacing={4}>
                <Box
                  bg="#0F172A"
                  border="1px solid"
                  borderColor="#334155"
                  borderRadius="md"
                  p={4}
                >
                  <Text color="gray.300" fontSize="sm" mb={1}>
                    Score
                  </Text>
                  <Text color="white" fontSize="2xl" fontWeight="semibold">
                    {`${Number(attemptResult?.attempt?.score || 0)}/${
                      activity?.max_score ??
                      activity?.question_count ??
                      questionCount
                    }`}
                  </Text>
                </Box>

                <Box>
                  <Text color="gray.200" fontWeight="semibold" mb={2}>
                    Attempt details
                  </Text>

                  <Accordion allowMultiple>
                    <AccordionItem borderColor="#334155">
                      <AccordionButton bg="#0F172A" _hover={{ bg: "#0F172A" }}>
                        <Flex align="center" justify="space-between" w="100%">
                          <Text color="white" fontWeight="semibold">
                            This attempt
                          </Text>
                          <Flex align="center" gap={3}>
                            <Text color="gray.300" fontSize="sm">
                              {`${Number(
                                attemptResult?.attempt?.score || 0
                              )}/${maxScore}`}
                            </Text>
                            <AccordionIcon color="gray.300" />
                          </Flex>
                        </Flex>
                      </AccordionButton>

                      <AccordionPanel bg="#1E293B">
                        <Flex justify={"flex-end"} mb={2}>
                          <Button
                            colorScheme="red"
                            variant="solid"
                            isDisabled={
                              Number(attemptResult?.attempt?.score) ===
                              Number(maxScore)
                            }
                            cursor="pointer"
                            onClick={() =>
                              handleExplainMistakes(attemptResult?.attempt?._id)
                            }
                            transition="all 0.3s ease"
                          >
                            EXPLAIN MISTAKES
                          </Button>
                        </Flex>
                        <VStack align="stretch" spacing={3}>
                          {questions.map((q, idx) => {
                            const qid = String(q._id);
                            const attemptAnswer =
                              attemptResultsByQuestionId[qid];

                            const selectedAnswerIds = Array.isArray(
                              attemptAnswer?.selected_answer_ids
                            )
                              ? attemptAnswer.selected_answer_ids.map(String)
                              : [];

                            const isCorrect = Boolean(
                              attemptAnswer?.is_correct
                            );

                            return (
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
                                <Text
                                  color="white"
                                  mb={2}
                                  whiteSpace="pre-wrap"
                                >
                                  {q.question}
                                </Text>

                                {isMultipleChoice &&
                                  Array.isArray(q.answers) &&
                                  q.answers.length > 0 && (
                                    <VStack align="stretch" spacing={2}>
                                      {q.answers.map((a, ai) => {
                                        const aid = String(a._id);
                                        const isSelected =
                                          selectedAnswerIds.includes(aid);
                                        const isSelectedCorrect =
                                          isSelected && a.is_correct;
                                        const isSelectedWrong =
                                          isSelected && !a.is_correct;

                                        return (
                                          <Flex
                                            key={a._id || ai}
                                            align="center"
                                            justify="space-between"
                                            bg={
                                              isSelectedCorrect
                                                ? "green.900"
                                                : isSelectedWrong
                                                ? "red.900"
                                                : "#1E293B"
                                            }
                                            borderRadius="md"
                                            px={3}
                                            py={2}
                                            border="1px solid"
                                            borderColor={
                                              isSelectedCorrect
                                                ? "green.400"
                                                : isSelectedWrong
                                                ? "red.400"
                                                : "#334155"
                                            }
                                          >
                                            <Text color="gray.200">
                                              {a.answer}
                                            </Text>
                                            {a.is_correct ? (
                                              <Text
                                                color="#3B82F6"
                                                fontSize="sm"
                                              >
                                                correct
                                              </Text>
                                            ) : (
                                              <Text
                                                color="gray.500"
                                                fontSize="sm"
                                              ></Text>
                                            )}
                                          </Flex>
                                        );
                                      })}
                                    </VStack>
                                  )}

                                {isFreeText && (
                                  <Box>
                                    <Flex
                                      align="center"
                                      justify="space-between"
                                      bg={isCorrect ? "green.900" : "red.900"}
                                      borderRadius="md"
                                      px={3}
                                      py={2}
                                      border="1px solid"
                                      borderColor={
                                        isCorrect ? "green.400" : "red.400"
                                      }
                                    >
                                      <Text color="gray.200">
                                        {String(
                                          attemptAnswer?.text_answer || ""
                                        ) || "(no answer)"}
                                      </Text>
                                      <Text
                                        color={
                                          isCorrect ? "green.200" : "red.200"
                                        }
                                        fontSize="sm"
                                      >
                                        {isCorrect ? "correct" : "wrong"}
                                      </Text>
                                    </Flex>
                                  </Box>
                                )}
                              </Box>
                            );
                          })}
                        </VStack>
                      </AccordionPanel>
                    </AccordionItem>
                  </Accordion>
                </Box>
              </VStack>
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
                    {((isMultipleChoice || isFreeText) &&
                      "Completion History") ||
                      "Question"}
                  </Text>

                  {(isMultipleChoice || isFreeText) && (
                    <Box>
                      {isHistoryLoading ? (
                        <Flex align="center" justify="center" py={4}>
                          <Spinner color="#3B82F6" thickness="3px" />
                        </Flex>
                      ) : attemptHistory.length === 0 ? (
                        <Text color="gray.400" fontSize="sm">
                          No attempts yet.
                        </Text>
                      ) : (
                        <Accordion allowMultiple>
                          {attemptHistory.map((attempt, attemptIndex) => {
                            const maxScore = activity?.max_score;
                            const score = Number(attempt?.score || 0);
                            const attemptAnswers = Array.isArray(
                              attempt?.answers
                            )
                              ? attempt.answers
                              : [];
                            const attemptAnswersByQuestionId =
                              attemptAnswers.reduce((acc, ans) => {
                                acc[String(ans.activity_question_id)] = ans;
                                return acc;
                              }, {});

                            return (
                              <AccordionItem
                                key={attempt?._id || attemptIndex}
                                borderColor="#334155"
                              >
                                <AccordionButton
                                  bg="#0F172A"
                                  _hover={{ bg: "#0F172A" }}
                                >
                                  <Flex
                                    align="center"
                                    justify="space-between"
                                    w="100%"
                                  >
                                    <Text color="white" fontWeight="semibold">
                                      {`Attempt ${attemptIndex + 1}`}
                                    </Text>
                                    <Flex align="center" gap={3}>
                                      <Text color="gray.300" fontSize="sm">
                                        {`${score}/${maxScore}`}
                                      </Text>
                                      <AccordionIcon color="gray.300" />
                                    </Flex>
                                  </Flex>
                                </AccordionButton>

                                <AccordionPanel bg="#1E293B">
                                  <Flex justify={"flex-end"} mb={2}>
                                    <Button
                                      colorScheme="red"
                                      variant="solid"
                                      isDisabled={
                                        score === maxScore ? true : false
                                      }
                                      cursor="pointer"
                                      onClick={() =>
                                        handleExplainMistakes(attempt?._id)
                                      }
                                      transition="all 0.3s ease"
                                    >
                                      EXPLAIN MISTAKES
                                    </Button>
                                  </Flex>
                                  <VStack align="stretch" spacing={3}>
                                    {questions.map((q, idx) => {
                                      const qid = String(q._id);
                                      const attemptAnswer =
                                        attemptAnswersByQuestionId[qid];

                                      const selectedAnswerIds = Array.isArray(
                                        attemptAnswer?.activity_answer_id
                                      )
                                        ? attemptAnswer.activity_answer_id.map(
                                            String
                                          )
                                        : [];

                                      const isCorrect = Boolean(
                                        attemptAnswer?.is_correct
                                      );

                                      return (
                                        <Box
                                          key={q._id || idx}
                                          bg="#0F172A"
                                          border="1px solid"
                                          borderColor="#334155"
                                          borderRadius="md"
                                          p={3}
                                        >
                                          <Text
                                            color="gray.300"
                                            fontSize="sm"
                                            mb={2}
                                          >
                                            {idx + 1}.
                                          </Text>
                                          <Text
                                            color="white"
                                            mb={2}
                                            whiteSpace="pre-wrap"
                                          >
                                            {q.question}
                                          </Text>

                                          {isMultipleChoice &&
                                            Array.isArray(q.answers) &&
                                            q.answers.length > 0 && (
                                              <VStack
                                                align="stretch"
                                                spacing={2}
                                              >
                                                {q.answers.map((a, ai) => {
                                                  const aid = String(a._id);
                                                  const isSelected =
                                                    selectedAnswerIds.includes(
                                                      aid
                                                    );
                                                  const isSelectedCorrect =
                                                    isSelected && a.is_correct;
                                                  const isSelectedWrong =
                                                    isSelected && !a.is_correct;

                                                  return (
                                                    <Flex
                                                      key={a._id || ai}
                                                      align="center"
                                                      justify="space-between"
                                                      bg={
                                                        isSelectedCorrect
                                                          ? "green.900"
                                                          : isSelectedWrong
                                                          ? "red.900"
                                                          : "#1E293B"
                                                      }
                                                      borderRadius="md"
                                                      px={3}
                                                      py={2}
                                                      border="1px solid"
                                                      borderColor={
                                                        isSelectedCorrect
                                                          ? "green.400"
                                                          : isSelectedWrong
                                                          ? "red.400"
                                                          : "#334155"
                                                      }
                                                    >
                                                      <Text color="gray.200">
                                                        {a.answer}
                                                      </Text>
                                                      {a.is_correct ? (
                                                        <Text
                                                          color="#3B82F6"
                                                          fontSize="sm"
                                                        >
                                                          correct
                                                        </Text>
                                                      ) : (
                                                        <Text
                                                          color="gray.500"
                                                          fontSize="sm"
                                                        ></Text>
                                                      )}
                                                    </Flex>
                                                  );
                                                })}
                                              </VStack>
                                            )}

                                          {isFreeText && (
                                            <Box>
                                              <Flex
                                                align="center"
                                                justify="space-between"
                                                bg={
                                                  isCorrect
                                                    ? "green.900"
                                                    : "red.900"
                                                }
                                                borderRadius="md"
                                                px={3}
                                                py={2}
                                                border="1px solid"
                                                borderColor={
                                                  isCorrect
                                                    ? "green.400"
                                                    : "red.400"
                                                }
                                              >
                                                <Text color="gray.200">
                                                  {String(
                                                    attemptAnswer?.text_answer ||
                                                      ""
                                                  ) || "(no answer)"}
                                                </Text>
                                                <Text
                                                  color={
                                                    isCorrect
                                                      ? "green.200"
                                                      : "red.200"
                                                  }
                                                  fontSize="sm"
                                                >
                                                  {isCorrect
                                                    ? "correct"
                                                    : "wrong"}
                                                </Text>
                                              </Flex>
                                            </Box>
                                          )}
                                        </Box>
                                      );
                                    })}
                                  </VStack>
                                </AccordionPanel>
                              </AccordionItem>
                            );
                          })}
                        </Accordion>
                      )}
                    </Box>
                  )}
                  {isFlashcards && (
                    <Accordion allowToggle>
                      <AccordionItem borderColor="#334155">
                        <AccordionButton
                          bg="#0F172A"
                          _hover={{ bg: "#0F172A" }}
                        >
                          <Flex align="center" justify="space-between" w="100%">
                            <Text color="gray.200" fontWeight="semibold">
                              Open activity questions
                            </Text>
                            <AccordionIcon color="gray.300" />
                          </Flex>
                        </AccordionButton>
                        <AccordionPanel bg="#1E293B" pt={3}>
                          <VStack align="stretch" spacing={3}>
                            {questions.map((q, i) => (
                              <Box
                                key={i}
                                bg="#0F172A"
                                border="1px solid"
                                borderColor="#334155"
                                borderRadius="md"
                                p={3}
                              >
                                <Text color="gray.300" fontSize="sm" mb={2}>
                                  {i + 1}.
                                </Text>
                                <Text
                                  color="white"
                                  mb={2}
                                  whiteSpace="pre-wrap"
                                >
                                  {q.question}
                                </Text>
                                {Array.isArray(q.answers) &&
                                  q.answers.length > 0 && (
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
                                          <Text color="gray.200">
                                            {a.answer}
                                          </Text>
                                        </Flex>
                                      ))}
                                    </VStack>
                                  )}
                              </Box>
                            ))}
                          </VStack>
                        </AccordionPanel>
                      </AccordionItem>
                    </Accordion>
                  )}
                </Box>
              </VStack>
            ) : !currentQuestion ? (
              <Text color="gray.400">No questions available.</Text>
            ) : (
              <Box w="100%">
                {isMultipleChoice && (
                  <MultipleChoiceActivityRunner
                    question={currentQuestion}
                    value={
                      multipleChoiceAnswersByQuestionId[
                        String(currentQuestion._id)
                      ] || []
                    }
                    isReadOnly={Boolean(isSubmitting)}
                    onChange={(nextSelectedIds) => {
                      if (isSubmitting) return;
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
                      freeTextAnswersByQuestionId[
                        String(currentQuestion._id)
                      ] || ""
                    }
                    isReadOnly={Boolean(isSubmitting)}
                    onChange={(nextText) => {
                      if (isSubmitting) return;
                      setFreeTextAnswersByQuestionId((prev) => ({
                        ...prev,
                        [String(currentQuestion._id)]: nextText,
                      }));
                    }}
                  />
                )}

                {isFlashcards && (
                  <Flex justify="center" w="100%">
                    <FlashcardsActivityRunner question={currentQuestion} />
                  </Flex>
                )}
              </Box>
            )}
          </ModalBody>

          <ModalFooter>
            {isShowingMistakes && (isMultipleChoice || isFreeText) && (
              <Flex align="center" w="100%" justify="flex-end" mt={5}>
                <Button
                  colorScheme="blue"
                  variant="solid"
                  cursor="pointer"
                  onClick={handleBackToStart}
                  transition="all 0.3s ease"
                  marginLeft={2}
                >
                  BACK TO START
                </Button>
              </Flex>
            )}

            {isStarted &&
              !isShowingMistakes &&
              isShowingResults &&
              (isMultipleChoice || isFreeText) && (
                <Flex align="center" w="100%" justify="flex-end" mt={5}>
                  <Button
                    colorScheme="blue"
                    variant="solid"
                    cursor="pointer"
                    onClick={handleBackToStart}
                    transition="all 0.3s ease"
                    marginLeft={2}
                  >
                    BACK TO START
                  </Button>
                </Flex>
              )}

            {isStarted &&
              !isShowingResults &&
              !isShowingMistakes &&
              questionCount > 0 && (
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
                      variant="solid"
                      cursor="pointer"
                      onClick={isFlashcards ? handleClose : handleFinish}
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
            {!isStarted && !isShowingMistakes && (
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

      <AcceptModal
        isOpen={isDeleteModalOpen}
        onClose={onDeleteModalClose}
        title="Delete activity"
        description="Are you sure you want to permanently delete this activity? All related data including questions, answers, and attempts will be deleted."
        handleAction={handleDeleteActivity}
        confirmText="DELETE"
        isLoading={isDeleting}
      />

      <AcceptModal
        isOpen={isRegenerateModalOpen}
        onClose={onRegenerateModalClose}
        title="Regenerate activity"
        description="This will generate entirely new questions for this activity. All previous questions, answers, and attempt history will be permanently deleted. Are you sure you want to continue?"
        handleAction={handleRegenerateActivity}
        confirmText="REGENERATE"
        isLoading={isRegenerating}
      />
    </>
  );
};

export default ActivityModal;
