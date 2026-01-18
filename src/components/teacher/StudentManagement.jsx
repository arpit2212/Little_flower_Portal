import { useState, useEffect, useRef } from 'react';
import { useParams } from 'react-router-dom';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../../lib/supabase';
import { SESSIONS } from '../../lib/constants';
import { UserPlus, Edit2, Trash2, Search, X, Check, Upload, Download, FileSpreadsheet, Filter } from 'lucide-react';
import * as XLSX from 'xlsx';
import { logTeacherAction } from '../../lib/teacherLog';

const StudentManagement = () => {
  const { user } = useUser();
  const userRole = user?.publicMetadata?.role;
  const { classId: routeClassId } = useParams();
  const [myClasses, setMyClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadPreview, setUploadPreview] = useState([]);
  const [uploadErrors, setUploadErrors] = useState([]);
  const [selectedImage, setSelectedImage] = useState(null);
  const [bulkImages, setBulkImages] = useState([]);
  const [photoFolderFiles, setPhotoFolderFiles] = useState([]);
  const [photoFolderUploading, setPhotoFolderUploading] = useState(false);
  const [photoFolderSummary, setPhotoFolderSummary] = useState(null);
  const photoFolderInputRef = useRef(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [editingStudent, setEditingStudent] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    student_name: '',
    scholar_number: '',
    father_name: '',
    mother_name: '',
    date_of_birth: '',
    session: '',
    rte: '',
    date_of_admission: '',
    admission_date: new Date().toISOString().split('T')[0],
    caste: '',
    address: '',
    aadhar_number: '',
    mobile_no: '',
    parent_contact: '',
    other_no: '',
    pen_number: '',
    family_id: '',
    samagra_id: '',
    house: '',
    gender: '',
    appar_id: ''
  });

  const [showFilters, setShowFilters] = useState(false);
  const [activeFilters, setActiveFilters] = useState({
    caste: '',
    house: '',
    rte: ''
  });

  useEffect(() => {
    if (user) {
      fetchMyClasses();
    }
  }, [user]);

  useEffect(() => {
    if (selectedClass) {
      fetchStudents();
    }
  }, [selectedClass]);

  useEffect(() => {
    let filtered = students;

    // Apply Search
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(student =>
        (student.name || student.student_name || '').toLowerCase().includes(term) ||
        (student.roll_number || '').toLowerCase().includes(term) ||
        (student.scholar_number || '').toLowerCase().includes(term) ||
        (student.samagra_id || '').toLowerCase().includes(term) ||
        (student.father_name || '').toLowerCase().includes(term) ||
        (student.mother_name || '').toLowerCase().includes(term) ||
        (student.date_of_birth || '').toLowerCase().includes(term) ||
        (student.mobile_no || student.parent_contact || '').includes(term) ||
        (student.other_no || '').includes(term) ||
        (student.address || '').toLowerCase().includes(term) ||
        (student.aadhar_number || '').includes(term) ||
        (student.gender || '').toLowerCase().includes(term) ||
        (student.appar_id || '').toLowerCase().includes(term) ||
        (student.family_id || '').toLowerCase().includes(term) ||
        (student.admission_date || student.date_of_admission || '').toLowerCase().includes(term)
      );
    }

    // Apply Filters
    if (activeFilters.caste) {
      filtered = filtered.filter(student => (student.caste || '').toLowerCase() === activeFilters.caste.toLowerCase());
    }
    if (activeFilters.house) {
      filtered = filtered.filter(student => (student.house || '').toLowerCase() === activeFilters.house.toLowerCase());
    }
    if (activeFilters.rte) {
      filtered = filtered.filter(student => (student.rte || '').toLowerCase() === activeFilters.rte.toLowerCase());
    }

    setFilteredStudents(filtered);
  }, [searchTerm, activeFilters, students]);

  const fetchMyClasses = async () => {
    try {
      let classesQuery = supabase.from('classes').select('*');
      if (userRole !== 'principal') {
        classesQuery = classesQuery.eq('teacher_id', user.id);
      }
      const { data: classesData } = await classesQuery;

      setMyClasses(classesData || []);
      if (classesData && classesData.length > 0) {
        if (routeClassId && classesData.some(c => c.id === routeClassId)) {
          setSelectedClass(routeClassId);
        } else {
          setSelectedClass(classesData[0].id);
        }
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', selectedClass);
        // We will sort manually after fetching to ensure numeric sorting of roll numbers

      if (error) throw error;
      
      const sortedData = (data || []).sort((a, b) => {
        // Convert roll numbers to integers for proper numeric sorting
        const rollA = parseInt(a.roll_number) || 0;
        const rollB = parseInt(b.roll_number) || 0;
        return rollA - rollB;
      });

      setStudents(sortedData);
      setFilteredStudents(sortedData);
    } catch (error) {
      console.error('Error fetching students:', error);
      alert('Failed to load students. Please check your class selection and database connection.');
    }
  };

  const reorderStudents = async (classId) => {
    try {
      const { data: students, error } = await supabase
        .from('students')
        .select('id, name, student_name')
        .eq('class_id', classId);
      
      if (error) throw error;
      if (!students || students.length === 0) return;

      const sortedStudents = students.sort((a, b) => {
        const nameA = (a.student_name || a.name || '').toLowerCase();
        const nameB = (b.student_name || b.name || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });

      // Update students one by one to avoid unique constraint violations
      // We start from 1 and assign sequentially
      // To avoid unique constraint errors during swapping, we might need a more robust approach
      // but for now, since we are re-assigning, let's try direct assignment.
      // If 'roll_number' has a unique constraint, updating '2' to '1' when '1' exists will fail.
      
      // First, set all roll numbers to a temporary high value to clear the low numbers
      const tempUpdates = sortedStudents.map((student, index) => 
        supabase
          .from('students')
          .update({ roll_number: (90000 + index).toString() })
          .eq('id', student.id)
      );
      await Promise.all(tempUpdates);

      // Now assign the correct ordered roll numbers
      const finalUpdates = sortedStudents.map((student, index) => 
        supabase
          .from('students')
          .update({ roll_number: (index + 1).toString() })
          .eq('id', student.id)
      );

      await Promise.all(finalUpdates);
    } catch (error) {
      console.error('Error reordering students:', error);
    }
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setSelectedImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const uploadStudentImage = async (file) => {
    if (!file) return null;
    const fileExt = file.name.split('.').pop();
    const fileName = `${Date.now()}_${Math.random().toString(36).substring(7)}.${fileExt}`;
    const filePath = `${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from('student-images')
      .upload(filePath, file, { upsert: true, contentType: file.type || 'image/jpeg' });

    if (uploadError) {
      console.error('Error uploading image:', uploadError);
      throw uploadError;
    }

    const { data } = supabase.storage
      .from('student-images')
      .getPublicUrl(filePath);

    return data.publicUrl;
  };

  const handlePhotoFolderChange = (e) => {
    const files = Array.from(e.target.files || []);
    setPhotoFolderFiles(files);
  };

  const handleBulkPhotoUpload = async () => {
    if (!selectedClass) {
      alert('Please select a class first.');
      return;
    }

    if (photoFolderFiles.length === 0) {
      alert('Please select a folder with student photos first.');
      return;
    }

    setPhotoFolderUploading(true);
    setPhotoFolderSummary(null);

    try {
      const { data: classStudents, error: classStudentsError } = await supabase
        .from('students')
        .select('id, scholar_number')
        .eq('class_id', selectedClass);

      if (classStudentsError) {
        throw classStudentsError;
      }

      const studentsByScholar = new Map();
      (classStudents || []).forEach((s) => {
        if (s.scholar_number) {
          studentsByScholar.set(String(s.scholar_number).trim(), s.id);
        }
      });

      let updatedCount = 0;
      let skippedNoMatch = 0;
      let failedCount = 0;

      for (let i = 0; i < photoFolderFiles.length; i++) {
        const file = photoFolderFiles[i];
        const baseName = file.name.split('.').slice(0, -1).join('.') || file.name;
        const scholarKey = baseName.trim();

        const studentId = studentsByScholar.get(scholarKey);
        if (!studentId) {
          skippedNoMatch++;
          continue;
        }

        try {
          const imageUrl = await uploadStudentImage(file);
          if (!imageUrl) {
            failedCount++;
            continue;
          }

          const { error: updateError } = await supabase
            .from('students')
            .update({ profile_image: imageUrl })
            .eq('id', studentId);

          if (updateError) {
            failedCount++;
          } else {
            updatedCount++;
          }
        } catch (err) {
          console.error('Error updating photo for scholar:', scholarKey, err);
          failedCount++;
        }
      }

      setPhotoFolderSummary({
        totalFiles: photoFolderFiles.length,
        updatedCount,
        skippedNoMatch,
        failedCount
      });

      await logTeacherAction(user, {
        action: 'STUDENT_PHOTOS_BULK_UPDATED',
        entityType: 'student',
        entityId: selectedClass,
        description: `Bulk updated photos for class ${selectedClass}: total files ${photoFolderFiles.length}, updated ${updatedCount}, no match ${skippedNoMatch}, failed ${failedCount}`
      });

      alert(
        `Photo upload completed:\n` +
        `- Total files: ${photoFolderFiles.length}\n` +
        `- Updated photos: ${updatedCount}\n` +
        `- No matching scholar number: ${skippedNoMatch}\n` +
        `- Failed updates: ${failedCount}`
      );

      await fetchStudents();
    } catch (error) {
      console.error('Error in bulk photo upload:', error);
      alert('Error uploading photos. Please try again.');
    } finally {
      setPhotoFolderUploading(false);
    }
  };

  useEffect(() => {
    if (photoFolderInputRef.current) {
      photoFolderInputRef.current.setAttribute('webkitdirectory', '');
      photoFolderInputRef.current.setAttribute('directory', '');
      photoFolderInputRef.current.setAttribute('multiple', '');
      photoFolderInputRef.current.setAttribute('accept', 'image/*');
    }
  }, [photoFolderInputRef]);

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const selectedClassObj = myClasses.find((c) => c.id === selectedClass);
      const classSession = selectedClassObj?.session || null;

      let imageUrl = formData.profile_image;
      if (selectedImage) {
        imageUrl = await uploadStudentImage(selectedImage);
      }

      if (editingStudent) {
        const { error } = await supabase
          .from('students')
          .update({
            name: formData.name,
            student_name: formData.student_name || formData.name,
            // roll_number is auto-generated
            scholar_number: formData.scholar_number || null,
            father_name: formData.father_name || null,
            mother_name: formData.mother_name || null,
            date_of_birth: formData.date_of_birth || null,
            session: classSession,
            rte: formData.rte || null,
            date_of_admission: formData.date_of_admission || formData.admission_date || null,
            admission_date: formData.admission_date || null,
            caste: formData.caste || null,
            address: formData.address || null,
            aadhar_number: formData.aadhar_number || null,
            mobile_no: formData.mobile_no || formData.parent_contact || null,
            parent_contact: formData.parent_contact || formData.mobile_no || null,
            other_no: formData.other_no || null,
            pen_number: formData.pen_number || null,
            family_id: formData.family_id || null,
            samagra_id: formData.samagra_id || null,
            house: formData.house || null,
            gender: formData.gender || null,
            appar_id: formData.appar_id || null,
            profile_image: imageUrl || null
          })
          .eq('id', editingStudent.id);

        if (error) throw error;
      } else {
        // Generate a temporary unique roll number
        // We use a timestamp-based approach to ensure uniqueness during insertion
        // Before reordering takes place
        const tempRollNumber = `TMP${Date.now()}`;

        const { error } = await supabase
          .from('students')
          .insert([{
            name: formData.name,
            student_name: formData.student_name || formData.name,
            roll_number: tempRollNumber,
            scholar_number: formData.scholar_number || null,
            father_name: formData.father_name || null,
            mother_name: formData.mother_name || null,
            date_of_birth: formData.date_of_birth || null,
            session: classSession,
            rte: formData.rte || null,
            date_of_admission: formData.date_of_admission || formData.admission_date || null,
            admission_date: formData.admission_date || null,
            caste: formData.caste || null,
            address: formData.address || null,
            aadhar_number: formData.aadhar_number || null,
            mobile_no: formData.mobile_no || formData.parent_contact || null,
            parent_contact: formData.parent_contact || formData.mobile_no || null,
            other_no: formData.other_no || null,
            pen_number: formData.pen_number || null,
            family_id: formData.family_id || null,
            samagra_id: formData.samagra_id || null,
            house: formData.house || null,
            gender: formData.gender || null,
            appar_id: formData.appar_id || null,
            class_id: selectedClass,
            profile_image: imageUrl || null
          }]);

        if (error) throw error;
      }

      await reorderStudents(selectedClass);

      if (editingStudent) {
        await logTeacherAction(user, {
          action: 'STUDENT_UPDATED',
          entityType: 'student',
          entityId: editingStudent.id,
          description: `Updated student ${formData.name || formData.student_name || ''} in class ${selectedClass}`
        });
      } else {
        await logTeacherAction(user, {
          action: 'STUDENT_CREATED',
          entityType: 'student',
          entityId: null,
          description: `Created student ${formData.name || formData.student_name || ''} in class ${selectedClass}`
        });
      }

      setFormData({
        name: '',
        student_name: '',
        scholar_number: '',
        father_name: '',
        mother_name: '',
        date_of_birth: '',
        session: '',
        rte: '',
        date_of_admission: '',
        admission_date: new Date().toISOString().split('T')[0],
        caste: '',
        address: '',
        aadhar_number: '',
        mobile_no: '',
        parent_contact: '',
        other_no: '',
        pen_number: '',
        family_id: '',
        samagra_id: '',
        house: '',
        gender: '',
        appar_id: '',
        profile_image: ''
      });
      setSelectedImage(null);
      setImagePreview(null);
      setShowForm(false);
      setEditingStudent(null);
      fetchStudents();
    } catch (error) {
      console.error('Error saving student:', error);
      if (error.code === '23505') {
        alert('A student with this roll number already exists in this class.');
      } else {
        alert('Error saving student. Please try again.');
      }
    }
  };

  const handleEdit = (student) => {
    setEditingStudent(student);
    setFormData({
      name: student.name || student.student_name || '',
      student_name: student.student_name || student.name || '',
      scholar_number: student.scholar_number || '',
      father_name: student.father_name || '',
      mother_name: student.mother_name || '',
      date_of_birth: student.date_of_birth || '',
      session: student.session || '',
      rte: student.rte || '',
      date_of_admission: student.date_of_admission || '',
      admission_date: student.admission_date || new Date().toISOString().split('T')[0],
      caste: student.caste || '',
      address: student.address || '',
      aadhar_number: student.aadhar_number || '',
      mobile_no: student.mobile_no || student.parent_contact || '',
      parent_contact: student.parent_contact || student.mobile_no || '',
      other_no: student.other_no || '',
      pen_number: student.pen_number || '',
      family_id: student.family_id || '',
      samagra_id: student.samagra_id || '',
      house: student.house || '',
      gender: student.gender || '',
      appar_id: student.appar_id || '',
      profile_image: student.profile_image || ''
    });
    setImagePreview(student.profile_image || null);
    setShowForm(true);
  };

  const handleDelete = async (student) => {
    if (!confirm('Are you sure you want to delete this student? All attendance records will be deleted.')) {
      return;
    }

    try {
      const { error } = await supabase
        .from('students')
        .delete()
        .eq('id', student.id);

      if (error) throw error;
      
      await reorderStudents(selectedClass);

      await logTeacherAction(user, {
        action: 'STUDENT_DELETED',
        entityType: 'student',
        entityId: student.id,
        description: `Deleted student ${student.name || student.student_name || ''} from class ${selectedClass}`
      });
      
      fetchStudents();
    } catch (error) {
      console.error('Error deleting student:', error);
      alert('Error deleting student. Please try again.');
    }
  };

  const downloadTemplate = () => {
    const templateData = [
      {
        'Scholar Number': 'SCH001',
        'Student Name': 'John Doe',
        'Samagra ID': 'SAM001',
        'Date of Birth': '2010-01-15',
        'Session': '2025-2026',
        'Father Name': 'Father Doe',
        'Mother Name': 'Mother Doe',
        'Mobile Number': '9876543210',
        'Other Contact': '9876543211',
        'Family ID': 'FAM001',
        'Address': '123 Main Street, City',
        'Aadhar Number': '1234 5678 9012',
        'Gender': 'girl',
        'Caste': 'General',
        'RTE': 'No',
        'PEN Number': 'PEN001',
        'Appar ID': 'APP001',
        'House': 'Red',
        'Date of Admission': '2025-04-01',
        'Profile Image URL': 'https://example.com/image.jpg'
      },
      {
        'Scholar Number': 'SCH002',
        'Student Name': 'Jane Smith',
        'Samagra ID': 'SAM002',
        'Date of Birth': '2010-03-20',
        'Session': '2025-2026',
        'Father Name': 'Father Smith',
        'Mother Name': 'Mother Smith',
        'Mobile Number': '9876543212',
        'Other Contact': '',
        'Family ID': 'FAM002',
        'Address': '456 Oak Avenue, City',
        'Aadhar Number': '2345 6789 0123',
        'Gender': 'boy',
        'Caste': 'OBC',
        'RTE': 'Yes',
        'PEN Number': 'PEN002',
        'Appar ID': 'APP002',
        'House': 'Blue',
        'Date of Admission': '2025-04-01',
        'Profile Image URL': ''
      }
    ];

    const ws = XLSX.utils.json_to_sheet(templateData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Students');
    
    // Set column widths
    const colWidths = [
      { wch: 15 }, // Scholar Number
      { wch: 20 }, // Student Name
      { wch: 15 }, // Samagra ID
      { wch: 15 }, // Date of Birth
      { wch: 12 }, // Session
      { wch: 18 }, // Father Name
      { wch: 18 }, // Mother Name
      { wch: 15 }, // Mobile Number
      { wch: 15 }, // Other Contact
      { wch: 12 }, // Family ID
      { wch: 30 }, // Address
      { wch: 18 }, // Aadhar Number
      { wch: 10 }, // Gender
      { wch: 12 }, // Caste
      { wch: 8 },  // RTE
      { wch: 12 }, // PEN Number
      { wch: 15 }, // Appar ID
      { wch: 10 }, // House
      { wch: 18 }  // Date of Admission
    ];
    ws['!cols'] = colWidths;

    XLSX.writeFile(wb, 'Student_Import_Template.xlsx');
  };

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      alert('Please upload a valid Excel file (.xlsx or .xls)');
      return;
    }

    const reader = new FileReader();

    reader.onload = (event) => {
      try {
        const data = new Uint8Array(event.target.result);
        const workbook = XLSX.read(data, { type: 'array' });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        if (jsonData.length === 0) {
          alert('The Excel file is empty. Please check your file.');
          return;
        }

        const mappedData = [];
        const errors = [];

        const validCastes = ['General', 'Gen', 'OBC', 'SC', 'ST', 'Other', 'NA', 'General Category', 'Other Backward Class', 'Scheduled Caste', 'Scheduled Tribe'];
        
        const validRTE = ['Yes', 'No', 'yes', 'no', 'YES', 'NO', 'RTE', 'rte'];
        
        const validGender = ['girl', 'boy', 'others'];

        const normalizeDate = (value) => {
          if (!value) return null;
          if (value instanceof Date && !Number.isNaN(value.getTime())) {
            const year = value.getFullYear();
            const month = String(value.getMonth() + 1).padStart(2, '0');
            const day = String(value.getDate()).padStart(2, '0');
            return `${year}-${month}-${day}`;
          }
          if (typeof value === 'number') {
            const excelEpoch = new Date(Date.UTC(1899, 11, 30));
            const date = new Date(excelEpoch.getTime() + value * 24 * 60 * 60 * 1000);
            if (!Number.isNaN(date.getTime())) {
              const year = date.getFullYear();
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const day = String(date.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            }
          }
          if (typeof value === 'string') {
            const trimmed = value.trim();
            if (trimmed === '') return null;
            const dotMatch = trimmed.match(/^(\d{2})\.(\d{2})\.(\d{4})$/);
            if (dotMatch) {
              const day = dotMatch[1];
              const month = dotMatch[2];
              const year = dotMatch[3];
              return `${year}-${month}-${day}`;
            }
            const dashMatch = trimmed.match(/^(\d{2})-(\d{2})-(\d{4})$/);
            if (dashMatch) {
              const day = dashMatch[1];
              const month = dashMatch[2];
              const year = dashMatch[3];
              return `${year}-${month}-${day}`;
            }
            const slashMatch = trimmed.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
            if (slashMatch) {
              const day = slashMatch[1];
              const month = slashMatch[2];
              const year = slashMatch[3];
              return `${year}-${month}-${day}`;
            }
            if (/^\d{4}-\d{2}-\d{2}$/.test(trimmed)) {
              return trimmed;
            }
            const parsed = new Date(trimmed);
            if (!Number.isNaN(parsed.getTime())) {
              const year = parsed.getFullYear();
              const month = String(parsed.getMonth() + 1).padStart(2, '0');
              const day = String(parsed.getDate()).padStart(2, '0');
              return `${year}-${month}-${day}`;
            }
          }
          return null;
        };

        jsonData.forEach((row, index) => {
          const rowNum = index + 2; // +2 because index is 0-based and we have header row
          const errorsForRow = [];

          if (!row['Student Name'] && !row['student_name']) {
            errorsForRow.push(`Row ${rowNum}: Student Name is required`);
          }

          const casteValue = row['Caste'] || row['caste'] || '';
          if (casteValue && casteValue.trim() !== '') {
            // Normalize caste value for comparison
            const normalizedCaste = casteValue.trim();
            const isValidCaste = validCastes.some(valid => 
              valid.toLowerCase() === normalizedCaste.toLowerCase() ||
              normalizedCaste.toLowerCase().includes(valid.toLowerCase())
            );
            
            if (!isValidCaste) {
              errorsForRow.push(`Row ${rowNum}: Invalid caste value "${casteValue}". Valid values: General, OBC, SC, ST, Other`);
            }
          }

          const rteValue = row['RTE'] || row['rte'] || '';
          if (rteValue && rteValue.trim() !== '') {
            const normalizedRTE = rteValue.trim();
            if (!validRTE.includes(normalizedRTE) && !validRTE.some(v => v.toLowerCase() === normalizedRTE.toLowerCase())) {
              errorsForRow.push(`Row ${rowNum}: Invalid RTE value "${rteValue}". Valid values: Yes, No`);
            }
          }

          const genderValue = row['Gender'] || row['gender'] || '';
          if (genderValue && genderValue.trim() !== '') {
            const normalizedGender = genderValue.trim().toLowerCase();
            if (!validGender.includes(normalizedGender)) {
              errorsForRow.push(`Row ${rowNum}: Invalid gender value "${genderValue}". Valid values: girl, boy, others`);
            }
          }

          if (errorsForRow.length > 0) {
            errors.push(...errorsForRow);
          } else {
            let normalizedCasteValue = 'NA';
            if (casteValue && casteValue.trim() !== '') {
              const normalizedCaste = casteValue.trim();
              if (normalizedCaste.toLowerCase().includes('general') || normalizedCaste.toLowerCase() === 'gen') {
                normalizedCasteValue = 'Gen';
              } else if (normalizedCaste.toLowerCase().includes('obc') || normalizedCaste.toLowerCase().includes('other backward')) {
                normalizedCasteValue = 'OBC';
              } else if (normalizedCaste.toLowerCase().includes('sc') || normalizedCaste.toLowerCase().includes('scheduled caste')) {
                normalizedCasteValue = 'SC';
              } else if (normalizedCaste.toLowerCase().includes('st') || normalizedCaste.toLowerCase().includes('scheduled tribe')) {
                normalizedCasteValue = 'ST';
              } else if (normalizedCaste.toLowerCase() === 'other' || normalizedCaste.toLowerCase() === 'na') {
                normalizedCasteValue = 'NA';
              } else {
                // If it matches one of the DB values exactly (case insensitive)
                if (['Gen', 'OBC', 'SC', 'ST', 'NA'].includes(normalizedCaste)) {
                    normalizedCasteValue = normalizedCaste;
                } else {
                    normalizedCasteValue = 'NA';
                }
              }
            }

            // Normalize RTE value
            let normalizedRTEValue = 'no';
            if (rteValue && rteValue.trim() !== '') {
              const val = rteValue.trim().toLowerCase();
              if (val === 'yes' || val === 'rte') {
                normalizedRTEValue = 'RTE';
              } else if (val === 'no') {
                normalizedRTEValue = 'no';
              }
            }
            
            let normalizedGenderValue = '';
            if (genderValue && genderValue.trim() !== '') {
              const val = genderValue.trim().toLowerCase();
              if (validGender.includes(val)) {
                normalizedGenderValue = val;
              }
            }

            const studentData = {
              name: row['Student Name'] || row['student_name'] || '',
              student_name: row['Student Name'] || row['student_name'] || '',
              roll_number: '0',
              scholar_number: row['Scholar Number'] || row['scholar_number'] || null,
              samagra_id: row['Samagra ID'] || row['samagra_id'] || null,
              date_of_birth: normalizeDate(row['Date of Birth'] || row['date_of_birth']),
              session: row['Session'] || row['session'] || null,
              father_name: row['Father Name'] || row['father_name'] || null,
              mother_name: row['Mother Name'] || row['mother_name'] || null,
              mobile_no: row['Mobile Number'] || row['mobile_number'] || row['mobile_no'] || null,
              parent_contact: row['Mobile Number'] || row['mobile_number'] || row['mobile_no'] || null,
              other_no: row['Other Contact'] || row['other_contact'] || row['other_no'] || null,
              family_id: row['Family ID'] || row['family_id'] || null,
              address: row['Address'] || row['address'] || null,
              aadhar_number: row['Aadhar Number'] || row['aadhar_number'] || null,
              caste: normalizedCasteValue,
              rte: normalizedRTEValue,
              pen_number: row['PEN Number'] || row['pen_number'] || null,
              appar_id: row['Appar ID'] || row['appar_id'] || null,
              gender: normalizedGenderValue || null,
              house: row['House'] || row['house'] || null,
              date_of_admission: normalizeDate(row['Date of Admission'] || row['date_of_admission']),
              admission_date: normalizeDate(row['Date of Admission'] || row['date_of_admission']),
              class_id: selectedClass,
              profile_image: row['Profile Image URL'] || row['profile_image_url'] || row['Profile Image'] || row['profile_image'] || null
            };

            mappedData.push(studentData);
          }
        });

        setUploadPreview(mappedData);
        setUploadErrors(errors);

        if (errors.length > 0) {
          alert(`Found ${errors.length} error(s) in the Excel file. Please check the preview below.`);
        }
      } catch (error) {
        console.error('Error reading Excel file:', error);
        alert('Error reading Excel file. Please make sure the file is valid.');
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleBulkImport = async () => {
    if (!selectedClass) {
      alert('Please select a class first.');
      return;
    }

    if (uploadPreview.length === 0) {
      alert('No valid data to import.');
      return;
    }

    if (uploadErrors.length > 0) {
      if (!confirm(`There are ${uploadErrors.length} error(s) in the data. Do you want to import only valid records?`)) {
        return;
      }
    }

    setUploading(true);

    try {
      // Insert students one by one to get detailed error messages
      let successCount = 0;
      let errorCount = 0;
      const errors = [];

      for (let i = 0; i < uploadPreview.length; i++) {
        const student = uploadPreview[i];
        const tempRollNumber = `TMP${Date.now()}_${i}`;
        student.roll_number = tempRollNumber;
        
        // Check for image upload if profile_image is a filename
        if (student.profile_image && !student.profile_image.startsWith('http') && bulkImages.length > 0) {
          const matchingFile = bulkImages.find(file => file.name === student.profile_image);
          if (matchingFile) {
            try {
              const imageUrl = await uploadStudentImage(matchingFile);
              if (imageUrl) {
                student.profile_image = imageUrl;
              }
            } catch (imgError) {
              console.warn(`Failed to upload image for ${student.name}:`, imgError);
              // Continue without image or log warning? 
              // We'll just continue with original value (which is filename, might be useful for debugging)
            }
          }
        }

        const { error } = await supabase
          .from('students')
          .insert([student]);

        if (error) {
          errorCount++;
          // Extract more detailed error message
          let errorMsg = error.message;
          if (error.message.includes('caste_check')) {
            errorMsg = `Row ${i + 2}: Invalid caste value "${student.caste}". Valid values: Gen, OBC, SC, ST, NA`;
          } else if (error.message.includes('rte')) {
            errorMsg = `Row ${i + 2}: Invalid RTE value "${student.rte}". Valid values: RTE, no`;
          } else if (error.message.includes('violates check constraint')) {
            errorMsg = `Row ${i + 2}: ${error.message}`;
          }
          errors.push(errorMsg);
        } else {
          successCount++;
        }
      }

      if (errorCount > 0) {
        const errorSummary = errors.slice(0, 10).join('\n');
        const moreErrors = errors.length > 10 ? `\n... and ${errors.length - 10} more error(s)` : '';
        alert(`Import completed with errors:\n- Successfully imported: ${successCount} students\n- Failed: ${errorCount} students\n\nErrors:\n${errorSummary}${moreErrors}`);
      } else {
        alert(`Successfully imported ${successCount} student(s)!`);
      }

      await logTeacherAction(user, {
        action: 'STUDENTS_BULK_IMPORTED',
        entityType: 'student',
        entityId: selectedClass,
        description: `Bulk imported ${successCount} students into class ${selectedClass} with ${errorCount} failures`
      });

      // Reorder students after import
      await reorderStudents(selectedClass);

      // Reset upload state
      setUploadPreview([]);
      setUploadErrors([]);
      setBulkImages([]);
      setShowUpload(false);
      
      // Refresh student list
      fetchStudents();
    } catch (error) {
      console.error('Error importing students:', error);
      alert('Error importing students. Please try again.');
    } finally {
      setUploading(false);
    }
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
          <UserPlus className="w-8 h-8 text-indigo-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Assigned</h3>
        <p className="text-gray-600 text-sm sm:text-base">Please contact the principal to get classes assigned to you.</p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Manage Students</h2>
        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <button
            onClick={downloadTemplate}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md hover:shadow-lg w-full sm:w-auto"
          >
            <Download className="w-5 h-5" />
            <span className="font-medium">Download Template</span>
          </button>
          <button
            onClick={() => {
            setShowUpload(!showUpload);
            setShowForm(false);
            setUploadPreview([]);
            setUploadErrors([]);
            }}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors shadow-md hover:shadow-lg w-full sm:w-auto"
          >
            {showUpload ? <X className="w-5 h-5" /> : <Upload className="w-5 h-5" />}
            <span className="font-medium">{showUpload ? 'Cancel' : 'Upload Excel'}</span>
          </button>
          <button
            onClick={() => {
              setShowForm(!showForm);
              setShowUpload(false);
              setEditingStudent(null);
              setSelectedImage(null);
              setImagePreview(null);
              setFormData({
                name: '',
                student_name: '',
                scholar_number: '',
                father_name: '',
                mother_name: '',
                date_of_birth: '',
                session: '',
                rte: '',
                date_of_admission: '',
                admission_date: new Date().toISOString().split('T')[0],
                caste: '',
                address: '',
                aadhar_number: '',
                mobile_no: '',
                parent_contact: '',
                other_no: '',
                pen_number: '',
                family_id: '',
                student_id_number: '',
                house: ''
              });
            }}
            className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md hover:shadow-lg w-full sm:w-auto"
          >
            {showForm ? <X className="w-5 h-5" /> : <UserPlus className="w-5 h-5" />}
            <span className="font-medium">{showForm ? 'Cancel' : 'Add Student'}</span>
          </button>
        </div>
      </div>

      {/* Class Selector */}
      <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 border border-gray-100">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Select Class
        </label>
        <select
          value={selectedClass}
          onChange={(e) => setSelectedClass(e.target.value)}
          className="w-full md:w-64 px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800"
        >
          {myClasses.map((cls) => (
            <option key={cls.id} value={cls.id}>
              {cls.name} {cls.session && `- ${cls.session}`}
            </option>
          ))}
        </select>
      </div>

      {/* Excel Upload Section */}
      {showUpload && (
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
          <div className="flex items-center space-x-2 mb-4">
            <FileSpreadsheet className="w-6 h-6 text-blue-600" />
            <h3 className="text-lg font-semibold text-gray-800">Upload Students from Excel</h3>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Select Excel File (.xlsx or .xls)
              </label>
              <div className="flex flex-col space-y-3 sm:flex-row sm:items-center sm:space-y-0 sm:space-x-4">
                <input
                  type="file"
                  accept=".xlsx,.xls"
                  onChange={handleFileUpload}
                  className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                />
                <button
                  onClick={downloadTemplate}
                  className="flex items-center justify-center space-x-2 px-4 py-2 text-sm bg-green-50 text-green-700 rounded-lg hover:bg-green-100 transition-colors w-full sm:w-auto"
                >
                  <Download className="w-4 h-4" />
                  <span>Template</span>
                </button>
              </div>
              <p className="mt-2 text-xs text-gray-500">
                Download the template file, fill in student information, and upload it here.
              </p>
              <div className="mt-3 bg-yellow-50 border border-yellow-200 rounded-lg p-3">
                <p className="text-xs text-yellow-800 font-semibold mb-1">Important Notes:</p>
                <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
                  <li><strong>Caste:</strong> Must be one of: General, OBC, SC, ST, or Other</li>
                  <li><strong>RTE:</strong> Must be either "Yes" or "No"</li>
                  <li><strong>Student Name</strong> is a required field</li>
                  <li><strong>Roll Number</strong> will be auto-generated alphabetically</li>
                </ul>
              </div>
            </div>

            <div className="border-t border-gray-200 pt-4">
              <h4 className="text-sm font-semibold text-gray-800 mb-2">Bulk Update Photos by Scholar Number</h4>
              <p className="text-xs text-gray-600 mb-2">
                Select a folder of images. Each image file name must be the scholar number of the student (for example: <span className="font-mono">SCH001.jpg</span>).
              </p>
              <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                <input
                  type="file"
                  multiple
                  onChange={handlePhotoFolderChange}
                  className="block w-full text-xs text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-xs file:font-semibold file:bg-purple-50 file:text-purple-700 hover:file:bg-purple-100"
                  ref={photoFolderInputRef}
                />
                <button
                  type="button"
                  onClick={handleBulkPhotoUpload}
                  disabled={photoFolderUploading || photoFolderFiles.length === 0 || !selectedClass}
                  className="w-full sm:w-auto flex items-center justify-center space-x-2 px-4 py-2.5 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed text-xs sm:text-sm"
                >
                  {photoFolderUploading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Uploading Photos...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4" />
                      <span>Upload Student Photo</span>
                    </>
                  )}
                </button>
              </div>
              {photoFolderSummary && (
                <div className="mt-2 text-[11px] text-gray-600">
                  <p>Total files: {photoFolderSummary.totalFiles}</p>
                  <p>Updated photos: {photoFolderSummary.updatedCount}</p>
                  <p>No matching scholar number: {photoFolderSummary.skippedNoMatch}</p>
                  <p>Failed updates: {photoFolderSummary.failedCount}</p>
                </div>
              )}
            </div>

            {uploadErrors.length > 0 && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <h4 className="text-sm font-semibold text-red-800 mb-2">Errors Found ({uploadErrors.length}):</h4>
                <ul className="text-xs text-red-700 space-y-1 max-h-32 overflow-y-auto">
                  {uploadErrors.map((error, index) => (
                    <li key={index}>• {error}</li>
                  ))}
                </ul>
              </div>
            )}

            {uploadPreview.length > 0 && (
              <div className="space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <h4 className="text-sm font-semibold text-blue-800 mb-2">
                    Preview: {uploadPreview.length} student(s) ready to import
                  </h4>
                  <div className="overflow-x-auto max-h-64 overflow-y-auto">
                    <table className="min-w-full text-xs">
                      <thead className="bg-blue-100">
                        <tr>
                          <th className="px-2 py-1 text-left">Name</th>
                          <th className="px-2 py-1 text-left">Scholar No.</th>
                          <th className="px-2 py-1 text-left">Samagra ID</th>
                          <th className="px-2 py-1 text-left">DOB</th>
                          <th className="px-2 py-1 text-left">Session</th>
                          <th className="px-2 py-1 text-left">Father Name</th>
                          <th className="px-2 py-1 text-left">Mother Name</th>
                          <th className="px-2 py-1 text-left">Mobile</th>
                          <th className="px-2 py-1 text-left">Other Contact</th>
                          <th className="px-2 py-1 text-left">Family ID</th>
                          <th className="px-2 py-1 text-left">Address</th>
                          <th className="px-2 py-1 text-left">Aadhar</th>
                          <th className="px-2 py-1 text-left">Gender</th>
                          <th className="px-2 py-1 text-left">Caste</th>
                          <th className="px-2 py-1 text-left">RTE</th>
                          <th className="px-2 py-1 text-left">PEN</th>
                          <th className="px-2 py-1 text-left">Appar ID</th>
                          <th className="px-2 py-1 text-left">House</th>
                          <th className="px-2 py-1 text-left">Admission Date</th>
                          <th className="px-2 py-1 text-left">Image</th>
                        </tr>
                      </thead>
                      <tbody className="bg-white divide-y divide-gray-200">
                        {uploadPreview.map((student, index) => (
                          <tr key={index}>
                            <td className="px-2 py-1">{student.name || student.student_name}</td>
                            <td className="px-2 py-1">{student.scholar_number || '-'}</td>
                            <td className="px-2 py-1">{student.samagra_id || '-'}</td>
                            <td className="px-2 py-1">{student.date_of_birth || '-'}</td>
                            <td className="px-2 py-1">{student.session || '-'}</td>
                            <td className="px-2 py-1">{student.father_name || '-'}</td>
                            <td className="px-2 py-1">{student.mother_name || '-'}</td>
                            <td className="px-2 py-1">{student.mobile_no || '-'}</td>
                            <td className="px-2 py-1">{student.other_no || '-'}</td>
                            <td className="px-2 py-1">{student.family_id || '-'}</td>
                            <td className="px-2 py-1">{student.address || '-'}</td>
                            <td className="px-2 py-1">{student.aadhar_number || '-'}</td>
                            <td className="px-2 py-1">{student.gender || '-'}</td>
                            <td className="px-2 py-1">{student.caste || '-'}</td>
                            <td className="px-2 py-1">{student.rte || '-'}</td>
                            <td className="px-2 py-1">{student.pen_number || '-'}</td>
                            <td className="px-2 py-1">{student.appar_id || '-'}</td>
                            <td className="px-2 py-1">{student.house || '-'}</td>
                            <td className="px-2 py-1">{student.admission_date || '-'}</td>
                            <td className="px-2 py-1">
                              {student.profile_image ? (
                                student.profile_image.startsWith('http') ? 
                                  <span className="text-green-600">URL</span> : 
                                  (bulkImages.some(f => f.name === student.profile_image) ? 
                                    <span className="text-blue-600 flex items-center gap-1"><Check className="w-3 h-3" /> Ready</span> : 
                                    <span className="text-orange-500">Missing File</span>
                                  )
                              ) : '-'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>

                <button
                  onClick={handleBulkImport}
                  disabled={uploading || !selectedClass}
                  className="w-full flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed shadow-md font-medium"
                >
                  {uploading ? (
                    <>
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      <span>Importing...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-5 h-5" />
                      <span>Import {uploadPreview.length} Student(s)</span>
                    </>
                  )}
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-white rounded-xl shadow-md p-4 sm:p-6 border border-gray-100">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">
            {editingStudent ? 'Edit Student' : 'Add New Student'}
          </h3>
          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Student Image */}
            <div className="flex flex-col items-center justify-center mb-6">
              <div className="relative w-32 h-32 mb-4">
                {imagePreview ? (
                  <img
                    src={imagePreview}
                    alt="Student Preview"
                    className="w-full h-full object-cover rounded-full border-4 border-indigo-100 shadow-md"
                  />
                ) : (
                  <div className="w-full h-full bg-gray-100 rounded-full flex items-center justify-center border-4 border-indigo-50 text-gray-400">
                    <UserPlus className="w-12 h-12" />
                  </div>
                )}
                <label
                  htmlFor="student-image"
                  className="absolute bottom-0 right-0 bg-indigo-600 text-white p-2 rounded-full cursor-pointer hover:bg-indigo-700 transition-colors shadow-sm"
                >
                  <Upload className="w-4 h-4" />
                </label>
                <input
                  type="file"
                  id="student-image"
                  accept="image/*"
                  onChange={handleImageChange}
                  className="hidden"
                />
              </div>
              <p className="text-sm text-gray-500">Upload Student Photo</p>
            </div>

            {/* Basic Information */}
            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">Basic Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Scholar Number
                  </label>
                  <input
                    type="text"
                    value={formData.scholar_number}
                    onChange={(e) => setFormData({ ...formData, scholar_number: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Student Name *
                  </label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value, student_name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Samagra ID
                  </label>
                  <input
                    type="text"
                    value={formData.samagra_id}
                    onChange={(e) => setFormData({ ...formData, samagra_id: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.date_of_birth}
                    onChange={(e) => setFormData({ ...formData, date_of_birth: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800"
                  />
                </div>

                
              </div>
            </div>

            {/* Family Information */}
            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">Family Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Father's Name
                  </label>
                  <input
                    type="text"
                    value={formData.father_name}
                    onChange={(e) => setFormData({ ...formData, father_name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mother's Name
                  </label>
                  <input
                    type="text"
                    value={formData.mother_name}
                    onChange={(e) => setFormData({ ...formData, mother_name: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Mobile Number
                  </label>
                  <input
                    type="tel"
                    value={formData.mobile_no}
                    onChange={(e) => setFormData({ ...formData, mobile_no: e.target.value, parent_contact: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Other Contact Number
                  </label>
                  <input
                    type="tel"
                    value={formData.other_no}
                    onChange={(e) => setFormData({ ...formData, other_no: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Family ID
                  </label>
                  <input
                    type="text"
                    value={formData.family_id}
                    onChange={(e) => setFormData({ ...formData, family_id: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800"
                  />
                </div>
              </div>
            </div>

            {/* Additional Information */}
            <div>
              <h4 className="text-md font-semibold text-gray-800 mb-3 pb-2 border-b border-gray-200">Additional Information</h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    rows="3"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Aadhar Number
                  </label>
                  <input
                    type="text"
                    value={formData.aadhar_number}
                    onChange={(e) => setFormData({ ...formData, aadhar_number: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Gender
                  </label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800"
                  >
                    <option value="">Select Gender</option>
                    <option value="girl">Girl</option>
                    <option value="boy">Boy</option>
                    <option value="others">Others</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Caste
                  </label>
                  <select
                    value={formData.caste}
                    onChange={(e) => setFormData({ ...formData, caste: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800"
                  >
                    <option value="">Select Caste</option>
                    <option value="Gen">General</option>
                    <option value="OBC">OBC</option>
                    <option value="SC">SC</option>
                    <option value="ST">ST</option>
                    <option value="NA">NA (Other)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    RTE
                  </label>
                  <select
                    value={formData.rte}
                    onChange={(e) => setFormData({ ...formData, rte: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800"
                  >
                    <option value="">Select</option>
                    <option value="RTE">Yes</option>
                    <option value="no">No</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    PEN Number
                  </label>
                  <input
                    type="text"
                    value={formData.pen_number}
                    onChange={(e) => setFormData({ ...formData, pen_number: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Appar ID
                  </label>
                  <input
                    type="text"
                    value={formData.appar_id}
                    onChange={(e) => setFormData({ ...formData, appar_id: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    House
                  </label>
                  <input
                    type="text"
                    value={formData.house}
                    onChange={(e) => setFormData({ ...formData, house: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Admission
                  </label>
                  <input
                    type="date"
                    value={formData.admission_date}
                    onChange={(e) => setFormData({ ...formData, admission_date: e.target.value, date_of_admission: e.target.value })}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800"
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row justify-end gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setEditingStudent(null);
                  setSelectedImage(null);
                  setImagePreview(null);
                }}
                className="px-4 py-2.5 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors font-medium w-full sm:w-auto"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md font-medium w-full sm:w-auto"
              >
                <Check className="w-5 h-5" />
                <span>{editingStudent ? 'Update Student' : 'Add Student'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Search and Filter */}
      <div className="bg-white rounded-xl shadow-md p-4 border border-gray-100 mb-6">
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
            <input
              type="text"
              placeholder="Search by name, father, mother, DOB, mobile, address..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800"
            />
          </div>
          
          <div className="relative">
            <button
              onClick={() => setShowFilters(!showFilters)}
              className={`flex items-center space-x-2 px-4 py-2.5 border rounded-lg transition-colors ${
                showFilters || Object.values(activeFilters).some(v => v) 
                  ? 'bg-indigo-50 border-indigo-200 text-indigo-700' 
                  : 'border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-5 h-5" />
              <span>Filters</span>
              {Object.values(activeFilters).some(v => v) && (
                <span className="bg-indigo-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                  {Object.values(activeFilters).filter(v => v).length}
                </span>
              )}
            </button>

            {showFilters && (
              <div className="absolute right-0 mt-2 w-72 bg-white rounded-xl shadow-lg border border-gray-100 z-50 p-4">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="font-semibold text-gray-900">Filters</h3>
                  <button 
                    onClick={() => {
                      setActiveFilters({ caste: '', house: '', rte: '' });
                      setShowFilters(false);
                    }}
                    className="text-xs text-indigo-600 hover:text-indigo-800"
                  >
                    Clear all
                  </button>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Caste</label>
                    <select
                      value={activeFilters.caste}
                      onChange={(e) => setActiveFilters(prev => ({ ...prev, caste: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">All Castes</option>
                      {['Gen', 'OBC', 'SC', 'ST', 'NA'].map(c => (
                        <option key={c} value={c}>{c}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">House</label>
                    <select
                      value={activeFilters.house}
                      onChange={(e) => setActiveFilters(prev => ({ ...prev, house: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">All Houses</option>
                      {[...new Set(students.map(s => s.house).filter(Boolean))].sort().map(h => (
                        <option key={h} value={h}>{h}</option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">RTE</label>
                    <select
                      value={activeFilters.rte}
                      onChange={(e) => setActiveFilters(prev => ({ ...prev, rte: e.target.value }))}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                    >
                      <option value="">All</option>
                      <option value="RTE">Yes (RTE)</option>
                      <option value="no">No</option>
                    </select>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Students Table */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-gray-50 to-indigo-50">
              <tr>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider sticky left-0 bg-gray-50 z-10 whitespace-nowrap shadow-sm">
                  Roll No.
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Photo
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Scholar No.
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Name
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Samagra ID
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Gender
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Father Name
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Mother Name
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  DOB
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Session
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Mobile
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Other Contact
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Address
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Aadhar
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Caste
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  RTE
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  PEN No.
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Appar ID
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Family ID
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  House
                </th>
                <th className="px-3 py-3 text-left text-xs font-semibold text-gray-700 uppercase tracking-wider whitespace-nowrap">
                  Adm. Date
                </th>
                <th className="px-3 py-3 text-right text-xs font-semibold text-gray-700 uppercase tracking-wider sticky right-0 bg-indigo-50 z-10 whitespace-nowrap shadow-sm">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan="22" className="px-6 py-12 text-center text-gray-500 text-sm sm:text-base">
                    {searchTerm ? 'No students found matching your search.' : 'No students in this class yet. Click "Add Student" to get started.'}
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="group hover:bg-gray-50 transition-colors">
                    <td className="px-3 py-3 sticky left-0 bg-white group-hover:bg-gray-50 z-10 whitespace-nowrap">
                      <span className="text-xs font-semibold text-gray-900">{student.roll_number || '-'}</span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      {student.profile_image ? (
                        <img 
                          src={student.profile_image} 
                          alt={student.name} 
                          className="h-8 w-8 rounded-full object-cover border border-gray-200"
                        />
                      ) : (
                        <div className="h-8 w-8 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold">
                          {(student.name || student.student_name || '?').charAt(0).toUpperCase()}
                        </div>
                      )}
                    </td>
                   
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-xs text-gray-900">{student.scholar_number || '-'}</span>
                    </td>
                     <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-xs text-gray-900">{student.name || student.student_name || '-'}</span>
                    </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className="text-xs text-gray-900">{student.samagra_id || '-'}</span>
                </td>
                
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className="text-xs text-gray-900">{student.gender || '-'}</span>
                </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-xs text-gray-900">{student.father_name || '-'}</span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-xs text-gray-900">{student.mother_name || '-'}</span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-xs text-gray-600">
                        {student.date_of_birth ? new Date(student.date_of_birth).toLocaleDateString() : '-'}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-xs text-gray-900">{student.session || '-'}</span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-xs text-gray-900">{student.mobile_no || student.parent_contact || '-'}</span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-xs text-gray-900">{student.other_no || '-'}</span>
                    </td>
                    <td className="px-3 py-3 max-w-xs whitespace-nowrap">
                      <span className="text-xs text-gray-900 truncate block" title={student.address || ''}>
                        {student.address || '-'}
                      </span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-xs text-gray-900">{student.aadhar_number || '-'}</span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-xs text-gray-900">{student.caste || '-'}</span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-xs text-gray-900">{student.rte || '-'}</span>
                    </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className="text-xs text-gray-900">{student.pen_number || '-'}</span>
                </td>
                <td className="px-3 py-3 whitespace-nowrap">
                  <span className="text-xs text-gray-900">{student.appar_id || '-'}</span>
                </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-xs text-gray-900">{student.family_id || '-'}</span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-xs text-gray-900">{student.house || '-'}</span>
                    </td>
                    <td className="px-3 py-3 whitespace-nowrap">
                      <span className="text-xs text-gray-600">
                        {student.admission_date || student.date_of_admission 
                          ? new Date(student.admission_date || student.date_of_admission).toLocaleDateString() 
                          : '-'}
                      </span>
                    </td>
                    <td className="px-3 py-3 text-right sticky right-0 bg-white group-hover:bg-gray-50 z-10 whitespace-nowrap">
                      <div className="flex justify-end space-x-2">
            <button
                          onClick={() => handleEdit(student)}
                          className="text-indigo-600 hover:text-indigo-800 transition-colors"
                          aria-label="Edit student"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDelete(student)}
                          className="text-red-600 hover:text-red-800 transition-colors"
                          aria-label="Delete student"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Student Count */}
      <div className="bg-indigo-50 border border-indigo-200 rounded-lg p-4">
        <p className="text-sm text-indigo-900">
          <strong className="font-semibold">Total Students:</strong> {filteredStudents.length} {searchTerm && `(filtered from ${students.length})`}
        </p>
      </div>
    </div>
  );
};

export default StudentManagement;
