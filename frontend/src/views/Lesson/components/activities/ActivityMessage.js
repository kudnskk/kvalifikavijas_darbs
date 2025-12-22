import React, { useRef } from "react";
import { Box, Flex, Icon, Text } from "@chakra-ui/react";

import { FaPlay, FaRegStar } from "react-icons/fa";

const ActivityMessage = ({ onOpen, type, title }) => {
  return (
    <Box bg={"gray.100"} p={3} borderRadius="md" maxW="30%" mb={2}>
      <Flex direction="column" gap={1}>
        <Text color="black" mb={2}>
          Title: {title}
        </Text>
        <Text color="black" mb={2}>
          Type: {type}
        </Text>
        <Box
          onClick={onOpen}
          cursor="pointer"
          borderRadius="md"
          border="2px solid"
          borderColor={"gray.300"}
          bg={"blue.600"}
          _hover={{ borderColor: "#3B82F6", bg: "blue.500" }}
          transition="all 0.2s"
          display="flex"
          alignItems="center"
          justifyContent="center"
          p={4}
        >
          <Flex direction="column" align="center" gap={2}>
            <Icon as={FaRegStar} color="gray.200" boxSize={6} />
            <Text
              fontSize="sm"
              fontWeight="medium"
              color="gray.200"
              textAlign="center"
            >
              OPEN
            </Text>
          </Flex>
        </Box>
        <Text color="gray.500" fontSize="sm" mb={2}>
          Open activity modal
        </Text>
      </Flex>
    </Box>
  );
};

export default ActivityMessage;
