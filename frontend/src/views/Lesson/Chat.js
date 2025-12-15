import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Flex,
  Textarea,
  Text,
  Center,
  Divider,
  useToast,
  Icon,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  useDisclosure,
} from "@chakra-ui/react";
import { useParams } from "react-router-dom";
import ChatFileDropzone from "./components/ChatFileDropzone";
import { messageApi } from "../../api";
import socket from "../../api/socket";
import { FaFilePdf, FaFileWord, FaFileAlt } from "react-icons/fa";

const transformDate = (dateString) => {
  const date = new Date(dateString);
  return date.toLocaleTimeString("en-GB", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  });
};

const getFileIcon = (fileOrMimeType) => {
  const mimeType =
    typeof fileOrMimeType === "string" ? fileOrMimeType : fileOrMimeType?.type;

  if (mimeType === "application/pdf") {
    return FaFilePdf;
  } else if (
    mimeType === "application/msword" ||
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return FaFileWord;
  } else {
    return FaFileAlt;
  }
};

const Chat = () => {
  const { id } = useParams();
  const [isLoading, setIsLoading] = useState(false);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [file, setFile] = useState(null);
  const [attachedFiles, setAttachedFiles] = useState([]);
  const [isWaitingForResponse, setIsWaitingForResponse] = useState(false);
  const toast = useToast();
  const messagesEndRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const {
    isOpen: isFileViewerOpen,
    onOpen: onFileViewerOpen,
    onClose: onFileViewerClose,
  } = useDisclosure();
  const [fileViewerData, setFileViewerData] = useState(null);

  const getAllMessagesFunc = async () => {
    setIsLoading(true);
    try {
      const response = await messageApi.getMessagesByLessonId(id);
      setMessages(response.data.messages);
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    setSelectedLesson(id);
    if (id) {
      getAllMessagesFunc();

      const joinRoom = () => {
        socket.emit("join_lesson_room", id);
      };

      // Debug: confirm the socket is connected
      const onConnect = () => {
        console.log("[socket] connected", socket.id);
        joinRoom();
      };
      const onConnectError = (err) =>
        console.error("[socket] connect_error", err?.message || err);
      socket.on("connect", onConnect);
      socket.on("connect_error", onConnectError);

      //join room
      if (socket.connected) {
        joinRoom();
      }

      const handleNewMessage = (newMessage) => {
        console.log(newMessage);
        setIsWaitingForResponse(false);
        setMessages((prevMessages) => [...prevMessages, newMessage]);
      };

      socket.on("new_message", handleNewMessage);

      return () => {
        socket.off("new_message", handleNewMessage);
        socket.off("connect", onConnect);
        socket.off("connect_error", onConnectError);
      };
    }
  }, [id]);

  // message typing logic
  const handleTyping = (e) => {
    setNewMessage(e.target.value);
  };

  // Create a new message
  const createMessageFunc = async (messageData) => {
    setIsLoading(true);
    try {
      const response = await messageApi.createMessage(messageData);
      if (response.status) {
        setIsWaitingForResponse(true);
      }
      return response.data;
    } catch (error) {
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        status: "error",
        duration: 5000,
        isClosable: true,
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendMessage = async () => {
    const hasText = Boolean(newMessage.trim());
    const hasFile = Boolean(file);

    if (!hasText && !hasFile) return;

    const payload = hasFile
      ? (() => {
          const formDataToSend = new FormData();
          formDataToSend.append("lesson_id", id);
          formDataToSend.append("content", newMessage);
          formDataToSend.append("type", "text");
          formDataToSend.append("file", file);
          return formDataToSend;
        })()
      : {
          lesson_id: id,
          content: newMessage,
          type: "text",
        };

    const savedMessage = await createMessageFunc(payload);

    if (savedMessage) {
      setMessages((prev) => [...prev, savedMessage]);
      setNewMessage("");
      setFile(null);
      setAttachedFiles([]);
    }
  };

  const openFileViewer = (message) => {
    const fileData = message?.file;
    if (!fileData?.file_name) return;

    setFileViewerData({
      file_name: fileData.file_name,
      type: fileData.type,
      content: fileData.content || "",
    });
    onFileViewerOpen();
  };

  return (
    <Box bg="#0F172A" height="calc(100vh - 60px)">
      {/* Chat Section */}
      <Box
        padding={4}
        display="flex"
        flexDirection="column"
        height="100%"
        overflow="hidden"
      >
        {selectedLesson ? (
          <>
            <Box
              flex="1"
              overflowY="auto"
              marginBottom={1}
              ref={scrollContainerRef}
            >
              {Array.isArray(messages) &&
                messages.map((message, index) => {
                  const currentMessageDate = new Date(
                    message.createdAt
                  ).toDateString();
                  const previousMessageDate =
                    index > 0
                      ? new Date(messages[index - 1].createdAt).toDateString()
                      : null;

                  const showDateSeparator =
                    currentMessageDate !== previousMessageDate;
                  return (
                    <React.Fragment key={message._id || index}>
                      {showDateSeparator && (
                        <Flex align="center" my={4}>
                          <Divider flex="1" />
                          <Text
                            fontSize="sm"
                            color="gray.500"
                            px={4}
                            whiteSpace="nowrap"
                          >
                            {currentMessageDate}
                          </Text>
                          <Divider flex="1" />
                        </Flex>
                      )}
                      <Flex
                        justify={
                          message.sender_type === "user"
                            ? //&&
                              // message?.sender_id === userId
                              "flex-end"
                            : "flex-start"
                        }
                        mb={2}
                      >
                        <Box
                          maxW="70%"
                          display="flex"
                          flexDirection="column"
                          alignItems={
                            message.sender_type === "user"
                              ? //&&
                                //message?.sender_id === userId
                                "flex-end"
                              : "flex-start"
                          }
                        >
                          {/* ✅ Images, if any */}
                          {/* {message.images && message.images.length > 0 && (
                            <Flex
                              direction="column"
                              justify={
                                message.sender_role === role
                                  ? // &&
                                    //message?.sender_id === userId
                                    "flex-end"
                                  : "flex-start"
                              }
                              wrap="wrap"
                              mb={2}
                              gap={2}
                              // mb={message.message ? 2 : 0} // only add margin if there's a message below
                            >
                              {message.images.map((imgUrl, i) => (
                                <Image
                                  key={i}
                                  src={
                                    typeof imgUrl === "string"
                                      ? imgUrl
                                      : imgUrl.previewUrl
                                  }
                                  alt={`attachment-${i}`}
                                  maxH="150px"
                                  borderRadius="md"
                                  objectFit="cover"
                                  boxShadow="sm"
                                  cursor="pointer"
                                  onClick={() => handleImageClick(imgUrl)}
                                />
                              ))}
                            </Flex>
                          )} */}

                          {/* ✅ Message box (only if there is a message) */}
                          {message.content && (
                            <Box
                              bg={
                                message.sender_type === "user"
                                  ? //&&
                                    //message?.sender_id === userId
                                    "blue.100"
                                  : "gray.100"
                              }
                              p={3}
                              borderRadius="md"
                            >
                              <Text wordBreak="break-word">
                                {message.content}
                              </Text>
                            </Box>
                          )}

                          {/* ✅ Timestamp */}
                          {message.createdAt && (
                            <Text fontSize="xs" color="gray.500">
                              {transformDate(message.createdAt)}
                            </Text>
                          )}
                          {message.file &&
                            message.file.file_name &&
                            message.file.type && (
                              <Flex
                                align="center"
                                bg="#334155"
                                size="xs"
                                px={2}
                                py={1}
                                borderRadius="md"
                                fontSize="xs"
                                cursor="pointer"
                                onClick={() => openFileViewer(message)}
                              >
                                <Icon
                                  as={getFileIcon(message.file.type)}
                                  color="#3B82F6"
                                  mr={2}
                                />
                                <Text color="white" maxW="150px" isTruncated>
                                  {message.file.file_name}
                                </Text>
                              </Flex>
                            )}
                        </Box>
                      </Flex>
                    </React.Fragment>
                  );
                })}

              <Box ref={messagesEndRef} height="1px" />
            </Box>
            <Flex justify="space-between" w="100%" mb={2}>
              {isWaitingForResponse && (
                <Text fontSize="sm" color="gray.400" alignSelf="center">
                  Waiting for response...
                </Text>
              )}
            </Flex>
            <Flex align={"center"}>
              <ChatFileDropzone
                onFilesSelected={(files) => {
                  setAttachedFiles(files);
                  setFile(files[0] ?? null);
                }}
                files={attachedFiles}
              />

              <Textarea
                color="white"
                placeholder="Type a message..."
                value={newMessage}
                onChange={handleTyping}
                onKeyDown={(e) => {
                  if (e.key === "Enter" && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
              />

              <Button
                colorScheme="blue"
                varianrt="solid"
                cursor="pointer"
                onClick={handleSendMessage}
                transition="all 0.3s ease"
                marginLeft={2}
              >
                SEND
              </Button>
            </Flex>
          </>
        ) : (
          <Center h="100%">Select a lesson in the left sidebar.</Center>
        )}
      </Box>

      <Modal isOpen={isFileViewerOpen} onClose={onFileViewerClose} size="xl">
        <ModalOverlay />
        <ModalContent bg="#1E293B">
          <ModalHeader color="white">
            {fileViewerData?.file_name || "Attached file"}
          </ModalHeader>
          <ModalCloseButton color="white" />
          <ModalBody pb={4}>
            <Flex align="center" mb={3} gap={2}>
              <Icon as={getFileIcon(fileViewerData?.type)} color="#3B82F6" />
              <Text color="gray.300" fontSize="sm">
                {fileViewerData?.type || ""}
              </Text>
            </Flex>
            <Box
              bg="#0F172A"
              borderRadius="md"
              p={3}
              maxH="60vh"
              overflowY="auto"
            >
              <Text color="white" whiteSpace="pre-wrap" fontSize="sm">
                {fileViewerData?.content
                  ? fileViewerData.content
                  : "No extracted text available for this file."}
              </Text>
            </Box>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default Chat;
