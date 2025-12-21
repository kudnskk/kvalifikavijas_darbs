import React, { useMemo, useState } from "react";
import { Box, Button, Divider, Text, VStack } from "@chakra-ui/react";

const getBackText = (question) => {
  const answers = Array.isArray(question?.answers) ? question.answers : [];
  const first = answers.find((a) => typeof a?.answer === "string" && a.answer);
  return first?.answer || "";
};

const FlashcardsActivityRunner = ({ question }) => {
  const [isRevealed, setIsRevealed] = useState(false);

  const back = useMemo(() => getBackText(question), [question]);

  return (
    <VStack align="stretch" spacing={4}>
      <Box
        bg="#0F172A"
        border="1px solid"
        borderColor="#334155"
        borderRadius="md"
        p={4}
      >
        <Text color="gray.300" fontSize="sm" mb={1}>
          Front
        </Text>
        <Text color="white" whiteSpace="pre-wrap">
          {question?.question || ""}
        </Text>

        <Divider borderColor="#334155" my={4} />

        <Button
          variant="ghost"
          color="gray.300"
          _hover={{ bg: "#334155" }}
          onClick={() => setIsRevealed((v) => !v)}
          alignSelf="flex-start"
          mb={2}
        >
          {isRevealed ? "Hide back" : "Show back"}
        </Button>

        {isRevealed && (
          <Box>
            <Text color="gray.300" fontSize="sm" mb={1}>
              Back
            </Text>
            <Text color="white" whiteSpace="pre-wrap">
              {back || "(no back provided)"}
            </Text>
          </Box>
        )}
      </Box>

      <Text color="gray.500" fontSize="sm">
        Flashcards are not submitted.
      </Text>
    </VStack>
  );
};

export default FlashcardsActivityRunner;
