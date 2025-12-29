import React, { useMemo, useState } from "react";
import {
  Box,
  Button,
  Flex,
  Input,
  Modal,
  ModalBody,
  ModalCloseButton,
  ModalContent,
  ModalHeader,
  ModalOverlay,
  Text,
  VStack,
} from "@chakra-ui/react";

const prettyType = (type) => {
  if (!type) return "";
  if (type === "multiple-choice") return "Multiple Choice";
  if (type === "text") return "Free text";
  if (type === "flashcards") return "Flashcards";
  return String(type);
};

const ViewActivitiesModal = ({
  isOpen,
  onClose,
  activities,
  onOpenActivity,
}) => {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const list = Array.isArray(activities) ? activities : [];
    const q = query.trim().toLowerCase();
    if (!q) return list;
    return list.filter((a) =>
      String(a?.title || "")
        .toLowerCase()
        .includes(q)
    );
  }, [activities, query]);

  const handleClose = () => {
    setQuery("");
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      size="xl"
      scrollBehavior="inside"
    >
      <ModalOverlay />
      <ModalContent bg="#1E293B" borderColor="#334155" borderWidth="1px">
        <ModalHeader
          color="white"
          borderBottomWidth="1px"
          borderColor="#334155"
        >
          View all activities
        </ModalHeader>
        <ModalCloseButton color="white" />

        <ModalBody pb={4}>
          <Box mb={4}>
            <Input
              placeholder="Search by activity name..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              bg="#0F172A"
              border="1px solid"
              borderColor="#334155"
              color="white"
              _placeholder={{ color: "gray.500" }}
              _hover={{ borderColor: "#3B82F6" }}
              _focus={{
                borderColor: "#3B82F6",
                boxShadow: "0 0 0 1px #3B82F6",
              }}
            />
          </Box>

          {filtered.length === 0 ? (
            <Text color="gray.400">
              {Array.isArray(activities) && activities.length > 0
                ? "No activities match your search."
                : "No activities in this chat yet."}
            </Text>
          ) : (
            <VStack align="stretch" spacing={2}>
              {filtered.map((a) => (
                <Flex
                  key={a.activity_id}
                  align="center"
                  justify="space-between"
                  bg="#0F172A"
                  border="1px solid"
                  borderColor="#334155"
                  borderRadius="md"
                  px={3}
                  py={2}
                  gap={3}
                >
                  <Box minW={0}>
                    <Text color="white" fontWeight="semibold" noOfLines={1}>
                      {a.title || "(untitled)"}
                    </Text>
                    <Text color="gray.400" fontSize="sm" noOfLines={1}>
                      {prettyType(a.type)}
                    </Text>
                  </Box>

                  <Button
                    colorScheme="blue"
                    size="sm"
                    onClick={() => {
                      if (!a?.activity_id) return;
                      if (onOpenActivity) onOpenActivity(a.activity_id);
                      handleClose();
                    }}
                  >
                    Open
                  </Button>
                </Flex>
              ))}
            </VStack>
          )}
        </ModalBody>
      </ModalContent>
    </Modal>
  );
};

export default ViewActivitiesModal;
