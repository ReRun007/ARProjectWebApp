import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import 'bootstrap/dist/css/bootstrap.min.css';

import './index.css'
import { UserAuthContextProvider } from './context/UserAuthContext.jsx'
import { createBrowserRouter, RouterProvider } from "react-router-dom";


import App from './App.jsx';
import Login from './components/auth/Login.jsx';
import Register from './components/auth/Register.jsx';
import TeacherHome from './components/teacher/Home.jsx';
import SutdentHome from './components/student/Home.jsx';
import ProtectedRoute from './auth/ProtectedRoute.jsx';
import TeacherHeader from './components/teacher/Header.jsx';
import StudentHeader from './components/student/Header.jsx';
import ClassroomDetails from './components/teacher/ClassroomDetails.jsx';
import LessonManagement from './components/teacher/LessonManagement.jsx';
import ClassroomPost from './components/teacher/ClassroomPost.jsx';
import StudentClassroomDetails from './components/student/StudentClassroomDetails.jsx';
import QuizEditor from './components/teacher/model/QuizEditor.jsx';
import QuizTaker from './components/teacher/model/QuizTaker.jsx';
import QuizManagement from './components/teacher/QuizManagement.jsx';




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
    path: "/teacher/home",
    element: <ProtectedRoute><TeacherHome /></ProtectedRoute>,
  },
  {
    path: "/student/home",
    element: <ProtectedRoute><SutdentHome /></ProtectedRoute>,
  },
  {
    path: "/student/classroom/:classId",
    element: <StudentClassroomDetails />
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
    path: "/teacher/classroom/:classId",  
    element: <ProtectedRoute><ClassroomDetails /></ProtectedRoute>
  },  
  {
    path:"/teacher/classroom/:classId/lessons",
    element:<LessonManagement />
  },{
    path:"/teacher/create-post",
    element: <ClassroomPost />
  },{
    path:"/teacher/classroom/:classId/quiz/:quizId",
    element:<QuizEditor />
  },{
    path:"/teacher/classroom/:classId/quiz/:quizId/take",
    element:<QuizTaker />
  },{
    path:"/teacher/classroom/:classId/quiz",
    element:<QuizManagement />
  }

]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserAuthContextProvider>
      <RouterProvider router={router} />
    </UserAuthContextProvider>
  </StrictMode>,
)