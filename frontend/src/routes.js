// src/routes/routes.js
import { lazy } from 'react';

const Home = lazy(() => import('./views/Home'));
const Login = lazy(() => import('./views/Login'));
const Dashboard = lazy(() => import('./views/Dashboard'));
const Register = lazy(() => import('./views/Register')); 
//const Profile = lazy(() => import('../views/Profile'));
// ... more imports

export const routes = [
  { path: '/', element: Home, protected: false },
  { path: '/login', element: Login, protected: false },
  { path: '/register', element: Register, protected: false },
  { path: '/dashboard', element: Dashboard, protected: true },
  //{ path: '/profile', element: Profile, protected: true },
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