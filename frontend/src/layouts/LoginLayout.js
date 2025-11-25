import React from "react";
import { Box } from "@chakra-ui/react";
import LoginNavBar from "./components/LoginNavBar";

const LoginLayout = ({ children }) => {
  return (
    <Box minH="100vh" bgColor="#0F172A">
      <LoginNavBar />
      <Box>{children}</Box>
    </Box>
  );
};

export default LoginLayout;
