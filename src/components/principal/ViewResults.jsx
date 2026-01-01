import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { Search, AlertCircle, CheckCircle, Trophy, TrendingUp } from 'lucide-react';

const ViewResults = () => {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [examTypes, setExamTypes] = useState([]);
  const [subjects, setSubjects] = useState([]);

  const [selectedClass, setSelectedClass] = useState('');
  const [resultType, setResultType] = useState('scholastic'); // 'scholastic' | 'non_scholastic'
  const [selectedExamType, setSelectedExamType] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(''); // For Non-Scholastic
  const [categories, setCategories] = useState([]); // Non-Scholastic Categories

  const [students, setStudents] = useState([]);
  const [marksMatrix, setMarksMatrix] = useState({});
  const [maxMarksMap, setMaxMarksMap] = useState({}); // { subject_id: max_marks }
  const [nonScholasticData, setNonScholasticData] = useState({ categories: [], activities: [] });
  const [message, setMessage] = useState(null);

  // Statistics
  const [stats, setStats] = useState({
    bestStudent: null,
    subjectStats: {},
    classAverage: 0
  });

  useEffect(() => {
    const fetchInitial = async () => {
      setLoading(true);
      try {
        // Fetch ALL classes for Principal
        const { data: classesData, error: classesError } = await supabase
          .from('classes')
          .select('*')
          .order('name');
        if (classesError) throw classesError;
        setClasses(classesData || []);

        const { data: examTypesData, error: examTypesError } = await supabase
          .from('exam_types')
          .select('*')
          .order('display_order');
        if (examTypesError) throw examTypesError;
        setExamTypes(examTypesData || []);

        // Fetch Non-Scholastic Categories
        const { data: categoriesData, error: catError } = await supabase
            .from('non_scholastic_categories')
            .select('*')
            .order('category_name');
        if (catError) throw catError;
        setCategories(categoriesData || []);

      } catch (err) {
        setMessage({ type: 'error', text: 'Failed to load initial data.' });
      } finally {
        setLoading(false);
      }
    };
    fetchInitial();
  }, []);

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

  const calculateStatistics = (studentsList, matrix, maxMarks, currentSubjects) => {
    if (!studentsList.length || Object.keys(matrix).length === 0) {
      setStats({ bestStudent: null, subjectStats: {}, classAverage: 0 });
      return;
    }

    let bestStudent = null;
    let maxPercentage = -1;
    let totalClassPercentage = 0;
    let studentCountWithMarks = 0;

    // Subject Stats Initialization
    const subjStats = {};
    currentSubjects.forEach(s => {
      subjStats[s.id] = {
        highest: -1,
        lowest: 10000, // Arbitrary high number
        total: 0,
        count: 0
      };
    });

    studentsList.forEach(student => {
      let totalObtained = 0;
      let totalMax = 0;
      let hasMarks = false;

      currentSubjects.forEach(s => {
        const maxM = maxMarks[s.id];
        if (!maxM) return;

        const cell = matrix[student.id]?.[s.id];
        if (cell && !cell.absent) {
          const marks = parseFloat(cell.marks) || 0;
          totalObtained += marks;
          totalMax += maxM;
          hasMarks = true;

          // Update Subject Stats
          if (subjStats[s.id]) {
            if (marks > subjStats[s.id].highest) subjStats[s.id].highest = marks;
            if (marks < subjStats[s.id].lowest) subjStats[s.id].lowest = marks;
            subjStats[s.id].total += marks;
            subjStats[s.id].count += 1;
          }
        }
      });

      if (hasMarks && totalMax > 0) {
        const percentage = (totalObtained / totalMax) * 100;
        studentCountWithMarks++;
        totalClassPercentage += percentage;

        if (percentage > maxPercentage) {
          maxPercentage = percentage;
          bestStudent = {
            ...student,
            percentage: percentage.toFixed(2),
            totalObtained: totalObtained,
            totalMax: totalMax
          };
        }
      }
    });

    // Finalize Subject Stats
    Object.keys(subjStats).forEach(sId => {
        if (subjStats[sId].lowest === 10000) subjStats[sId].lowest = '-'; // No marks
    });

    setStats({
      bestStudent,
      subjectStats: subjStats,
      classAverage: studentCountWithMarks > 0 ? (totalClassPercentage / studentCountWithMarks).toFixed(2) : 0
    });
  };

  const handleOpen = async () => {
    if (!selectedClass) {
        setMessage({ type: 'error', text: 'Please select a Class.' });
        return;
    }
    if (resultType === 'scholastic' && !selectedExamType) {
        setMessage({ type: 'error', text: 'Please select an Exam Type.' });
        return;
    }
    if (resultType === 'non_scholastic' && !selectedCategory) {
        setMessage({ type: 'error', text: 'Please select a Category.' });
        return;
    }

    setLoading(true);
    setMessage(null);
    setStats({ bestStudent: null, subjectStats: {}, classAverage: 0 }); // Reset stats

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

      if (resultType === 'scholastic') {
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
        const maxMarks = {};
        filteredConfigs.forEach(c => { 
            configById[c.id] = c;
            maxMarks[c.subject_id] = c.max_marks;
        });
        setMaxMarksMap(maxMarks);

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
        
        // Calculate Statistics
        calculateStatistics(sorted, matrix, maxMarks, subjects);

      } else {
          // Non-Scholastic Logic (Principal view doesn't need complex stats for non-scholastic usually, but we keep the view)
          const { data: activitiesData, error: actError } = await supabase
            .from('non_scholastic_activities')
            .select('*')
            .eq('category_id', selectedCategory)
            .order('activity_name');
            
          if (actError) throw actError;

          const filteredActivities = activitiesData.filter(a => {
             return a.class_level === classLevel;
          });
          
          setNonScholasticData({
              categories: categories, 
              activities: filteredActivities
          });

          const { data: nsMarks, error: nsError } = await supabase
             .from('student_non_scholastic')
             .select('*')
             .eq('academic_year', academicYear)
             .in('student_id', sorted.map(s => s.id));
             
          if (nsError) throw nsError;

          const matrix = {};
          nsMarks.forEach(m => {
              if (!matrix[m.student_id]) matrix[m.student_id] = {};
              matrix[m.student_id][m.activity_id] = {
                  grade: m.grade,
                  numeric_value: m.numeric_value
              };
          });
          setMarksMatrix(matrix);
      }

    } catch (err) {
      console.error(err);
      setMessage({ type: 'error', text: 'Failed to load results.' });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold text-gray-800">Class Results & Insights</h2>
      </div>

      {message && (
        <div className={`p-4 rounded-lg flex items-center gap-2 ${message.type === 'error' ? 'bg-red-50 text-red-700' : 'bg-green-50 text-green-700'}`}>
          {message.type === 'error' ? <AlertCircle className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
          {message.text}
        </div>
      )}

      {/* Controls */}
      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
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
            <label className="block text-sm font-medium text-gray-700 mb-2">Result Type</label>
            <select
              value={resultType}
              onChange={(e) => {
                  setResultType(e.target.value);
                  setMarksMatrix({});
                  setMaxMarksMap({});
                  setStudents([]);
                  setStats({ bestStudent: null, subjectStats: {}, classAverage: 0 });
              }}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="scholastic">Scholastic</option>
              <option value="non_scholastic">Non-Scholastic</option>
            </select>
          </div>

          <div>
            {resultType === 'scholastic' ? (
                <>
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
                </>
            ) : (
                <>
                <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                <select
                value={selectedCategory}
                onChange={(e) => setSelectedCategory(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                >
                <option value="">Select Category</option>
                {categories.map(c => (
                    <option key={c.id} value={c.id}>{c.category_name}</option>
                ))}
                </select>
                </>
            )}
          </div>
          <div className="flex items-end">
            <button
              onClick={handleOpen}
              disabled={loading || !selectedClass || (resultType === 'scholastic' && !selectedExamType) || (resultType === 'non_scholastic' && !selectedCategory)}
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

      {/* Insights Section */}
      {resultType === 'scholastic' && students.length > 0 && stats.bestStudent && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Best Student Card */}
            <div className="bg-gradient-to-br from-yellow-50 to-orange-50 rounded-xl shadow-md p-6 border border-orange-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-orange-800">Class Topper</h3>
                    <Trophy className="w-8 h-8 text-orange-500" />
                </div>
                <div>
                    <p className="text-2xl font-bold text-gray-900">{stats.bestStudent.name}</p>
                    <div className="flex justify-between items-center mt-2">
                        <span className="text-sm text-gray-600">Roll No: {stats.bestStudent.roll_number}</span>
                        <span className="text-xl font-bold text-orange-600">{stats.bestStudent.percentage}%</span>
                    </div>
                </div>
            </div>

            {/* Class Average Card */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-xl shadow-md p-6 border border-blue-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-blue-800">Class Average</h3>
                    <TrendingUp className="w-8 h-8 text-blue-500" />
                </div>
                <div className="flex items-end">
                    <p className="text-4xl font-bold text-blue-700">{stats.classAverage}%</p>
                </div>
            </div>

            {/* Participation/Pass Card (Placeholder for now, maybe total students) */}
             <div className="bg-gradient-to-br from-green-50 to-emerald-50 rounded-xl shadow-md p-6 border border-green-100">
                <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-green-800">Total Students</h3>
                    <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                 <div className="flex items-end">
                    <p className="text-4xl font-bold text-green-700">{students.length}</p>
                </div>
            </div>
        </div>
      )}
      
      {/* Subject Insights (Expandable or Table Header extension?) -> Let's put it above the table if exists */}
      {resultType === 'scholastic' && students.length > 0 && Object.keys(stats.subjectStats).length > 0 && (
          <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100 overflow-x-auto">
             <h3 className="text-lg font-bold text-gray-800 mb-4">Subject Highlights</h3>
             <div className="flex gap-4 min-w-max">
                 {subjects.map(s => {
                     const stat = stats.subjectStats[s.id];
                     if (!stat) return null;
                     return (
                         <div key={s.id} className="min-w-[150px] bg-gray-50 rounded-lg p-3 border border-gray-200">
                             <p className="font-semibold text-gray-700 text-sm mb-1 truncate" title={s.subject_name}>{s.subject_name}</p>
                             <div className="flex justify-between text-xs text-gray-500">
                                 <span>High: <span className="text-green-600 font-bold">{stat.highest}</span></span>
                                 <span>Low: <span className="text-red-600 font-bold">{stat.lowest}</span></span>
                             </div>
                         </div>
                     )
                 })}
             </div>
          </div>
      )}


      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scholar No</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Student Name</th>
                {resultType === 'scholastic' ? (
                  <>
                    {subjects.map(s => (
                      <th key={s.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        {s.subject_name}
                      </th>
                    ))}
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Percentage
                    </th>
                  </>
                ) : (
                  nonScholasticData.activities.map(a => {
                    const category = nonScholasticData.categories.find(c => c.id === a.category_id);
                    return (
                      <th key={a.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        <div className="flex flex-col">
                          <span className="text-[10px] text-gray-400">{category?.category_name}</span>
                          <span>{a.activity_name}</span>
                        </div>
                      </th>
                    );
                  })
                )}
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {students.length === 0 ? (
                <tr>
                  <td colSpan={3 + (resultType === 'scholastic' ? subjects.length : nonScholasticData.activities.length)} className="px-6 py-4 text-center text-gray-500">
                    No students found.
                  </td>
                </tr>
              ) : (
                students.map((student) => (
                  <tr key={student.id} className={`hover:bg-gray-50 ${stats.bestStudent?.id === student.id ? 'bg-yellow-50' : ''}`}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{student.roll_number || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.scholar_number || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                        {student.name || student.student_name}
                        {stats.bestStudent?.id === student.id && <span className="ml-2 inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-yellow-100 text-yellow-800">Top</span>}
                    </td>
                    {resultType === 'scholastic' ? (
                      <>
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
                        {(() => {
                            let totalObtained = 0;
                            let totalMax = 0;
                            let isNA = false;

                            for (const s of subjects) {
                                const maxM = maxMarksMap[s.id];
                                if (!maxM) continue; // Subject not configured for this exam

                                const cell = marksMatrix[student.id]?.[s.id];
                                if (!cell) {
                                    isNA = true; // Configured but marks not entered
                                    break;
                                }

                                totalMax += maxM;
                                if (!cell.absent) {
                                    totalObtained += (parseFloat(cell.marks) || 0);
                                }
                            }

                            if (isNA || totalMax === 0) {
                                return <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">NA</td>;
                            }
                            
                            const percentage = ((totalObtained / totalMax) * 100).toFixed(2);
                            return <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-indigo-600">{percentage}%</td>;
                        })()}
                      </>
                    ) : (
                      nonScholasticData.activities.map(a => {
                        const cell = marksMatrix[student.id]?.[a.id];
                        let text = '-';
                        if (cell) {
                          if (cell.grade) text = cell.grade;
                          else if (cell.numeric_value !== null && cell.numeric_value !== undefined) text = cell.numeric_value;
                        }
                        return (
                          <td key={a.id} className="px-6 py-4 whitespace-nowrap text-sm text-gray-700">
                            {text}
                          </td>
                        );
                      })
                    )}
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
