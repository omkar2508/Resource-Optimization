import { NavLink, Outlet, Link } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import toast from "react-hot-toast";
import useIdleLogout from "../hooks/useIdleLogout";
import { Menu, X } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminLayout() {
  const { axios, setIsAdmin, adminData } = useAppContext();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      
      if (mobile) {
        setIsSidebarOpen(false);
      }
    };

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (isMobile && isSidebarOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isMobile, isSidebarOpen]);

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

  useIdleLogout(handleLogout);

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
      icon: assets.add_icon,
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Navbar */}
      <header className="fixed top-0 left-0 right-0 z-50 h-14 sm:h-16 bg-white border-b shadow-sm flex items-center justify-between px-3 sm:px-4 md:px-6">
        <div className="flex items-center gap-2 sm:gap-3">
          {/*Mobile Sidebar Toggle */}
          <button
            onClick={() => setIsSidebarOpen(!isSidebarOpen)}
            className="md:hidden p-2.5 hover:bg-blue-100 rounded-lg transition-colors flex-shrink-0 bg-blue-50 text-blue-700 border border-blue-300 shadow-sm"
            aria-label="Toggle sidebar"
          >
            {isSidebarOpen ? <X size={20} /> : <Menu size={20} />}
          </button>

          {/* BRANDING: ResourceOPT Logo */}
          <Link to="/" className="flex items-center space-x-1.5 sm:space-x-2 min-w-0">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-gradient-to-br from-blue-600 to-cyan-500 rounded-lg flex items-center justify-center flex-shrink-0">
              <span className="text-white font-bold text-base sm:text-lg">R</span>
            </div>
            <span className="font-bold text-base sm:text-lg md:text-xl text-gray-800 truncate">
              ResourceOPT
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <span className="hidden sm:inline-flex px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
            {adminData?.department || "Admin"}
          </span>
          <span className="hidden md:inline text-sm text-gray-600">
            Hi, {adminData?.name || "Admin"}
          </span>
          <button
            onClick={handleLogout}
            className="px-3 py-1.5 rounded-lg text-sm font-semibold text-red-600 hover:bg-red-50 border border-red-200 transition-colors"
          >
            Logout
          </button>
        </div>
      </header>

      {/* MOBILE SIDEBAR OVERLAY */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 md:hidden backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
          style={{ touchAction: 'none' }}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed top-14 sm:top-16 left-0 z-50 h-[calc(100vh-3.5rem)] sm:h-[calc(100vh-4rem)] bg-white border-r overflow-y-auto transition-transform duration-300 ease-in-out shadow-2xl
          ${
            isMobile
              ? `w-64 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}`
              : 'translate-x-0 w-16 lg:w-64'
          }
        `}
      >
        <div className={`${isMobile ? "px-4 py-4" : "px-2 lg:px-4 py-4 lg:py-6"}`}>
          {/*Close Button (Mobile Only) */}
          {isMobile && (
            <div className="flex justify-end mb-4">
              <button
                onClick={() => setIsSidebarOpen(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
                aria-label="Close sidebar"
              >
                <X size={20} className="text-gray-600" />
              </button>
            </div>
          )}

          {/* Generate Timetable Button */}
          <NavLink
            to="/admin/dashboard"
            onClick={() => isMobile && setIsSidebarOpen(false)}
            className={({ isActive }) =>
              `flex items-center ${isMobile ? "justify-start gap-3" : "justify-center lg:justify-start lg:gap-2"} mx-1 mb-4 lg:mb-8 py-3 lg:py-2 rounded-xl bg-blue-600 text-white font-semibold shadow-md hover:bg-blue-700 transition-all group relative
              ${isMobile ? "px-4" : "px-2 lg:px-3"}
              ${isActive ? "ring-2 ring-blue-300" : ""}
              `
            }
            title="Generate Timetable"
          >
            <img 
              src={assets.dashboard_icon} 
              alt="Generate Timetable" 
              className={`${isMobile ? "w-6 h-6" : "w-5 h-5 lg:w-5 lg:h-5"} flex-shrink-0`} 
            />
            <span className={`${isMobile ? "block text-base font-bold" : "hidden lg:block text-sm lg:text-base"}`}>
              Generate Timetable
            </span>
            {!isMobile && (
              <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 lg:hidden">
                Generate Timetable
              </span>
            )}
          </NavLink>

          {/* View Section */}
          <p className={`${isMobile ? "block" : "hidden lg:block"} px-3 text-[11px] lg:text-[13px] font-semibold text-gray-400 uppercase mb-2 mt-4 tracking-widest`}>
            View
          </p>
          {viewLinks.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => isMobile && setIsSidebarOpen(false)}
              className={({ isActive }) =>
                `group flex items-center ${isMobile ? "gap-3 px-3 py-3" : "justify-center lg:justify-start lg:gap-3 px-2 lg:px-3 py-2.5"} rounded-xl mb-2 transition-all relative
                ${
                  isActive
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }
                `
              }
              title={item.name}
            >
              {({ isActive }) => (
                <>
                  <img
                    src={item.icon}
                    alt={item.name}
                    className={`${isMobile ? "w-6 h-6" : "w-5 h-5"} flex-shrink-0`}
                  />
                  <span className={`${isMobile ? "block text-base font-medium" : "hidden lg:block text-sm font-medium"} flex-1`}>
                    {item.name}
                  </span>
                  {isActive && (
                    <span className={`${isMobile ? "block" : "hidden lg:block"} ml-auto w-2 h-2 rounded-full bg-blue-500 flex-shrink-0`}></span>
                  )}
                  {!isMobile && (
                    <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 lg:hidden">
                      {item.name}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}

          <div className={`${isMobile ? "my-4" : "my-3 lg:my-4"} border-t border-gray-100`} />

          {/* Manage Resources Section */}
          <p className={`${isMobile ? "block" : "hidden lg:block"} px-3 text-[11px] lg:text-[13px] font-semibold text-gray-400 uppercase mt-4 lg:mt-6 mb-2 tracking-wide`}>
            Manage Resources
          </p>
          {manageLinks.map((item) => (
            <NavLink
              key={item.name}
              to={item.path}
              onClick={() => isMobile && setIsSidebarOpen(false)}
              className={({ isActive }) =>
                `group flex items-center ${isMobile ? "gap-3 px-3 py-3" : "justify-center lg:justify-start lg:gap-3 px-2 lg:px-3 py-2.5"} rounded-xl mb-2 transition-all relative
                ${
                  isActive
                    ? "bg-blue-50 text-blue-600 font-semibold"
                    : "text-gray-700 hover:bg-gray-100"
                }
                `
              }
              title={item.name}
            >
              {({ isActive }) => (
                <>
                  <img
                    src={item.icon}
                    alt={item.name}
                    className={`${isMobile ? "w-6 h-6" : "w-5 h-5"} flex-shrink-0`}
                  />
                  <span className={`${isMobile ? "block text-base font-medium" : "hidden lg:block text-sm font-medium"} flex-1`}>
                    {item.name}
                  </span>
                  {isActive && (
                    <span className={`${isMobile ? "block" : "hidden lg:block"} ml-auto w-2 h-2 rounded-full bg-blue-500 flex-shrink-0`}></span>
                  )}
                  {!isMobile && (
                    <span className="absolute left-full ml-2 px-2 py-1 bg-gray-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-50 lg:hidden">
                      {item.name}
                    </span>
                  )}
                </>
              )}
            </NavLink>
          ))}
        </div>
      </aside>

      {/* CONTENT */}
      <main className={`pt-14 sm:pt-16 pb-6 transition-all duration-300 min-h-[calc(100vh-3.5rem)] sm:min-h-[calc(100vh-4rem)] ${
        isMobile 
          ? "pl-0" 
          : "pl-16 lg:pl-64"
      }`}>
       <div className="px-0">

          <Outlet />
        </div>
      </main>
    </div>
  );
}