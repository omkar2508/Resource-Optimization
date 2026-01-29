import { useState, useEffect } from "react";
import { useAppContext } from "../context/AppContext";
import { 
  BarChart3, 
  Users, 
  Shield, 
  BookOpen, 
  DoorOpen, 
  Calendar,
  TrendingUp,
  Building2
} from "lucide-react";

export default function SuperAdminDashboard() {
  const { axios } = useAppContext();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const res = await axios.get("/api/superadmin/dashboard-stats");
      if (res.data.success) {
        setStats(res.data);
      }
    } catch (err) {
      console.error("Failed to fetch stats:", err);
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

  const { stats: globalStats, departmentStats } = stats || {};

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-3">
          <BarChart3 className="text-blue-600" size={32} />
          Super Admin Dashboard
        </h1>
        <p className="text-gray-600 mt-2">
          Overview of all departments and system-wide statistics
        </p>
      </div>


      {/* Global Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
        <StatCard
          icon={Shield}
          title="Total Admins"
          value={globalStats?.totalAdmins || 0}
          color="blue"
        />
        <StatCard
          icon={Users}
          title="Total Teachers"
          value={globalStats?.totalTeachers || 0}
          color="blue"
        />
        <StatCard
          icon={Users}
          title="Total Students"
          value={globalStats?.totalStudents || 0}
          color="green"
        />
        <StatCard
          icon={DoorOpen}
          title="Total Rooms"
          value={globalStats?.totalRooms || 0}
          color="orange"
        />
        <StatCard
          icon={BookOpen}
          title="Total Subjects"
          value={globalStats?.totalSubjects || 0}
          color="pink"
        />
        <StatCard
          icon={Calendar}
          title="Total Timetables"
          value={globalStats?.totalTimetables || 0}
          color="indigo"
        />
      </div>

      {/* Department Breakdown */}
      <div className="bg-white rounded-xl shadow-md p-6">
        <h2 className="text-2xl font-bold mb-4 flex items-center gap-2">
          <Building2 className="text-blue-600" />
          Department Statistics
        </h2>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-4 font-semibold text-gray-700">
                  Department
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">
                  Admin
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">
                  Teachers
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">
                  Rooms
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">
                  Subjects
                </th>
                <th className="text-center py-3 px-4 font-semibold text-gray-700">
                  Timetables
                </th>
              </tr>
            </thead>
            <tbody>
              {departmentStats?.map((dept, idx) => (
                <tr key={idx} className="border-t hover:bg-gray-50">
                  <td className="py-3 px-4 font-medium">{dept.department}</td>
                  <td className="text-center py-3 px-4">
                    <span className={`inline-block px-2 py-1 rounded text-sm ${
                      dept.admins > 0 
                        ? "bg-green-100 text-green-700" 
                        : "bg-red-100 text-red-700"
                    }`}>
                      {dept.admins}
                    </span>
                  </td>
                  <td className="text-center py-3 px-4">{dept.teachers}</td>
                  <td className="text-center py-3 px-4">{dept.rooms}</td>
                  <td className="text-center py-3 px-4">{dept.subjects}</td>
                  <td className="text-center py-3 px-4">{dept.timetables}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function StatCard({ icon: Icon, title, value, color }) {
  const colorClasses = {
    blue: "from-blue-500 to-blue-600",
    blue: "from-blue-500 to-blue-600",
    green: "from-green-500 to-green-600",
    orange: "from-orange-500 to-orange-600",
    pink: "from-pink-500 to-pink-600",
    indigo: "from-indigo-500 to-indigo-600"
  };

  return (
    <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-gray-200 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-gray-600 text-sm font-medium">{title}</p>
          <p className="text-3xl font-bold text-gray-800 mt-2">{value}</p>
        </div>
        <div className={`p-3 rounded-lg bg-gradient-to-br ${colorClasses[color]}`}>
          <Icon className="text-white" size={24} />
        </div>
      </div>
    </div>
  );
}