import React from "react";
import { Box, Flex, Text, Spacer, Image } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import ShinyText from "components/ShinyText";
const MainNavBar = () => {
  const navigate = useNavigate();

  return (
    <Box bg="#0F172A" px={8} pt={4}>
      <Flex align="center">
        <Box onClick={() => navigate("/")} cursor="pointer">
          <ShinyText text="AI Learning Assistant" speed={3} />
        </Box>
        <Spacer />

        <Text
          cursor="pointer"
          _hover={{
            transform: "scale(1.03)",
            color: "red.500",
            textDecoration: "underline",
            transition: "all 0.2s ease-in-out",
          }}
          color="white"
          mr={3}
          size="lg"
          onClick={() => navigate("/login")}
        >
          Login
        </Text>
        <Text
          cursor="pointer"
          _hover={{
            transform: "scale(1.03)",
            color: "red.500",
            textDecoration: "underline",
            transition: "all 0.2s ease-in-out",
          }}
          color="white"
          onClick={() => navigate("/register")}
        >
          Register
        </Text>
      </Flex>
    </Box>
  );
};

export default MainNavBar;
