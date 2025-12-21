import React, { useMemo } from "react";
import { Box, Flex, Text, VStack } from "@chakra-ui/react";

const normalizeAnswers = (question) => {
  const answers = Array.isArray(question?.answers) ? question.answers : [];
  return answers
    .map((a) => ({
      _id: a?._id,
      answer: typeof a?.answer === "string" ? a.answer : "",
    }))
    .filter((a) => a._id && a.answer);
};

const MultipleChoiceActivityRunner = ({
  question,
  value,
  onChange,
  isReadOnly,
  result,
}) => {
  const answers = useMemo(() => normalizeAnswers(question), [question]);
  const selectedIds = Array.isArray(value) ? value : [];

  const toggle = (answerId) => {
    if (isReadOnly) return;
    if (!answerId) return;
    const isSelected = selectedIds.includes(answerId);
    const next = isSelected
      ? selectedIds.filter((id) => id !== answerId)
      : [...selectedIds, answerId];
    onChange(next);
  };

  return (
    <VStack align="stretch" spacing={4}>
      <Box>
        <Text color="gray.300" fontSize="sm" mb={1}>
          Question
        </Text>
        <Text color="white" whiteSpace="pre-wrap">
          {question?.question || ""}
        </Text>
        {typeof result?.is_correct === "boolean" && (
          <Text
            mt={2}
            fontSize="sm"
            color={result.is_correct ? "#3B82F6" : "gray.400"}
          >
            {result.is_correct ? "Correct" : "Incorrect"}
          </Text>
        )}
      </Box>

      <Box>
        <Text color="gray.300" fontSize="sm" mb={2}>
          Answers
        </Text>
        <VStack align="stretch" spacing={2}>
          {answers.map((a) => {
            const active = selectedIds.includes(a._id);
            return (
              <Flex
                key={a._id}
                role="button"
                tabIndex={0}
                align="center"
                justify="space-between"
                bg={active ? "#334155" : "#0F172A"}
                border="1px solid"
                borderColor={active ? "#3B82F6" : "#334155"}
                borderRadius="md"
                px={3}
                py={3}
                cursor={isReadOnly ? "default" : "pointer"}
                transition="all 0.15s"
                _hover={{ borderColor: "#3B82F6" }}
                onClick={() => toggle(a._id)}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    toggle(a._id);
                  }
                }}
              >
                <Text color="gray.200">{a.answer}</Text>
                {active && (
                  <Text color="#3B82F6" fontSize="sm">
                    selected
                  </Text>
                )}
              </Flex>
            );
          })}

          {!answers.length && (
            <Text color="gray.500" fontSize="sm">
              No answers available.
            </Text>
          )}
        </VStack>
      </Box>
    </VStack>
  );
};

export default MultipleChoiceActivityRunner;
