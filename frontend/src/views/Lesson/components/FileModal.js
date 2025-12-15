import React from "react";
import {
  IconButton,
  Box,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  Button,
  Text,
  Input,
  Flex,
  Icon,
  Center,
} from "@chakra-ui/react";
import { MdDelete } from "react-icons/md";
import { FaFilePdf, FaFileWord, FaFileAlt } from "react-icons/fa";

const FileModal = ({
  file,
  setFile,
  newMessage,
  setNewMessage,
  handleSendMessage,
  isOpen,
  onClose,
}) => {
  const handleClose = () => {
    setFile(null);
    setNewMessage("");
    onClose();
  };

  //   useEffect(() => {
  //     if (images.length == 0) {
  //       handleClose();
  //     }
  //   }, [images]);

  return (
    <Box>
      <Modal isOpen={isOpen} onClose={handleClose}>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Send Attached Images</ModalHeader>
          <ModalCloseButton />
          <ModalBody m={2}>
            <Flex mt={10}>
              {/* <ChatImageDropzone
                onImagesSelected={setAttachedImages}
                images={images}
                setImages={setImages}
              /> */}

              <Input
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
              />

              <Button
                align="center"
                bg={"white"}
                border="1px solid"
                borderColor={"gray.300"}
                bgColor={"gray.50"}
                borderRadius="md"
                boxShadow="sm"
                _hover={{ bg: "blue.100", borderColor: "blue.400" }}
                cursor="pointer"
                onClick={handleSendMessage}
                transition="all 0.3s ease"
                marginLeft={2}
              >
                <Text fontSize="sm" color={"gray.600"} flex="1">
                  SEND
                </Text>
              </Button>
            </Flex>
          </ModalBody>
        </ModalContent>
      </Modal>
    </Box>
  );
};

export default FileModal;
