import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../../lib/supabase';
import { ATTENDANCE_STATUS, ATTENDANCE_STATUS_COLORS } from '../../lib/constants';
import { Calendar, Save, CheckCircle } from 'lucide-react';

const AttendanceMarking = () => {
  const { user } = useUser();
  const [myClasses, setMyClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState({});
  const [remarks, setRemarks] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [alreadyMarked, setAlreadyMarked] = useState(false);

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
      const { data: classesData } = await supabase
        .from('classes')
        .select('*')
        .eq('teacher_id', user.id);

      setMyClasses(classesData || []);
      if (classesData && classesData.length > 0) {
        setSelectedClass(classesData[0].id);
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
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

      setStudents(studentsData || []);

      const { data: attendanceData } = await supabase
        .from('attendance')
        .select('*')
        .eq('class_id', selectedClass)
        .eq('date', selectedDate);

      if (attendanceData && attendanceData.length > 0) {
        setAlreadyMarked(true);
        const attendanceMap = {};
        const remarksMap = {};
        
        attendanceData.forEach((record) => {
          attendanceMap[record.student_id] = record.status;
          remarksMap[record.student_id] = record.remarks || '';
        });
        
        setAttendance(attendanceMap);
        setRemarks(remarksMap);
      } else {
        setAlreadyMarked(false);
        const initialAttendance = {};
        studentsData?.forEach((student) => {
          initialAttendance[student.id] = ATTENDANCE_STATUS.PRESENT;
        });
        setAttendance(initialAttendance);
        setRemarks({});
      }
    } catch (error) {
      console.error('Error fetching data:', error);
    }
  };

  const handleAttendanceChange = (studentId, status) => {
    setAttendance({
      ...attendance,
      [studentId]: status
    });
  };

  const handleRemarksChange = (studentId, remark) => {
    setRemarks({
      ...remarks,
      [studentId]: remark
    });
  };

  const handleSave = async () => {
    if (!selectedClass || students.length === 0) {
      alert('Please select a class with students.');
      return;
    }

    setSaving(true);

    try {
      await supabase
        .from('attendance')
        .delete()
        .eq('class_id', selectedClass)
        .eq('date', selectedDate);

      const attendanceRecords = students.map((student) => ({
        student_id: student.id,
        class_id: selectedClass,
        date: selectedDate,
        status: attendance[student.id] || ATTENDANCE_STATUS.PRESENT,
        marked_by: user.id,
        remarks: remarks[student.id] || null
      }));

      const { error } = await supabase
        .from('attendance')
        .insert(attendanceRecords);

      if (error) throw error;

      alert('Attendance saved successfully!');
      setAlreadyMarked(true);
    } catch (error) {
      console.error('Error saving attendance:', error);
      alert('Error saving attendance. Please try again.');
    } finally {
      setSaving(false);
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
        <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <CheckCircle className="w-8 h-8 text-indigo-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Assigned</h3>
        <p className="text-gray-600 text-sm sm:text-base">Please contact the principal to get classes assigned to you.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Mark Attendance</h2>
        <button
          onClick={handleSave}
          disabled={saving || students.length === 0}
          className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md hover:shadow-lg font-medium"
        >
          {saving ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              <span>Saving...</span>
            </>
          ) : (
            <>
              <Save className="w-5 h-5" />
              <span>Save Attendance</span>
            </>
          )}
        </button>
      </div>

      {/* Class and Date Selector */}
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

        {alreadyMarked && (
          <div className="mt-4 bg-indigo-50 border border-indigo-200 rounded-lg p-3 flex items-center space-x-2">
            <CheckCircle className="w-5 h-5 text-indigo-600 flex-shrink-0" />
            <span className="text-sm text-indigo-900">
              Attendance already marked for this date. You can modify and save again.
            </span>
          </div>
        )}
      </div>

      {/* Statistics - Mobile Responsive */}
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
        <div className="bg-amber-50 rounded-xl shadow-md p-4 border border-amber-200">
          <p className="text-sm text-amber-700 font-medium">Late</p>
          <p className="text-2xl font-bold text-amber-600 mt-1">{getStatusCount(ATTENDANCE_STATUS.LATE)}</p>
        </div>
      </div>

      {/* Attendance Table - Mobile Optimized */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-indigo-50">
              <tr>
                <th className="px-3 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Roll No.
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
                  <td colSpan="4" className="px-6 py-12 text-center text-gray-500 text-sm sm:text-base">
                    No students in this class. Please add students first.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-3 sm:px-6 py-4">
                      <span className="text-sm font-semibold text-gray-900">{student.roll_number}</span>
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <span className="text-sm text-gray-900 block">{student.name}</span>
                      <input
                        type="text"
                        value={remarks[student.id] || ''}
                        onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                        placeholder="Remarks..."
                        className="lg:hidden w-full mt-2 px-2 py-1 text-xs border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800"
                      />
                    </td>
                    <td className="px-3 sm:px-6 py-4">
                      <div className="flex flex-wrap gap-1 sm:gap-2">
                        {Object.entries(ATTENDANCE_STATUS).map(([key, value]) => (
                          <button
                            key={value}
                            onClick={() => handleAttendanceChange(student.id, value)}
                            className={`px-2 sm:px-3 py-1 rounded-full text-xs font-medium transition-colors ${
                              attendance[student.id] === value
                                ? ATTENDANCE_STATUS_COLORS[value]
                                : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                            }`}
                          >
                            {key.charAt(0) + key.slice(1).toLowerCase()}
                          </button>
                        ))}
                      </div>
                    </td>
                    <td className="px-3 sm:px-6 py-4 hidden lg:table-cell">
                      <input
                        type="text"
                        value={remarks[student.id] || ''}
                        onChange={(e) => handleRemarksChange(student.id, e.target.value)}
                        placeholder="Optional remarks..."
                        className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800"
                      />
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AttendanceMarking;