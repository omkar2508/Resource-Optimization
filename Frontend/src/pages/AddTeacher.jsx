import React, { useState } from "react";
import { toast } from "react-toastify";
import { Navbar } from "../components/Navbar";
import { useAppContext } from "../context/AppContext";

const AddTeacher = () => {
  const { axios } = useAppContext();

  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [department, setDepartment] = useState("");
  const [password, setPassword] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!name || !email || !department || !password) {
      toast.error("All fields are required");
      return;
    }

    try {
      const { data } = await axios.post("/api/admin/add-teacher", {
        name,
        email,
        department,
        password,
      });

      if (data.success) {
        toast.success("Teacher added successfully");

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
    }
  };

  return (
    <>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-cyan-50 to-blue-100 flex items-center justify-center px-4">
        <div className="bg-slate-900 w-full max-w-md rounded-xl shadow-xl p-10 text-indigo-300">
          <h2 className="text-3xl font-semibold text-white text-center mb-6">
            Add Teacher
          </h2>

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Name */}
            <input
              type="text"
              placeholder="Teacher Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-5 py-2.5 rounded-full bg-[#333A5C] text-white outline-none"
              required
            />

            {/* Email */}
            <input
              type="email"
              placeholder="Teacher Email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-5 py-2.5 rounded-full bg-[#333A5C] text-white outline-none"
              required
            />

            {/* Department */}
            <input
              type="text"
              placeholder="Department"
              value={department}
              onChange={(e) => setDepartment(e.target.value)}
              className="w-full px-5 py-2.5 rounded-full bg-[#333A5C] text-white outline-none"
              required
            />

            {/* Password */}
            <input
              type="password"
              placeholder="Temporary Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-5 py-2.5 rounded-full bg-[#333A5C] text-white outline-none"
              required
            />

            <button
              type="submit"
              className="w-full py-2.5 rounded-full bg-gradient-to-r from-indigo-500 to-indigo-900 text-white font-medium"
            >
              Add Teacher
            </button>
          </form>
        </div>
      </div>
    </>
  );
};

export default AddTeacher;
