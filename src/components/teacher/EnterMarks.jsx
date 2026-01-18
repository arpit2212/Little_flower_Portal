import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../../lib/supabase';
import { BookOpen, Save, Search, AlertCircle, CheckCircle, Check } from 'lucide-react';
import * as XLSX from 'xlsx';
import { logTeacherAction } from '../../lib/teacherLog';

const EnterMarks = () => {
  const { user } = useUser();
  const userRole = user?.publicMetadata?.role;
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
  const [existingMarks, setExistingMarks] = useState({});
  
  const [viewMode, setViewMode] = useState('initial'); // initial, view, edit
  const [message, setMessage] = useState(null); // { type: 'success' | 'error', text: string }
  const [excelPreviewOpen, setExcelPreviewOpen] = useState(false);
  const [excelPreviewEntries, setExcelPreviewEntries] = useState([]);
  const [excelPreviewSummary, setExcelPreviewSummary] = useState(null);
  const [excelUploading, setExcelUploading] = useState(false);

  const resolveMarkerTeacherId = async () => {
    const { data: byClerk } = await supabase
      .from('teachers')
      .select('id')
      .eq('clerk_user_id', user.id)
      .maybeSingle();
    if (byClerk?.id) return byClerk.id;
    const { data: byEmail } = await supabase
      .from('teachers')
      .select('id')
      .eq('email', user.primaryEmailAddress?.emailAddress || '')
      .maybeSingle();
    if (byEmail?.id) return byEmail.id;
    const { data: inserted } = await supabase
      .from('teachers')
      .insert([{
        clerk_user_id: user.id,
        name: user.fullName || user.firstName || 'User',
        email: user.primaryEmailAddress?.emailAddress || ''
      }])
      .select('id')
      .single();
    return inserted.id;
  };

  // Fetch initial data (Classes and Exam Types)
  useEffect(() => {
    const fetchInitialData = async () => {
      if (!user) return;
      setLoading(true);
      try {
        let classesQuery = supabase.from('classes').select('*');
        if (userRole !== 'principal') {
          classesQuery = classesQuery.eq('teacher_id', user.id);
        }
        const { data: classesData, error: classesError } = await classesQuery;

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
    
    if (lowerName.includes('Nursery')) return 'Nursery';
    if (lowerName.includes('kg1')) return 'KG1';
    if (lowerName.includes('kg2')) return 'KG2';
    
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
        const { data: marksData, error: marksError } = await supabase
          .from('student_marks')
          .select('*')
          .eq('exam_configuration_id', configData.id);

        if (marksError) throw marksError;

        const marksMap = {};
        const absentMap = {};
        const existingMap = {};
        marksData.forEach(m => {
          marksMap[m.student_id] = m.marks_obtained;
          absentMap[m.student_id] = m.is_absent;
          existingMap[m.student_id] = {
            marks_obtained: m.marks_obtained,
            is_absent: m.is_absent
          };
        });
        setMarks(marksMap);
        setAbsentStatus(absentMap);
        setExistingMarks(existingMap);
      } else {
        setMaxMarks('');
        setMarks({});
        setAbsentStatus({});
        setExistingMarks({});
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

      const teacherId = await resolveMarkerTeacherId();

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
      
      Object.entries(absentStatus).forEach(([studentId, isAbsent]) => {
          if (isAbsent && !marks[studentId]) {
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

      const selectedClassDataForName = classes.find(c => c.id === selectedClass);
      const classLabel = selectedClassDataForName ? `${selectedClassDataForName.name}${selectedClassDataForName.session ? ' - ' + selectedClassDataForName.session : ''}` : selectedClass;
      const subjectData = subjects.find(s => s.id === selectedSubject || s.id === Number(selectedSubject));
      const subjectName = subjectData ? subjectData.subject_name : String(selectedSubject);
      const examTypeData = examTypes.find(e => e.id === selectedExamType || e.id === Number(selectedExamType));
      const examName = examTypeData ? examTypeData.exam_name : String(selectedExamType);

      const perStudentLogPromises = marksToUpsert.map(entry => {
        const student = students.find(s => s.id === entry.student_id);
        const oldRow = existingMarks[entry.student_id] || null;
        const oldMarks = oldRow ? oldRow.marks_obtained : null;
        const oldAbsent = oldRow ? oldRow.is_absent : false;
        const newMarks = entry.marks_obtained;
        const newAbsent = entry.is_absent;

        if (oldRow && oldMarks === newMarks && oldAbsent === newAbsent) {
          return null;
        }

        const studentLabel = student ? `${student.name || student.student_name || ''}` : entry.student_id;
        const roll = student?.roll_number || '-';
        const scholar = student?.scholar_number || '-';

        const oldText = oldAbsent ? 'AB' : (oldMarks ?? 'none');
        const newText = newAbsent ? 'AB' : (newMarks ?? 'none');

        const description = `Scholastic marks for ${studentLabel} (Roll ${roll}, Scholar ${scholar}) in ${subjectName} (${examName}, ${academicYear}) in ${classLabel}: ${oldText} -> ${newText}`;

        return logTeacherAction(user, {
          action: oldRow ? 'SCHOLASTIC_MARK_CHANGED' : 'SCHOLASTIC_MARK_CREATED',
          entityType: 'marks',
          entityId: entry.student_id,
          description
        });
      }).filter(p => p !== null);

      if (perStudentLogPromises.length > 0) {
        await Promise.all(perStudentLogPromises);
      }

      await logTeacherAction(user, {
        action: 'SCHOLASTIC_MARKS_SAVED',
        entityType: 'marks',
        entityId: configId,
        description: `Saved scholastic marks for ${classLabel}, subject ${subjectName}, exam type ${examName}, year ${academicYear}`
      });

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

  const handleDownloadTemplate = async () => {
    if (!selectedClass || !selectedExamType) {
      setMessage({ type: 'error', text: 'Please select Class and Exam Type first.' });
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

      let subjectsForClass = subjects;

      if (!subjectsForClass || subjectsForClass.length === 0) {
        const { data: subjectsData, error: subjectsError } = await supabase
          .from('subjects')
          .select('*')
          .eq('class_level', classLevel);

        if (subjectsError) {
          throw subjectsError;
        }

        subjectsForClass = subjectsData || [];
      }

      if (!subjectsForClass || subjectsForClass.length === 0) {
        throw new Error('No subjects configured for this class.');
      }

      const subjectIds = subjectsForClass.map(s => s.id);

      const { data: configData, error: configError } = await supabase
        .from('exam_configurations')
        .select('*')
        .eq('class_level', classLevel)
        .eq('exam_type_id', selectedExamType)
        .eq('academic_year', academicYear)
        .in('subject_id', subjectIds);

      if (configError) {
        throw configError;
      }

      const configBySubjectId = new Map();
      (configData || []).forEach(cfg => {
        configBySubjectId.set(cfg.subject_id, cfg);
      });

      const configIds = (configData || []).map(cfg => cfg.id);
      const marksByStudentAndConfig = new Map();

      if (configIds.length > 0) {
        const { data: marksData, error: marksError } = await supabase
          .from('student_marks')
          .select('student_id, exam_configuration_id, marks_obtained, is_absent')
          .in('exam_configuration_id', configIds);

        if (marksError) {
          throw marksError;
        }

        (marksData || []).forEach(row => {
          const key = `${row.student_id}-${row.exam_configuration_id}`;
          marksByStudentAndConfig.set(key, row);
        });
      }

      const templateRows = [];

      if (sortedStudents.length === 0) {
        const emptyRow = {
          'Scholar No': '',
          'Student Name': ''
        };

        subjectsForClass.forEach(subj => {
          const maxHeader = `${subj.subject_name} - Max Marks`;
          const obtainHeader = `${subj.subject_name} - Obtain Marks`;
          emptyRow[maxHeader] = '';
          emptyRow[obtainHeader] = '';
        });

        templateRows.push(emptyRow);
      } else {
        sortedStudents.forEach(student => {
          const row = {
            'Scholar No': student.scholar_number || '',
            'Student Name': student.name || student.student_name || ''
          };

          subjectsForClass.forEach(subj => {
            const maxHeader = `${subj.subject_name} - Max Marks`;
            const obtainHeader = `${subj.subject_name} - Obtain Marks`;

            const cfg = configBySubjectId.get(subj.id);

            if (cfg) {
              row[maxHeader] = cfg.max_marks;
              const key = `${student.id}-${cfg.id}`;
              const markRow = marksByStudentAndConfig.get(key);

              if (markRow) {
                row[obtainHeader] = markRow.is_absent ? 'Absent' : (markRow.marks_obtained ?? '');
              } else {
                row[obtainHeader] = '';
              }
            } else {
              row[maxHeader] = '';
              row[obtainHeader] = '';
            }
          });

          templateRows.push(row);
        });
      }

      const ws = XLSX.utils.json_to_sheet(templateRows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Marks');

      const examTypeName = examTypes.find(et => et.id === selectedExamType)?.exam_name || 'Exam';
      const safeClassName = (selectedClassData.name || 'Class').replace(/[^a-zA-Z0-9]/g, '_');
      const safeExamTypeName = examTypeName.replace(/[^a-zA-Z0-9]/g, '_');

      XLSX.writeFile(wb, `Marks_${safeClassName}_${safeExamTypeName}.xlsx`);

      setMessage({ type: 'success', text: 'Excel template downloaded successfully.' });
    } catch (error) {
      console.error('Error generating Excel template:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to generate Excel template.' });
    } finally {
      setLoading(false);
    }
  };

  const handleExcelUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!selectedClass || !selectedExamType) {
      setMessage({ type: 'error', text: 'Please select Class and Exam Type first.' });
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
        const subjectMetas = [];

        headers.forEach(header => {
          if (header.endsWith(' - Obtain Marks')) {
            const subjectName = header.replace(' - Obtain Marks', '').trim();
            const maxKey = `${subjectName} - Max Marks`;
            subjectMetas.push({
              subjectName,
              obtainKey: header,
              maxKey
            });
          }
        });

        if (subjectMetas.length === 0) {
          throw new Error('No subject columns found in Excel file. Please use the provided template.');
        }

        const selectedClassData = classes.find(c => c.id === selectedClass);
        if (!selectedClassData) {
          throw new Error('Selected class not found.');
        }

        const classLevel = normalizeClassLevel(selectedClassData.name);
        const academicYear = selectedClassData.session || '2024-2025';

        let subjectsForClass = subjects;

        if (!subjectsForClass || subjectsForClass.length === 0) {
          const { data: subjectsData, error: subjectsError } = await supabase
            .from('subjects')
            .select('*')
            .eq('class_level', classLevel);

          if (subjectsError) {
            throw subjectsError;
          }

          subjectsForClass = subjectsData || [];
        }

        const subjectRecords = subjectMetas.map(meta => {
          const subj = subjectsForClass.find(s => s.subject_name === meta.subjectName);
          if (!subj) {
            throw new Error(`Subject '${meta.subjectName}' not found for this class.`);
          }
          return {
            ...meta,
            subjectId: subj.id
          };
        });
        const activeSubjectRecords = subjectRecords.filter(sr => {
          return jsonData.some(row => {
            const val = row[sr.obtainKey];
            return val !== undefined && val !== null && String(val).trim() !== '';
          });
        });

        const { data: studentsData, error: studentsError } = await supabase
          .from('students')
          .select('id, scholar_number, roll_number, name, student_name')
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

        const subjectIds = activeSubjectRecords.map(sr => sr.subjectId);

        const { data: existingConfigs, error: configError } = await supabase
          .from('exam_configurations')
          .select('*')
          .eq('class_level', classLevel)
          .eq('exam_type_id', selectedExamType)
          .eq('academic_year', academicYear)
          .in('subject_id', subjectIds);

        if (configError) {
          throw configError;
        }

        const configBySubjectId = new Map();
        (existingConfigs || []).forEach(cfg => {
          configBySubjectId.set(cfg.subject_id, cfg);
        });

        const configsToCreate = [];
        const subjectMaxMap = new Map();

        activeSubjectRecords.forEach(sr => {
          const existingCfg = configBySubjectId.get(sr.subjectId);
          if (existingCfg) {
            subjectMaxMap.set(sr.subjectId, existingCfg.max_marks);
          } else {
            let maxValue = null;
            jsonData.forEach(row => {
              const cell = row[sr.maxKey];
              if (cell !== undefined && cell !== null && String(cell).trim() !== '') {
                const num = Number(cell);
                if (!Number.isNaN(num)) {
                  maxValue = num;
                }
              }
            });
            if (!maxValue) {
              throw new Error(`Max Marks missing for subject '${sr.subjectName}'. Please fill '${sr.maxKey}' column.`);
            }
            subjectMaxMap.set(sr.subjectId, maxValue);
            configsToCreate.push({
              class_level: classLevel,
              subject_id: sr.subjectId,
              exam_type_id: selectedExamType,
              max_marks: maxValue,
              academic_year: academicYear
            });
          }
        });

        if (configsToCreate.length > 0) {
          const { data: newConfigs, error: createConfigError } = await supabase
            .from('exam_configurations')
            .insert(configsToCreate)
            .select();

          if (createConfigError) {
            throw createConfigError;
          }

          (newConfigs || []).forEach(cfg => {
            configBySubjectId.set(cfg.subject_id, cfg);
          });
        }

        const teacherId = await resolveMarkerTeacherId();

        const marksToUpsert = [];
        const previewRows = [];

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

          activeSubjectRecords.forEach(sr => {
            const obtainRaw = row[sr.obtainKey];
            const maxRaw = row[sr.maxKey];

            const hasMax = maxRaw !== null && maxRaw !== undefined && String(maxRaw).trim() !== '';
            const hasObtain = obtainRaw !== null && obtainRaw !== undefined && String(obtainRaw).trim() !== '';

            if (!hasMax && !hasObtain) {
              return;
            }

            let isAbsent = false;
            let marksValue = null;

            if (typeof obtainRaw === 'string') {
              const trimmed = obtainRaw.trim();
              if (trimmed === '') {
                return;
              }
              if (['ab', 'AB', 'absent', 'ABSENT', 'a', 'A'].includes(trimmed)) {
                isAbsent = true;
                marksValue = null;
              } else {
                const num = Number(trimmed);
                if (Number.isNaN(num)) {
                  throw new Error(`Invalid marks value for student ${scholarKey}, subject ${sr.subjectName} (row ${index + 2}).`);
                }
                marksValue = num;
              }
            } else if (typeof obtainRaw === 'number') {
              marksValue = obtainRaw;
            } else if (obtainRaw === null || obtainRaw === undefined || obtainRaw === '') {
              return;
            }

            const cfg = configBySubjectId.get(sr.subjectId);
            if (!cfg) {
              return;
            }

            const maxMarks = subjectMaxMap.get(sr.subjectId);
            if (marksValue != null && maxMarks != null && marksValue > maxMarks) {
              throw new Error(`Marks for student ${scholarKey}, subject ${sr.subjectName} exceed Max Marks.`);
            }

            marksToUpsert.push({
              student_id: studentId,
              exam_configuration_id: cfg.id,
              marks_obtained: isAbsent ? null : (marksValue != null ? marksValue : null),
              is_absent: isAbsent,
              marked_by: teacherId
            });
            const sd = studentsData.find(s => s.id === studentId) || {};
            previewRows.push({
              student_id: studentId,
              roll_number: sd.roll_number || '-',
              scholar_number: sd.scholar_number || '-',
              student_name: sd.name || sd.student_name || '',
              subject_name: sr.subjectName,
              exam_configuration_id: cfg.id,
              marks_obtained: isAbsent ? null : (marksValue != null ? marksValue : null),
              is_absent: isAbsent,
              max_marks: maxMarks || null
            });
          });
        });

        if (marksToUpsert.length === 0) {
          throw new Error('No marks found in Excel file.');
        }

        const uniqueStudentCount = new Set(marksToUpsert.map(m => m.student_id)).size;
        const uniqueConfigCount = new Set(marksToUpsert.map(m => m.exam_configuration_id)).size;
        setExcelPreviewEntries(previewRows);
        setExcelPreviewSummary({
          studentCount: uniqueStudentCount,
          subjectCount: uniqueConfigCount,
          entryCount: marksToUpsert.length,
          classLabel: selectedClassData.name + (selectedClassData.session ? ` - ${selectedClassData.session}` : ''),
          academicYear,
          examTypeId: selectedExamType
        });
        setExcelPreviewOpen(true);
      } catch (error) {
        console.error('Error processing Excel file:', error);
        setMessage({ type: 'error', text: error.message || 'Failed to process Excel file.' });
      } finally {
        setLoading(false);
        e.target.value = '';
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const applyExcelUpload = async () => {
    if (!excelPreviewEntries || excelPreviewEntries.length === 0) return;
    setExcelUploading(true);
    try {
      const teacherId = await resolveMarkerTeacherId();
      const payload = excelPreviewEntries.map(r => ({
        student_id: r.student_id,
        exam_configuration_id: r.exam_configuration_id,
        marks_obtained: r.is_absent ? null : (r.marks_obtained != null ? r.marks_obtained : null),
        is_absent: r.is_absent,
        marked_by: teacherId
      }));
      const { error: upsertError } = await supabase
        .from('student_marks')
        .upsert(payload, { onConflict: 'student_id, exam_configuration_id' });
      if (upsertError) throw upsertError;
      await logTeacherAction(user, {
        action: 'SCHOLASTIC_MARKS_IMPORTED_EXCEL',
        entityType: 'marks',
        entityId: selectedClass,
        description: `Imported scholastic marks from Excel for ${excelPreviewSummary.studentCount} students and ${excelPreviewSummary.subjectCount} subjects in ${excelPreviewSummary.classLabel}, exam type ${excelPreviewSummary.examTypeId}, year ${excelPreviewSummary.academicYear}`
      });
      setMessage({ type: 'success', text: 'Marks uploaded successfully from Excel.' });
      setExcelPreviewOpen(false);
      setExcelPreviewEntries([]);
      setExcelPreviewSummary(null);
    } catch (error) {
      console.error('Error applying Excel upload:', error);
      setMessage({ type: 'error', text: error.message || 'Failed to apply Excel upload.' });
    } finally {
      setExcelUploading(false);
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

      <div className="bg-white rounded-xl shadow-md p-6 border border-gray-100">
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Bulk Upload Marks via Excel</h3>
        <p className="text-sm text-gray-600 mb-4">
          Download the template for the selected Class and Exam Type, fill Max Marks and Obtained Marks for each subject, then upload the file to save all marks in one step.
        </p>
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          <button
            onClick={handleDownloadTemplate}
            disabled={loading || !selectedClass || !selectedExamType}
            className="flex items-center justify-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:bg-gray-400"
          >
            Download Template
          </button>
          <label className={`flex items-center justify-center px-4 py-2 border border-dashed rounded-lg cursor-pointer ${loading || !selectedClass || !selectedExamType ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-white text-indigo-700 border-indigo-300 hover:bg-indigo-50'}`}>
            <span>Select Excel File (.xlsx or .xls)</span>
            <input
              type="file"
              accept=".xlsx,.xls"
              className="hidden"
              onChange={handleExcelUpload}
              disabled={loading || !selectedClass || !selectedExamType}
            />
          </label>
        </div>
        {excelPreviewOpen && (
          <div className="mt-6 space-y-3">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-blue-800">
                  Preview: {excelPreviewSummary.entryCount} entry(ies) ready to import
                </h4>
                <button
                  onClick={() => { setExcelPreviewOpen(false); setExcelPreviewEntries([]); setExcelPreviewSummary(null); }}
                  className="px-3 py-1.5 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-xs"
                >
                  Cancel
                </button>
              </div>
              <div className="overflow-x-auto max-h-64 overflow-y-auto mt-2">
                {(() => {
                  const subjectNames = Array.from(new Set(excelPreviewEntries.map(e => e.subject_name))).filter(Boolean);
                  const students = Array.from(
                    new Map(
                      excelPreviewEntries.map(e => [
                        e.scholar_number,
                        { roll: e.roll_number, scholar: e.scholar_number, name: e.student_name }
                      ])
                    ).values()
                  );
                  return (
                    <table className="min-w-full text-xs">
                      <thead className="bg-blue-100">
                        <tr>
                          <th className="px-2 py-1 text-left">Roll</th>
                          <th className="px-2 py-1 text-left">Scholar No</th>
                          <th className="px-2 py-1 text-left">Student</th>
                          {subjectNames.map((sn) => (
                            <th key={sn} className="px-2 py-1 text-left">{sn}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {students.map((s) => (
                          <tr key={s.scholar}>
                            <td className="px-2 py-1">{s.roll || '-'}</td>
                            <td className="px-2 py-1">{s.scholar || '-'}</td>
                            <td className="px-2 py-1">{s.name || '-'}</td>
                            {subjectNames.map((sn) => {
                              const entry = excelPreviewEntries.find(e => e.scholar_number === s.scholar && e.subject_name === sn);
                              const obt = entry ? (entry.is_absent ? 'Absent' : (entry.marks_obtained ?? '-')) : '-';
                              const max = entry ? (entry.max_marks ?? '-') : '-';
                              const val = `${obt} / ${max}`;
                              return <td key={sn} className="px-2 py-1">{val}</td>;
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  );
                })()}
              </div>
            </div>
            <button
              onClick={applyExcelUpload}
              disabled={excelUploading}
              className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md"
            >
              {excelUploading ? (
                <>
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                  <span>Importing...</span>
                </>
              ) : (
                <>
                  <Check className="w-5 h-5" />
                  <span>Import {excelPreviewSummary.entryCount} Entry(ies)</span>
                </>
              )}
            </button>
          </div>
        )}
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
