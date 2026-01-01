import React, { useState, useRef } from 'react';

export default function MarksheetGenerator() {
  const [formData, setFormData] = useState({
    studentName: '',
    fatherName: '',
    motherName: '',
    dob: '',
    class: '',
    section: '',
    scholarNo: '',
    
    // Unit Test I marks
    ut1English: '',
    ut1Hindi: '',
    ut1Maths: '',
    ut1EVS: '',
    
    // I Terminal marks
    t1English: '',
    t1Hindi: '',
    t1Maths: '',
    t1EVS: '',
    
    // II Terminal marks
    t2English: '',
    t2Hindi: '',
    t2Maths: '',
    t2EVS: '',
    
    // Annual Exam marks
    annualEnglish: '',
    annualHindi: '',
    annualMaths: '',
    annualEVS: '',
    
    // Attendance
    totalWorkingDays: '',
    totalDaysAttended: '',
    
    // Health
    height: '',
    weight: '',
    
    // Other
    dateOfIssue: '',
    schoolReopenOn: '',
    remark: '',
    result: '',
    division: '',
  });

  const [showMarksheet, setShowMarksheet] = useState(false);
  const marksheetRef = useRef(null);

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const calculateGrade = (marks) => {
    const m = parseFloat(marks) || 0;
    if (m >= 91) return 'A1';
    if (m >= 81) return 'A2';
    if (m >= 71) return 'B1';
    if (m >= 61) return 'B2';
    if (m >= 51) return 'C1';
    if (m >= 41) return 'C2';
    if (m >= 33) return 'D';
    return 'E';
  };

  const calculateTotal = (sub) => {
    const ut1 = parseFloat(formData[`ut1${sub}`]) || 0;
    const t1 = parseFloat(formData[`t1${sub}`]) || 0;
    const t2 = parseFloat(formData[`t2${sub}`]) || 0;
    const annual = parseFloat(formData[`annual${sub}`]) || 0;
    return ut1 + t1 + t2 + annual;
  };

  const getGrandTotal = () => {
    return ['English', 'Hindi', 'Maths', 'EVS'].reduce((sum, sub) => sum + calculateTotal(sub), 0);
  };

  const getPercentage = () => {
    const total = getGrandTotal();
    return total > 0 ? ((total / 1600) * 100).toFixed(2) : '0.00';
  };

  const getAttendancePercentage = () => {
    const total = parseFloat(formData.totalWorkingDays) || 0;
    const attended = parseFloat(formData.totalDaysAttended) || 0;
    if (total === 0) return '0.00';
    return ((attended / total) * 100).toFixed(2);
  };

  const handlePrint = () => {
    window.print();
  };

  const handleGenerateMarksheet = () => {
    setShowMarksheet(true);
  };

  return (
    <div className="min-h-screen bg-gray-100 p-4">
      {/* Input Form - Hidden when printing */}
      {!showMarksheet && (
        <div className="max-w-5xl mx-auto bg-white rounded-lg shadow-lg p-8 print:hidden">
          <h1 className="text-3xl font-bold text-center mb-8 text-blue-700">
            School Marksheet Generator
          </h1>
          
          <div className="space-y-8">
            {/* Student Details */}
            <div className="border-b-2 border-gray-300 pb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Student Information</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="text"
                  name="studentName"
                  placeholder="Student Name *"
                  value={formData.studentName}
                  onChange={handleChange}
                  required
                  className="p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  name="fatherName"
                  placeholder="Father's Name *"
                  value={formData.fatherName}
                  onChange={handleChange}
                  required
                  className="p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  name="motherName"
                  placeholder="Mother's Name *"
                  value={formData.motherName}
                  onChange={handleChange}
                  required
                  className="p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="date"
                  name="dob"
                  placeholder="Date of Birth"
                  value={formData.dob}
                  onChange={handleChange}
                  required
                  className="p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  name="class"
                  placeholder="Class *"
                  value={formData.class}
                  onChange={handleChange}
                  required
                  className="p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  name="section"
                  placeholder="Section *"
                  value={formData.section}
                  onChange={handleChange}
                  required
                  className="p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  name="scholarNo"
                  placeholder="Scholar No *"
                  value={formData.scholarNo}
                  onChange={handleChange}
                  required
                  className="p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Marks Section */}
            <div className="border-b-2 border-gray-300 pb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Academic Performance</h2>
              
              <div className="overflow-x-auto">
                <table className="w-full text-sm border-2 border-gray-400">
                  <thead>
                    <tr className="bg-gray-200">
                      <th className="p-3 text-left border border-gray-400">Subject</th>
                      <th className="p-3 border border-gray-400">Unit Test (40)</th>
                      <th className="p-3 border border-gray-400">I Terminal (100)</th>
                      <th className="p-3 border border-gray-400">II Terminal (100)</th>
                      <th className="p-3 border border-gray-400">Annual (100)</th>
                    </tr>
                  </thead>
                  <tbody>
                    {['English', 'Hindi', 'Maths', 'EVS'].map((subject) => (
                      <tr key={subject} className="border border-gray-400">
                        <td className="p-3 font-medium border border-gray-400">{subject}</td>
                        <td className="p-2 border border-gray-400">
                          <input
                            type="number"
                            name={`ut1${subject}`}
                            value={formData[`ut1${subject}`]}
                            onChange={handleChange}
                            max="40"
                            className="w-full p-2 border-2 border-gray-300 rounded text-center"
                          />
                        </td>
                        <td className="p-2 border border-gray-400">
                          <input
                            type="number"
                            name={`t1${subject}`}
                            value={formData[`t1${subject}`]}
                            onChange={handleChange}
                            max="100"
                            className="w-full p-2 border-2 border-gray-300 rounded text-center"
                          />
                        </td>
                        <td className="p-2 border border-gray-400">
                          <input
                            type="number"
                            name={`t2${subject}`}
                            value={formData[`t2${subject}`]}
                            onChange={handleChange}
                            max="100"
                            className="w-full p-2 border-2 border-gray-300 rounded text-center"
                          />
                        </td>
                        <td className="p-2 border border-gray-400">
                          <input
                            type="number"
                            name={`annual${subject}`}
                            value={formData[`annual${subject}`]}
                            onChange={handleChange}
                            max="100"
                            className="w-full p-2 border-2 border-gray-300 rounded text-center"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Attendance & Health */}
            <div className="border-b-2 border-gray-300 pb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Attendance & Health</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="number"
                  name="totalWorkingDays"
                  placeholder="Total Working Days"
                  value={formData.totalWorkingDays}
                  onChange={handleChange}
                  className="p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="number"
                  name="totalDaysAttended"
                  placeholder="Total Days Attended"
                  value={formData.totalDaysAttended}
                  onChange={handleChange}
                  className="p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="number"
                  name="height"
                  placeholder="Height (cm)"
                  value={formData.height}
                  onChange={handleChange}
                  className="p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="number"
                  name="weight"
                  placeholder="Weight (kg)"
                  value={formData.weight}
                  onChange={handleChange}
                  className="p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Other Details */}
            <div className="border-b-2 border-gray-300 pb-6">
              <h2 className="text-xl font-semibold mb-4 text-gray-800">Other Details</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <input
                  type="date"
                  name="dateOfIssue"
                  placeholder="Date of Issue"
                  value={formData.dateOfIssue}
                  onChange={handleChange}
                  className="p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="date"
                  name="schoolReopenOn"
                  placeholder="School Reopen On"
                  value={formData.schoolReopenOn}
                  onChange={handleChange}
                  className="p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  name="division"
                  placeholder="Division"
                  value={formData.division}
                  onChange={handleChange}
                  className="p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  name="remark"
                  placeholder="Remark"
                  value={formData.remark}
                  onChange={handleChange}
                  className="p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <input
                  type="text"
                  name="result"
                  placeholder="Result (e.g., Pass & Congratulations! Promoted to Class V)"
                  value={formData.result}
                  onChange={handleChange}
                  className="p-3 border-2 border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 md:col-span-2"
                />
              </div>
            </div>

            <button
              onClick={handleGenerateMarksheet}
              className="w-full bg-blue-600 text-white py-4 rounded-lg font-semibold text-lg hover:bg-blue-700 transition shadow-lg"
            >
              Generate Marksheet
            </button>
          </div>
        </div>
      )}

      {/* Generated Marksheet */}
      {showMarksheet && (
        <div className="print:p-0">
          {/* Print Button - Hidden when printing */}
          <div className="max-w-4xl mx-auto mb-4 flex gap-3 print:hidden">
            <button
              onClick={handlePrint}
              className="flex items-center gap-2 bg-green-600 text-white px-6 py-3 rounded-lg hover:bg-green-700 shadow-lg font-semibold"
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9"></polyline>
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2"></path>
                <rect x="6" y="14" width="12" height="8"></rect>
              </svg>
              Print Marksheet
            </button>
            <button
              onClick={() => setShowMarksheet(false)}
              className="bg-gray-600 text-white px-6 py-3 rounded-lg hover:bg-gray-700 shadow-lg font-semibold"
            >
              Back to Form
            </button>
          </div>

          {/* Actual Marksheet */}
          <div 
            ref={marksheetRef}
            className="max-w-4xl mx-auto bg-white print:shadow-none shadow-2xl"
            style={{ fontFamily: 'Arial, sans-serif' }}
          >
            {/* Main Border */}
            <div className="border-4 border-black p-3">
              <div className="border-2 border-black p-4">
                
                {/* Header with Logo */}
                <div className="flex items-start mb-4 pb-3 border-b-2 border-gray-800">
                  {/* Logo */}
                  <div className="flex-shrink-0 mr-4">
                    <div className="w-16 h-16 rounded-full bg-yellow-600 flex items-center justify-center border-4 border-yellow-700">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="white" className="w-10 h-10">
                        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-5-9h10v2H7z"/>
                      </svg>
                    </div>
                  </div>
                  
                  {/* School Info */}
                  <div className="flex-grow text-center">
                    <h1 className="text-2xl font-bold text-blue-700" style={{ letterSpacing: '0.5px' }}>
                      LITTLE FLOWER CONVENT HR. SEC. SCHOOL
                    </h1>
                    <p className="text-xs mt-1" style={{ fontSize: '10px' }}>
                      Opposite Capital Mall, Narmadapuram Road, Misrod Bhopal-26. (MP)
                    </p>
                    <p className="text-xs" style={{ fontSize: '9px' }}>
                      Affiliated to MP. BOARD, Affiliation No. 632437
                    </p>
                    <p className="text-xs" style={{ fontSize: '9px' }}>
                      Email – <span className="text-blue-600">littlefloweragp@gamil.com</span>, <span className="text-blue-600">www.littleflowerschoolmisrod.com</span>
                    </p>
                  </div>
                </div>

                {/* Title */}
                <div className="text-center mb-3">
                  <h2 className="text-lg font-bold text-purple-700">RECORD OF ANNUAL ACADEMIC PERFORMANCE</h2>
                  <p className="text-sm font-bold text-red-600">2025-26</p>
                </div>

                {/* Student Info with Photo */}
                <div className="flex mb-4">
                  <div className="flex-grow">
                    <table className="w-full text-xs">
                      <tbody>
                        <tr>
                          <td className="py-1 font-bold w-40">Name of Student</td>
                          <td className="py-1">: {formData.studentName.toUpperCase()}</td>
                          <td className="py-1 font-bold w-24">Class:</td>
                          <td className="py-1">{formData.class} - Sec: {formData.section}</td>
                        </tr>
                        <tr>
                          <td className="py-1 font-bold">Father's Name</td>
                          <td className="py-1">: {formData.fatherName}</td>
                          <td className="py-1"></td>
                          <td className="py-1"></td>
                        </tr>
                        <tr>
                          <td className="py-1 font-bold">Mother's Name</td>
                          <td className="py-1">: {formData.motherName}</td>
                          <td className="py-1 font-bold">Scholar No:</td>
                          <td className="py-1">{formData.scholarNo}</td>
                        </tr>
                        <tr>
                          <td className="py-1 font-bold">Date of Birth</td>
                          <td className="py-1">: {formData.dob}</td>
                          <td className="py-1"></td>
                          <td className="py-1"></td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                  
                  {/* Student Photo */}
                  <div className="ml-4 flex-shrink-0">
                    <div className="w-24 h-28 border-2 border-gray-800 bg-gradient-to-br from-blue-100 to-purple-100 flex items-center justify-center">
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="gray" className="w-16 h-16 opacity-30">
                        <path d="M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z"/>
                      </svg>
                    </div>
                  </div>
                </div>

                {/* Scholastic Section */}
                <div className="mb-3">
                  <h3 className="font-bold text-xs mb-1 bg-gray-300 px-2 py-1 border border-black">SCHOLASTIC</h3>
                  <table className="w-full border-collapse text-xs border border-black">
                    <thead>
                      <tr className="border border-black">
                        <th className="border border-black p-1 text-left bg-gray-100" rowSpan="2" style={{ width: '120px' }}>SUBJECT</th>
                        <th className="border border-black p-1 bg-gray-100" colSpan="2">UNIT TEST</th>
                        <th className="border border-black p-1 bg-gray-100" colSpan="2">I TERMINAL</th>
                        <th className="border border-black p-1 bg-gray-100" colSpan="2">II TERMINAL</th>
                        <th className="border border-black p-1 bg-gray-100" colSpan="2">ANNUAL EXAM</th>
                        <th className="border border-black p-1 bg-gray-100" rowSpan="2" style={{ width: '70px' }}>ANNUAL<br/>AGGREGATE<br/>(Grade)</th>
                      </tr>
                      <tr className="border border-black">
                        <th className="border border-black p-1 bg-gray-100" style={{ width: '45px' }}>Max</th>
                        <th className="border border-black p-1 bg-gray-100" style={{ width: '45px' }}>OBT</th>
                        <th className="border border-black p-1 bg-gray-100" style={{ width: '45px' }}>Max</th>
                        <th className="border border-black p-1 bg-gray-100" style={{ width: '45px' }}>OBT</th>
                        <th className="border border-black p-1 bg-gray-100" style={{ width: '45px' }}>Max</th>
                        <th className="border border-black p-1 bg-gray-100" style={{ width: '45px' }}>OBT</th>
                        <th className="border border-black p-1 bg-gray-100" style={{ width: '45px' }}>Max</th>
                        <th className="border border-black p-1 bg-gray-100" style={{ width: '45px' }}>OBT</th>
                      </tr>
                    </thead>
                    <tbody>
                      {[
                        { name: 'English', key: 'English' },
                        { name: 'Hindi', key: 'Hindi' },
                        { name: 'Mathematics', key: 'Maths' },
                        { name: 'EVS', key: 'EVS' }
                      ].map(({ name, key }) => (
                        <tr key={key} className="border border-black">
                          <td className="border border-black p-1 pl-2">{name}</td>
                          <td className="border border-black p-1 text-center">40</td>
                          <td className="border border-black p-1 text-center">{formData[`ut1${key}`]}</td>
                          <td className="border border-black p-1 text-center">100</td>
                          <td className="border border-black p-1 text-center">{formData[`t1${key}`]}</td>
                          <td className="border border-black p-1 text-center">100</td>
                          <td className="border border-black p-1 text-center">{formData[`t2${key}`]}</td>
                          <td className="border border-black p-1 text-center">100</td>
                          <td className="border border-black p-1 text-center">{formData[`annual${key}`]}</td>
                          <td className="border border-black p-1 text-center font-bold">
                            {calculateGrade(((calculateTotal(key) / 400) * 100).toFixed(2))}
                          </td>
                        </tr>
                      ))}
                      <tr className="border border-black font-bold">
                        <td className="border border-black p-1 pl-2">Grand Total</td>
                        <td className="border border-black p-1 text-center">160</td>
                        <td className="border border-black p-1 text-center">
                          {['English', 'Hindi', 'Maths', 'EVS'].reduce((sum, s) => sum + (parseFloat(formData[`ut1${s}`]) || 0), 0)}
                        </td>
                        <td className="border border-black p-1 text-center">400</td>
                        <td className="border border-black p-1 text-center">
                          {['English', 'Hindi', 'Maths', 'EVS'].reduce((sum, s) => sum + (parseFloat(formData[`t1${s}`]) || 0), 0)}
                        </td>
                        <td className="border border-black p-1 text-center">400</td>
                        <td className="border border-black p-1 text-center">
                          {['English', 'Hindi', 'Maths', 'EVS'].reduce((sum, s) => sum + (parseFloat(formData[`t2${s}`]) || 0), 0)}
                        </td>
                        <td className="border border-black p-1 text-center">400</td>
                        <td className="border border-black p-1 text-center">
                          {getGrandTotal()}
                        </td>
                        <td className="border border-black p-1 text-center"></td>
                      </tr>
                      <tr className="border border-black font-bold">
                        <td className="border border-black p-1 pl-2" colSpan="9">Percentage %</td>
                        <td className="border border-black p-1 text-center">{getPercentage()}%</td>
                      </tr>
                    </tbody>
                  </table>
                </div>

                {/* Non-Scholastic and Other Sections */}
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <h3 className="font-bold text-xs mb-1 bg-gray-300 px-2 py-1 border border-black">NON SCHOLASTIC</h3>
                    <div className="border border-black">
                      <table className="w-full text-xs">
                        <thead>
                          <tr className="border-b border-black">
                            <th className="p-1 text-left bg-gray-100 border-r border-black font-bold" style={{ width: '50%' }}>CO-CURRICULAR ACTIVITY</th>
                            <th className="p-1 text-left bg-gray-100 font-bold">PERSONAL ATTRIBUTES</th>
                          </tr>
                        </thead>
                        <tbody>
                          <tr className="border-b border-black">
                            <td className="p-1 border-r border-black">Computer</td>
                            <td className="p-1">Punctuality & Punctuality</td>
                          </tr>
                          <tr className="border-b border-black">
                            <td className="p-1 border-r border-black">Cultural Activity</td>
                            <td className="p-1">Neatness & Cleanliness</td>
                          </tr>
                          <tr className="border-b border-black">
                            <td className="p-1 border-r border-black">General Knowledge</td>
                            <td className="p-1">Discipline & Responsibility</td>
                          </tr>
                          <tr className="border-b border-black">
                            <td className="p-1 border-r border-black">Art & Craft</td>
                            <td className="p-1">Leadership Quality</td>
                          </tr>
                          <tr>
                            <td className="p-1 border-r border-black">Sports</td>
                            <td className="p-1">Overall Development</td>
                          </tr>
                        </tbody>
                      </table>
                    </div>
                  </div>
                  
                  <div>
                    <div className="mb-3">
                      <h3 className="font-bold text-xs mb-1 bg-gray-300 px-2 py-1 border border-black">HEALTH ASPECTS</h3>
                      <div className="border border-black p-2 text-xs">
                        <p className="mb-1">Height (in cm): <span className="font-semibold">{formData.height}</span></p>
                        <p className="mb-1">Weight (in kg): <span className="font-semibold">{formData.weight}</span></p>
                        <p>Physical Development</p>
                      </div>
                    </div>
                    
                    <div>
                      <h3 className="font-bold text-xs mb-1 bg-gray-300 px-2 py-1 border border-black">ATTENDANCE</h3>
                      <div className="border border-black p-2 text-xs">
                        <p className="mb-1">Total Working Days: <span className="font-semibold">{formData.totalWorkingDays}</span></p>
                        <p className="mb-1">Total Days Attended: <span className="font-semibold">{formData.totalDaysAttended}</span></p>
                        <p>Percentage of Attendance: <span className="font-semibold">{getAttendancePercentage()}%</span></p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                <div className="border-t border-black pt-2 mb-3">
                  <div className="grid grid-cols-2 gap-4 text-xs mb-2">
                    <div>
                      <p className="mb-1">Division: {formData.division || '-'}</p>
                      <p className="mb-1">Remark: {formData.remark || '-'}</p>
                    </div>
                    <div>
                      <p className="mb-1">Date of Issue: {formData.dateOfIssue || '-'}</p>
                      <p className="mb-1">School Reopen On: {formData.schoolReopenOn || '-'}</p>
                    </div>
                  </div>
                  <p className="text-xs font-bold mb-3">Result: {formData.result || '-'}</p>
                </div>

                {/* Signatures */}
                <div className="border-t-2 border-black pt-3">
                  <div className="grid grid-cols-3 gap-4 text-xs">
                    <div className="text-center">
                      <div className="h-12"></div>
                      <p className="font-bold border-t border-black pt-1">Teacher's Signature</p>
                    </div>
                    <div className="text-center">
                      <div className="h-12"></div>
                      <p className="font-bold border-t border-black pt-1">Parent's Signature</p>
                    </div>
                    <div className="text-center">
                      <div className="h-12"></div>
                      <p className="font-bold border-t border-black pt-1">Principal</p>
                    </div>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      )}

      <style>{`
        @media print {
          body {
            margin: 0;
            padding: 0;
          }
          @page {
            margin: 0.5cm;
            size: A4 portrait;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
}