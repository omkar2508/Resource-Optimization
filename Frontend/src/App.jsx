import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";

// User Pages
import Index from "./pages/Index";
import Login from "./pages/Login";


import EmailVerify from "./pages/EmailVerify";
import ResetPassword from "./pages/ResetPassword";

// Admin Pages
import AdminLogin from "./pages/AdminLogin";
import TimetableGenerator from "./pages/TimetableGenerator";

// Other
import NotFound from "./pages/NotFound";

// Context
import { useAppContext } from "./context/AppContext";

// Toast
import { ToastContainer } from "react-toastify";
import AdminLayout from "./layouts/AdminLayouts";
import SavedTimetable from "./pages/SavedTimetable";
import "react-toastify/dist/ReactToastify.css";
import TeacherTimetable from "./pages/TeacherTimetable";
import EditTimetable from "./pages/EditTimetable";

export default function App() {
  const { isAdmin, isLoggedIn } = useAppContext();

  return (
    <>
      <ToastContainer />

      <Routes>
        {/* PUBLIC USER ROUTES */}
        <Route path="/" element={<Index />} />
        <Route
          path="/login"
          element={isLoggedIn ? <Navigate to="/" /> : <Login />}
        />

        <Route path="/email-verify" element={<EmailVerify />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ADMIN ROUTES */}
        <Route path="/admin/login" element={<AdminLogin />} />
        <Route
          path="/admin"
          element={isAdmin ? <AdminLayout /> : <AdminLogin />}
        >
          <Route path="dashboard" element={<TimetableGenerator />} />
          <Route path="saved" element={<SavedTimetable />} />
          <Route path="teachers" element={<TeacherTimetable />} />
          <Route path="edit-timetable" element={<EditTimetable />} />
        </Route>

        {/* 404 PAGE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}
