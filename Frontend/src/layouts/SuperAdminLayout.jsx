import { NavLink, Outlet, Link, useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { assets } from "../assets/assets";
import toast from "react-hot-toast";

import { Menu, X, Shield, Users, BarChart3, LogOut } from "lucide-react";

export default function SuperAdminLayout() {
  const { axios, setIsAdmin, adminData, adminLogout } = useAppContext();
  const navigate = useNavigate();
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const handleResize = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
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
    return () => { document.body.style.overflow = 'unset'; };
  }, [isMobile, isSidebarOpen]);

  const handleLogout = async () => {
   
    
    try {
      await adminLogout();
      toast.success("Logged out successfully");
    } catch (error) {
      toast.error("Logout failed");
    }
  };

  const menuLinks = [
    {
      name: "Dashboard",
      path: "/superadmin/dashboard",
      icon: BarChart3,
      color: "blue"
    },
    {
      name: "Manage Admins",
      path: "/superadmin/admins",
      icon: Shield,
      color: "blue"
    },
    {
      name: "All Departments",
      path: "/superadmin/departments",
      icon: Users,
      color: "green"
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* NAVBAR */}
      <header className="fixed top-0 left-0 right-0 z-50 h-16 bg-gradient-to-r from-blue-600 to-blue-300 shadow-lg flex items-center justify-between px-6">
        <div className="flex items-center gap-3">
          {isMobile && (
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors text-white"
            >
              {isSidebarOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          )}

          <Link to="/" className="flex items-center space-x-2">
            <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center">
              <Shield className="text-blue-600" size={24} />
            </div>
            <span className="font-bold text-xl text-white hidden sm:block">
              Super Admin
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-4">
          <div className="bg-white/20 px-4 py-2 rounded-full">
            <span className="text-white font-medium text-sm">
              {adminData?.name || "Super Admin"}
            </span>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 bg-white/20 hover:bg-white/30 text-white px-4 py-2 rounded-lg transition-colors"
          >
            <LogOut size={18} />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </header>

      {/* MOBILE OVERLAY */}
      {isMobile && isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 backdrop-blur-sm"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* SIDEBAR */}
      <aside
        className={`fixed top-16 left-0 z-50 h-[calc(100vh-4rem)] bg-white border-r shadow-lg overflow-y-auto transition-transform duration-300
          ${isMobile 
            ? `w-64 ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}` 
            : 'translate-x-0 w-64'
          }
        `}
      >
        <div className="p-4">
          <div className="mb-6 p-4 bg-gradient-to-r from-blue-100 to-blue-0 rounded-lg border border-blue-200">
            <div className="flex items-center gap-2 text-blue-700 mb-1">
              <Shield size={20} />
              <span className="font-bold text-sm">SUPER ADMIN</span>
            </div>
            <p className="text-xs text-blue-600">Full system access</p>
          </div>

          <nav>
            {menuLinks.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => isMobile && setIsSidebarOpen(false)}
                className={({ isActive }) =>
                  `flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition-all group ${
                    isActive
                      ? `bg-${item.color}-50 text-${item.color}-700 font-semibold`
                      : "text-gray-700 hover:bg-gray-100"
                  }`
                }
              >
                {({ isActive }) => (
                  <>
                    <item.icon 
                      size={20} 
                      className={isActive ? `text-${item.color}-600` : "text-gray-400 group-hover:text-gray-600"}
                    />
                    <span>{item.name}</span>
                    {isActive && (
                      <span className="ml-auto w-2 h-2 rounded-full bg-blue-500"></span>
                    )}
                  </>
                )}
              </NavLink>
            ))}
          </nav>
        </div>
      </aside>

      {/* MAIN CONTENT */}
      <main className={`pt-16 transition-all duration-300 ${isMobile ? 'pl-0' : 'pl-64'}`}>
        <Outlet />
      </main>
    </div>
  );
}