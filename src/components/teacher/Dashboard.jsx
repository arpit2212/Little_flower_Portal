// ============================================
// Dashboard.jsx (Teacher)
// ============================================
import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../../lib/supabase';
import { Users, CheckCircle, XCircle, Clock, BookOpen } from 'lucide-react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { format, subDays } from 'date-fns';

const Dashboard = () => {
  const { user } = useUser();
  const [myClasses, setMyClasses] = useState([]);
  const [stats, setStats] = useState({
    totalStudents: 0,
    todayPresent: 0,
    todayAbsent: 0,
    todayLate: 0
  });
  const [weeklyData, setWeeklyData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      fetchDashboardData();
    }
  }, [user]);

  const fetchDashboardData = async () => {
    try {
      const clerkUserId = user.id;

      const { data: existingTeacher } = await supabase
        .from('teachers')
        .select('*')
        .eq('clerk_user_id', clerkUserId)
        .single();

      if (!existingTeacher) {
        await supabase
          .from('teachers')
          .insert([{
            clerk_user_id: clerkUserId,
            name: user.fullName || user.firstName || 'Teacher',
            email: user.primaryEmailAddress?.emailAddress || ''
          }]);
      }

      const { data: classesData } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', clerkUserId);

      if (!classesData || classesData.length === 0) {
        setLoading(false);
        return;
      }

      setMyClasses(classesData);

      const classIds = classesData.map(c => c.id);

      const { count: studentCount } = await supabase
        .from('students')
        .select('*', { count: 'exact', head: true })
        .in('class_id', classIds);

      const today = new Date().toISOString().split('T')[0];
      const { data: todayAttendance } = await supabase
        .from('attendance')
        .select('status')
        .in('class_id', classIds)
        .eq('date', today);

      const presentCount = todayAttendance?.filter(a => a.status === 'present').length || 0;
      const absentCount = todayAttendance?.filter(a => a.status === 'absent').length || 0;
      const lateCount = todayAttendance?.filter(a => a.status === 'late').length || 0;

      setStats({
        totalStudents: studentCount || 0,
        todayPresent: presentCount,
        todayAbsent: absentCount,
        todayLate: lateCount
      });

      const weekData = [];
      for (let i = 6; i >= 0; i--) {
        const date = format(subDays(new Date(), i), 'yyyy-MM-dd');
        const { data: dayAttendance } = await supabase
          .from('attendance')
          .select('status')
          .in('class_id', classIds)
          .eq('date', date);

        const present = dayAttendance?.filter(a => a.status === 'present').length || 0;
        const absent = dayAttendance?.filter(a => a.status === 'absent').length || 0;

        weekData.push({
          date: format(subDays(new Date(), i), 'MMM dd'),
          Present: present,
          Absent: absent
        });
      }

      setWeeklyData(weekData);
    } catch (error) {
      console.error('Error fetching dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (myClasses.length === 0) {
    return (
      <div className="w-full space-y-6">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Teacher Dashboard</h2>
        <div className="bg-white rounded-xl shadow-md p-8 sm:p-12 text-center border border-gray-100">
          <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Assigned</h3>
          <p className="text-gray-600 text-sm sm:text-base">Please contact the principal to get classes assigned to you.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Teacher Dashboard</h2>

      {/* My Classes */}
      <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 border border-gray-100">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-3">My Classes</h3>
        <div className="flex flex-wrap gap-2">
          {myClasses.map((cls) => (
            <span
              key={cls.id}
              className="px-3 sm:px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg font-medium text-sm"
            >
              {cls.name} {cls.session && `- ${cls.session}`}
            </span>
          ))}
        </div>
      </div>

      {/* Stats Cards */}
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

        <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow p-6 border border-gray-100">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today Late</p>
              <p className="text-2xl sm:text-3xl font-bold text-amber-600 mt-2">{stats.todayLate}</p>
            </div>
            <div className="bg-amber-100 p-3 rounded-lg">
              <Clock className="w-8 h-8 sm:w-10 sm:h-10 text-amber-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Weekly Attendance Trend */}
      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Weekly Attendance Trend</h3>
        <div className="w-full overflow-x-auto">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="Present" stroke="#10b981" strokeWidth={2} />
              <Line type="monotone" dataKey="Absent" stroke="#ef4444" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
