import React, { useEffect, useMemo, useState } from "react";
import { Box, Text, VStack, Flex } from "@chakra-ui/react";

const getBackText = (question) => {
  const answers = Array.isArray(question?.answers) ? question.answers : [];
  const first = answers.find((a) => typeof a?.answer === "string" && a.answer);
  return first?.answer || "";
};

const Flashcard = ({ frontText, backText, cardId }) => {
  const [flipped, setFlipped] = useState(false);

  useEffect(() => {
    setFlipped(false);
  }, [cardId]);

  return (
    <Box
      bg={flipped ? "#180f2a" : "#0F172A"}
      border="1px solid"
      borderRadius="md"
      boxShadow="sm"
      p={6}
      onClick={() => setFlipped((v) => !v)}
      cursor="pointer"
      userSelect="none"
      w="600px"
      h="400px"
      position="relative"
      transition="all 0.2s ease-in-out"
      _hover={{
        transform: "scale(1.01)",
        boxShadow: "md",
        borderColor: "red.500",
      }}
    >
      <Text
        position="absolute"
        top={2}
        left={2}
        color="gray.500"
        fontSize="xs"
        lineHeight="short"
      >
        {flipped ? "Answer" : "Question"}
      </Text>

      <Flex alignItems="center" justifyContent="center" h="100%">
        <Text
          color="white"
          whiteSpace="pre-wrap"
          textAlign="center"
          w="100%"
          overflow="auto"
          maxH="100%"
          px={4}
        >
          {flipped ? backText : frontText}
        </Text>
      </Flex>
    </Box>
  );
};

const FlashcardsActivityRunner = ({ question }) => {
  const front = useMemo(
    () => (typeof question?.question === "string" ? question.question : ""),
    [question]
  );
  const back = useMemo(() => getBackText(question), [question]);
  const cardId = question?._id || front;

  return (
    <VStack align="stretch" spacing={4}>
      <Flashcard
        cardId={cardId}
        frontText={front || ""}
        backText={back || "(no back provided)"}
      />
    </VStack>
  );
};

export default FlashcardsActivityRunner;
