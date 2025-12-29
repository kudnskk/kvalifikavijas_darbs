// src/routes/routes.js
import { lazy } from "react";

const Home = lazy(() => import("./views/Home"));
const Login = lazy(() => import("./views/Login"));
const Dashboard = lazy(() => import("./views/Dashboard"));
const Register = lazy(() => import("./views/Register"));
const Chat = lazy(() => import("./views/Lesson/Chat"));
const ForgotPassword = lazy(() => import("./views/ForgotPassword"));
const Profile = lazy(() => import("./views/Profile"));
const AdminPanel = lazy(() => import("./views/AdminPanel"));
// ... more imports

export const routes = [
  { path: "/", element: Home, protected: false },
  { path: "/login", element: Login, protected: false },
  { path: "/register", element: Register, protected: false },
  { path: "/forgot-password", element: ForgotPassword, protected: false },
  { path: "/dashboard", element: Dashboard, protected: true },
  { path: "/lesson/:id", element: Chat, protected: true },
  { path: "/profile", element: Profile, protected: true },
  { path: "/admin", element: AdminPanel, protected: true },
  // grouped routes
  //   {
  //     path: '/admin',
  //     protected: true,
  //     children: [
  //       { path: 'users', element: lazy(() => import('../views/Admin/Users')) },
  //       { path: 'settings', element: lazy(() => import('../views/Admin/Settings')) }
  //     ]
  //   }
];
