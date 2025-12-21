import React from "react";
import { Box, Text, Textarea, VStack } from "@chakra-ui/react";

const FreeTextActivityRunner = ({
  question,
  value,
  onChange,
  isReadOnly,
  result,
}) => {
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
          Your answer
        </Text>
        <Textarea
          value={typeof value === "string" ? value : ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder="Type your answer..."
          color="white"
          bg="#0F172A"
          borderColor="#334155"
          _hover={{ borderColor: "#3B82F6" }}
          _focus={{ borderColor: "#3B82F6", boxShadow: "none" }}
          minH="140px"
          isReadOnly={Boolean(isReadOnly)}
        />
      </Box>
    </VStack>
  );
};

export default FreeTextActivityRunner;
