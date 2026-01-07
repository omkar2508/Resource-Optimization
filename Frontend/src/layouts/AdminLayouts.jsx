import { NavLink, Outlet, Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import toast from "react-hot-toast";

export default function AdminLayout() {
  const { axios, navigate, setIsAdmin } = useAppContext();

  const handleLogout = async () => {
    try {
      const { data } = await axios.post("/api/admin/logout");

      if (data.success) {
        toast.success("Admin logged out");
        setIsAdmin(false);
        navigate("/admin/login");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  // Sidebar sections
  // 1. View Section - This displays data
  const viewLinks = [
    { 
      name: "View Timetable",
      path: "/admin/saved",
      icon: assets.saved_icon,
    },
    {
      name: "Teacher Timetables",
      path: "/admin/teachers",
      icon: assets.teacher_icon,
    },
  ];

  // 2. Add / Manage - Modification
  const manageLinks = [
    {
      name: "Add Teacher",
      path: "/admin/add-teacher",
      icon: assets.add_icon,
    },
    {
      name: "Add Room",
      path: "/admin/add-room",
      icon: assets.room_icon,
    },
    {
      name: "Add Subject",
      path: "/admin/add-subject",
      icon: assets.add_icon, // You can create a specific subject icon if needed
    },
  ];
  
  return (
    <div className="min-h-screen bg-gray-50">
      {/* ================= NAVBAR ================= */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-white border-b shadow-sm flex items-center justify-between px-6">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">R</span>
          </div>
          <span className="font-bold text-xl text-foreground">ResourceOPT</span>
        </Link>

        <div className="flex items-center gap-4">
          <span className="text-sm text-gray-600">Hi, Admin</span>
          <button
            onClick={handleLogout}
            className="border rounded-full px-4 py-1 text-sm hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      </header>

      {/* ================= SIDEBAR ================= */}
      <aside className="fixed top-16 left-0 z-40 h-[calc(100vh-4rem)] w-64 bg-white border-r overflow-y-auto px-4 py-6">
        {/* Button for generate timetable */}
        <NavLink 
          to="/admin/dashboard"
          className="flex items-center justify-center gap-2 mx-2 mb-8 py-2 rounded-xl bg-blue-600 
                      text-white font-semibold shadow-md hover:bg-blue-700 shadow-lg transition"
        >
          Generate Timetable
        </NavLink>

        {/* View Section */}
        <p className="px-3 text-[15px] font-semibold text-gray-400 uppercase mb-3 tracking-widest">
          View
        </p>
        {viewLinks.map((item) => (
          <NavLink key={item.name} to={item.path}>
            {({ isActive }) => (
              <div
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all
                  ${isActive ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-700 hover:bg-gray-100"}
                `}
              >
                <img src={item.icon} alt={item.name} className="w-5 h-5" />
                <span className="text-base font-medium">{item.name}</span>
                {isActive && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-blue-500"></span>
                )}
              </div>
            )}
          </NavLink>
        ))}

        <div className="my-4 border-t border-gray-100" />

        {/* Add / Manage Section */}
        <p className="px-3 text-[15px] font-semibold text-gray-400 uppercase mt-6 mb-2 tracking-wide">
          Manage Resources
        </p>
        {manageLinks.map((item) => (
          <NavLink key={item.name} to={item.path}>
            {({ isActive }) => (
              <div
                className={`group flex items-center gap-3 px-3 py-2.5 rounded-xl mb-1 transition-all
                  ${isActive ? "bg-blue-50 text-blue-600 font-semibold" : "text-gray-700 hover:bg-gray-100"}
                `}
              >
                <img src={item.icon} alt={item.name} className="w-5 h-5" />
                <span className="text-base font-medium">{item.name}</span>
                {isActive && (
                  <span className="ml-auto w-2 h-2 rounded-full bg-blue-500"></span>
                )}
              </div>
            )}
          </NavLink>
        ))}
      </aside>

      {/* ================= CONTENT ================= */}
      <main className="pt-16 pl-64 pb-6">
        <Outlet />
      </main>
    </div>
  );
}