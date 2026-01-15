import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { FileText, Search, Download, Loader2, Filter, Eye, X } from 'lucide-react';
import MarksheetTemplate from './MarksheetTemplate';

const GenerateMarksheet = () => {
  const [loading, setLoading] = useState(false);
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [generatingPdf, setGeneratingPdf] = useState(null); // student id being processed
  const [pdfData, setPdfData] = useState(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [previewMode, setPreviewMode] = useState(false);
  const templateRef = useRef(null);
  const previewRef = useRef(null);

  useEffect(() => {
    fetchClasses();
  }, []);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents(selectedClass);
    } else {
      setStudents([]);
    }
  }, [selectedClass]);

  useEffect(() => {
    // When pdfData is set, check mode
    if (pdfData) {
        if (previewMode) {
            setShowPreviewModal(true);
            setGeneratingPdf(null);
        } else if (templateRef.current) {
            generatePdfFromTemplate();
        }
    }
  }, [pdfData, previewMode]);

  const fetchClasses = async () => {
    try {
      const { data, error } = await supabase
        .from('classes')
        .select('*')
        .order('name');
      if (error) throw error;
      setClasses(data || []);
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const fetchStudents = async (classId) => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', classId)
        .order('roll_number', { ascending: true });
      
      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('Error fetching students:', error);
    } finally {
      setLoading(false);
    }
  };

  const getBase64FromUrl = async (url) => {
    if (!url) return null;
    try {
        const response = await fetch(url + '?t=' + new Date().getTime(), { mode: 'cors' });
        const blob = await response.blob();
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => resolve(reader.result);
            reader.onerror = reject;
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Error converting image to base64:", error);
        return null;
    }
  };

  const openPrintWindowFromElement = (element, title) => {
    if (!element) {
      alert('Marksheet is not ready yet. Please try again.');
      return;
    }

    const printWindow = window.open('', '_blank', 'width=900,height=650');
    if (!printWindow) {
      alert('Please allow popups to print or save the marksheet.');
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { margin: 0; padding: 0; }
          </style>
        </head>
        <body></body>
      </html>
    `);
    printWindow.document.close();

    const cloned = printWindow.document.importNode(element, true);
    printWindow.document.body.appendChild(cloned);

    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
    }, 500);
  };

  const generatePdfFromTemplate = (usePreview = false) => {
    if (!pdfData) return;

    let element = null;

    if (usePreview && previewRef.current) {
      element = previewRef.current;
    } else if (templateRef.current) {
      element = templateRef.current;
    }

    if (!element) {
      console.error("No template element available for printing");
      setGeneratingPdf(null);
      setPdfData(null);
      alert("Error: Marksheet template could not be loaded.");
      return;
    }

    openPrintWindowFromElement(element, `${pdfData.student.name}_Marksheet`);
    setGeneratingPdf(null);
    setPdfData(null);
  };

  const prepareMarksheetData = async (student, mode = 'pdf') => {
    setGeneratingPdf(student.id);
    setPreviewMode(mode === 'preview');
    try {
      const selectedClassData = classes.find(c => c.id === selectedClass);
      const classLevel = selectedClassData ? selectedClassData.name : '';
      const session = selectedClassData ? selectedClassData.session : '2025-26';

      // 1. Fetch Subjects
      const { data: subjects } = await supabase
        .from('subjects')
        .select('*')
        .eq('class_level', classLevel);

      // 2. Fetch Exam Types
      const { data: examTypes } = await supabase
        .from('exam_types')
        .select('*')
        .order('display_order');

      // 3. Fetch Exam Configurations
      const { data: examConfigs } = await supabase
        .from('exam_configurations')
        .select('*')
        .eq('class_level', classLevel);

      // 4. Fetch Student Marks
      const { data: marks } = await supabase
        .from('student_marks')
        .select('*, exam_configurations(*)')
        .eq('student_id', student.id);

      // 5. Fetch Non-Scholastic Activities
      const { data: nsActivities } = await supabase
        .from('non_scholastic_activities')
        .select('*, non_scholastic_categories(*)')
        .eq('class_level', classLevel)
        .order('display_order');

      // 6. Fetch Student Non-Scholastic Grades
      const { data: nsGrades } = await supabase
        .from('student_non_scholastic')
        .select('*')
        .eq('student_id', student.id);

      // --- Process Scholastic Data ---
      // Group subjects by base name (removing " Internal" or " Theory" suffix)
      const groupedSubjects = {};
      
      subjects?.forEach(sub => {
        let baseName = sub.subject_name;
        let type = 'main'; // main, internal, theory
        
        if (baseName.trim().endsWith('Internal')) {
            baseName = baseName.replace(/ Internal$/i, '').trim();
            type = 'internal';
        } else if (baseName.trim().endsWith('Theory')) {
            baseName = baseName.replace(/ Theory$/i, '').trim();
            type = 'theory';
        }

        if (!groupedSubjects[baseName]) {
            groupedSubjects[baseName] = { name: baseName, components: [] };
        }
        groupedSubjects[baseName].components.push({ ...sub, type });
      });

      const processedScholastic = Object.values(groupedSubjects).map(group => {
        const getCombinedExamData = (examNameKeyword) => {
            const type = examTypes?.find(t => t.exam_name.toLowerCase().includes(examNameKeyword.toLowerCase()));
            if (!type) return { max: '-', obt: '-' };

            let totalMax = 0;
            let totalObt = 0;
            let hasData = false;
            let isAbsent = true; // Assume absent until proven present

            group.components.forEach(comp => {
                const config = examConfigs?.find(c => c.subject_id === comp.id && c.exam_type_id === type.id);
                if (config) {
                    hasData = true;
                    totalMax += parseFloat(config.max_marks || 0);
                    
                    const markEntry = marks?.find(m => m.exam_configuration_id === config.id);
                    if (markEntry && !markEntry.is_absent) {
                        isAbsent = false;
                        totalObt += parseFloat(markEntry.marks_obtained || 0);
                    }
                }
            });

            if (!hasData) return { max: '-', obt: '-' };
            if (isAbsent && totalObt === 0) return { max: totalMax, obt: 'AB' };
            
            return {
                max: totalMax,
                obt: totalObt
            };
        };

        const unitTest = getCombinedExamData('Unit');
        const term1 = getCombinedExamData('I-Term');
        const term2 = getCombinedExamData('Half Yearly');
        const annual = getCombinedExamData('Annual');

        // Calculate Aggregate for Grade
        let grandMax = 0;
        let grandObt = 0;
        
        [unitTest, term1, term2, annual].forEach(exam => {
            if (exam.max !== '-' && !isNaN(parseFloat(exam.max))) grandMax += parseFloat(exam.max);
            if (exam.obt !== '-' && exam.obt !== 'AB' && !isNaN(parseFloat(exam.obt))) grandObt += parseFloat(exam.obt);
        });

        const percentage = grandMax > 0 ? (grandObt / grandMax) * 100 : 0;
        let grade = '';
        if (grandMax > 0) {
            if (percentage > 85) grade = 'A+';
            else if (percentage >= 76) grade = 'A';
            else if (percentage >= 66) grade = 'B+';
            else if (percentage >= 56) grade = 'B';
            else if (percentage >= 51) grade = 'C+';
            else if (percentage >= 46) grade = 'C';
            else if (percentage >= 33) grade = 'D';
            else grade = 'F';
        }

        return {
            subject: group.name,
            unitTest,
            term1,
            term2,
            annual,
            grade
        };
      });

      // Calculate Totals
      const calculateTotal = (examKey) => {
        let maxTotal = 0;
        let obtTotal = 0;
        processedScholastic.forEach(sub => {
            const d = sub[examKey];
            if (d.max !== '-' && !isNaN(parseFloat(d.max))) maxTotal += parseFloat(d.max);
            if (d.obt !== '-' && d.obt !== 'AB' && !isNaN(parseFloat(d.obt))) obtTotal += parseFloat(d.obt);
        });
        const percentage = maxTotal > 0 ? ((obtTotal / maxTotal) * 100).toFixed(2) : '';
        return { max: maxTotal || '', obt: obtTotal || '', percentage: percentage };
      };

      const totals = {
        unitTest: calculateTotal('unitTest'),
        term1: calculateTotal('term1'),
        term2: calculateTotal('term2'),
        annual: calculateTotal('annual'),
        aggregatePercentage: '' // Calculate overall
      };

      // Overall Percentage
      const allMax = parseFloat(totals.unitTest.max || 0) + parseFloat(totals.term1.max || 0) + parseFloat(totals.term2.max || 0) + parseFloat(totals.annual.max || 0);
      const allObt = parseFloat(totals.unitTest.obt || 0) + parseFloat(totals.term1.obt || 0) + parseFloat(totals.term2.obt || 0) + parseFloat(totals.annual.obt || 0);
      const aggPercentNum = allMax > 0 ? (allObt / allMax) * 100 : 0;
      totals.aggregatePercentage = allMax > 0 ? aggPercentNum.toFixed(2) + '%' : '';
      const computeGrade = (p) => {
        if (p > 85) return 'A+';
        if (p >= 76) return 'A';
        if (p >= 66) return 'B+';
        if (p >= 56) return 'B';
        if (p >= 51) return 'C+';
        if (p >= 46) return 'C';
        if (p >= 33) return 'D';
        return 'F';
      };
      totals.aggregateGrade = allMax > 0 ? computeGrade(aggPercentNum) : '';


      // --- Process Non-Scholastic Data ---
      const getNSData = (activityName) => {
        // Find activity by name (fuzzy)
        const activity = nsActivities?.find(a => a.activity_name.toLowerCase().includes(activityName.toLowerCase()));
        if (!activity) return null;
        
        // Find grade (Assuming Annual Exam usually, or check all)
        // For simplicity, taking the first matching entry or specifically Annual
        const entry = nsGrades?.find(g => g.activity_id === activity.id); // Maybe filter by exam type if multiple
        
        if (!entry) return { name: activity.activity_name, grade: '-' };
        return {
            name: activity.activity_name,
            grade: entry.grade || entry.numeric_value || '-'
        };
      };

      // Helper to group by category
      const getCategoryItems = (categoryName) => {
         const categoryId = nsActivities?.find(a => a.non_scholastic_categories?.category_name.includes(categoryName))?.category_id;
         if (!categoryId) return [];
         
         return nsActivities
            .filter(a => a.category_id === categoryId)
            .map(a => {
                const entry = nsGrades?.find(g => g.activity_id === a.id);
                return {
                    name: a.activity_name,
                    grade: entry ? (entry.grade || entry.numeric_value) : '-'
                };
            });
      };

      const coCurricular = getCategoryItems('CO-CURRICULAR');
      const personalAttributes = getCategoryItems('PERSONAL');
      
      // Health
      const getValue = (name) => {
         const item = nsActivities?.find(a => a.activity_name.toLowerCase().includes(name.toLowerCase()));
         if (!item) return '-';
         const entry = nsGrades?.find(g => g.activity_id === item.id);
         return entry ? (entry.numeric_value || entry.grade) : '-';
      };

      const health = {
        height: getValue('Height'),
        weight: getValue('Weight'),
        physical: getValue('Physical Development')
      };

      const attendance = {
        workingDays: getValue('Total Working Days'),
        attended: getValue('Total Days Attended'),
        percentage: getValue('Percentage of Attendance')
      };

      let photoBase64 = null;
      if (student.profile_image) {
          photoBase64 = await getBase64FromUrl(student.profile_image);
      }

      setPdfData({
        student: {
            name: student.name,
            fatherName: student.father_name,
            motherName: student.mother_name,
            dob: student.date_of_birth,
            class: classLevel,
            section: 'A', // Default
            scholarNo: student.scholar_number,
            rollNo: student.roll_number,
            photo: photoBase64 || student.profile_image
        },
        scholastic: processedScholastic,
        totals,
        nonScholastic: {
            coCurricular,
            personalAttributes,
            health,
            attendance
        },
        session: session,
        result: {
            division: '-',
            remark: '-',
            status: "Pass & Congratulations! Promoted to Class " + (student.next_class || "Next")
        }
      });

    } catch (error) {
      console.error('Error generating marksheet data:', error);
      setGeneratingPdf(null);
    }
  };

  const filteredStudents = students.filter(student => 
    student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.roll_number?.toLowerCase().includes(searchQuery.toLowerCase()) ||
    student.scholar_number?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      {/* Hidden Template for PDF Generation */}
      <div style={{ position: 'absolute', left: '-9999px', top: 0 }}>
        <MarksheetTemplate data={pdfData} ref={templateRef} />
      </div>

      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Generate Marksheets</h1>
          <p className="text-gray-500 mt-1">Select a class and generate student marksheets</p>
        </div>
      </div>

      <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-4 items-center">
        <div className="w-full sm:w-64">
          <label className="block text-sm font-medium text-gray-700 mb-1">Select Class</label>
          <select
            className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={selectedClass}
            onChange={(e) => setSelectedClass(e.target.value)}
          >
            <option value="">-- Select Class --</option>
            {classes.map((cls) => (
              <option key={cls.id} value={cls.id}>
                {cls.name}
              </option>
            ))}
          </select>
        </div>
        
        <div className="flex-1 w-full">
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Student</label>
            <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                <input
                    type="text"
                    placeholder="Search by name, roll no, or scholar no..."
                    className="w-full pl-10 p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                />
            </div>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
        </div>
      ) : selectedClass && filteredStudents.length > 0 ? (
        <div className="bg-white rounded-lg shadow-sm border border-gray-200 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Photo</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Roll No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Scholar No</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Father's Name</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="h-10 w-10 rounded-full overflow-hidden bg-gray-100">
                        {student.profile_image ? (
                          <img 
                            src={student.profile_image} 
                            alt={student.name}
                            className="h-full w-full object-cover"
                            crossOrigin="anonymous"
                            onError={(e) => { e.target.style.display = 'none'; }}
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-gray-400">
                            <span className="text-xs">No Img</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.roll_number || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.scholar_number || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{student.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{student.father_name || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex justify-end gap-2">
                        <button
                          onClick={() => prepareMarksheetData(student, 'preview')}
                          disabled={generatingPdf === student.id}
                          className="inline-flex items-center px-3 py-1.5 border border-gray-300 text-xs font-medium rounded-md shadow-sm text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                          title="Preview Marksheet"
                        >
                          <Eye className="h-3 w-3 mr-1" />
                          Preview
                        </button>
                        <button
                          onClick={() => prepareMarksheetData(student, 'pdf')}
                          disabled={generatingPdf === student.id}
                          className="inline-flex items-center px-3 py-1.5 border border-transparent text-xs font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                        >
                          {generatingPdf === student.id ? (
                            <>
                      <Loader2 className="h-3 w-3 animate-spin mr-1" />
                              Generating...
                            </>
                          ) : (
                            <>
                              <FileText className="h-3 w-3 mr-1" />
                              Generate
                            </>
                          )}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      ) : selectedClass ? (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-gray-100 mb-4">
            <Filter className="h-6 w-6 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">No students found</h3>
          <p className="mt-1 text-gray-500">No students found in this class matching your search.</p>
        </div>
      ) : (
        <div className="text-center py-12 bg-white rounded-lg border border-gray-200">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-blue-100 mb-4">
            <Search className="h-6 w-6 text-blue-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900">Select a Class</h3>
          <p className="mt-1 text-gray-500">Please select a class to view students and generate marksheets.</p>
        </div>
      )}

      {/* Preview Modal */}
      {showPreviewModal && pdfData && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-4xl max-h-[90vh] flex flex-col">
            <div className="flex justify-between items-center p-4 border-b">
              <h3 className="text-lg font-semibold text-gray-900">Marksheet Preview</h3>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                      generatePdfFromTemplate(true);
                  }}
                  className="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                >
                  <Download className="h-4 w-4 mr-1" />
                  Print / Save as PDF
                </button>
                <button
                  onClick={() => setShowPreviewModal(false)}
                  className="p-1 rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
            </div>
            <div className="flex-1 overflow-auto p-4 bg-gray-100 flex justify-center">
              <div className="bg-white shadow-lg" style={{ width: '210mm', minHeight: '297mm' }}>
                <MarksheetTemplate data={pdfData} ref={previewRef} />
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GenerateMarksheet;
