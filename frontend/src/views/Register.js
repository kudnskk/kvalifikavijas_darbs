import React, { useState, setTimeout } from "react";
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
} from "@chakra-ui/react";
//import { ViewIcon, ViewOffIcon } from '@chakra-ui/icons';
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

    if (formData.password !== formData.confirmPassword) {
      toast({
        title: "Passwords do not match",
        description: "Please make sure your passwords match",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }

    if (formData.password.length < 5) {
      toast({
        title: "Password too short",
        description: "Password must be at least 5 characters",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
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
        setTimeout(() => {
          navigate("/dashboard");
        }, 1200);
      } else {
        toast({
          title: "Registration failed",
          description: "Somethign went wrong, please try again",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Registration failed",
        description: error.message || "Something went wrong",
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
        <VStack spacing={6} align="stretch">
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
                  placeholder="Enter your full name"
                  value={formData.user_name}
                  onChange={handleChange}
                />
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
                      icon={showPassword ? <LuEyeClosed /> : <LuEye />}
                      onClick={() => setShowPassword(!showPassword)}
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    />
                  </InputRightElement>
                </InputGroup>
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
                      icon={showConfirmPassword ? <LuEyeClosed /> : <LuEye />}
                      onClick={() =>
                        setShowConfirmPassword(!showConfirmPassword)
                      }
                      aria-label={
                        showConfirmPassword ? "Hide password" : "Show password"
                      }
                    />
                  </InputRightElement>
                </InputGroup>
              </FormControl>

              <Button
                color="white"
                type="submit"
                bg="#0F172A"
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
            <Link color="teal.500" onClick={() => navigate("/login")}>
              Sign in here
            </Link>
          </Text>
        </VStack>
      </Box>
    </Container>
  );
};

export default Register;
