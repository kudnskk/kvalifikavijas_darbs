import { Navigate } from "react-router-dom";
import React from "react";
import authApi from "../api/authApi";
import { Spinner, Center } from "@chakra-ui/react";

const ProtectedRoute = ({ children }) => {
  const [checked, setChecked] = React.useState(false);
  const [isAuthenticated, setIsAuthenticated] = React.useState(false);

  React.useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("authToken");
      if (!token) {
        setIsAuthenticated(false);
        setChecked(true);
        return;
      }
      try {
        const res = await authApi.verify();
        setIsAuthenticated(res?.status === true);
      } catch {
        setIsAuthenticated(false);
      } finally {
        setChecked(true);
      }
    };
    checkAuth();
  }, []);

  if (!checked) {
    return (
      <Center h="100vh">
        <Spinner size="xl" color="teal.500" thickness="4px" />
      </Center>
    );
  }
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;
