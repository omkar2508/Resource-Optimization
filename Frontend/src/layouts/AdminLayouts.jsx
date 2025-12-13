import { NavLink, Outlet, Link } from "react-router-dom";
import { useAppContext } from "../context/AppContext";
import { assets } from "../assets/assets"; // your icons/logo
import toast from "react-hot-toast";

export default function AdminLayout() {
  const { axios, navigate, setIsAdmin } = useAppContext();

  // LOGOUT
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
      name: "Dashboard",
      path: "/admin/dashboard",
      icon: assets.dashboard_icon,
    },
    { name: "Saved Timetables", path: "/admin/saved", icon: assets.saved_icon },
    {
      name: "Teacher Timetables",
      path: "/admin/teachers",
      icon: assets.teacher_icon,
    },
    // you can add more tabs here later
  ];

  return (
    <>
      {/* TOP NAVBAR */}
      <div className="flex items-center justify-between px-4 md:px-8 border-b border-gray-300 py-3 bg-white">
        <Link to="/">
          <img src={assets.logo} alt="Logo" className="cursor-pointer w-36" />
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

      {/* MAIN CONTENT */}
      <div className="flex">
        {/* SIDEBAR */}
        <div className="md:w-64 w-16 border-r h-[90vh] pt-4 text-base flex flex-col">
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
              <img src={item.icon} className="w-7 h-7" />
              <p className="hidden md:block">{item.name}</p>
            </NavLink>
          ))}
        </div>

        {/* CONTENT */}
        <div className="flex-1 p-4 md:p-8">
          <Outlet />
        </div>
      </div>
    </>
  );
}
