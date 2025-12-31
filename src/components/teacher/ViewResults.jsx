import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../../lib/supabase';
import { Search, AlertCircle, CheckCircle } from 'lucide-react';

const ViewResults = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('');

  const [students, setStudents] = useState([]);
  const [marksMatrix, setMarksMatrix] = useState({});
  const [message, setMessage] = useState(null);

  useEffect(() => {
    const fetchInitial = async () => {
      if (!user) return;
      setLoading(true);
      try {
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select('*')
          .eq('teacher_id', user.id);
        if (classesError) throw classesError;
        setClasses(classesData || []);

        const { data: examTypesData, error: examTypesError } = await supabase
          .from('exam_types')
          .select('*')
          .order('display_order');
        if (examTypesError) throw examTypesError;
        setExamTypes(examTypesData || []);
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to load initial data.' });
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, [user]);

  const normalizeClassLevel = (className) => {
    if (!className) return '';
    const lowerName = className.toLowerCase();
    if (lowerName.includes('nur')) return 'Nur';
    if (lowerName.includes('lkg')) return 'LKG';
    if (lowerName.includes('ukg')) return 'UKG';
    const match = lowerName.match(/\d+/);
    if (match) {
      const num = parseInt(match[0]);
      if (num === 1) return '1st';
      if (num === 2) return '2nd';
      if (num === 3) return '3rd';
      if (num >= 4 && num <= 12) return `${num}th`;
    }
    return className.split(' ')[0];
  };

  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedClass) {
        setSubjects([]);
        return;
      }
      const cls = classes.find(c => c.id === selectedClass);
      if (!cls) return;
      const classLevel = normalizeClassLevel(cls.name);
      try {
        const { data, error } = await supabase
          .from('subjects')
          .select('*')
          .eq('class_level', classLevel);
        if (error) throw error;
        setSubjects(data || []);
      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to load subjects.' });
      }
    };
    fetchSubjects();
  }, [selectedClass, classes]);

  const handleOpen = async () => {
    if (!selectedClass || !selectedExamType) {
      setMessage({ type: 'error', text: 'Please select Class and Exam Type.' });
      return;
    }
    setLoading(true);
    setMessage(null);
    try {
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', selectedClass);
      if (studentsError) throw studentsError;
      const sorted = (studentsData || []).sort((a, b) => {
        const aR = parseInt(a.roll_number) || 0;
        const bR = parseInt(b.roll_number) || 0;
        return aR - bR;
      });
      setStudents(sorted);

      const cls = classes.find(c => c.id === selectedClass);
      const classLevel = normalizeClassLevel(cls?.name || '');
      const academicYear = cls?.session || '2024-2025';

      const { data: configs, error: cfgErr } = await supabase
        .from('exam_configurations')
        .select('*')
        .eq('class_level', classLevel)
        .eq('exam_type_id', selectedExamType)
        .eq('academic_year', academicYear);
      if (cfgErr) throw cfgErr;

      const subjectIds = subjects.map(s => s.id);
      const filteredConfigs = (configs || []).filter(c => subjectIds.includes(c.subject_id));
      const configIds = filteredConfigs.map(c => c.id);
      const configById = {};
      filteredConfigs.forEach(c => { configById[c.id] = c; });

      let marksData = [];
      if (configIds.length > 0) {
        const { data: marksRows, error: marksErr } = await supabase
          .from('student_marks')
          .select('*')
          .in('exam_configuration_id', configIds);
        if (marksErr) throw marksErr;
        marksData = marksRows || [];
      }

      const matrix = {};
      marksData.forEach(m => {
        const subjId = configById[m.exam_configuration_id]?.subject_id;
        if (!subjId) return;
        if (!matrix[m.student_id]) matrix[m.student_id] = {};
        matrix[m.student_id][subjId] = {
          marks: m.marks_obtained,
          absent: m.is_absent
        };
      });
      setMarksMatrix(matrix);
    } catch (err) {
      setMessage({ type: 'error', text: 'Failed to load results.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">View Results</h2>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select Class</option>
              {classes.map(c => (
                <option key={c.id} value={c.id}>{c.name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Exam Type</label>
            <select
              value={selectedExamType}
              onChange={(e) => setSelectedExamType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select Exam</option>
              {examTypes.map(et => (
                <option key={et.id} value={et.id}>{et.exam_name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleOpen}
              disabled={loading || !selectedClass || !selectedExamType}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
              ) : (
                <>
                  <Search className="w-5 h-5" />
                  <span>Open</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scholar No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                {subjects.map(s => (
                  <th key={s.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    {s.subject_name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={3 + subjects.length} className="px-6 py-4 text-center text-gray-500">
                    No students found.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.roll_number || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.scholar_number || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name || student.student_name}</td>
                    {subjects.map(s => {
                      const cell = marksMatrix[student.id]?.[s.id];
                      const text = cell
                        ? (cell.absent ? 'Absent' : (cell.marks ?? '-'))
                        : '-';
                      return (
                        <td key={s.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                          <span className={`${text === 'Absent' ? 'text-red-600 font-semibold' : 'text-gray-700'}`}>{text}</span>
                        </td>
                      );
                    })}
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

export default ViewResults;
