import React, { useState } from "react";
import { LuEye, LuEyeClosed } from "react-icons/lu";
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
  FormHelperText,
} from "@chakra-ui/react";

import { Form, useNavigate } from "react-router-dom";
import authApi from "../api/authApi";
const Login = () => {
  const [errorMessage, setErrorMessage] = useState("");
  const [userId, setUserId] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isTokenCorrect, setIsTokenCorrect] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const navigate = useNavigate();
  const toast = useToast();

  const handleSendToken = async () => {
    if (!email.trim()) {
      setErrorMessage("Not all required input fields are filled in!");
      return;
    }
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await authApi.forgotPasswordRequest(email.trim());
      if (response.status) {
        toast({
          title: "Token sent",
          description: response.message,
          status: "success",
          duration: 2000,
          isClosable: true,
        });
      } else {
        toast({
          title: "Failed",
          description: response.message,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Failed",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const compareToken = async () => {
    if (!email.trim() || !tokenInput.trim()) {
      setErrorMessage("Not all required input fields are filled in!");
      return;
    }
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await authApi.comparePasswordToken({
        email: email.trim(),
        code: tokenInput.trim(),
      });
      if (response.status) {
        setIsTokenCorrect(true);
        setUserId(response.userId);
      } else {
        toast({
          title: "Failed",
          description: response.message,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Failed",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const createNewPassword = async () => {
    if (!password.trim() || !confirmPassword.trim()) {
      setErrorMessage("Not all required input fields are filled in!");
      return;
    }
    if (password.length < 5 || password.length > 20) {
      setErrorMessage("Password must be between 5-20 characters!");
      return;
    }
    if (password !== confirmPassword) {
      setErrorMessage("The passwords do not match!");
      return;
    }
    setIsLoading(true);
    setErrorMessage("");
    try {
      const response = await authApi.resetPassword({
        userId,
        password: password.trim(),
      });
      if (response.status) {
        toast({
          title: "Success",
          description: "Password changed successfully!",
          status: "success",
          duration: 3000,
          isClosable: true,
        });
        setTimeout(() => {
          navigate("/login");
        }, 1200);
      } else {
        toast({
          title: "Failed",
          description: response.message,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Failed",
        description: error.message,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const [tokenInput, setTokenInput] = useState("");

  return (
    <Container maxW="md" py={16}>
      <Box bg="white" p={8} borderRadius="lg" boxShadow="lg">
        <VStack spacing={6}>
          <Box textAlign="center">
            <Heading size="xl" mb={2}>
              Forgot Password
            </Heading>
            <Text color="gray.600">Create New Password</Text>
          </Box>

          <VStack spacing={4}>
            {!isTokenCorrect ? (
              <>
                <FormControl isRequired>
                  <FormLabel>Email</FormLabel>
                  <Input
                    type="email"
                    placeholder="Enter your email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <FormHelperText>
                    Please enter email of your registered user account
                  </FormHelperText>
                </FormControl>
                <FormControl isRequired mt={2}>
                  <FormLabel>Token</FormLabel>
                  <Input
                    type="text"
                    placeholder="Enter the code sent to your email"
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                  />
                  <FormHelperText>
                    Enter the 6-digit code sent to your email
                  </FormHelperText>
                </FormControl>
                <Button
                  colorScheme="blue"
                  width="full"
                  size="lg"
                  onClick={handleSendToken}
                  isLoading={isLoading}
                  mt={2}
                >
                  Send Token
                </Button>
                <Button
                  colorScheme="green"
                  width="full"
                  size="lg"
                  onClick={compareToken}
                  isLoading={isLoading}
                  mt={2}
                >
                  Verify Token
                </Button>
              </>
            ) : (
              <>
                <FormControl isRequired>
                  <FormLabel>Password</FormLabel>
                  <InputGroup>
                    <Input
                      name="password"
                      type={showPassword ? "text" : "password"}
                      placeholder="Create a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                    />
                    <InputRightElement>
                      <IconButton
                        variant="ghost"
                        icon={showPassword ? <LuEyeClosed /> : <LuEye />}
                        onClick={() => setShowPassword(!showPassword)}
                      />
                    </InputRightElement>
                  </InputGroup>
                  <FormHelperText>
                    Must be between 5-20 characters, contain at least one
                    number, upper and lower case letter.
                  </FormHelperText>
                </FormControl>

                <FormControl isRequired>
                  <FormLabel>Confirm Password</FormLabel>
                  <InputGroup>
                    <Input
                      name="confirmPassword"
                      type={showConfirmPassword ? "text" : "password"}
                      placeholder="Confirm your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                    <InputRightElement>
                      <IconButton
                        variant="ghost"
                        icon={showConfirmPassword ? <LuEyeClosed /> : <LuEye />}
                        onClick={() =>
                          setShowConfirmPassword(!showConfirmPassword)
                        }
                      />
                    </InputRightElement>
                  </InputGroup>
                </FormControl>
                <Button
                  colorScheme="blue"
                  width="full"
                  size="lg"
                  onClick={createNewPassword}
                  isLoading={isLoading}
                  mt={2}
                >
                  Create New Password
                </Button>
              </>
            )}

            {errorMessage && <Text color="red.500">{errorMessage}</Text>}
          </VStack>
        </VStack>
      </Box>
    </Container>
  );
};

export default Login;
