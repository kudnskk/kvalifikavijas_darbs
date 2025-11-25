import React from "react";
import { Box, Container, Heading, Text, Flex } from "@chakra-ui/react";
const Home = () => {
  return (
    <Box p={5} h="calc(100vh - 72px)">
      <Container
        minW="100%"
        h="full"
        bg="white"
        boxShadow="lg"
        borderRadius="2xl"
        mx="auto"
        backgroundImage={`url(${process.env.PUBLIC_URL}/image2.jpg)`}
        backgroundSize="cover"
        backgroundPosition="center"
        backgroundRepeat="no-repeat"
      >
        <Flex align="center" h="full" flexDirection="column" gap={10} pt={20}>
          <Heading fontFamily="'Poppins', sans-serif" size="2xl" color="white">
            AI-Powered Learning Assistant
          </Heading>

          <Text fontSize="xl" fontFamily="'Poppins', sans-serif" color="white">
            Transform your learning experience with personalized AI assistance,
            smart recommendations, and adaptive learning paths.
          </Text>
        </Flex>
      </Container>
    </Box>
  );
};

export default Home;
