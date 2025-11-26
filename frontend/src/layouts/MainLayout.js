import React from "react";
import { Box } from "@chakra-ui/react";
import MainNavBar from "./components/MainNavBar";

const MainLayout = ({ children }) => {
  return (
    <Box minH="100vh" bgColor="#0F172A">
      <MainNavBar />
      <Box>{children}</Box>
    </Box>
  );
};

export default MainLayout;
