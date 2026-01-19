// ============================================
// Dashboard.jsx (Principal)
// ============================================
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, BookOpen, CheckCircle, XCircle } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from 'recharts';

const Dashboard = () => {
  const [stats, setStats] = useState({
    totalStudents: 0,
    totalClasses: 0,
    totalTeachers: 0,
    todayPresent: 0,
    todayAbsent: 0
  });
  const [classData, setClassData] = useState([]);
  const [marksTotals, setMarksTotals] = useState({ scholastic: 0, nonScholastic: 0 });
  const [marksPerClass, setMarksPerClass] = useState([]);
  const [attendanceByClass, setAttendanceByClass] = useState([]);
  const [weeklyMarksTrend, setWeeklyMarksTrend] = useState([]);
  const [gradeDistribution, setGradeDistribution] = useState([]);
  const [recentLogs, setRecentLogs] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      const { count: studentCount, data: studentsData } = await supabase
        .from('students')
        .select('id, class_id', { count: 'exact' });

      const { count: classCount } = await supabase
        .from('classes')
        .select('*', { count: 'exact', head: true });

      const { count: teacherCount } = await supabase
        .from('teachers')
        .select('*', { count: 'exact', head: true });

      const today = new Date().toISOString().split('T')[0];
      const { data: todayAttendance } = await supabase
        .from('attendance')
        .select('class_id, status')
        .eq('date', today);

      const presentCount = todayAttendance?.filter(a => a.status === 'present').length || 0;
      const absentCount = todayAttendance?.filter(a => a.status === 'absent').length || 0;

      const { data: classes } = await supabase
        .from('classes')
        .select('id, name, session');

      const classStats = await Promise.all(
        (classes || []).map(async (cls) => {
          const { count } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', cls.id);

          return {
            name: `${cls.name} ${cls.session || ''}`.trim(),
            students: count || 0
          };
        })
      );

      const classIdToLabel = new Map();
      (classes || []).forEach(c => {
        classIdToLabel.set(c.id, `${c.name} ${c.session || ''}`.trim());
      });

      const attendanceMap = new Map();
      (todayAttendance || []).forEach(row => {
        const key = row.class_id;
        if (!attendanceMap.has(key)) {
          attendanceMap.set(key, { present: 0, absent: 0 });
        }
        const entry = attendanceMap.get(key);
        if (row.status === 'present') entry.present += 1;
        if (row.status === 'absent') entry.absent += 1;
      });
      const attendanceByClassData = Array.from(attendanceMap.entries()).map(([classId, counts]) => ({
        name: classIdToLabel.get(classId) || 'Unknown',
        Present: counts.present,
        Absent: counts.absent
      }));

      const allStudentIds = (studentsData || []).map(s => s.id);
      let scholasticMarks = [];
      let nonScholasticMarks = [];
      if (allStudentIds.length > 0) {
        const { data: scholData } = await supabase
          .from('student_marks')
          .select('student_id, marked_at');
        scholasticMarks = scholData || [];
        const { data: nonScholData } = await supabase
          .from('student_non_scholastic')
          .select('student_id, grade, marked_at');
        nonScholasticMarks = nonScholData || [];
      }

      const studentIdToClass = new Map();
      (studentsData || []).forEach(s => {
        studentIdToClass.set(s.id, s.class_id);
      });

      const marksByClass = new Map();
      scholasticMarks.forEach(m => {
        const cls = studentIdToClass.get(m.student_id);
        if (!cls) return;
        if (!marksByClass.has(cls)) marksByClass.set(cls, { scholastic: 0, nonScholastic: 0 });
        marksByClass.get(cls).scholastic += 1;
      });
      nonScholasticMarks.forEach(m => {
        const cls = studentIdToClass.get(m.student_id);
        if (!cls) return;
        if (!marksByClass.has(cls)) marksByClass.set(cls, { scholastic: 0, nonScholastic: 0 });
        marksByClass.get(cls).nonScholastic += 1;
      });
      const marksPerClassData = Array.from(marksByClass.entries()).map(([classId, counts]) => ({
        name: classIdToLabel.get(classId) || 'Unknown',
        Scholastic: counts.scholastic,
        NonScholastic: counts.nonScholastic
      }));

      const totals = {
        scholastic: scholasticMarks.length,
        nonScholastic: nonScholasticMarks.length
      };

      const last7 = [];
      for (let i = 6; i >= 0; i--) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        const key = d.toISOString().split('T')[0];
        const label = d.toLocaleDateString(undefined, { month: 'short', day: 'numeric' });
        const dayCount = scholasticMarks.filter(m => {
          if (!m.marked_at) return false;
          const mk = new Date(m.marked_at).toISOString().split('T')[0];
          return mk === key;
        }).length;
        last7.push({ date: label, Entries: dayCount });
      }

      const gradeMap = new Map([['A+', 0], ['A', 0], ['B', 0], ['C', 0], ['D', 0]]);
      nonScholasticMarks.forEach(m => {
        const g = (m.grade || '').toUpperCase();
        if (gradeMap.has(g)) gradeMap.set(g, gradeMap.get(g) + 1);
      });
      const gradeDist = Array.from(gradeMap.entries()).map(([name, value]) => ({
        name,
        value,
        color:
          name === 'A+' ? '#22c55e' :
          name === 'A' ? '#10b981' :
          name === 'B' ? '#3b82f6' :
          name === 'C' ? '#f59e0b' : '#ef4444'
      }));

      const { data: logsData } = await supabase
        .from('teacher_activity_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(8);

      setStats({
        totalStudents: studentCount || 0,
        totalClasses: classCount || 0,
        totalTeachers: teacherCount || 0,
        todayPresent: presentCount,
        todayAbsent: absentCount
      });

      setClassData(classStats);
      setAttendanceByClass(attendanceByClassData);
      setMarksPerClass(marksPerClassData);
      setMarksTotals(totals);
      setWeeklyMarksTrend(last7);
      setGradeDistribution(gradeDist);
      setRecentLogs(logsData || []);
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

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <p className="text-sm font-medium text-gray-600">Scholastic Marks Entries</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-2">{marksTotals.scholastic}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <p className="text-sm font-medium text-gray-600">Non-Scholastic Records</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-2">{marksTotals.nonScholastic}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <p className="text-sm font-medium text-gray-600">Classes With Attendance Today</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-2">{attendanceByClass.length}</p>
        </div>
        <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
          <p className="text-sm font-medium text-gray-600">Active Teachers (recent logs)</p>
          <p className="text-2xl sm:text-3xl font-bold text-gray-800 mt-2">{recentLogs.length}</p>
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Class-wise Attendance Today</h3>
          <div className="w-full overflow-x-auto">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={attendanceByClass}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Present" fill="#10b981" />
                <Bar dataKey="Absent" fill="#ef4444" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Marks Entries per Class</h3>
          <div className="w-full overflow-x-auto">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={marksPerClass}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} tick={{ fontSize: 12 }} />
                <YAxis tick={{ fontSize: 12 }} />
                <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
                <Legend wrapperStyle={{ fontSize: '12px' }} />
                <Bar dataKey="Scholastic" fill="#6366f1" />
                <Bar dataKey="NonScholastic" fill="#f59e0b" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Weekly Scholastic Entries</h3>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={weeklyMarksTrend}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
              <XAxis dataKey="date" tick={{ fontSize: 12 }} />
              <YAxis tick={{ fontSize: 12 }} />
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
              <Legend wrapperStyle={{ fontSize: '12px' }} />
              <Line type="monotone" dataKey="Entries" stroke="#6366f1" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
          <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Non-Scholastic Grade Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={gradeDistribution}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
                outerRadius={100}
                dataKey="value"
              >
                {gradeDistribution.map((entry, index) => (
                  <Cell key={`cell-grade-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: '#fff', border: '1px solid #e5e7eb' }} />
            </PieChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Recent Teacher Activity</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-indigo-50">
              <tr>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Time</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Teacher</th>
                <th className="px-3 sm:px-4 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">Action</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {recentLogs.length === 0 ? (
                <tr>
                  <td colSpan="3" className="px-4 py-6 text-center text-gray-500 text-sm">No recent activity</td>
                </tr>
              ) : recentLogs.map(log => {
                const createdAt = log.created_at ? new Date(log.created_at) : null;
                const dateString = createdAt ? createdAt.toLocaleDateString() : '';
                const timeString = createdAt ? createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : '';
                return (
                  <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                      <div className="flex flex-col">
                        <span className="font-medium">{dateString}</span>
                        <span className="text-gray-500">{timeString}</span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {log.teacher_name || 'Unknown'}
                        </span>
                        <span className="text-gray-500 break-all">
                          {log.teacher_email || log.clerk_user_id}
                        </span>
                      </div>
                    </td>
                    <td className="px-3 sm:px-4 py-3 whitespace-nowrap text-xs sm:text-sm text-gray-700">
                      <div className="flex flex-col">
                        <span className="font-semibold">
                          {log.action}
                        </span>
                        <span className="text-gray-500 capitalize">
                          {log.entity_type}
                        </span>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
