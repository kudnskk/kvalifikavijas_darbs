import React, { Suspense, lazy, useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Navigate, Routes, Route } from "react-router-dom";
import { ChakraProvider, Spinner, Center } from "@chakra-ui/react";
import { routes } from "./routes";
import ProtectedRoute from "./components/ProtectedRoute";
import theme from "./theme";

import authApi from "./api/authApi";
const LoginLayout = lazy(() => import("./layouts/LoginLayout"));
const MainLayout = lazy(() => import("./layouts/MainLayout"));

const NotFoundRedirect = () => {
  const [checked, setChecked] = useState(false);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const token = localStorage.getItem("sessionToken");
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
    //show the loading process
    return (
      <Center h="100vh">
        <Spinner size="xl" color="teal.500" thickness="4px" />
      </Center>
    );
  }
  return <Navigate to={isAuthenticated ? "/dashboard" : "/"} replace />;
};

const root = ReactDOM.createRoot(document.getElementById("root"));

root.render(
  <ChakraProvider theme={theme}>
    <HashRouter>
      <Suspense
        fallback={
          <Center h="100vh">
            <Spinner size="xl" color="teal.500" thickness="4px" />
          </Center>
        }
      >
        <Routes>
          {routes.map((route) => (
            <Route
              key={route.path}
              path={route.path}
              element={
                route.protected ? (
                  <ProtectedRoute>
                    <MainLayout>
                      <route.element />
                    </MainLayout>
                  </ProtectedRoute>
                ) : (
                  <LoginLayout>
                    <route.element />
                  </LoginLayout>
                )
              }
            />
          ))}

          <Route path="*" element={<NotFoundRedirect />} />
        </Routes>
      </Suspense>
    </HashRouter>
  </ChakraProvider>
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
// reportWebVitals();
