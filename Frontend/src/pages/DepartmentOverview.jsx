// pages/DepartmentOverview.jsx
import { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import { 
  Building2, 
  CheckCircle, 
  XCircle, 
  User,
  Mail
} from "lucide-react";

export default function DepartmentOverview() {
  const { axios } = useAppContext();
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDepartments();
  }, []);

  const fetchDepartments = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/superadmin/departments");
      
      if (res.data.success) {
        setDepartments(res.data.departments);
      }
    } catch (err) {
      toast.error("Failed to load departments");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <Building2 className="text-blue-600" />
          Department Overview
        </h1>
        <p className="text-gray-600 mt-2">View admin assignments across all departments</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {departments.map((dept, idx) => (
          <div
            key={idx}
            className={`bg-white rounded-xl shadow-md p-6 border-l-4 transition-all hover:shadow-lg ${
              dept.hasAdmin 
                ? "border-green-500" 
                : "border-red-500"
            }`}
          >
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-3 rounded-lg ${
                  dept.hasAdmin ? "bg-green-100" : "bg-red-100"
                }`}>
                  <Building2 
                    className={dept.hasAdmin ? "text-green-600" : "text-red-600"} 
                    size={24} 
                  />
                </div>
                <div>
                  <h3 className="font-bold text-gray-800 text-lg">
                    {dept.name}
                  </h3>
                </div>
              </div>
              
              {dept.hasAdmin ? (
                <CheckCircle className="text-green-500" size={24} />
              ) : (
                <XCircle className="text-red-500" size={24} />
              )}
            </div>

            <div className="mt-4 pt-4 border-t">
              {dept.admin ? (
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-gray-700">
                    <User size={16} className="text-gray-400" />
                    <span className="font-medium">{dept.admin.name}</span>
                  </div>
                  <div className="flex items-center gap-2 text-gray-600 text-sm">
                    <Mail size={14} className="text-gray-400" />
                    <span>{dept.admin.email}</span>
                  </div>
                  <div className="mt-3">
                    <span className="inline-block px-3 py-1 bg-green-100 text-green-700 rounded-full text-xs font-medium">
                      Admin Assigned
                    </span>
                  </div>
                </div>
              ) : (
                <div className="text-center py-4">
                  <p className="text-red-600 font-medium mb-2">No Admin Assigned</p>
                  <span className="inline-block px-3 py-1 bg-red-100 text-red-700 rounded-full text-xs font-medium">
                    Requires Admin
                  </span>
                </div>
              )}
            </div>
          </div>
        ))}
      </div>

      {/* Summary Stats */}
      <div className="mt-8 bg-white rounded-xl shadow-md p-6">
        <h2 className="text-xl font-bold text-gray-800 mb-4">Summary</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-blue-600 text-sm font-medium">Total Departments</p>
            <p className="text-3xl font-bold text-blue-700 mt-1">{departments.length}</p>
          </div>
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-green-600 text-sm font-medium">With Admin</p>
            <p className="text-3xl font-bold text-green-700 mt-1">
              {departments.filter(d => d.hasAdmin).length}
            </p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-red-600 text-sm font-medium">Without Admin</p>
            <p className="text-3xl font-bold text-red-700 mt-1">
              {departments.filter(d => !d.hasAdmin).length}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}