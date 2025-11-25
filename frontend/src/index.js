import React, { Suspense, lazy } from "react";
import ReactDOM from "react-dom/client";
import { HashRouter, Navigate, Routes, Route } from "react-router-dom";
import { ChakraProvider, Spinner, Center } from "@chakra-ui/react";
import { routes } from "./routes";
import ProtectedRoute from "./components/ProtectedRoute";
import theme from "./theme";
const LoginLayout = lazy(() => import("./layouts/LoginLayout"));
const MainLayout = lazy(() => import("./layouts/MainLayout"));

// Component to handle 404 redirection based on auth
const NotFoundRedirect = () => {
  // const token = localStorage.getItem('authToken');
  // const isAuthenticated = !!token;
  const isAuthenticated = true; // Temporarily disabled auth check
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
