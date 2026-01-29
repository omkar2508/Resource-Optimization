import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAppContext } from "../context/AppContext";

const AddTeacher = () => {
  const { axios, adminData } = useAppContext();

  // ADD FORM
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // TABLE DATA
  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);

  // UPDATE MODAL STATES
  const [showModal, setShowModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [updateName, setUpdateName] = useState("");

  // Get admin's department - teachers automatically assigned to this department
  const department = adminData?.department || "";

  const fetchTeachers = async () => {
    try {
      const { data } = await axios.get("/api/teacher", {
        withCredentials: true,
      });
      if (data.success) setTeachers(data.teachers);
    } catch (error) {
      toast.error("Failed to fetch teachers");
      console.error("Fetch error:", error);
    }
  };

  useEffect(() => {
    fetchTeachers();
  }, []);

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !password) {
      toast.error("All fields are required");
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.post(
        "/api/teacher/add",
        { name, email, password },
        { withCredentials: true }
      );

      if (data.success) {
        toast.success(" Teacher added successfully");
        fetchTeachers();
        setName("");
        setEmail("");
        setPassword("");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add teacher");
    } finally {
      setLoading(false);
    }
  };

  const openUpdateModal = (teacher) => {
    setSelectedTeacher(teacher);
    setUpdateName(teacher.name);
    setShowModal(true);
  };

  const handleUpdateTeacher = async () => {
    if (!updateName) {
      toast.error("Name is required");
      return;
    }

    try {
      const { data } = await axios.put(
        `/api/teacher/update/${selectedTeacher._id}`,
        { name: updateName },
        { withCredentials: true }
      );

      if (data.success) {
        toast.success(" Teacher updated successfully");
        fetchTeachers();
        setShowModal(false);
      }
    } catch (error) {
      toast.error("Failed to update teacher");
    }
  };

  const confirmDeleteTeacher = (id, teacherName) => {
    toast(
      ({ closeToast }) => (
        <div>
          <p className="font-medium mb-2">
            Delete teacher <strong>{teacherName}</strong>?
          </p>
          <div className="flex justify-end gap-2">
            <button
              onClick={closeToast}
              className="px-3 py-1 text-sm border rounded hover:bg-gray-50"
            >
              Cancel
            </button>
            <button
              onClick={() => {
                handleDeleteTeacher(id);
                closeToast();
              }}
              className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete
            </button>
          </div>
        </div>
      ),
      {
        position: "top-center",
        autoClose: false,
        closeOnClick: false,
        draggable: false,
      }
    );
  };

  const handleDeleteTeacher = async (id) => {
    try {
      const { data } = await axios.delete(`/api/teacher/delete/${id}`, {
        withCredentials: true,
      });

      if (data.success) {
        toast.success(" Teacher deleted");
        fetchTeachers();
      }
    } catch (error) {
      toast.error("Failed to delete teacher");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-sky-50 to-indigo-100 px-3 sm:px-4 md:px-6 lg:px-8 py-4 sm:py-6 md:py-10">
      <div className="max-w-6xl mx-auto">
        {/* ADD TEACHER */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-xl p-4 sm:p-6 md:p-8 mb-6 sm:mb-8 md:mb-10 border">
          <h2 className="text-xl sm:text-2xl font-semibold text-slate-800 mb-4 sm:mb-6">
            👥 Add Teacher
          </h2>

          {/* Department Info */}
          <div className="mb-4 p-3 bg-blue-50 border-l-4 border-blue-500 rounded">
            <p className="text-sm text-blue-800">
              <strong>Department:</strong> {department}
              <span className="ml-2 text-blue-600">(Auto-assigned to teachers)</span>
            </p>
          </div>

          <form
            onSubmit={handleSubmit}
            className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4"
          >
            <input
              type="text"
              placeholder="Teacher Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg bg-slate-100 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <input
              type="email"
              placeholder="Teacher Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg bg-slate-100 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="px-3 sm:px-4 py-2 text-sm sm:text-base rounded-lg bg-slate-100 text-slate-800 outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <button
              type="submit"
              disabled={loading}
              className="sm:col-span-2 lg:col-span-3 mt-2 py-2.5 sm:py-2 rounded-lg bg-blue-600 hover:bg-blue-700 transition text-white font-semibold disabled:opacity-60 text-sm sm:text-base"
            >
              {loading ? "Adding..." : "➕ Add Teacher"}
            </button>
          </form>
        </div>

        {/* TEACHERS TABLE */}
        <div className="bg-white rounded-xl sm:rounded-2xl shadow-lg p-4 sm:p-6 border">
          <h3 className="text-lg sm:text-xl font-semibold mb-3 sm:mb-4 text-slate-800">
            📋 Teachers List ({teachers.length})
          </h3>

          <div className="overflow-x-auto -mx-4 sm:mx-0">
            <div className="inline-block min-w-full align-middle sm:px-0 px-4">
              <table className="min-w-full border-collapse">
                <thead>
                  <tr className="bg-blue-50 text-slate-700">
                    <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">Name</th>
                    <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">Email</th>
                    <th className="p-2 sm:p-3 text-left text-xs sm:text-sm font-semibold whitespace-nowrap">Department</th>
                    <th className="p-2 sm:p-3 text-center text-xs sm:text-sm font-semibold whitespace-nowrap">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {teachers.length === 0 ? (
                    <tr>
                      <td colSpan="4" className="text-center p-4 sm:p-6 text-gray-500 text-sm sm:text-base">
                        No teachers added yet
                      </td>
                    </tr>
                  ) : (
                    teachers.map((t) => (
                      <tr
                        key={t._id}
                        className="border-t hover:bg-blue-50 transition"
                      >
                        <td className="p-2 sm:p-3 text-sm sm:text-base whitespace-nowrap">{t.name}</td>
                        <td className="p-2 sm:p-3 text-xs sm:text-sm whitespace-nowrap break-all">{t.email}</td>
                        <td className="p-2 sm:p-3 text-sm sm:text-base whitespace-nowrap">{t.department}</td>
                        <td className="p-2 sm:p-3 text-center whitespace-nowrap">
                          <div className="flex justify-center gap-1.5 sm:gap-2">
                            <button
                              onClick={() => openUpdateModal(t)}
                              className="px-2 sm:px-3 py-1 text-xs rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
                            >
                              ✏️ Edit
                            </button>
                            <button
                              onClick={() => confirmDeleteTeacher(t._id, t.name)}
                              className="px-2 sm:px-3 py-1 text-xs rounded bg-red-600 hover:bg-red-700 text-white transition-colors"
                            >
                              🗑️ Delete
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>

      {/* UPDATE MODAL */}
      {showModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-md">
            <h3 className="text-lg sm:text-xl font-semibold mb-4">✏️ Update Teacher</h3>

            <input
              type="text"
              value={updateName}
              onChange={(e) => setUpdateName(e.target.value)}
              placeholder="Name"
              className="w-full mb-3 px-3 py-2 text-sm sm:text-base rounded bg-slate-100 outline-none focus:ring-2 focus:ring-blue-500"
              required
            />

            <div className="mb-3 p-2 bg-gray-50 rounded">
              <p className="text-xs text-gray-600">
                <strong>Email:</strong> {selectedTeacher?.email}
              </p>
              <p className="text-xs text-gray-600">
                <strong>Department:</strong> {selectedTeacher?.department}
              </p>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-2 sm:gap-3">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-sm sm:text-base rounded border hover:bg-gray-50 transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateTeacher}
                className="px-4 py-2 text-sm sm:text-base rounded bg-blue-600 hover:bg-blue-700 text-white transition-colors"
              >
                💾 Update
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AddTeacher;