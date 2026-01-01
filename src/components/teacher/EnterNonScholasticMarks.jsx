import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../../lib/supabase';
import { Save, Search, AlertCircle, CheckCircle } from 'lucide-react';

const EnterNonScholasticMarks = () => {
  const { user } = useUser();
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [categories, setCategories] = useState([]);
  const [activities, setActivities] = useState([]);
  
  const [selectedClass, setSelectedClass] = useState('');
  // const [selectedExamType, setSelectedExamType] = useState(''); // Removed as per request
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedActivity, setSelectedActivity] = useState('');
  
  const [students, setStudents] = useState([]);
  const [marks, setMarks] = useState({}); // { student_id: { grade, numeric_value } }
  const [currentActivityData, setCurrentActivityData] = useState(null); // Metadata of selected activity
  
  const [viewMode, setViewMode] = useState('initial'); // initial, view, edit
  const [message, setMessage] = useState(null);

  // Fetch initial data (Classes, Exam Types, Categories)
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Fetch classes assigned to teacher
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select('*')
          .eq('teacher_id', user.id);

        if (classesError) throw classesError;
        setClasses(classesData || []);

        // Fetch Exam Types (We need at least one to satisfy the DB constraint)
        const { data: examTypesData, error: examTypesError } = await supabase
          .from('exam_types')
          .select('*')
          .order('display_order');

        if (examTypesError) throw examTypesError;
        setExamTypes(examTypesData || []);

        // Fetch Categories
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('non_scholastic_categories')
          .select('*')
          .order('display_order');

        if (categoriesError) throw categoriesError;
        setCategories(categoriesData || []);

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
    
    if (lowerName.includes('nur')) return 'Nursery';
    if (lowerName.includes('lkg')) return 'KG1'; // Mapping LKG -> KG1 based on schema inserts
    if (lowerName.includes('ukg')) return 'KG2'; // Mapping UKG -> KG2 based on schema inserts
    
    // Extract number
    const match = lowerName.match(/\d+/);
    if (match) {
      const num = parseInt(match[0]);
      if (num === 1) return '1st';
      if (num === 2) return '2nd';
      if (num === 3) return '3rd';
      if (num >= 4 && num <= 12) return `${num}th`;
    }
    
    // Fallback
    return className.split(' ')[0];
  };

  // Fetch Activities when Class and Category are selected
  useEffect(() => {
    const fetchActivities = async () => {
      if (!selectedClass || !selectedCategory) {
        setActivities([]);
        return;
      }

      const selectedClassData = classes.find(c => c.id === selectedClass);
      if (!selectedClassData) return;

      const classLevel = normalizeClassLevel(selectedClassData.name);
      
      try {
        const { data, error } = await supabase
          .from('non_scholastic_activities')
          .select('*')
          .eq('class_level', classLevel)
          .eq('category_id', selectedCategory)
          .order('display_order');

        if (error) throw error;
        setActivities(data || []);
      } catch (error) {
        console.error('Error fetching activities:', error);
      }
    };

    fetchActivities();
  }, [selectedClass, selectedCategory, classes]);

  const handleOpen = async () => {
    if (!selectedClass || !selectedCategory || !selectedActivity) {
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
      
      const sortedStudents = (studentsData || []).sort((a, b) => {
        const rollA = parseInt(a.roll_number) || 0;
        const rollB = parseInt(b.roll_number) || 0;
        return rollA - rollB;
      });
      
      setStudents(sortedStudents);

      // 2. Get Activity Metadata
      const activityData = activities.find(a => a.id === parseInt(selectedActivity));
      setCurrentActivityData(activityData);

      // 3. Fetch Existing Marks
      const selectedClassData = classes.find(c => c.id === selectedClass);
      const academicYear = selectedClassData.session || '2024-2025'; // Fallback logic same as EnterMarks

      // Find appropriate exam type ID (e.g., Annual, Final, or just the first one)
      // Since it's yearly, we'll try to find 'Annual' or use the last one (usually final) or just the first one
      let examTypeId = null;
      if (examTypes.length > 0) {
          const annual = examTypes.find(et => et.exam_name.toLowerCase().includes('annual') || et.exam_name.toLowerCase().includes('final'));
          examTypeId = annual ? annual.id : examTypes[examTypes.length - 1].id;
      }
      
      // If still no exam type, we can't proceed because DB requires it. 
      // Assuming at least one exam type exists as per previous logic.
      if (!examTypeId && examTypes.length > 0) examTypeId = examTypes[0].id;
      
      if (!examTypeId) {
           throw new Error('No Exam Types defined in system. Please contact admin.');
      }

      const { data: existingMarks, error: marksError } = await supabase
        .from('student_non_scholastic')
        .select('*')
        .eq('activity_id', selectedActivity)
        .eq('exam_type_id', examTypeId)
        .eq('academic_year', academicYear);

      if (marksError) throw marksError;

      const marksMap = {};
      existingMarks.forEach(m => {
        marksMap[m.student_id] = {
            grade: m.grade,
            numeric_value: m.numeric_value
        };
      });
      setMarks(marksMap);

      setViewMode('view');

    } catch (error) {
      console.error('Error loading marks data:', error);
      setMessage({ type: 'error', text: 'Failed to load data.' });
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMarks = async () => {
    setLoading(true);
    try {
      const selectedClassData = classes.find(c => c.id === selectedClass);
      const academicYear = selectedClassData.session || '2024-2025';

      // Determine Exam Type ID (same logic as handleOpen)
      let examTypeId = null;
      if (examTypes.length > 0) {
          const annual = examTypes.find(et => et.exam_name.toLowerCase().includes('annual') || et.exam_name.toLowerCase().includes('final'));
          examTypeId = annual ? annual.id : examTypes[examTypes.length - 1].id;
      }
      if (!examTypeId && examTypes.length > 0) examTypeId = examTypes[0].id;
      
      if (!examTypeId) throw new Error('System Configuration Error: No Exam Type found.');
        // 1. Fetch Teacher UUID
      let teacherId = null;
      const { data: teacherByClerk } = await supabase
        .from('teachers')
        .select('id')
        .eq('clerk_user_id', user.id)
        .maybeSingle();

      if (teacherByClerk) {
        teacherId = teacherByClerk.id;
      } else {
        const { data: teacherByEmail } = await supabase
          .from('teachers')
          .select('id')
          .eq('email', user.primaryEmailAddress.emailAddress)
          .maybeSingle();
        if (teacherByEmail) teacherId = teacherByEmail.id;
      }

      if (!teacherId) throw new Error('Teacher record not found.');

      // 2. Prepare Data
      const marksToUpsert = Object.entries(marks).map(([studentId, data]) => {
          if (!data) return null;
          
          // Check if empty
          const isNumeric = currentActivityData.is_numeric;
          const isEmpty = isNumeric 
            ? (data.numeric_value === '' || data.numeric_value === null || data.numeric_value === undefined)
            : (data.grade === '' || data.grade === null || data.grade === undefined);
            
          if (isEmpty) return null;

          return {
              student_id: studentId,
              activity_id: parseInt(selectedActivity),
              academic_year: academicYear,
              exam_type_id: examTypeId, // Using the auto-selected ID
              grade: isNumeric ? null : data.grade,
              numeric_value: isNumeric ? parseFloat(data.numeric_value) : null,
              marked_by: teacherId
          };
        }).filter(m => m !== null);

        if (marksToUpsert.length > 0) {
            const { error: upsertError } = await supabase
              .from('student_non_scholastic')
              .upsert(marksToUpsert, { 
                  onConflict: 'student_id, activity_id, academic_year, exam_type_id'
              });
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

  const handleInputChange = (studentId, value) => {
    const isNumeric = currentActivityData?.is_numeric;
    setMarks(prev => ({
        ...prev,
        [studentId]: {
            ...prev[studentId],
            [isNumeric ? 'numeric_value' : 'grade']: value
        }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Enter Non-Scholastic Marks</h2>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Selection Panel */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                  setSelectedClass(e.target.value);
                  setViewMode('initial');
                  setSelectedActivity('');
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
            <select
              value={selectedCategory}
              onChange={(e) => {
                  setSelectedCategory(e.target.value);
                  setViewMode('initial');
                  setSelectedActivity('');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select Category</option>
              {categories.map(c => (
                <option key={c.id} value={c.id}>{c.category_name}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Activity</label>
            <select
              value={selectedActivity}
              onChange={(e) => {
                  setSelectedActivity(e.target.value);
                  setViewMode('initial');
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              disabled={!selectedClass || !selectedCategory}
            >
              <option value="">Select Activity</option>
              {activities.map(a => (
                <option key={a.id} value={a.id}>{a.activity_name}</option>
              ))}
            </select>
          </div>
        </div>
        <div className="mt-4 flex justify-end">
            <button
              onClick={handleOpen}
              disabled={loading || !selectedClass || !selectedCategory || !selectedActivity}
              className="flex items-center space-x-2 px-6 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400"
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

      {/* Entry Area */}
      {viewMode !== 'initial' && currentActivityData && (
        <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <div className="p-6 border-b border-gray-100 flex justify-between items-center">
                <h3 className="text-lg font-semibold text-gray-800">
                    Entering Marks for: <span className="text-indigo-600">{currentActivityData.activity_name}</span>
                </h3>
                <div className="flex gap-2">
                    {viewMode === 'view' ? (
                        <button
                            onClick={() => setViewMode('edit')}
                            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                        >
                            Edit Marks
                        </button>
                    ) : (
                        <>
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
                        </>
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
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                {currentActivityData.is_numeric ? 'Value' : 'Grade'}
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {students.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="px-6 py-4 text-center text-gray-500">
                                    No students found.
                                </td>
                            </tr>
                        ) : (
                            students.map((student) => {
                                const studentMarks = marks[student.id] || {};
                                const isNumeric = currentActivityData.is_numeric;
                                const val = isNumeric ? studentMarks.numeric_value : studentMarks.grade;
                                
                                return (
                                    <tr key={student.id} className="hover:bg-gray-50">
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.roll_number || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.scholar_number || '-'}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name || student.student_name}</td>
                                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                                            {viewMode === 'edit' ? (
                                                isNumeric ? (
                                                    <input
                                                        type="number"
                                                        step="0.01"
                                                        value={val || ''}
                                                        onChange={(e) => handleInputChange(student.id, e.target.value)}
                                                        className="w-32 px-2 py-1 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                                        placeholder="0.00"
                                                    />
                                                ) : (
                                                    <select
                                                        value={val || ''}
                                                        onChange={(e) => handleInputChange(student.id, e.target.value)}
                                                        className="w-32 px-2 py-1 border border-gray-300 rounded focus:ring-indigo-500 focus:border-indigo-500"
                                                    >
                                                        <option value="">Select</option>
                                                        <option value="A+">A+</option>
                                                        <option value="A">A</option>
                                                        <option value="B">B</option>
                                                        <option value="C">C</option>
                                                        <option value="D">D</option>
                                                    </select>
                                                )
                                            ) : (
                                                <span className={`font-semibold ${val ? 'text-gray-900' : 'text-gray-400'}`}>
                                                    {val || '-'}
                                                </span>
                                            )}
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

export default EnterNonScholasticMarks;
