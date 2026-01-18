import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../../lib/supabase';
import { Save, Search, AlertCircle, CheckCircle } from 'lucide-react';
import * as XLSX from 'xlsx';

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
    
    if (lowerName.includes('nursery')) return 'Nursery';
    if (lowerName.includes('kg1')) return 'KG1'; // Mapping LKG -> KG1 based on schema inserts
    if (lowerName.includes('kg2')) return 'KG2'; // Mapping UKG -> KG2 based on schema inserts
    
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

  const handleDownloadTemplate = async () => {
    if (!selectedClass) {
      setMessage({ type: 'error', text: 'Please select a Class first.' });
      return;
    }

    setLoading(true);
    setMessage(null);

    try {
      const selectedClassData = classes.find(c => c.id === selectedClass);
      if (!selectedClassData) {
        throw new Error('Selected class not found.');
      }

      const classLevel = normalizeClassLevel(selectedClassData.name);
      const academicYear = selectedClassData.session || '2024-2025';

      const { data: studentsData, error: studentsError } = await supabase
        .from('students')
        .select('id, scholar_number, name, student_name, roll_number')
        .eq('class_id', selectedClass);

      if (studentsError) {
        throw studentsError;
      }

      const sortedStudents = (studentsData || []).sort((a, b) => {
        const rollA = parseInt(a.roll_number) || 0;
        const rollB = parseInt(b.roll_number) || 0;
        return rollA - rollB;
      });

      let categoryList = categories;

      if (!categoryList || categoryList.length === 0) {
        const { data: categoriesData, error: categoriesError } = await supabase
          .from('non_scholastic_categories')
          .select('*')
          .order('display_order');

        if (categoriesError) {
          throw categoriesError;
        }

        categoryList = categoriesData || [];
      }

      if (!categoryList || categoryList.length === 0) {
        throw new Error('No non-scholastic categories configured.');
      }

      const categoryMap = new Map();
      categoryList.forEach(cat => {
        categoryMap.set(cat.id, cat.category_name);
      });

      const { data: activitiesData, error: activitiesError } = await supabase
        .from('non_scholastic_activities')
        .select('*')
        .eq('class_level', classLevel)
        .order('category_id, display_order');

      if (activitiesError) {
        throw activitiesError;
      }

      const activitiesForClass = activitiesData || [];

      if (activitiesForClass.length === 0) {
        throw new Error('No non-scholastic activities configured for this class.');
      }

      let examTypeId = null;
      if (examTypes.length > 0) {
        const annual = examTypes.find(et => et.exam_name.toLowerCase().includes('annual') || et.exam_name.toLowerCase().includes('final'));
        examTypeId = annual ? annual.id : examTypes[examTypes.length - 1].id;
      }
      if (!examTypeId && examTypes.length > 0) {
        examTypeId = examTypes[0].id;
      }
      if (!examTypeId) {
        throw new Error('No Exam Types defined in system. Please contact admin.');
      }

      const activityIds = activitiesForClass.map(a => a.id);

      const { data: existingMarks, error: marksError } = await supabase
        .from('student_non_scholastic')
        .select('student_id, activity_id, grade, numeric_value')
        .in('activity_id', activityIds)
        .eq('academic_year', academicYear)
        .eq('exam_type_id', examTypeId);

      if (marksError) {
        throw marksError;
      }

      const marksByStudentActivity = new Map();
      (existingMarks || []).forEach(row => {
        const key = `${row.student_id}-${row.activity_id}`;
        marksByStudentActivity.set(key, row);
      });

      const headerMetas = activitiesForClass.map(act => {
        const categoryName = categoryMap.get(act.category_id) || `Category ${act.category_id}`;
        const base = `${categoryName} - ${act.activity_name}`;
        const isNumeric = !!act.is_numeric;
        const header = isNumeric ? `${base} - Numeric` : `${base} - Grade`;
        return {
          header,
          activityId: act.id,
          isNumeric
        };
      });

      const templateRows = [];

      if (sortedStudents.length === 0) {
        const row = {
          'Scholar No': '',
          'Student Name': ''
        };
        headerMetas.forEach(meta => {
          row[meta.header] = '';
        });
        templateRows.push(row);
      } else {
        sortedStudents.forEach(student => {
          const row = {
            'Scholar No': student.scholar_number || '',
            'Student Name': student.name || student.student_name || ''
          };

          headerMetas.forEach(meta => {
            const key = `${student.id}-${meta.activityId}`;
            const markRow = marksByStudentActivity.get(key);

            if (markRow) {
              if (meta.isNumeric) {
                row[meta.header] = markRow.numeric_value ?? '';
              } else {
                row[meta.header] = markRow.grade ?? '';
              }
            } else {
              row[meta.header] = '';
            }
          });

          templateRows.push(row);
        });
      }

      const ws = XLSX.utils.json_to_sheet(templateRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Non-Scholastic');

      const safeClassName = (selectedClassData.name || 'Class').replace(/[^a-zA-Z0-9]/g, '_');
      XLSX.writeFile(wb, `NonScholastic_${safeClassName}.xlsx`);

      setMessage({ type: 'success', text: 'Excel template downloaded successfully.' });
    } catch (error) {
      console.error('Error generating non-scholastic Excel template:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to generate Excel template.' });
    } finally {
      setLoading(false);
    }
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!selectedClass) {
      setMessage({ type: 'error', text: 'Please select a Class first.' });
      return;
    }

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setMessage({ type: 'error', text: 'Please upload a valid Excel file (.xlsx or .xls).' });
      return;
    }

    setLoading(true);
    setMessage(null);

    const reader = new FileReader();

    reader.onload = async (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { defval: '' });

        if (jsonData.length === 0) {
          throw new Error('The Excel file is empty. Please check your file.');
        }

        const headers = Object.keys(jsonData[0] || {});
        const headerMetas = [];

        headers.forEach(header => {
          if (header === 'Scholar No' || header === 'Scholar Number' || header === 'Student Name') {
            return;
          }
          if (header.endsWith(' - Grade') || header.endsWith(' - Numeric')) {
            const parts = header.split(' - ');
            if (parts.length < 3) {
              return;
            }
            const suffix = parts[parts.length - 1];
            const isNumeric = suffix === 'Numeric';
            const categoryName = parts[0];
            const activityName = parts.slice(1, parts.length - 1).join(' - ');
            headerMetas.push({
              header,
              categoryName,
              activityName,
              isNumeric
            });
          }
        });

        if (headerMetas.length === 0) {
          throw new Error('No activity columns found in Excel file. Please use the provided template.');
        }

        const selectedClassData = classes.find(c => c.id === selectedClass);
        if (!selectedClassData) {
          throw new Error('Selected class not found.');
        }

        const classLevel = normalizeClassLevel(selectedClassData.name);
        const academicYear = selectedClassData.session || '2024-2025';

        let categoryList = categories;

        if (!categoryList || categoryList.length === 0) {
          const { data: categoriesData, error: categoriesError } = await supabase
            .from('non_scholastic_categories')
            .select('*')
            .order('display_order');

          if (categoriesError) {
            throw categoriesError;
          }

          categoryList = categoriesData || [];
        }

        const categoryNameToId = new Map();
        categoryList.forEach(cat => {
          if (cat.category_name) {
            categoryNameToId.set(cat.category_name.toLowerCase().trim(), cat.id);
          }
        });

        const categoryIds = [];
        headerMetas.forEach(meta => {
          const key = meta.categoryName.toLowerCase().trim();
          const id = categoryNameToId.get(key);
          if (!id) {
            throw new Error(`Category '${meta.categoryName}' not found in system.`);
          }
          if (!categoryIds.includes(id)) {
            categoryIds.push(id);
          }
          meta.categoryId = id;
        });

        const { data: activitiesData, error: activitiesError } = await supabase
          .from('non_scholastic_activities')
          .select('*')
          .eq('class_level', classLevel)
          .in('category_id', categoryIds);

        if (activitiesError) {
          throw activitiesError;
        }

        const activitiesForClass = activitiesData || [];

        headerMetas.forEach(meta => {
          const activity = activitiesForClass.find(a => a.category_id === meta.categoryId && a.activity_name === meta.activityName);
          if (!activity) {
            throw new Error(`Activity '${meta.activityName}' under category '${meta.categoryName}' not found for this class.`);
          }
          if (meta.isNumeric && !activity.is_numeric) {
            throw new Error(`Activity '${meta.activityName}' is grade-based but Excel column is Numeric.`);
          }
          if (!meta.isNumeric && !activity.has_grade) {
            throw new Error(`Activity '${meta.activityName}' is numeric but Excel column is Grade.`);
          }
          meta.activityId = activity.id;
        });

        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('id, scholar_number')
          .eq('class_id', selectedClass);

        if (studentsError) {
          throw studentsError;
        }

        const studentMap = new Map();
        (studentsData || []).forEach(s => {
          if (s.scholar_number) {
            studentMap.set(String(s.scholar_number).trim(), s.id);
          }
        });

        if (studentMap.size === 0) {
          throw new Error('No students found for selected class.');
        }

        let examTypeId = null;
        if (examTypes.length > 0) {
          const annual = examTypes.find(et => et.exam_name.toLowerCase().includes('annual') || et.exam_name.toLowerCase().includes('final'));
          examTypeId = annual ? annual.id : examTypes[examTypes.length - 1].id;
        }
        if (!examTypeId && examTypes.length > 0) {
          examTypeId = examTypes[0].id;
        }
        if (!examTypeId) {
          throw new Error('No Exam Types defined in system. Please contact admin.');
        }

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

          if (teacherByEmail) {
            teacherId = teacherByEmail.id;
          }
        }

        if (!teacherId) {
          throw new Error('Teacher record not found. Please contact administrator.');
        }

        const marksToUpsert = [];

        jsonData.forEach((row, index) => {
          const scholarRaw = row['Scholar No'] ?? row['Scholar Number'] ?? '';
          const scholarKey = String(scholarRaw).trim();
          if (!scholarKey) {
            return;
          }

          const studentId = studentMap.get(scholarKey);
          if (!studentId) {
            return;
          }

          headerMetas.forEach(meta => {
            const cellRaw = row[meta.header];
            if (cellRaw === null || cellRaw === undefined || String(cellRaw).trim() === '') {
              return;
            }

            if (meta.isNumeric) {
              const num = Number(cellRaw);
              if (Number.isNaN(num)) {
                throw new Error(`Invalid numeric value for student ${scholarKey}, activity '${meta.activityName}' (row ${index + 2}).`);
              }
              marksToUpsert.push({
                student_id: studentId,
                activity_id: meta.activityId,
                academic_year: academicYear,
                exam_type_id: examTypeId,
                grade: null,
                numeric_value: num,
                marked_by: teacherId
              });
            } else {
              const gradeRaw = String(cellRaw).trim().toUpperCase();
              const validGrades = ['A+', 'A', 'B', 'C', 'D'];
              if (!validGrades.includes(gradeRaw)) {
                throw new Error(`Invalid grade '${cellRaw}' for student ${scholarKey}, activity '${meta.activityName}' (row ${index + 2}).`);
              }
              marksToUpsert.push({
                student_id: studentId,
                activity_id: meta.activityId,
                academic_year: academicYear,
                exam_type_id: examTypeId,
                grade: gradeRaw,
                numeric_value: null,
                marked_by: teacherId
              });
            }
          });
        });

        if (marksToUpsert.length === 0) {
          throw new Error('No marks found in Excel file.');
        }

        const uniqueStudentCount = new Set(marksToUpsert.map(m => m.student_id)).size;
        const uniqueActivityCount = new Set(marksToUpsert.map(m => m.activity_id)).size;
        const confirmMessage = `You are about to upload non-scholastic marks for ${uniqueStudentCount} students and ${uniqueActivityCount} activities (${marksToUpsert.length} entries). Do you want to continue?`;
        const confirmed = window.confirm(confirmMessage);

        if (!confirmed) {
          setMessage({ type: 'error', text: 'Non-scholastic marks upload cancelled.' });
          return;
        }

        const { error: upsertError } = await supabase
          .from('student_non_scholastic')
          .upsert(marksToUpsert, {
            onConflict: 'student_id, activity_id, academic_year, exam_type_id'
          });

        if (upsertError) {
          throw upsertError;
        }

        setMessage({ type: 'success', text: 'Non-scholastic marks uploaded successfully from Excel.' });
      } catch (error) {
        console.error('Error processing non-scholastic Excel file:', error);
        setMessage({ type: 'error', text: error.message || 'Failed to process Excel file.' });
      } finally {
        setLoading(false);
        e.target.value = '';
      }
    };

    reader.readAsArrayBuffer(file);
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

      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Bulk Upload Non-Scholastic Marks via Excel</h3>
        <p className="text-sm text-gray-600 mb-4">
          Download the template for the selected Class, fill grades or numeric values for each non-scholastic activity, then upload the file to save all marks in one step.
        </p>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <button
            onClick={handleDownloadTemplate}
            disabled={loading || !selectedClass}
            className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
          >
            Download Template
          </button>
          <label className={`flex items-center justify-center px-4 py-2 border border-dashed rounded-lg cursor-pointer ${loading || !selectedClass ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-indigo-700 border-indigo-300 hover:bg-indigo-50'}`}>
            <span>Select Excel File (.xlsx or .xls)</span>
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleExcelUpload}
              disabled={loading || !selectedClass}
            />
          </label>
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
