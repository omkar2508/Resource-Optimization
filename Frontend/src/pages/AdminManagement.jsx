// pages/AdminManagement.jsx
import { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { toast } from "react-toastify";
import {
  Plus,
  Edit2,
  Trash2,
  Shield,
  ShieldCheck,
  ShieldOff,
  Mail,
  Building2,
  User
} from "lucide-react";

export default function AdminManagement() {
  const { axios } = useAppContext();
  const [admins, setAdmins] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingAdmin, setEditingAdmin] = useState(null);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    department: ""
  });

  const departments = [
    "Computer Engineering",
    "IT Engineering",
    "AI Engineering",
    "Software Engineering",
    "Mechanical Engineering",
    "Civil Engineering",
    "Electrical Engineering"
  ];

  useEffect(() => {
    fetchAdmins();
  }, []);

  const fetchAdmins = async () => {
    try {
      setLoading(true);
      const res = await axios.get("/api/superadmin/admins");
      
      if (res.data.success) {
        setAdmins(res.data.admins);
      }
    } catch (err) {
      toast.error("Failed to load admins");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAdmin = async (e) => {
    e.preventDefault();

    if (!formData.name || !formData.email || !formData.password || !formData.department) {
      toast.error("All fields are required");
      return;
    }

    try {
      const res = await axios.post("/api/superadmin/create-admin", formData);
      
      if (res.data.success) {
        toast.success("Admin created successfully");
        setShowCreateModal(false);
        setFormData({ name: "", email: "", password: "", department: "" });
        fetchAdmins();
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create admin");
    }
  };

  const handleUpdateAdmin = async (e) => {
    e.preventDefault();

    try {
      const res = await axios.patch(`/api/superadmin/admins/${editingAdmin._id}`, {
        name: formData.name,
        department: formData.department
      });
      
      if (res.data.success) {
        toast.success("Admin updated successfully");
        setEditingAdmin(null);
        setFormData({ name: "", email: "", password: "", department: "" });
        fetchAdmins();
      }
    } catch (err) {
      toast.error("Failed to update admin");
    }
  };

  const handleToggleStatus = async (adminId) => {
    try {
      const res = await axios.patch(`/api/superadmin/admins/${adminId}/toggle-status`);
      
      if (res.data.success) {
        toast.success(res.data.message);
        fetchAdmins();
      }
    } catch (err) {
      toast.error("Failed to toggle admin status");
    }
  };

const handleDeleteAdmin = (adminId) => {
  toast(
    ({ closeToast }) => (
      <div>
        <p className="font-medium mb-3">
          Are you sure you want to remove this admin?
        </p>

        <div className="flex justify-end gap-2">
          <button
            onClick={closeToast}
            className="px-4 py-2 text-sm border border-gray-300 rounded-lg hover:bg-gray-50"
          >
            Cancel
          </button>

          <button
            onClick={async () => {
              try {
                const res = await axios.delete(
                  `/api/superadmin/admins/${adminId}`
                );

                if (res.data.success) {
                  toast.success("Admin removed successfully");
                  fetchAdmins();
                }
              } catch (err) {
                toast.error("Failed to delete admin");
              }

              closeToast();
            }}
            className="px-4 py-2 text-sm bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            OK
          </button>
        </div>
      </div>
    ),
    {
      autoClose: false,
      closeOnClick: false,
      closeButton: false,
    }
  );
};
  const startEdit = (admin) => {
    setEditingAdmin(admin);
    setFormData({
      name: admin.name,
      email: admin.email,
      password: "",
      department: admin.department
    });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="p-3 sm:p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4 mb-6">
        <div>
          <h1 className="text-xl sm:text-3xl font-bold text-gray-800 flex items-center gap-3">
            <Shield className="text-blue-600" />
            Admin Management
          </h1>
          <p className="text-gray-600 mt-2">Create and manage department admins</p>
        </div>
        
        <button
          onClick={() => setShowCreateModal(true)}
          className="w-full sm:w-auto justify-center flex items-center gap-2 bg-blue-600 text-white px-5 py-3 rounded-lg hover:bg-blue-700 transition-colors shadow-md"
        >
          <Plus size={20} />
          Create Admin
        </button>
      </div>

      {/* Admins List */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[900px]">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Name</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Email</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Department</th>
                <th className="text-left py-4 px-6 font-semibold text-gray-700">Role</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Status</th>
                <th className="text-center py-4 px-6 font-semibold text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody>
              {admins.map((admin) => (
                <tr key={admin._id} className="border-t hover:bg-gray-50 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <User className="text-gray-400" size={18} />
                      <span className="font-medium">{admin.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail size={16} />
                      {admin.email}
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-2">
                      <Building2 className="text-blue-500" size={16} />
                      <span className="text-sm">{admin.department || "N/A"}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                      admin.role === "superadmin" 
                        ? "bg-blue-100 text-blue-700" 
                        : "bg-blue-100 text-blue-700"
                    }`}>
                      {admin.role === "superadmin" ? <ShieldCheck size={14} /> : <Shield size={14} />}
                      {admin.role}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      admin.isActive 
                        ? "bg-green-100 text-green-700" 
                        : "bg-red-100 text-red-700"
                    }`}>
                      {admin.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    {admin.role !== "superadmin" && (
                      <div className="flex items-center justify-center gap-2">
                        <button
                          onClick={() => startEdit(admin)}
                          className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                          title="Edit"
                        >
                          <Edit2 size={18} />
                        </button>
                        <button
                          onClick={() => handleToggleStatus(admin._id)}
                          className="p-2 text-amber-600 hover:bg-amber-50 rounded-lg transition-colors"
                          title={admin.isActive ? "Deactivate" : "Activate"}
                        >
                          {admin.isActive ? <ShieldOff size={18} /> : <ShieldCheck size={18} />}
                        </button>
                        <button
                          onClick={() => handleDeleteAdmin(admin._id)}
                          className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                          title="Delete"
                        >
                          <Trash2 size={18} />
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create/Edit Modal */}
      {(showCreateModal || editingAdmin) && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6">
            <h2 className="text-2xl font-bold mb-4">
              {editingAdmin ? "Edit Admin" : "Create New Admin"}
            </h2>
            
            <form onSubmit={editingAdmin ? handleUpdateAdmin : handleCreateAdmin}>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Name</label>
                <input
                  type="text"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium mb-2">Email</label>
                <input
                  type="email"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                  disabled={!!editingAdmin}
                />
              </div>

              {!editingAdmin && (
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-2">Password</label>
                  <input
                    type="password"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                    required
                  />
                </div>
              )}

              <div className="mb-6">
                <label className="block text-sm font-medium mb-2">Department</label>
                <select
                  value={formData.department}
                  onChange={(e) => setFormData({ ...formData, department: e.target.value })}
                  className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
                  required
                >
                  <option value="">Select Department</option>
                  {departments.map((dept) => (
                    <option key={dept} value={dept}>{dept}</option>
                  ))}
                </select>
              </div>

              <div className="flex gap-3">
                <button
                  type="submit"
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 transition-colors"
                >
                  {editingAdmin ? "Update" : "Create"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowCreateModal(false);
                    setEditingAdmin(null);
                    setFormData({ name: "", email: "", password: "", department: "" });
                  }}
                  className="flex-1 bg-gray-200 text-gray-700 py-2 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}