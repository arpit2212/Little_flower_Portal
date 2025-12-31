import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../../lib/supabase';
import { BookOpen, Save, Search, AlertCircle, CheckCircle } from 'lucide-react';

const EnterMarks = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [subjects, setSubjects] = useState([]);
  
  const [selectedClass, setSelectedClass] = useState('');
  const [selectedExamType, setSelectedExamType] = useState('');
  const [selectedSubject, setSelectedSubject] = useState('');
  
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({}); // { student_id: mark }
  const [absentStatus, setAbsentStatus] = useState({}); // { student_id: boolean }
  const [maxMarks, setMaxMarks] = useState('');
  const [examConfig, setExamConfig] = useState(null);
  
  const [viewMode, setViewMode] = useState('initial'); // initial, view, edit
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }

  // Fetch initial data (Classes and Exam Types)
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Fetch classes assigned to teacher directly using Clerk user ID
        // This matches the logic in StudentManagement.jsx
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select('*')
          .eq('teacher_id', user.id);

        if (classesError) throw classesError;
        setClasses(classesData || []);

        // Fetch Exam Types
        const { data: examTypesData, error: examTypesError } = await supabase
          .from('exam_types')
          .select('*')
          .order('display_order');

        if (examTypesError) throw examTypesError;
        setExamTypes(examTypesData || []);

      } catch (error) {
        console.error('Error fetching initial data:', error);
        setMessage({ type: 'error', text: 'Failed to load initial data.' });
      } finally {
        setLoading(false);
      }
    };

    fetchInitialData();
  }, [user]);

  const normalizeClassLevel = (className) => {
    if (!className) return '';
    const lowerName = className.toLowerCase();
    
    if (lowerName.includes('nur')) return 'Nur';
    if (lowerName.includes('lkg')) return 'LKG';
    if (lowerName.includes('ukg')) return 'UKG';
    
    // Extract number
    const match = lowerName.match(/\d+/);
    if (match) {
      const num = parseInt(match[0]);
      if (num === 1) return '1st';
      if (num === 2) return '2nd';
      if (num === 3) return '3rd';
      if (num >= 4 && num <= 12) return `${num}th`;
    }
    
    // Fallback: take the first word as before, but it's likely covered above
    return className.split(' ')[0];
  };

  // Fetch Subjects when Class is selected
  useEffect(() => {
    const fetchSubjects = async () => {
      if (!selectedClass) {
        setSubjects([]);
        return;
      }

      const selectedClassData = classes.find(c => c.id === selectedClass);
      if (!selectedClassData) return;

      const classLevel = normalizeClassLevel(selectedClassData.name);
      
      try {
        const { data, error } = await supabase
          .from('subjects')
          .select('*')
          .eq('class_level', classLevel);

        if (error) throw error;
        setSubjects(data || []);
      } catch (error) {
        console.error('Error fetching subjects:', error);
      }
    };

    fetchSubjects();
  }, [selectedClass, classes]);

  const handleOpen = async () => {
    if (!selectedClass || !selectedExamType || !selectedSubject) {
      setMessage({ type: 'error', text: 'Please select all fields.' });
      return;
    }

    setLoading(true);
    setMessage(null);
    try {
      // 1. Fetch Students
      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', selectedClass);

      if (studentsError) throw studentsError;
      
      // Sort students numerically by roll number
      const sortedStudents = (studentsData || []).sort((a, b) => {
        const rollA = parseInt(a.roll_number) || 0;
        const rollB = parseInt(b.roll_number) || 0;
        return rollA - rollB;
      });
      
      setStudents(sortedStudents);

      // 2. Check for Exam Configuration
      const selectedClassData = classes.find(c => c.id === selectedClass);
      const classLevel = normalizeClassLevel(selectedClassData.name);
      const currentYear = new Date().getFullYear().toString(); // Or fetch from session logic
      // Ideally academic_year should be dynamic. For now using current year or session from class?
      // classes table has 'session' column.
      const academicYear = selectedClassData.session || '2024-2025';

      const { data: configData, error: configError } = await supabase
        .from('exam_configurations')
        .select('*')
        .eq('class_level', classLevel)
        .eq('subject_id', selectedSubject)
        .eq('exam_type_id', selectedExamType)
        .eq('academic_year', academicYear)
        .maybeSingle();

      if (configError) throw configError;

      setExamConfig(configData);

      if (configData) {
        setMaxMarks(configData.max_marks);
        // 3. Fetch Existing Marks
        const { data: marksData, error: marksError } = await supabase
          .from('student_marks')
          .select('*')
          .eq('exam_configuration_id', configData.id);

        if (marksError) throw marksError;

        const marksMap = {};
        const absentMap = {};
        marksData.forEach(m => {
          marksMap[m.student_id] = m.marks_obtained;
          absentMap[m.student_id] = m.is_absent;
        });
        setMarks(marksMap);
        setAbsentStatus(absentMap);
      } else {
        setMaxMarks('');
        setMarks({});
        setAbsentStatus({});
      }

      setViewMode('view');

    } catch (error) {
      console.error('Error loading marks data:', error);
      setMessage({ type: 'error', text: 'Failed to load data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMarks = async () => {
    if (!maxMarks) {
      setMessage({ type: 'error', text: 'Please enter Max Marks.' });
      return;
    }

    setLoading(true);
    try {
      const selectedClassData = classes.find(c => c.id === selectedClass);
      const classLevel = normalizeClassLevel(selectedClassData.name);
      const academicYear = selectedClassData.session || '2024-2025';

      // 1. Ensure Exam Configuration Exists
      let configId = examConfig?.id;

      if (!configId) {
        const { data: newConfig, error: createConfigError } = await supabase
          .from('exam_configurations')
          .insert([{
            class_level: classLevel,
            subject_id: selectedSubject,
            exam_type_id: selectedExamType,
            max_marks: parseInt(maxMarks),
            academic_year: academicYear
          }])
          .select()
          .single();

        if (createConfigError) throw createConfigError;
        configId = newConfig.id;
        setExamConfig(newConfig);
      } else {
        // Update max marks if changed
        if (examConfig.max_marks !== parseInt(maxMarks)) {
            const { error: updateConfigError } = await supabase
                .from('exam_configurations')
                .update({ max_marks: parseInt(maxMarks) })
                .eq('id', configId);
            if (updateConfigError) throw updateConfigError;
        }
      }

      // 1.5. Fetch Teacher UUID (needed for marked_by foreign key)
      // The classes table uses Clerk ID (user.id), but student_marks uses Teacher UUID (from teachers table)
      let teacherId = null;
      
      // Try fetching by clerk_user_id first
      const { data: teacherByClerk, error: teacherClerkError } = await supabase
        .from('teachers')
        .select('id')
        .eq('clerk_user_id', user.id)
        .maybeSingle();

      if (teacherByClerk) {
        teacherId = teacherByClerk.id;
      } else {
        // Fallback to email if clerk_user_id is not set
        const { data: teacherByEmail, error: teacherEmailError } = await supabase
          .from('teachers')
          .select('id')
          .eq('email', user.primaryEmailAddress.emailAddress)
          .maybeSingle();
          
        if (teacherByEmail) {
          teacherId = teacherByEmail.id;
        }
      }

      if (!teacherId) {
        throw new Error('Teacher record not found. Please contact administrator.');
      }

      // 2. Upsert Marks
      const marksToUpsert = Object.entries(marks).map(([studentId, marksObtained]) => {
          const isAbsent = absentStatus[studentId] || false;
          
          // Only include marks if they exist OR if the student is marked absent
          // If neither, skip
          if ((marksObtained === '' || marksObtained === null) && !isAbsent) return null;
          
          return {
              student_id: studentId,
              exam_configuration_id: configId,
              marks_obtained: isAbsent ? null : parseFloat(marksObtained),
              is_absent: isAbsent,
              marked_by: teacherId
          };
      }).filter(m => m !== null);
      
      // Also handle cases where a student is marked absent but has no entry in 'marks' state yet
      // This happens if you just click absent without typing anything in marks input
      Object.entries(absentStatus).forEach(([studentId, isAbsent]) => {
          if (isAbsent && !marks[studentId]) {
             // Check if already added
             const exists = marksToUpsert.find(m => m.student_id === studentId);
             if (!exists) {
                 marksToUpsert.push({
                    student_id: studentId,
                    exam_configuration_id: configId,
                    marks_obtained: null,
                    is_absent: true,
                    marked_by: teacherId
                 });
             }
          }
      });

      if (marksToUpsert.length > 0) {
          const { error: upsertError } = await supabase
            .from('student_marks')
            .upsert(marksToUpsert, { onConflict: 'student_id, exam_configuration_id' });
          
          if (upsertError) throw upsertError;
      }

      setMessage({ type: 'success', text: 'Marks saved successfully!' });
      setViewMode('view');

    } catch (error) {
      console.error('Error saving marks:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to save marks.' });
    } finally {
      setLoading(false);
    }
  };

  const handleMarkChange = (studentId, value) => {
      // Validate marks <= maxMarks
      const numValue = parseFloat(value);
      
      // Allow empty string to clear input
      if (value === '') {
         setMarks(prev => ({ ...prev, [studentId]: value }));
         return;
      }

      if (maxMarks && numValue > parseFloat(maxMarks)) {
          setMessage({ type: 'error', text: `Marks cannot exceed Max Marks (${maxMarks})` });
          // Prevent updating the state with the invalid value
          return;
      } else {
          // Clear error if it was a "marks exceeded" error
          if (message?.text?.includes('Marks cannot exceed')) {
               setMessage(null);
          }
      }
      
      setMarks(prev => ({ ...prev, [studentId]: value }));
  };

  const handleAbsentChange = (studentId, isChecked) => {
      setAbsentStatus(prev => ({ ...prev, [studentId]: isChecked }));
      if (isChecked) {
          // Clear marks if marked absent
          setMarks(prev => ({ ...prev, [studentId]: '' }));
      }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Enter Marks</h2>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Selection Panel */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setViewMode('initial');
              }}
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
              onChange={(e) => {
                  setSelectedExamType(e.target.value);
                  setViewMode('initial');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select Exam</option>
              {examTypes.map(et => (
                <option key={et.id} value={et.id}>{et.exam_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
            <select
              value={selectedSubject}
              onChange={(e) => {
                  setSelectedSubject(e.target.value);
                  setViewMode('initial');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={!selectedClass}
            >
              <option value="">Select Subject</option>
              {subjects.map(s => (
                <option key={s.id} value={s.id}>{s.subject_name}</option>
              ))}
            </select>
          </div>
          <div className="flex items-end">
            <button
              onClick={handleOpen}
              disabled={loading || !selectedClass || !selectedExamType || !selectedSubject}
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

      {/* Marks Display / Entry Area */}
      {viewMode !== 'initial' && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex flex-col sm:flex-row justify-between items-center gap-4">
                <h3 className="text-lg font-semibold text-gray-800">
                    Student Marks List
                </h3>
                <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                        <label className="text-sm font-medium text-gray-700">Max Marks:</label>
                        {viewMode === 'edit' ? (
                            <select
                                value={maxMarks}
                                onChange={(e) => setMaxMarks(e.target.value)}
                                className="w-24 px-2 py-1 border border-gray-300 rounded-md"
                            >
                                <option value="">Select</option>
                                {[10, 20, 30, 40, 50, 60, 70, 80, 90, 100].map(m => (
                                    <option key={m} value={m}>{m}</option>
                                ))}
                            </select>
                        ) : (
                            <span className="font-bold text-indigo-600">{maxMarks || 'N/A'}</span>
                        )}
                    </div>
                    {viewMode === 'view' ? (
                        <button
                            onClick={() => setViewMode('edit')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2"
                        >
                            <BookOpen className="w-4 h-4" />
                            Enter Marks
                        </button>
                    ) : (
                        <div className="flex gap-2">
                             <button
                                onClick={() => setViewMode('view')}
                                className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSaveMarks}
                                disabled={loading}
                                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center gap-2"
                            >
                                <Save className="w-4 h-4" />
                                Save Marks
                            </button>
                        </div>
                    )}
                </div>
            </div>
            
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scholar No</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Marks Obtained</th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Absent</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {students.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                                    No students found in this class.
                                </td>
                            </tr>
                        ) : (
                            students.map((student) => {
                                const mark = marks[student.id] || '';
                                const isAbsent = absentStatus[student.id] || false;
                                
                                return (
                                    <tr key={student.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.roll_number || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.scholar_number || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name || student.student_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {viewMode === 'edit' ? (
                                                <input
                                                    type="number"
                                                    min="0"
                                                    max={maxMarks}
                                                    step="0.5"
                                                    value={mark}
                                                    onChange={(e) => handleMarkChange(student.id, e.target.value)}
                                                    disabled={isAbsent || !maxMarks}
                                                    title={!maxMarks ? "Please select Max Marks first" : ""}
                                                    className={`w-24 px-2 py-1 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500 ${isAbsent || !maxMarks ? 'bg-gray-100 cursor-not-allowed' : ''}`}
                                                    placeholder={isAbsent ? '' : "0.0"}
                                                />
                                            ) : (
                                                <span className={`font-semibold ${mark !== '' ? 'text-gray-900' : 'text-gray-400'}`}>
                                                    {isAbsent ? 'Absent' : (mark !== '' ? mark : '-')}
                                                </span>
                                            )}
                                        </td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            <input
                                                type="checkbox"
                                                checked={isAbsent}
                                                onChange={(e) => viewMode === 'edit' && handleAbsentChange(student.id, e.target.checked)}
                                                disabled={viewMode !== 'edit'}
                                                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                                            />
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
      )}
    </div>
  );
};

export default EnterMarks;
