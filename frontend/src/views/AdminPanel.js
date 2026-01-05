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
  Spinner,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { userApi } from "../api";
import AcceptModal from "../components/AcceptModal";
const AdminPanel = () => {
  const toast = useToast();
  const navigate = useNavigate();
  const [allUsers, setAllUsers] = useState([]);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const [selectedUser, setSelectedUser] = useState(null);

  const cancelRef = useRef();
  const { isOpen, onOpen, onClose } = useDisclosure();

  const loadUsers = async () => {
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

      const usersRes = await userApi.adminGetUsers();
      if (usersRes?.status) {
        const fetchedUsers = usersRes?.data?.users || [];
        setAllUsers(fetchedUsers);
        setUsers(fetchedUsers);
      } else {
        setAllUsers([]);
        setUsers([]);
      }
    } catch (error) {
      setAllUsers([]);
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
    loadUsers();
  }, []);

  const handleSearch = () => {
    const searchTerm = search.trim().toLowerCase();
    if (!searchTerm) {
      setUsers(allUsers);
      return;
    }

    const filtered = allUsers.filter(
      (user) =>
        user.user_name?.toLowerCase().includes(searchTerm) ||
        user.email?.toLowerCase().includes(searchTerm)
    );
    setUsers(filtered);
  };

  const handleToggleBlockStatus = async (userId) => {
    try {
      setIsLoading(true);
      const res = await userApi.adminChangeUserStatus({ userId });
      if (res?.status) {
        toast({
          title: "Success",
          description: res?.message || "User status changed successfully!",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        await loadUsers();
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
    } finally {
      setIsLoading(false);
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

    setIsLoading(true);
    try {
      const res = await userApi.adminDeleteUser({ userId: selectedUser.id });
      if (res?.status) {
        toast({
          title: "Success",
          description: res?.message || "User deleted successfully!",
          status: "success",
          duration: 2000,
          isClosable: true,
        });
        await loadUsers();
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
      setIsLoading(false);
      onClose();
      setSelectedUser(null);
    }
  };

  return (
    <Box color="white" position="relative">
      {isLoading && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0, 0, 0, 0.7)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={9999}
        >
          <Spinner />
        </Box>
      )}
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
                  color="white"
                />
                <Button colorScheme="blue" onClick={handleSearch}>
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
                                colorScheme={u.is_blocked ? "blue" : "red"}
                                onClick={() => handleToggleBlockStatus(u.id)}
                              >
                                {u.is_blocked ? "Unblock" : "Block"}
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
      <AcceptModal
        isOpen={isOpen}
        onClose={onClose}
        title="Delete User"
        description="Are you sure you want to permanently delete this user? All related data will be deleted."
        handleAction={handleConfirmDelete}
        confirmText="DELETE"
      />
    </Box>
  );
};

export default AdminPanel;
