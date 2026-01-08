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
  FormHelperText,
} from "@chakra-ui/react";

import { useNavigate } from "react-router-dom";
import { GrView } from "react-icons/gr";
import { LuEye, LuEyeClosed } from "react-icons/lu";
import { register } from "../api/authApi";
const Register = () => {
  const [formData, setFormData] = useState({
    user_name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [errorMessage, setErrorMessage] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const toast = useToast();

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage("");

    // Check if all fields are filled
    if (
      !formData.password ||
      !formData.confirmPassword ||
      !formData.email ||
      !formData.user_name
    ) {
      setErrorMessage("Not all required input fields are filled in!");
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      setErrorMessage("Email is not valid!");
      return;
    }

    const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).+$/;
    if (!passwordRegex.test(formData.password)) {
      setErrorMessage(
        "The password must contain at least one uppercase letter, one lowercase letter, and one digit!"
      );
      return;
    }

    if (formData.password.length < 5 || formData.password.length > 20) {
      setErrorMessage("Password must be between 5-20 characters!");
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      setErrorMessage("The passwords do not match!");
      return;
    }

    if (formData.user_name.length > 20) {
      setErrorMessage("Username must be less than 20 characters!");
      return;
    }

    setIsLoading(true);

    try {
      const response = await register({
        user_name: formData.user_name,
        email: formData.email,
        password: formData.password,
      });

      if (response.status) {
        toast({
          title: "Registration successful",
          description: "Welcome to AI Learning Assistant!",
          status: "success",
          duration: 1000,
          isClosable: true,
        });
        localStorage.setItem("sessionToken", response?.token);
        setTimeout(() => {
          navigate("/dashboard");
        }, 1200);
      } else {
        const errorMsg =
          response.message || "Something went wrong, please try again";
        setErrorMessage(errorMsg);
        toast({
          title: "Registration failed",
          description: errorMsg,
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      console.log("Registration error:", error);
      const errorMsg = error?.message || error?.msg || "Something went wrong";

      toast({
        title: "Registration failed",
        description: errorMsg,
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Container maxW="md">
      <Box bg="white" p={8} borderRadius="lg" boxShadow="lg">
        <VStack spacing={3}>
          <Box textAlign="center">
            <Heading size="xl" mb={2}>
              Create Account
            </Heading>
            <Text color="gray.600">Join AI Learning Assistant today</Text>
          </Box>

          <form onSubmit={handleSubmit}>
            <VStack spacing={4}>
              <FormControl isRequired>
                <FormLabel>Username</FormLabel>
                <Input
                  name="user_name"
                  type="text"
                  placeholder="Enter your username"
                  value={formData.user_name}
                  onChange={handleChange}
                />
                <FormHelperText>
                  Must be less than 20 characters.
                </FormHelperText>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Email</FormLabel>
                <Input
                  name="email"
                  type="email"
                  placeholder="Enter your email"
                  value={formData.email}
                  onChange={handleChange}
                />
                <FormHelperText>Must be valid email.</FormHelperText>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Password</FormLabel>
                <InputGroup>
                  <Input
                    name="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                  />
                  <InputRightElement>
                    <IconButton
                      variant="ghost"
                      icon={showPassword ? <LuEye /> : <LuEyeClosed />}
                      onClick={() => setShowPassword(!showPassword)}
                    />
                  </InputRightElement>
                </InputGroup>
                <FormHelperText>
                  Must be between 5-20 characters, contain at least one number,
                  upper and lower case letter.
                </FormHelperText>
              </FormControl>

              <FormControl isRequired>
                <FormLabel>Confirm Password</FormLabel>
                <InputGroup>
                  <Input
                    name="confirmPassword"
                    type={showConfirmPassword ? "text" : "password"}
                    placeholder="Confirm your password"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                  />
                  <InputRightElement>
                    <IconButton
                      variant="ghost"
                      icon={showConfirmPassword ? <LuEye /> : <LuEyeClosed />}
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>
              {errorMessage && <Text color="red.500">{errorMessage}</Text>}
              <Button
                type="submit"
                colorScheme="blue"
                width="full"
                size="lg"
                isLoading={isLoading}
              >
                Create Account
              </Button>
            </VStack>
          </form>

          <Text textAlign="center" color="gray.600">
            Already have an account?{" "}
            <Link color="red.500" onClick={() => navigate("/login")}>
              Sign in here
            </Link>
          </Text>
        </VStack>
      </Box>
    </Container>
  );
};

export default Register;
