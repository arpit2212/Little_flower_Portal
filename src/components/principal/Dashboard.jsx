// ============================================
// Dashboard.jsx (Principal)
// ============================================
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalTeachers: 0,
    todayPresent: 0,
    todayAbsent: 0
  });
  const [classData, setClassData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true });

      const { count: classCount } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true });

      const { count: teacherCount } = await supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true });

      const today = new Date().toISOString().split('T')[0];
      const { data: todayAttendance } = await supabase
        .from('attendance')
        .select('status')
        .eq('date', today);

      const presentCount = todayAttendance?.filter(a => a.status === 'present').length || 0;
      const absentCount = todayAttendance?.filter(a => a.status === 'absent').length || 0;

      const { data: classes } = await supabase
        .from('classes')
        .select('id, name, section');

      const classStats = await Promise.all(
        (classes || []).map(async (cls) => {
          const { count } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', cls.id);

          return {
            name: `${cls.name} ${cls.section || ''}`.trim(),
            students: count || 0
          };
        })
      );

      setStats({
        totalStudents: studentCount || 0,
        totalClasses: classCount || 0,
        totalTeachers: teacherCount || 0,
        todayPresent: presentCount,
        todayAbsent: absentCount
      });

      setClassData(classStats);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  const pieData = [
    { name: 'Present', value: stats.todayPresent, color: '#10b981' },
    { name: 'Absent', value: stats.todayAbsent, color: '#ef4444' }
  ];

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Principal Dashboard</h2>

      {/* Stats Cards - Mobile Responsive Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Students</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-2">{stats.totalStudents}</p>
            </div>
            <div className="bg-blue-100 p-3 rounded-lg">
              <Users className="w-8 h-8 sm:w-10 sm:h-10 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Classes</p>
              <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-2">{stats.totalClasses}</p>
            </div>
            <div className="bg-purple-100 p-3 rounded-lg">
              <BookOpen className="w-8 h-8 sm:w-10 sm:h-10 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today Present</p>
              <p className="text-2xl sm:text-3xl font-bold text-green-600 mt-2">{stats.todayPresent}</p>
            </div>
            <div className="bg-green-100 p-3 rounded-lg">
              <CheckCircle className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today Absent</p>
              <p className="text-2xl sm:text-3xl font-bold text-red-600 mt-2">{stats.todayAbsent}</p>
            </div>
            <div className="bg-red-100 p-3 rounded-lg">
              <XCircle className="w-8 h-8 sm:w-10 sm:h-10 text-red-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Charts - Stacked on Mobile */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Students per Class</h3>
          <div className="w-full overflow-x-auto">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={classData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="students" fill="#6366f1" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Today's Attendance</h3>
          {stats.todayPresent + stats.todayAbsent > 0 ? (
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                  outerRadius={100}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <div className="flex items-center justify-center h-[300px] text-gray-500 text-sm sm:text-base">
              No attendance marked today
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
