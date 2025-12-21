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
    } catch (err) {
      toast.error("Logout failed");
    }
  };

  const sidebar = [
    {
      name: "Timetable Generate",
      path: "/admin/dashboard",
      icon: assets.dashboard_icon,
    },
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
    {
      name: "Add Teacher",
      path: "/admin/add-teacher",
      icon: assets.add_icon,
    },
  ];

  return (
    <div className="min-h-screen flex flex-col">
      {/* TOP NAVBAR - FIXED with consistent logo */}
      <div className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-4 md:px-8 border-b border-gray-300 py-3 bg-white shadow-sm">
        <Link to="/" className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-gradient-to-br from-primary to-primary-glow rounded-lg flex items-center justify-center">
            <span className="text-primary-foreground font-bold text-lg">R</span>
          </div>
          <span className="font-bold text-xl text-gray-800">ResourceOPT</span>
        </Link>

        <div className="flex items-center gap-5 text-gray-600">
          <p>Hi, Admin</p>
          <button
            onClick={handleLogout}
            className="border rounded-full text-sm px-4 py-1 hover:bg-gray-100"
          >
            Logout
          </button>
        </div>
      </div>

      {/* Add padding-top to account for fixed navbar */}
      <div className="flex pt-16">
        {/* SIDEBAR - FIXED */}
        <div className="fixed left-0 top-16 h-[calc(100vh-4rem)] md:w-64 w-16 border-r bg-white z-40 pt-4 text-base flex flex-col overflow-y-auto">
          {sidebar.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              className={({ isActive }) =>
                `flex items-center gap-3 px-4 py-3 ${
                  isActive
                    ? "border-r-4 bg-blue-100 border-blue-600 text-blue-600"
                    : "hover:bg-gray-100"
                }`
              }
            >
              <img src={item.icon} className="w-7 h-7" alt={item.name} />
              <p className="hidden md:block">{item.name}</p>
            </NavLink>
          ))}
        </div>

        {/* CONTENT - Add margin to account for fixed sidebar */}
        <div className="flex-1 md:ml-64 ml-16 p-4 md:p-8">
          <Outlet />
        </div>
      </div>
    </div>
  );
}
