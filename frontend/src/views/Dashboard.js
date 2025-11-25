import React from 'react';
import {
  Box,
  Container,
  Heading,
  Text,
  Button,
  Stack,
  Flex,
  Icon,
  SimpleGrid,
  Card,
  CardBody
} from '@chakra-ui/react';
import { FiBook, FiUsers, FiTrendingUp, FiZap } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';

const Home = () => {
  const navigate = useNavigate();

  return (
    <Box>
      {/* Hero Section */}
      <Box bg="teal.500" color="white" py={20}>
        <Container maxW="container.xl">
          <Stack spacing={6} maxW="2xl">
            <Heading size="2xl">
              AI-Powered Learning Assistant
            </Heading>
            <Text fontSize="xl">
              Transform your learning experience with personalized AI assistance, 
              smart recommendations, and adaptive learning paths.
            </Text>
            <Stack direction={{ base: 'column', sm: 'row' }} spacing={4}>
              <Button
                size="lg"
                colorScheme="white"
                variant="solid"
                onClick={() => navigate('/register')}
              >
                Get Started
              </Button>
              <Button
                size="lg"
                colorScheme="whiteAlpha"
                variant="outline"
                onClick={() => navigate('/login')}
              >
                Sign In
              </Button>
            </Stack>
          </Stack>
        </Container>
      </Box>

      {/* Features Section */}
      <Container maxW="container.xl" py={16}>
        <Heading textAlign="center" mb={12}>
          Why Choose AI Learning Assistant?
        </Heading>

        <SimpleGrid columns={{ base: 1, md: 2, lg: 4 }} spacing={8}>
          <Card>
            <CardBody textAlign="center">
              <Flex justify="center" mb={4}>
                <Icon as={FiBook} boxSize={12} color="teal.500" />
              </Flex>
              <Heading size="md" mb={2}>Smart Courses</Heading>
              <Text color="gray.600">
                Access a wide range of courses tailored to your learning style
              </Text>
            </CardBody>
          </Card>

          <Card>
            <CardBody textAlign="center">
              <Flex justify="center" mb={4}>
                <Icon as={FiZap} boxSize={12} color="purple.500" />
              </Flex>
              <Heading size="md" mb={2}>AI-Powered</Heading>
              <Text color="gray.600">
                Get personalized recommendations and adaptive learning paths
              </Text>
            </CardBody>
          </Card>

          <Card>
            <CardBody textAlign="center">
              <Flex justify="center" mb={4}>
                <Icon as={FiTrendingUp} boxSize={12} color="green.500" />
              </Flex>
              <Heading size="md" mb={2}>Track Progress</Heading>
              <Text color="gray.600">
                Monitor your learning journey with detailed analytics
              </Text>
            </CardBody>
          </Card>

          <Card>
            <CardBody textAlign="center">
              <Flex justify="center" mb={4}>
                <Icon as={FiUsers} boxSize={12} color="orange.500" />
              </Flex>
              <Heading size="md" mb={2}>Community</Heading>
              <Text color="gray.600">
                Learn together with a supportive community of learners
              </Text>
            </CardBody>
          </Card>
        </SimpleGrid>
      </Container>
    </Box>
  );
};

export default Home;
