import React, { useRef } from "react";
import { Box, Flex, Icon, IconButton, Text } from "@chakra-ui/react";
import { IoMdAttach, IoMdClose } from "react-icons/io";
import { FaFilePdf, FaFileWord, FaFileAlt } from "react-icons/fa";

const ChatFileDropzone = ({ onFilesSelected, files }) => {
  const fileInputRef = useRef(null);

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (selectedFile) {
      onFilesSelected([selectedFile]);
    }
  };

  const removeFile = () => {
    onFilesSelected([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  const getFileIcon = (file) => {
    if (file.type === "application/pdf") {
      return FaFilePdf;
    } else if (
      file.type === "application/msword" ||
      file.type ===
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
    ) {
      return FaFileWord;
    } else {
      return FaFileAlt;
    }
  };

  return (
    <Box mr={2}>
      <input
        ref={fileInputRef}
        type="file"
        accept=".pdf,.txt,.docx"
        onChange={handleFileChange}
        style={{ display: "none" }}
      />

      {files.length > 0 ? (
        <Flex
          align="center"
          bg="#334155"
          px={3}
          py={2}
          borderRadius="md"
          fontSize="sm"
        >
          <Icon as={getFileIcon(files[0])} color="#3B82F6" mr={2} />
          <Text color="white" maxW="150px" isTruncated>
            {files[0].name}
          </Text>
          <IconButton
            icon={<IoMdClose />}
            size="xs"
            variant="ghost"
            colorScheme="red"
            ml={2}
            onClick={removeFile}
          />
        </Flex>
      ) : (
        <IconButton
          icon={<IoMdAttach />}
          size="md"
          variant="ghost"
          color="gray.400"
          _hover={{ color: "#3B82F6", bg: "#1E293B" }}
          cursor="pointer"
          onClick={() => fileInputRef.current?.click()}
        />
      )}
    </Box>
  );
};

export default ChatFileDropzone;
