import React, { useEffect, useRef, useState } from "react";
import {
  Box,
  Container,
  Heading,
  Text,
  Card,
  CardBody,
  VStack,
  HStack,
  Input,
  Button,
  useToast,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  AlertDialog,
  AlertDialogOverlay,
  AlertDialogContent,
  AlertDialogHeader,
  AlertDialogBody,
  AlertDialogFooter,
  useDisclosure,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { userApi } from "../api";

const AdminPanel = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [me, setMe] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const cancelRef = useRef();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const loadMeAndUsers = async (searchValue = "") => {
    setIsLoading(true);
    try {
      const meRes = await userApi.getMe();
      if (!meRes?.status) {
        toast({
          title: "Failed fetching data",
          description: meRes?.message || "failed",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        navigate("/dashboard");
        return;
      }

      const currentUser = meRes?.data?.user || null;
      setMe(currentUser);

      if (currentUser?.user_type !== "admin") {
        toast({
          title: "Access denied",
          description: "Only administrators can do this action",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
        navigate("/dashboard");
        return;
      }

      const usersRes = await userApi.adminGetUsers({ search: searchValue });
      if (usersRes?.status) {
        setUsers(usersRes?.data?.users || []);
      } else {
        setUsers([]);
        toast({
          title: "No users",
          description: usersRes?.message || "No user found!",
          status: "info",
          duration: 2500,
          isClosable: true,
        });
      }
    } catch (error) {
      setUsers([]);
      toast({
        title: "Failed fetching data",
        description: error?.message || "failed",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
      navigate("/dashboard");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMeAndUsers("");
  }, []);

  const handleSearch = async () => {
    await loadMeAndUsers(search.trim());
  };

  const handleBlock = async (userId) => {
    try {
      const res = await userApi.adminBlockUser({ userId });
      if (res?.status) {
        toast({
          title: "Success",
          description:
            res?.message ||
            "User blocked successfully! (Lietotājs nobloķēts veiksmīgi!)",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        await loadMeAndUsers(search.trim());
      } else {
        toast({
          title: "Failed",
          description: res?.message || "failed",
          status: "error",
          duration: 3000,
          isClosable: true,
        });
      }
    } catch (error) {
      toast({
        title: "Failed",
        description: error?.message || "failed",
        status: "error",
        duration: 3000,
        isClosable: true,
      });
    }
  };

  const handleOpenDelete = (user) => {
    setSelectedUser(user);
    onOpen();
  };

  const handleConfirmDelete = async () => {
    if (!selectedUser?.id) {
      onClose();
      return;
    }

    setIsDeleting(true);
    try {
      const res = await userApi.adminDeleteUser({ userId: selectedUser.id });
      if (res?.status) {
        toast({
          title: "Success",
          description:
            res?.message ||
            "User deleted successfully! (Lietotājs izdzēsts veiksmīgi!)",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        await loadMeAndUsers(search.trim());
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
    } finally {
      setIsDeleting(false);
      onClose();
      setSelectedUser(null);
    }
  };

  return (
    <Box color="white">
      <Container maxW="container.md" py={8}>
        <Box mb={6}>
          <Heading size="lg">Admin panel</Heading>
          <Text color="gray.400">User management</Text>
        </Box>

        <Card bg="#1E293B" borderColor="#334155" borderWidth="1px" mb={6}>
          <CardBody>
            <VStack align="stretch" spacing={4}>
              <HStack spacing={3}>
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search by username or email"
                  bg="#1E293B"
                  borderColor="#334155"
                />
                <Button
                  colorScheme="blue"
                  onClick={handleSearch}
                  isLoading={isLoading}
                >
                  Search
                </Button>
              </HStack>

              <Box
                border="1px solid"
                borderColor="#334155"
                borderRadius="md"
                overflowX="auto"
              >
                <Table variant="simple" size="sm">
                  <Thead>
                    <Tr>
                      <Th color="gray.300">Username</Th>
                      <Th color="gray.300">Email</Th>
                      <Th color="gray.300">Role</Th>
                      <Th color="gray.300">Status</Th>
                      <Th color="gray.300" textAlign="right">
                        Actions
                      </Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    {Array.isArray(users) && users.length ? (
                      users.map((u) => (
                        <Tr key={u.id}>
                          <Td color="gray.100">{u.user_name || "-"}</Td>
                          <Td color="gray.100">{u.email || "-"}</Td>
                          <Td color="gray.200">{u.user_type || "-"}</Td>
                          <Td color={u.is_blocked ? "gray.300" : "gray.200"}>
                            {u.is_blocked ? "blocked" : "active"}
                          </Td>
                          <Td textAlign="right">
                            <HStack justify="flex-end" spacing={2}>
                              <Button
                                size="sm"
                                variant="outline"
                                colorScheme="red"
                                onClick={() => handleBlock(u.id)}
                                isDisabled={u.is_blocked}
                              >
                                Block
                              </Button>
                              <Button
                                size="sm"
                                colorScheme="red"
                                onClick={() => handleOpenDelete(u)}
                              >
                                Delete
                              </Button>
                            </HStack>
                          </Td>
                        </Tr>
                      ))
                    ) : (
                      <Tr>
                        <Td colSpan={5} color="gray.400">
                          No user found
                        </Td>
                      </Tr>
                    )}
                  </Tbody>
                </Table>
              </Box>
            </VStack>
          </CardBody>
        </Card>
      </Container>

      <AlertDialog
        isOpen={isOpen}
        leastDestructiveRef={cancelRef}
        onClose={onClose}
        isCentered
      >
        <AlertDialogOverlay>
          <AlertDialogContent bg="#0B1220" color="white" borderColor="#334155">
            <AlertDialogHeader fontSize="lg" fontWeight="bold">
              Confirm deletion
            </AlertDialogHeader>

            <AlertDialogBody>
              Are you sure you want to permanently delete this account? (Vai jūs
              tiešām gribāt neatgriezeniski izdzēst šo kontu?)
            </AlertDialogBody>

            <AlertDialogFooter>
              <Button ref={cancelRef} onClick={onClose} variant="outline">
                Cancel
              </Button>
              <Button
                colorScheme="red"
                onClick={handleConfirmDelete}
                ml={3}
                isLoading={isDeleting}
              >
                Delete
              </Button>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialogOverlay>
      </AlertDialog>
    </Box>
  );
};

export default AdminPanel;
