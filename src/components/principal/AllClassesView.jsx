// ============================================
// AllClassesView.jsx
// ============================================
import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Users, BookOpen, TrendingUp } from 'lucide-react';

const AllClassesView = () => {
  const [classes, setClasses] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      const { data: classesData, error } = await supabase
        .from('classes')
        .select('*')
        .order('name', { ascending: true });

      if (error) throw error;

      const enrichedClasses = await Promise.all(
        (classesData || []).map(async (cls) => {
          const { count: studentCount } = await supabase
            .from('students')
            .select('*', { count: 'exact', head: true })
            .eq('class_id', cls.id);

          let teacherName = 'Not Assigned';
          if (cls.teacher_id) {
            const { data: teacher } = await supabase
              .from('teachers')
              .select('name')
              .eq('clerk_user_id', cls.teacher_id)
              .single();
            
            if (teacher) teacherName = teacher.name;
          }

          const today = new Date().toISOString().split('T')[0];
          const { data: todayAttendance } = await supabase
            .from('attendance')
            .select('status')
            .eq('class_id', cls.id)
            .eq('date', today);

          const presentCount = todayAttendance?.filter(a => a.status === 'present').length || 0;
          const attendanceRate = studentCount > 0 ? ((presentCount / studentCount) * 100).toFixed(1) : 0;

          return {
            ...cls,
            studentCount: studentCount || 0,
            teacherName,
            attendanceRate
          };
        })
      );

      setClasses(enrichedClasses);
    } catch (error) {
      console.error('Error fetching classes:', error);
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

  return (
    <div className="w-full space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">All Classes</h2>
      </div>

      {classes.length === 0 ? (
        <div className="bg-white rounded-xl shadow-md p-8 sm:p-12 text-center border border-gray-100">
          <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <BookOpen className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Yet</h3>
          <p className="text-gray-600 text-sm sm:text-base">Classes will appear here once teachers are assigned.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
          {classes.map((cls) => (
            <div key={cls.id} className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow border border-gray-100">
              <div className="p-5 sm:p-6">
                <div className="flex items-start justify-between mb-4">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-800 truncate">
                      {cls.name} {cls.section && `- ${cls.section} `}
                    </h3>
                    <p className="text-sm text-gray-600 mt-1 truncate">Teacher: {cls.teacherName}</p>
                  </div>
                  <div className="bg-indigo-100 p-2 rounded-lg ml-2 flex-shrink-0">
                    <BookOpen className="w-6 h-6 sm:w-7 sm:h-7 text-indigo-600" />
                  </div>
                </div>

                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Users className="w-5 h-5 text-gray-500" />
                      <span className="text-sm text-gray-600">Students</span>
                    </div>
                    <span className="text-lg font-semibold text-gray-800">{cls.studentCount}</span>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <TrendingUp className="w-5 h-5 text-gray-500" />
                      <span className="text-sm text-gray-600">Today's Attendance</span>
                    </div>
                    <span className={`text-lg font-semibold ${
                      cls.attendanceRate >= 80 ? 'text-green-600' :
                      cls.attendanceRate >= 60 ? 'text-amber-600' :
                      'text-red-600'
                    }`}>
                      {cls.attendanceRate}%
                    </span>
                  </div>
                </div>
              </div>

              <div className="bg-gradient-to-r from-gray-50 to-indigo-50 px-5 sm:px-6 py-3 rounded-b-xl border-t border-gray-100">
                <p className="text-xs text-gray-600">
                  Created {new Date(cls.created_at).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllClassesView;
