import React, { useEffect, useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  SimpleGrid,
  Card,
  CardBody,
  Stat,
  StatLabel,
  StatNumber,
  StatHelpText,
  VStack,
  FormControl,
  FormLabel,
  Input,
  Button,
  useToast,
  HStack,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { userApi, authApi } from "../api";

const Profile = () => {
  const toast = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [user, setUser] = useState(null);
  const [stats, setStats] = useState({
    activityAttemptCount: 0,
    inProgressUpdatedThisWeek: 0,
  });

  const [password, setPassword] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyError, setVerifyError] = useState("");
  const handleVerifyEmail = async () => {
    setIsVerifying(true);
    setVerifyError("");
    try {
      const res = await authApi.verifyEmail({ code: verifyCode.trim() });
      if (res?.status) {
        toast({
          title: "Email verified!",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        setUser((prev) => ({ ...prev, is_email_verified: true }));
        setVerifyCode("");
      } else {
        setVerifyError(res?.message || "Invalid code");
      }
    } catch (error) {
      setVerifyError(error?.message || "Verification failed");
    } finally {
      setIsVerifying(false);
    }
  };

  const getProfileData = async () => {
    setIsLoading(true);
    try {
      const [meRes, statsRes] = await Promise.all([
        userApi.getMe(),
        userApi.getStats(),
      ]);

      if (meRes?.status) {
        setUser(meRes?.data?.user || null);
      } else {
        toast({
          title: "Failed fetching data",
          description: meRes?.message || "failed",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }

      if (statsRes?.status) {
        setStats({
          activityAttemptCount: Number(
            statsRes?.data?.activityAttemptCount || 0
          ),
          inProgressUpdatedThisWeek: Number(
            statsRes?.data?.inProgressUpdatedThisWeek || 0
          ),
        });
      }
    } catch (error) {
      toast({
        title: "Failed fetching data",
        description: error?.message || "failed",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    getProfileData();
  }, []);

  const handleDeleteClick = () => {
    if (!password.trim()) {
      toast({
        title: "Missing password",
        description: "Not all required input fields are filled in!",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      return;
    }
    handleConfirmDelete();
  };

  const handleConfirmDelete = async () => {
    try {
      const res = await userApi.deleteMe({ password: password.trim() });

      if (res?.status) {
        toast({
          title: "Account deleted",
          description: res?.message || "User deleted successfully!",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        authApi.logout();
      } else {
        toast({
          title: "Delete failed",
          description: res?.message || "failed",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Delete failed",
        description: error?.message || "failed",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  return (
    <Box color="white">
      <Container maxW="container.md" py={8}>
        <Box mb={6}>
          <Heading size="lg">Profile</Heading>
          <Text color="gray.400">Your account information</Text>
        </Box>

        {/* Email verification section */}
        {user && user.is_email_verified === false && (
          <Card bg="#1E293B" borderColor="#334155" borderWidth="1px" mb={8}>
            <CardBody>
              <VStack align="stretch" spacing={4}>
                <Box>
                  <Heading size="md" color="white">
                    Verify your email
                  </Heading>
                  <Text color="gray.400" fontSize="sm">
                    Enter the 4-digit code sent to your email address to verify
                    your account.
                  </Text>
                </Box>
                <FormControl isRequired>
                  <FormLabel color="gray.300">Verification code</FormLabel>
                  <Input
                    color="white"
                    type="text"
                    maxLength={4}
                    value={verifyCode}
                    onChange={(e) => setVerifyCode(e.target.value)}
                    placeholder="4-digit code"
                    bg="#0B1220"
                    borderColor="#334155"
                  />
                </FormControl>
                {verifyError && (
                  <Text color="red.300" fontSize="sm">
                    {verifyError}
                  </Text>
                )}
                <HStack justify="flex-end">
                  <Button
                    colorScheme="blue"
                    onClick={handleVerifyEmail}
                    isLoading={isVerifying}
                    isDisabled={verifyCode.length !== 4 || isVerifying}
                  >
                    Verify email
                  </Button>
                </HStack>
              </VStack>
            </CardBody>
          </Card>
        )}

        <SimpleGrid columns={{ base: 1, md: 2 }} spacing={6} mb={8}>
          <Card bg="#1E293B" borderColor="#334155" borderWidth="1px">
            <CardBody>
              <Stat>
                <StatLabel color="gray.400">Username</StatLabel>
                <StatNumber color="white" fontSize="xl">
                  {user?.user_name || "-"}
                </StatNumber>
                <StatHelpText color="gray.500">Registered user</StatHelpText>
              </Stat>
            </CardBody>
          </Card>

          <Card bg="#1E293B" borderColor="#334155" borderWidth="1px">
            <CardBody>
              <Stat>
                <StatLabel color="gray.400">Email</StatLabel>
                <StatNumber color="white" fontSize="xl">
                  {user?.email || "-"}
                </StatNumber>
                <StatHelpText color="gray.500">Account email</StatHelpText>
              </Stat>
            </CardBody>
          </Card>
        </SimpleGrid>

        <Card bg="#1E293B" borderColor="#334155" borderWidth="1px">
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <Box>
                <Heading size="md" color="gray.200">
                  Delete account
                </Heading>
                <Text color="gray.400" fontSize="sm">
                  This action is permanent
                </Text>
              </Box>

              <FormControl isRequired>
                <FormLabel color="gray.300">Password</FormLabel>
                <Input
                  color="white"
                  type="password"
                  autoComplete="new-password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                  bg="#0B1220"
                  borderColor="#334155"
                />
              </FormControl>

              <HStack justify="flex-end">
                <Button
                  colorScheme="red"
                  onClick={handleDeleteClick}
                  isDisabled={isLoading}
                >
                  Delete account
                </Button>
              </HStack>
            </VStack>
          </CardBody>
        </Card>
      </Container>
    </Box>
  );
};

export default Profile;
