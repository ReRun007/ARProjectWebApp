import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'
import Login from './components/Login.jsx'
import Register from './components/Register.jsx'
import Home from './components/Home.jsx'
import ProtectedRoute from './auth/ProtectedRoute.jsx'
import Dashboard from './components/Dashboard.jsx'
import Header from './components/Header.jsx'
import ClassroomDetails from './components/ClassroomDetails.jsx'


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
    path: "/home",
    element: <ProtectedRoute><Home /></ProtectedRoute>,
  },{
    path: "/dashboard",
    element: <Dashboard />,
  },{
    path: "/header",
    element: <Header />,
  },{
    path: "/classroom/:classId",  
    element: <ClassroomDetails />
  }
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <UserAuthContextProvider>
      <RouterProvider router={router} />
    </UserAuthContextProvider>
  </StrictMode>,
)
