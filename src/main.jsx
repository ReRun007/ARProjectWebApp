import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import Login from './components/auth/Login.jsx';
import Register from './components/auth/Register.jsx';
import TeacherHome from './components/teacher/Home.jsx';
import SutdentHome from './components/student/Home.jsx';
import ProtectedRoute from './auth/ProtectedRoute.jsx';
import TeacherHeader from './components/teacher/Header.jsx';
import StudentHeader from './components/student/Header.jsx';
import ClassroomDetails from './components/teacher/ClassroomDetails.jsx';

import 'bootstrap/dist/css/bootstrap.min.css';

import './index.css'
import { UserAuthContextProvider } from './context/UserAuthContext.jsx'
import { createBrowserRouter, RouterProvider } from "react-router-dom";

const router = createBrowserRouter([
  {
    path: "/",
    element: <App />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "//teacher/home",
    element: <ProtectedRoute><TeacherHome /></ProtectedRoute>,
  },
  {
    path: "/student/home",
    element: <ProtectedRoute><SutdentHome /></ProtectedRoute>,
  },
  {
    path: "/header",
    element: <TeacherHeader />,
  },
  {
    path: "/header",
    element: <StudentHeader />,
  },
  {
    path: "/classroom/:classId",  
    element: <ProtectedRoute><ClassroomDetails /></ProtectedRoute>
  }
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserAuthContextProvider>
      <RouterProvider router={router} />
    </UserAuthContextProvider>
  </StrictMode>,
)