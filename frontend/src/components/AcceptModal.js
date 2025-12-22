import React from "react";
import {
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  ModalFooter,
  Button,
  Flex,
  Text,
} from "@chakra-ui/react";

const AcceptModal = ({
  isOpen,
  onClose,
  title,
  description,
  handleAction,
  confirmText = "Delete",

  isLoading = false,
}) => {
  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalOverlay />
      <ModalContent bg="#1E293B" borderColor="#334155" borderWidth="1px">
        <ModalHeader
          color="white"
          borderBottomWidth="1px"
          borderColor="#334155"
        >
          {title}
        </ModalHeader>
        <ModalCloseButton color="white" />
        <ModalBody>
          <Text color="gray.200">{description}</Text>
        </ModalBody>
        <ModalFooter>
          <Flex gap={2} w="100%" justify="flex-end">
            <Button
              variant="ghost"
              color="gray.300"
              _hover={{ bg: "#334155" }}
              onClick={onClose}
            >
              CANCEL
            </Button>
            <Button
              colorScheme="red"
              onClick={handleAction}
              isLoading={isLoading}
            >
              {confirmText}
            </Button>
          </Flex>
        </ModalFooter>
      </ModalContent>
    </Modal>
  );
};

export default AcceptModal;
