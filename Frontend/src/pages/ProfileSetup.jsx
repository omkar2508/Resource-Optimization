import React, { useState, useEffect } from "react";
import { Navbar } from "../components/Navbar";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";

export default function ProfileSetup() {
  const { axios, userData, getUserData } = useAppContext();
  const navigate = useNavigate();
  const isTeacher = userData?.role === "teacher";
  
  const [formData, setFormData] = useState({
    department: userData?.department || "Software Engineering",
    year: userData?.year || "",
    division: userData?.division || "",
    batch: userData?.batch || "",
  });

  // Keep local state in sync if global data loads late
  useEffect(() => {
    if (userData) {
      setFormData({
        department: userData.department || "Software Engineering",
        year: userData.year || "",
        division: userData.division || "",
        batch: userData.batch || "",
      });
    }
  }, [userData]);

  const handleUpdate = async () => {
    if(!isTeacher){
      if (!formData.year || !formData.division) {
        return toast.error("Year and Division are required");
      }
    }

    try {
      const { data } = await axios.post("/api/user/update-profile", formData);
      if (data.success) {
        toast.success("Profile updated successfully!");
        await getUserData(); // Update global state
        navigate("/"); // Redirect to home/timetable after setup
      }
    } catch (err) {
      toast.error("Failed to update profile");
    }
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />
      
     <div className="container mx-auto px-4 pt-32 pb-12 max-w-4xl">
        <div className="bg-white rounded-3xl shadow-xl overflow-hidden flex flex-col md:flex-row border border-gray-100">
        
          
          {/* Left Side: Static Info */}
          <div className="md:w-1/3 bg-gradient-to-br from-blue-600 to-indigo-700 p-8 text-white flex flex-col items-center text-center">
            <div className="w-24 h-24 bg-white/20 rounded-full flex items-center justify-center text-3xl mb-4 border-2 border-white/30 backdrop-blur-md">
              {userData?.name?.charAt(0) || "S"}
            </div>
            <h2 className="text-2xl font-bold">{userData?.name || "Student"}</h2>
            <p className="text-blue-100 text-sm mt-2">{userData?.email}</p>
            <div className="mt-8 pt-8 border-t border-white/20 w-full">
              <span className="text-xs uppercase tracking-widest text-blue-200">Account Role</span>
              <p className="font-semibold capitalize mt-1">{userData?.role || "Student"}</p>
            </div>
          </div>

          {/* Right Side: Editable Details */}
          <div className="md:w-2/3 p-10">
            <h3 className="text-2xl font-bold text-gray-800 mb-2">{ isTeacher ? "Complete Your Profile" : "Complete Your Academic Profile"}</h3>
            <p className="text-gray-500 mb-8 text-sm">Please provide your academic details to access your specific timetable.</p>
            
            <div className="grid grid-cols-1 gap-6">
              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Department</label>
                <select className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-all" value={formData.department} onChange={(e)=>setFormData({...formData, department: e.target.value})}>
                   <option value="Software Engineering">Software Engineering</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-bold text-gray-700 mb-2">Academic Year</label>
                <select className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-all" value={formData.year} onChange={(e)=>setFormData({...formData, year: e.target.value})}>
                   <option value="">-- Choose Year --</option>
                   <option value="1st">First Year</option>
                   <option value="2nd">Second Year</option>
                   <option value="3rd">Third Year</option>
                   <option value="4th">Final Year</option>
                </select>
              </div>

              {/* <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Division</label>
                  <input type="number" min={1} max={5} placeholder="1" className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-all text-center uppercase" value={formData.division} onChange={(e)=>setFormData({...formData, division: e.target.value})} />
                </div>
                <div>
                  <label className="block text-sm font-bold text-gray-700 mb-2">Lab Batch</label>
                  <input type="number" min={1} max={5} placeholder="1" className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-all text-center" value={formData.batch} onChange={(e)=>setFormData({...formData, batch: e.target.value})} />
                </div>
              </div> */}


              {/* CHANGE: Academic fields hidden for teachers */}
              {!isTeacher && (
                <>
                  {/* Academic Year */}
                  <div>
                    <label className="block text-sm font-bold text-gray-700 mb-2">
                      Academic Year
                    </label>
                    <select
                      className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-all"
                      value={formData.year}
                      onChange={(e) =>
                        setFormData({ ...formData, year: e.target.value })
                      }
                    >
                      <option value="">-- Choose Year --</option>
                      <option value="1st">First Year</option>
                      <option value="2nd">Second Year</option>
                      <option value="3rd">Third Year</option>
                      <option value="4th">Final Year</option>
                    </select>
                  </div>

                  {/* Division & Batch */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Division
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        placeholder="1"
                        className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-all text-center"
                        value={formData.division}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            division: e.target.value,
                          })
                        }
                      />
                    </div>

                    <div>
                      <label className="block text-sm font-bold text-gray-700 mb-2">
                        Lab Batch
                      </label>
                      <input
                        type="number"
                        min={1}
                        max={5}
                        placeholder="1"
                        className="w-full p-3 border-2 border-gray-100 rounded-xl focus:border-blue-500 outline-none transition-all text-center"
                        value={formData.batch}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            batch: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </>
              )}

              <button onClick={handleUpdate} className="w-full py-4 bg-blue-600 text-white rounded-2xl font-bold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:scale-[1.02] active:scale-[0.98] transition-all mt-4">
                Save & Continue to Timetable
              </button>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}