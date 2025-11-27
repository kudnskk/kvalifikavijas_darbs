import React, { useState } from "react";
import {
  Box,
  Button,
  Container,
  FormControl,
  FormLabel,
  Input,
  VStack,
  Heading,
  Text,
  Link,
  useToast,
  InputGroup,
  InputRightElement,
  IconButton,
  Checkbox,
  Flex,
} from "@chakra-ui/react";

import { Form, useNavigate } from "react-router-dom";
import { login } from "../api/authApi";
const Login = () => {
  const remember_me = localStorage.getItem("rememberMe") === "true";
  const [errorMessage, setErrorMessage] = useState("");
  const [email, setEmail] = useState("");
  const [rememberMe, setRememberMe] = useState(remember_me);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleSubmit = async () => {
    if (!email.trim() || !password.trim()) {
      setErrorMessage("Not all required input fields are filled in!");
      return;
    }

    setIsLoading(true);
    setErrorMessage("");

    try {
      const response = await login({
        email: email.trim(),
        password: password.trim(),
        remember_me: rememberMe,
      });

      if (response.status) {
        localStorage.setItem("sessionToken", response?.token);
        if (rememberMe) {
          localStorage.setItem("rememberMe", "true");
        } else {
          localStorage.removeItem("rememberMe");
        }

        toast({
          title: "Login successful",
          description: "Welcome to AI Learning Assistant!",
          status: "success",
          duration: 1000,
          isClosable: true,
        });
        setTimeout(() => {
          navigate("/dashboard");
        }, 1200);
      } else {
        setErrorMessage(response.message || "Login failed");
      }
    } catch (error) {
      toast({
        title: "Login failed",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="md" py={16}>
      <Box bg="white" p={8} borderRadius="lg" boxShadow="lg">
        <VStack spacing={6}>
          <Box textAlign="center">
            <Heading size="xl" mb={2}>
              Welcome Back
            </Heading>
            <Text color="gray.600">Sign in to your account</Text>
          </Box>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  type="email"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <InputGroup>
                  <Input
                    type={showPassword ? "text" : "password"}
                    placeholder="Enter your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  <InputRightElement>
                    <IconButton
                      variant="ghost"
                      // icon={showPassword ? <ViewOffIcon /> : <ViewIcon />}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              {errorMessage && <Text color="red.500">{errorMessage}</Text>}

              <Checkbox
                colorScheme="blue"
                isChecked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
              >
                Remember me
              </Checkbox>

              <Button
                type="submit"
                colorScheme="blue"
                width="full"
                size="lg"
                onClick={handleSubmit}
                isLoading={isLoading}
              >
                Sign In
              </Button>
            </VStack>
          </form>

          <Text textAlign="center" color="gray.600">
            Don't have an account?{" "}
            <Link color="red.500" onClick={() => navigate("/register")}>
              Register here
            </Link>
          </Text>
        </VStack>
      </Box>
    </Container>
  );
};

export default Login;
