// import React, { useState } from "react";
// import { toast } from "react-toastify";
// import { Navbar } from "../components/Navbar";
// import { useAppContext } from "../context/AppContext";

// const AddTeacher = () => {
//   const { axios } = useAppContext();

//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");
//   const [department, setDepartment] = useState("");
//   const [password, setPassword] = useState("");

//   const handleSubmit = async (e) => {
//     e.preventDefault();

//     if (!name || !email || !department || !password) {
//       toast.error("All fields are required");
//       return;
//     }

//     try {
//       const { data } = await axios.post("/api/admin/add-teacher", {
//         name,
//         email,
//         department,
//         password,
//       });

//       if (data.success) {
//         toast.success("Teacher added successfully");

//         // clear form
//         setName("");
//         setEmail("");
//         setDepartment("");
//         setPassword("");
//       } else {
//         toast.error(data.message);
//       }
//     } catch (err) {
//       toast.error(err.response?.data?.message || "Failed to add teacher");
//     }
//   };

//   return (
//     <>
//       <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 flex items-center justify-center px-4">
//         <div className="bg-slate-900 w-full max-w-md rounded-xl shadow-xl p-10 text-indigo-300">
//           <h2 className="text-3xl font-semibold text-white text-center mb-6">
//             Add Teacher
//           </h2>

//           <form onSubmit={handleSubmit} className="space-y-4">
//             {/* Name */}
//             <input
//               type="text"
//               placeholder="Teacher Name"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//               className="w-full px-5 py-2.5 rounded-full bg-[#333A5C] text-white outline-none"
//               required
//             />

//             {/* Email */}
//             <input
//               type="email"
//               placeholder="Teacher Email"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//               className="w-full px-5 py-2.5 rounded-full bg-[#333A5C] text-white outline-none"
//               required
//             />

//             {/* Department */}
//             <input
//               type="text"
//               placeholder="Department"
//               value={department}
//               onChange={(e) => setDepartment(e.target.value)}
//               className="w-full px-5 py-2.5 rounded-full bg-[#333A5C] text-white outline-none"
//               required
//             />

//             {/* Password */}
//             <input
//               type="password"
//               placeholder="Temporary Password"
//               value={password}
//               onChange={(e) => setPassword(e.target.value)}
//               className="w-full px-5 py-2.5 rounded-full bg-[#333A5C] text-white outline-none"
//               required
//             />

//             <button
//               type="submit"
//               className="w-full py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-900 text-white font-medium"
//             >
//               Add Teacher
//             </button>
//           </form>
//         </div>
//       </div>
//     </>
//   );
// };

// export default AddTeacher;

import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useAppContext } from "../context/AppContext";

const AddTeacher = () => {
  const { axios } = useAppContext();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");

  const [teachers, setTeachers] = useState([]);
  const [loading, setLoading] = useState(false);

  // ===============================
  // FETCH TEACHERS
  // ===============================
  const fetchTeachers = async () => {
    try {
      const { data } = await axios.get("/api/teacher", {
        withCredentials: true,
      });

      if (data.success) {
        setTeachers(data.teachers);
      } else {
        toast.error("Failed to fetch teachers");
      }
    } catch (error) {
      toast.error("Failed to fetch teachers");
    }
  };
  useEffect(() => {
    fetchTeachers();
  }, []);

  // ===============================
  // ADD TEACHER
  // ===============================
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !department || !password) {
      toast.error("All fields are required");
      return;
    }

    try {
      setLoading(true);
      const { data } = await axios.post(
        "/api/teacher/add",
        { name, email, department, password },
        { withCredentials: true }
      );

      if (data.success) {
        toast.success("Teacher added successfully");

        // refresh table
        fetchTeachers();

        // clear form
        setName("");
        setEmail("");
        setDepartment("");
        setPassword("");
      } else {
        toast.error(data.message);
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to add teacher");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 px-8 py-10">
      {/* ================= ADD TEACHER RECTANGLE ================= */}
      <div className="bg-slate-900 rounded-2xl shadow-xl p-8 mb-10 max-w-6xl mx-auto">
        <h2 className="text-2xl font-semibold text-white mb-6">Add Teacher</h2>

        <form
          onSubmit={handleSubmit}
          className="grid grid-cols-1 md:grid-cols-4 gap-4"
        >
          <input
            type="text"
            placeholder="Teacher Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="px-4 py-2 rounded-lg bg-[#333A5C] text-white outline-none"
          />

          <input
            type="email"
            placeholder="Teacher Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="px-4 py-2 rounded-lg bg-[#333A5C] text-white outline-none"
          />

          <input
            type="text"
            placeholder="Department"
            value={department}
            onChange={(e) => setDepartment(e.target.value)}
            className="px-4 py-2 rounded-lg bg-[#333A5C] text-white outline-none"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="px-4 py-2 rounded-lg bg-[#333A5C] text-white outline-none"
          />

          <button
            type="submit"
            disabled={loading}
            className="md:col-span-4 mt-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-900 text-white font-medium"
          >
            {loading ? "Adding..." : "Add Teacher"}
          </button>
        </form>
      </div>

      {/* ================= TEACHERS TABLE ================= */}
      <div className="bg-white rounded-2xl shadow-lg p-6 max-w-6xl mx-auto">
        <h3 className="text-xl font-semibold mb-4 text-slate-800">
          Teachers List
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="bg-slate-100 text-left">
                <th className="p-3">Name</th>
                <th className="p-3">Email</th>
                <th className="p-3">Department</th>
                <th className="p-3">Role</th>
              </tr>
            </thead>
            <tbody>
              {teachers.length === 0 ? (
                <tr>
                  <td colSpan="4" className="text-center p-4 text-gray-500">
                    No teachers added yet
                  </td>
                </tr>
              ) : (
                teachers.map((t) => (
                  <tr key={t._id} className="border-t hover:bg-slate-50">
                    <td className="p-3">{t.name}</td>
                    <td className="p-3">{t.email}</td>
                    <td className="p-3">{t.department}</td>
                    <td className="p-3 capitalize">Teacher</td> {/* {t.role} */}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AddTeacher;
