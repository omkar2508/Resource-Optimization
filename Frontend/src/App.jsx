// App.jsx - FIXED WITH IMPROVED ROUTING
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

// Super Admin Pages
import SuperAdminDashboard from "./pages/SuperAdminDashboard";
import AdminManagement from "./pages/AdminManagement";
import DepartmentOverview from "./pages/DepartmentOverview";

// Other
import NotFound from "./pages/NotFound";

// Components
import AdminLayout from "./layouts/AdminLayouts";
import SuperAdminLayout from "./layouts/SuperAdminLayout";
import VerifiedRoute from "./components/VerifiedRoute";
import StudentRoute from "./components/StudentRoute";

// Context
import { useAppContext } from "./context/AppContext";

// Toast
import { ToastContainer } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

export default function App() {
  const { isAdmin, isLoggedIn, adminData } = useAppContext();
  
  // Check if user is super admin
  const isSuperAdmin = isAdmin && adminData?.role === "superadmin";
  const isRegularAdmin = isAdmin && adminData?.role === "admin";

  return (
    <>
      <ToastContainer 
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop={false}
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />

      <Routes>
        {/* 
            PUBLIC USER ROUTES
         */}
        <Route path="/" element={<Index />} />
        <Route
          path="/login"
          element={isLoggedIn ? <Navigate to="/" replace /> : <Login />}
        />
        <Route path="/email-verify" element={<EmailVerify />} />
        <Route path="/reset-password" element={<ResetPassword />} />

        {/* ADMIN LOGIN ROUTE */}
        <Route 
          path="/admin/login" 
          element={
            isAdmin ? (
              isSuperAdmin ? (
                <Navigate to="/superadmin/dashboard" replace />
              ) : (
                <Navigate to="/admin/dashboard" replace />
              )
            ) : (
              <AdminLogin />
            )
          } 
        />

        {/* SUPER ADMIN ROUTES */}
        <Route
          path="/superadmin"
          element={
            isSuperAdmin ? (
              <SuperAdminLayout />
            ) : isRegularAdmin ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        >
          <Route index element={<Navigate to="/superadmin/dashboard" replace />} />
          <Route path="dashboard" element={<SuperAdminDashboard />} />
          <Route path="admins" element={<AdminManagement />} />
          <Route path="departments" element={<DepartmentOverview />} />
          
          {/* BLOCK superadmin from timetable generation */}
          <Route path="*" element={<Navigate to="/superadmin/dashboard" replace />} />
        </Route>

        {/*  REGULAR ADMIN ROUTES  */}
        <Route
          path="/admin"
          element={
            isRegularAdmin ? (
              <AdminLayout />
            ) : isSuperAdmin ? (
              <Navigate to="/superadmin/dashboard" replace />
            ) : (
              <Navigate to="/admin/login" replace />
            )
          }
        >
          <Route index element={<Navigate to="/admin/dashboard" replace />} />
          <Route path="dashboard" element={<TimetableGenerator />} />
          <Route path="saved" element={<SavedTimetable />} />
          <Route path="teachers" element={<TeacherTimetable />} />
          <Route path="add-teacher" element={<AddTeacher />} />
          <Route path="add-room" element={<AddRoom />} />
          <Route path="add-subject" element={<AddSubject />} />
          <Route path="edit-timetable" element={<EditTimetable />} />
          <Route path="*" element={<Navigate to="/admin/dashboard" replace />} />
        </Route>

        {/*  PROTECTED USER ROUTES (VERIFIED ONLY) */}
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

        {/*  STUDENT PROFILE SETUP   */}
        <Route
          path="/profile-setup"
          element={
            <StudentRoute>
              <ProfileSetup />
            </StudentRoute>
          }
        />

        {/*  404 NOT FOUND */}
        <Route path="*" element={<NotFound />} />
      </Routes>
    </>
  );
}