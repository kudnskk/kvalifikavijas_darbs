import React, { useEffect, useState } from "react";
import { Box, Flex, Text, Spacer, Image } from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import ShinyText from "components/ShinyText";
import { authApi, userApi } from "../../api";
const MainNavBar = () => {
  const navigate = useNavigate();
  const [isAdmin, setIsAdmin] = useState(false);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await userApi.getMe();
        if (res?.status) {
          setIsAdmin(res?.data?.user?.user_type === "admin");
        }
      } catch {
        setIsAdmin(false);
      }
    };
    load();
  }, []);

  return (
    <Box
      h="60px"
      bg="#081229"
      px={8}
      py={4}
      borderBottom="1px solid"
      borderColor="#334155"
      boxShadow="md"
    >
      <Flex align="center">
        <Box onClick={() => navigate("/dashboard")} cursor="pointer">
          <ShinyText text="AI Learning Assistant" speed={3} />
        </Box>
        <Spacer />

        {isAdmin ? (
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
            onClick={() => navigate("/admin")}
          >
            Admin
          </Text>
        ) : null}

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
          onClick={() => navigate("/profile")}
        >
          Profile
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
          onClick={() => authApi.logout()}
        >
          Logout
        </Text>
      </Flex>
    </Box>
  );
};

export default MainNavBar;
