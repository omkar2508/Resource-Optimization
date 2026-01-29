import React, { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";


const getAcademicYear = (admissionYear) => {
  if (!admissionYear) return "";

  const now = new Date();
  const currentYear = now.getFullYear();
  const month = now.getMonth(); // Jan = 0

  // Academic year starts around July
  const academicBase = month >= 6 ? currentYear : currentYear - 1;

  return academicBase - admissionYear + 1;
};

const yearLabel = {
  1: "1st",
  2: "2nd",
  3: "3rd",
  4: "4th",
};

export default function ProfileSetup() {
  const { axios, userData, getUserData } = useAppContext();
  const navigate = useNavigate();
  const isTeacher = userData?.role === "teacher";

  // Only batch is editable now
  const [batch, setBatch] = useState(userData?.batch || "");

  useEffect(() => {
    if (userData?.batch) {
      setBatch(userData.batch);
    }
  }, [userData]);

  const handleUpdate = async () => {
    if (!isTeacher && !batch) {
      return toast.error("Lab batch is required");
    }

    try {
      const { data } = await axios.post("/api/user/update-profile", { batch });

      if (data.success) {
        toast.success("Profile updated successfully!");
        await getUserData();
        navigate("/");
      }
    } catch {
      toast.error("Failed to update profile");
    }
  };

  const academicYearNumber = getAcademicYear(userData?.admissionYear);
  const academicYearText = yearLabel[academicYearNumber] || "—";

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <div className="container mx-auto px-3 sm:px-4 pt-20 sm:pt-24 md:pt-32 pb-6 sm:pb-8 md:pb-12 max-w-4xl">
        <div className="bg-white rounded-xl sm:rounded-2xl md:rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-gray-100">
          {/* LEFT SIDE */}
          <div className="md:w-1/3 bg-gradient-to-br from-blue-600 to-indigo-700 p-6 sm:p-8 text-white flex flex-col items-center text-center">
            <div className="w-20 h-20 sm:w-24 sm:h-24 bg-white/20 rounded-full flex items-center justify-center text-2xl sm:text-3xl mb-3 sm:mb-4 border-2 border-white/30 backdrop-blur-md">
              {userData?.name?.charAt(0) || "S"}
            </div>
            <h2 className="text-xl sm:text-2xl font-bold">
              {userData?.name || "Student"}
            </h2>
            <p className="text-blue-100 text-sm mt-2">{userData?.email}</p>

            <div className="mt-8 pt-8 border-t border-white/20 w-full">
              <span className="text-xs uppercase tracking-widest text-blue-200">
                Account Role
              </span>
              <p className="font-semibold capitalize mt-1">
                {userData?.role || "Student"}
              </p>
            </div>
          </div>

          {/* RIGHT SIDE */}
          <div className="md:w-2/3 p-4 sm:p-6 md:p-8 lg:p-10">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-800 mb-2">
              {isTeacher
                ? "Complete Your Profile"
                : "Complete Your Academic Profile"}
            </h3>
            <p className="text-gray-500 mb-8 text-sm">
              Review your academic details and complete remaining information.
            </p>

            <div className="grid grid-cols-1 gap-6">
              {/* READ ONLY DETAILS */}
              {!isTeacher && (
                <>
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Department
                    </label>
                    <input
                      disabled
                      value={userData?.department || ""}
                      className="w-full p-3 border-2 border-gray-100 rounded-xl bg-gray-50 text-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Division
                    </label>
                    <input
                      disabled
                      value={userData?.division || ""}
                      className="w-full p-3 border-2 border-gray-100 rounded-xl bg-gray-50 text-gray-600"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Academic Year
                    </label>
                    <input
                      disabled
                      value={academicYearText}
                      className="w-full p-3 border-2 border-gray-100 rounded-xl bg-gray-50 text-gray-600"
                    />
                  </div>

                  {/* BATCH */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Lab Batch
                    </label>
                    <input
                      type="number"
                      min={1}
                      max={5}
                      placeholder="1"
                      value={batch}
                      onChange={(e) => setBatch(e.target.value)}
                      className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-all text-center"
                    />
                  </div>
                </>
              )}

              <button
                onClick={handleUpdate}
                className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4"
              >
                Save & Continue to Timetable
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
