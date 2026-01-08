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
import SavedTimetable from "./pages/SavedTimetable";
import TeacherTimetable from "./pages/TeacherTimetable";
import StudentTimetable from "./pages/StudentTimetable";
import EditTimetable from "./pages/EditTimetable";
import AddTeacher from "./pages/AddTeacher";
import AddRoom from "./pages/AddRoom";
import AddSubject from "./pages/AddSubject";
import IndividualTeacherTimetable from "./pages/IndividualTimetable";
import ProfileSetup from "./pages/ProfileSetup";

// Other
import NotFound from "./pages/NotFound";

// Components
import AdminLayout from "./layouts/AdminLayouts";
import VerifiedRoute from "./components/VerifiedRoute";

// Context
import { useAppContext } from "./context/AppContext";

// Toast
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

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
          <Route path="add-teacher" element={<AddTeacher />} />
          <Route path="add-room" element={<AddRoom />} />
          <Route path="add-subject" element={<AddSubject />} />
          <Route path="edit-timetable" element={<EditTimetable />} />
        </Route>

        {/* PROTECTED USER ROUTES */}
        <Route
          path="/teacher-timetable"
          element={
            <VerifiedRoute>
              <IndividualTeacherTimetable />
            </VerifiedRoute>
          }
        />

        <Route
          path="/student-timetable"
          element={
            <VerifiedRoute>
              <StudentTimetable />
            </VerifiedRoute>
          }
        />

        <Route path="/profile-setup" element={<ProfileSetup />} />

        {/* 404 PAGE */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}