import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../../lib/supabase';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_COLORS } from '../../lib/constants';
import { Calendar } from 'lucide-react';

const AttendanceViewer = () => {
  const { user } = useUser();
  const userRole = user?.publicMetadata?.role;
  const [myClasses, setMyClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [remarks, setRemarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [notMarked, setNotMarked] = useState(false);

  useEffect(() => {
    if (user) {
      fetchMyClasses();
    }
  }, [user]);

  useEffect(() => {
    if (selectedClass) {
      fetchStudentsAndAttendance();
    }
  }, [selectedClass, selectedDate]);

  const fetchMyClasses = async () => {
    try {
      let query = supabase.from('classes').select('*');
      if (userRole !== 'principal') {
        query = query.eq('teacher_id', user.id);
      }
      const { data: classesData } = await query;
      setMyClasses(classesData || []);
      if (classesData && classesData.length > 0) {
        setSelectedClass(classesData[0].id);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  };

  const fetchStudentsAndAttendance = async () => {
    try {
      const { data: studentsData } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', selectedClass)
        .order('roll_number');

      const sortedStudents = (studentsData || []).sort((a, b) => {
        const rollA = parseInt(a.roll_number) || 0;
        const rollB = parseInt(b.roll_number) || 0;
        return rollA - rollB;
      });

      setStudents(sortedStudents);

      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('class_id', selectedClass)
        .eq('date', selectedDate);

      if (!attendanceData || attendanceData.length === 0) {
        setNotMarked(true);
        setAttendance({});
        setRemarks({});
        return;
      }

      setNotMarked(false);
      const attendanceMap = {};
      const remarksMap = {};

      attendanceData.forEach((record) => {
        const student = sortedStudents.find(s => s.samagra_id === record.samagra_id || s.id === record.samagra_id);
        if (student) {
          attendanceMap[student.id] = record.status;
          remarksMap[student.id] = record.remarks || '';
        }
      });

      setAttendance(attendanceMap);
      setRemarks(remarksMap);
    } catch {
    }
  };

  const getStatusCount = (status) => {
    return Object.values(attendance).filter(s => s === status).length;
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
      <div className="bg-white rounded-xl shadow-md p-8 sm:p-12 text-center border border-gray-100">
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Available</h3>
        <p className="text-gray-600 text-sm sm:text-base">Please contact the principal to get classes assigned.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">View Attendance</h2>
      </div>

      <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Class
            </label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800"
            >
              {myClasses.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.session && `- ${cls.session}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Select Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800"
              />
            </div>
          </div>
        </div>

        {notMarked && (
          <div className="mt-4 bg-red-50 border border-red-200 rounded-lg p-3">
            <span className="text-sm text-red-900">
              Attendance not marked for the selected date.
            </span>
          </div>
        )}
      </div>

      {!notMarked && (
        <>
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100">
              <p className="text-sm text-gray-600">Total</p>
              <p className="text-2xl font-bold text-gray-800 mt-1">{students.length}</p>
            </div>
            <div className="bg-green-50 rounded-xl shadow-md p-4 border border-green-200">
              <p className="text-sm text-green-700 font-medium">Present</p>
              <p className="text-2xl font-bold text-green-600 mt-1">{getStatusCount(ATTENDANCE_STATUS.PRESENT)}</p>
            </div>
            <div className="bg-red-50 rounded-xl shadow-md p-4 border border-red-200">
              <p className="text-sm text-red-700 font-medium">Absent</p>
              <p className="text-2xl font-bold text-red-600 mt-1">{getStatusCount(ATTENDANCE_STATUS.ABSENT)}</p>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-indigo-50">
                  <tr>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Roll No.
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Scholar No.
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Student Name
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider hidden lg:table-cell">
                      Remarks
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {students.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-12 text-center text-gray-500 text-sm sm:text-base">
                        No students in this class.
                      </td>
                    </tr>
                  ) : (
                    students.map((student) => (
                      <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-3 sm:px-6 py-4">
                          <span className="text-sm font-semibold text-gray-900">{student.roll_number}</span>
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <span className="text-sm text-gray-500">{student.scholar_number}</span>
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <span className="text-sm text-gray-900 block">{student.name || student.student_name}</span>
                        </td>
                        <td className="px-3 sm:px-6 py-4">
                          <span
                            className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium ${
                              ATTENDANCE_STATUS_COLORS[attendance[student.id]] || 'bg-gray-100 text-gray-600'
                            }`}
                          >
                            {attendance[student.id] || '-'}
                          </span>
                        </td>
                        <td className="px-3 sm:px-6 py-4 hidden lg:table-cell">
                          <span className="text-sm text-gray-700">{remarks[student.id] || '-'}</span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default AttendanceViewer;
