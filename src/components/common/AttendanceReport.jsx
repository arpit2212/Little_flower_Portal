import { useState, useEffect } from 'react';
import { useUser } from '@clerk/clerk-react';
import { supabase } from '../../lib/supabase';
import { ATTENDANCE_STATUS_COLORS } from '../../lib/constants';
import { Download, FileText, Calendar, FileDown } from 'lucide-react';
import { format } from 'date-fns';

const AttendanceReport = ({ role }) => {
  const { user } = useUser();
  const [classes, setClasses] = useState([]);
  const [selectedClass, setSelectedClass] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [reportData, setReportData] = useState([]);
  const [dailyAttendance, setDailyAttendance] = useState([]);
  const [loading, setLoading] = useState(false);
  const [className, setClassName] = useState('');

  useEffect(() => {
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    setStartDate(thirtyDaysAgo.toISOString().split('T')[0]);
    fetchClasses();
  }, []);

  const fetchClasses = async () => {
    try {
      if (role === 'principal') {
        const { data } = await supabase
          .from('classes')
          .select('*')
          .order('name');
        setClasses(data || []);
        if (data && data.length > 0) {
          setSelectedClass(data[0].id);
          setClassName(`${data[0].name} ${data[0].session || ''}`);
        }
      } else {
        const { data } = await supabase
          .from('classes')
          .select('*')
          .eq('teacher_id', user.id)
          .order('name');
        setClasses(data || []);
        if (data && data.length > 0) {
          setSelectedClass(data[0].id);
          setClassName(`${data[0].name} ${data[0].session || ''}`);
        }
      }
    } catch (error) {
      console.error('Error fetching classes:', error);
    }
  };

  const generateReport = async () => {
    if (!selectedClass || !startDate || !endDate) {
      alert('Please select class and date range');
      return;
    }

    setLoading(true);

    try {
      const selectedClassData = classes.find(c => c.id === selectedClass);
      setClassName(`${selectedClassData.name} ${selectedClassData.session || ''}`);

      const { data: students } = await supabase
        .from('students')
        .select('*')
        .eq('class_id', selectedClass)
        .order('roll_number');

      const { data: attendanceRecords } = await supabase
        .from('attendance')
        .select('*')
        .eq('class_id', selectedClass)
        .gte('date', startDate)
        .lte('date', endDate)
        .order('date');

      // Get unique dates
      const uniqueDates = [...new Set(attendanceRecords.map(r => r.date))].sort();
      
      // Calculate daily attendance summary
      const dailySummary = uniqueDates.map(date => {
        const dayRecords = attendanceRecords.filter(r => r.date === date);
        return {
          date,
          present: dayRecords.filter(r => r.status === 'present').length,
          absent: dayRecords.filter(r => r.status === 'absent').length,
          late: dayRecords.filter(r => r.status === 'late').length,
          excused: dayRecords.filter(r => r.status === 'excused').length,
          total: students.length
        };
      });
      setDailyAttendance(dailySummary);

      const report = students.map((student) => {
        const studentAttendance = attendanceRecords.filter(
          (record) => record.student_id === student.id
        );

        const totalDays = studentAttendance.length;
        const presentDays = studentAttendance.filter(r => r.status === 'present').length;
        const absentDays = studentAttendance.filter(r => r.status === 'absent').length;
        const lateDays = studentAttendance.filter(r => r.status === 'late').length;
        const excusedDays = studentAttendance.filter(r => r.status === 'excused').length;

        const attendancePercentage = totalDays > 0 ? ((presentDays / totalDays) * 100).toFixed(1) : 0;

        return {
          ...student,
          totalDays,
          presentDays,
          absentDays,
          lateDays,
          excusedDays,
          attendancePercentage,
          attendanceByDate: uniqueDates.map(date => {
            const record = studentAttendance.find(r => r.date === date);
            return record ? record.status : '-';
          })
        };
      });

      setReportData(report);
    } catch (error) {
      console.error('Error generating report:', error);
      alert('Error generating report. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const exportToCSV = () => {
    if (reportData.length === 0) {
      alert('No data to export');
      return;
    }

    const headers = ['Roll Number', 'Name', 'Total Days', 'Present', 'Absent', 'Late', 'Excused', 'Attendance %'];
    const csvContent = [
      headers.join(','),
      ...reportData.map((row) =>
        [row.roll_number, `"${row.name}"`, row.totalDays, row.presentDays, row.absentDays, row.lateDays, row.excusedDays, row.attendancePercentage].join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `attendance_report_${startDate}_to_${endDate}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const exportToPDF = () => {
    if (reportData.length === 0) {
      alert('No data to export');
      return;
    }

    const printWindow = window.open('', '_blank');
    const avgAttendance = reportData.length > 0
      ? (reportData.reduce((sum, row) => sum + parseFloat(row.attendancePercentage), 0) / reportData.length).toFixed(1)
      : 0;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>Attendance Report - ${className}</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 20px; color: #1f2937; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 3px solid #6366f1; padding-bottom: 20px; }
          .header h1 { color: #1f2937; margin: 0; font-size: 28px; }
          .header p { color: #6b7280; margin: 5px 0; }
          .info-box { background: #f3f4f6; padding: 15px; border-radius: 8px; margin-bottom: 20px; }
          .info-row { display: flex; justify-content: space-between; margin: 8px 0; }
          .info-label { font-weight: bold; color: #374151; }
          .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin-bottom: 20px; }
          .summary-card { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; padding: 15px; border-radius: 8px; text-align: center; }
          .summary-card h3 { margin: 0; font-size: 14px; opacity: 0.9; }
          .summary-card p { margin: 10px 0 0 0; font-size: 24px; font-weight: bold; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th, td { padding: 12px; text-align: left; border: 1px solid #e5e7eb; }
          th { background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%); color: white; font-weight: 600; }
          tr:nth-child(even) { background-color: #f9fafb; }
          tr:hover { background-color: #f3f4f6; }
          .badge { padding: 4px 12px; border-radius: 12px; font-size: 11px; font-weight: 600; display: inline-block; }
          .badge-green { background: #d1fae5; color: #065f46; }
          .badge-red { background: #fee2e2; color: #991b1b; }
          .badge-yellow { background: #fef3c7; color: #92400e; }
          .badge-blue { background: #dbeafe; color: #1e40af; }
          .text-center { text-align: center; }
          .attendance-high { background: #d1fae5; color: #065f46; font-weight: bold; }
          .attendance-medium { background: #fef3c7; color: #92400e; font-weight: bold; }
          .attendance-low { background: #fee2e2; color: #991b1b; font-weight: bold; }
          .footer { margin-top: 30px; padding-top: 20px; border-top: 2px solid #e5e7eb; text-align: center; color: #6b7280; font-size: 12px; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>📊 Attendance Report</h1>
          <p style="font-size: 18px; color: #6366f1; font-weight: 600;">${className}</p>
          <p>Period: ${format(new Date(startDate), 'MMM dd, yyyy')} to ${format(new Date(endDate), 'MMM dd, yyyy')}</p>
        </div>

        <div class="info-box">
          <div class="info-row">
            <span class="info-label">Total Students:</span>
            <span>${reportData.length}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Report Generated:</span>
            <span>${format(new Date(), 'MMM dd, yyyy HH:mm')}</span>
          </div>
          <div class="info-row">
            <span class="info-label">Generated By:</span>
            <span>${user.fullName || user.firstName} (${role})</span>
          </div>
        </div>

        <div class="summary">
          <div class="summary-card">
            <h3>Average Attendance</h3>
            <p>${avgAttendance}%</p>
          </div>
          <div class="summary-card">
            <h3>High Performers (≥80%)</h3>
            <p>${reportData.filter(r => r.attendancePercentage >= 80).length}</p>
          </div>
          <div class="summary-card">
            <h3>Need Attention (<60%)</h3>
            <p>${reportData.filter(r => r.attendancePercentage < 60).length}</p>
          </div>
          <div class="summary-card">
            <h3>Total Records</h3>
            <p>${reportData.reduce((sum, r) => sum + r.totalDays, 0)}</p>
          </div>
        </div>

        <h2 style="color: #1f2937; margin-top: 30px;">Student-wise Attendance Summary</h2>
        <table>
          <thead>
            <tr>
              <th>Roll No.</th>
              <th>Student Name</th>
              <th class="text-center">Total Days</th>
              <th class="text-center">Present</th>
              <th class="text-center">Absent</th>
              <th class="text-center">Late</th>
              <th class="text-center">Excused</th>
              <th class="text-center">Attendance %</th>
            </tr>
          </thead>
          <tbody>
            ${reportData.map(row => `
              <tr>
                <td><strong>${row.roll_number}</strong></td>
                <td>${row.name}</td>
                <td class="text-center">${row.totalDays}</td>
                <td class="text-center"><span class="badge badge-green">${row.presentDays}</span></td>
                <td class="text-center"><span class="badge badge-red">${row.absentDays}</span></td>
                <td class="text-center"><span class="badge badge-yellow">${row.lateDays}</span></td>
                <td class="text-center"><span class="badge badge-blue">${row.excusedDays}</span></td>
                <td class="text-center">
                  <span class="${row.attendancePercentage >= 80 ? 'attendance-high' : row.attendancePercentage >= 60 ? 'attendance-medium' : 'attendance-low'} badge">
                    ${row.attendancePercentage}%
                  </span>
                </td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${dailyAttendance.length > 0 ? `
          <h2 style="color: #1f2937; margin-top: 40px;">Daily Attendance Summary</h2>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th class="text-center">Present</th>
                <th class="text-center">Absent</th>
                <th class="text-center">Late</th>
                <th class="text-center">Excused</th>
                <th class="text-center">Total</th>
                <th class="text-center">Attendance %</th>
              </tr>
            </thead>
            <tbody>
              ${dailyAttendance.map(day => `
                <tr>
                  <td><strong>${format(new Date(day.date), 'MMM dd, yyyy')}</strong></td>
                  <td class="text-center"><span class="badge badge-green">${day.present}</span></td>
                  <td class="text-center"><span class="badge badge-red">${day.absent}</span></td>
                  <td class="text-center"><span class="badge badge-yellow">${day.late}</span></td>
                  <td class="text-center"><span class="badge badge-blue">${day.excused}</span></td>
                  <td class="text-center">${day.total}</td>
                  <td class="text-center">
                    <span class="badge ${day.total > 0 && (day.present / day.total * 100) >= 80 ? 'attendance-high' : 'attendance-medium'}">
                      ${day.total > 0 ? ((day.present / day.total) * 100).toFixed(1) : 0}%
                    </span>
                  </td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <div class="footer">
          <p><strong>School Attendance Management System</strong></p>
          <p>This is a computer-generated report. Generated on ${format(new Date(), 'MMM dd, yyyy HH:mm:ss')}</p>
        </div>

        <div class="no-print" style="margin-top: 30px; text-align: center;">
          <button onclick="window.print()" style="background: #6366f1; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600;">
            Print / Save as PDF
          </button>
          <button onclick="window.close()" style="background: #6b7280; color: white; padding: 12px 24px; border: none; border-radius: 8px; cursor: pointer; font-size: 16px; font-weight: 600; margin-left: 10px;">
            Close
          </button>
        </div>
      </body>
      </html>
    `);
    printWindow.document.close();
  };

  if (classes.length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-md p-8 sm:p-12 text-center border border-gray-100">
        <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
          <FileText className="w-8 h-8 text-indigo-600" />
        </div>
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Classes Available</h3>
        <p className="text-gray-600 text-sm sm:text-base">
          {role === 'principal' ? 'No classes have been created yet.' : 'No classes assigned to you yet.'}
        </p>
      </div>
    );
  }

  return (
    <div className="w-full space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h2 className="text-xl sm:text-2xl font-bold text-gray-800">Attendance Reports</h2>
        {reportData.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2">
            <button
              onClick={exportToCSV}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors shadow-md font-medium"
            >
              <Download className="w-5 h-5" />
              <span>Export CSV</span>
            </button>
            <button
              onClick={exportToPDF}
              className="flex items-center justify-center space-x-2 px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors shadow-md font-medium"
            >
              <FileDown className="w-5 h-5" />
              <span>Export PDF</span>
            </button>
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white rounded-xl shadow-md p-5 sm:p-6 border border-gray-100">
        <h3 className="text-base sm:text-lg font-semibold text-gray-800 mb-4">Report Filters</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Class</label>
            <select
              value={selectedClass}
              onChange={(e) => {
                setSelectedClass(e.target.value);
                const cls = classes.find(c => c.id === e.target.value);
                setClassName(`${cls.name} ${cls.session || ''}`);
              }}
              className="w-full px-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800"
            >
              {classes.map((cls) => (
                <option key={cls.id} value={cls.id}>
                  {cls.name} {cls.session && `- ${cls.session}`}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent bg-white text-gray-800"
              />
            </div>
          </div>

          <div className="flex items-end">
            <button
              onClick={generateReport}
              disabled={loading}
              className="w-full px-4 py-2.5 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors disabled:bg-gray-400 shadow-md font-medium"
            >
              {loading ? 'Generating...' : 'Generate Report'}
            </button>
          </div>
        </div>
      </div>

      {/* Report Table */}
      {reportData.length > 0 && (
        <>
          <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
            <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-200">
              <h3 className="text-base sm:text-lg font-semibold text-gray-800">
                Report: {format(new Date(startDate), 'MMM dd, yyyy')} to {format(new Date(endDate), 'MMM dd, yyyy')}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-indigo-50">
                  <tr>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Roll No.</th>
                    <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Student Name</th>
                    <th className="px-4 sm:px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase hidden sm:table-cell">Total</th>
                    <th className="px-4 sm:px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Present</th>
                    <th className="px-4 sm:px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase hidden md:table-cell">Absent</th>
                    <th className="px-4 sm:px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase hidden lg:table-cell">Late</th>
                    <th className="px-4 sm:px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Attendance %</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-100">
                  {reportData.map((row) => (
                    <tr key={row.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 sm:px-6 py-4">
                        <span className="text-sm font-semibold text-gray-900">{row.roll_number}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-4">
                        <span className="text-sm text-gray-900">{row.name}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-center hidden sm:table-cell">
                        <span className="text-sm text-gray-900">{row.totalDays}</span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-center">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                          {row.presentDays}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-center hidden md:table-cell">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                          {row.absentDays}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-center hidden lg:table-cell">
                        <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                          {row.lateDays}
                        </span>
                      </td>
                      <td className="px-4 sm:px-6 py-4 text-center">
                        <span className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-bold rounded-full ${
                          row.attendancePercentage >= 80 ? 'bg-green-100 text-green-800' :
                          row.attendancePercentage >= 60 ? 'bg-amber-100 text-amber-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {row.attendancePercentage}%
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Summary */}
            <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-gray-50 to-indigo-50 border-t border-gray-200">
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                <div>
                  <p className="text-xs text-gray-600">Total Students</p>
                  <p className="text-lg font-bold text-gray-800">{reportData.length}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Avg Attendance</p>
                  <p className="text-lg font-bold text-green-600">
                    {reportData.length > 0
                      ? (reportData.reduce((sum, row) => sum + parseFloat(row.attendancePercentage), 0) / reportData.length).toFixed(1)
                      : 0}%
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Above 80%</p>
                  <p className="text-lg font-bold text-indigo-600">
                    {reportData.filter((row) => row.attendancePercentage >= 80).length}
                  </p>
                </div>
                <div>
                  <p className="text-xs text-gray-600">Below 60%</p>
                  <p className="text-lg font-bold text-red-600">
                    {reportData.filter((row) => row.attendancePercentage < 60).length}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Daily Attendance Summary */}
          {dailyAttendance.length > 0 && (
            <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-100">
              <div className="px-5 sm:px-6 py-4 bg-gradient-to-r from-indigo-50 to-blue-50 border-b border-gray-200">
                <h3 className="text-base sm:text-lg font-semibold text-gray-800">Daily Attendance Summary</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gradient-to-r from-gray-50 to-indigo-50">
                    <tr>
                      <th className="px-4 sm:px-6 py-3 text-left text-xs font-semibold text-gray-700 uppercase">Date</th>
                      <th className="px-4 sm:px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Present</th>
                      <th className="px-4 sm:px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase hidden md:table-cell">Absent</th>
                      <th className="px-4 sm:px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase hidden lg:table-cell">Late</th>
                      <th className="px-4 sm:px-6 py-3 text-center text-xs font-semibold text-gray-700 uppercase">Rate</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-100">
                    {dailyAttendance.map((day) => (
                      <tr key={day.date} className="hover:bg-gray-50 transition-colors">
                        <td className="px-4 sm:px-6 py-4">
                          <span className="text-sm font-medium text-gray-900">
                            {format(new Date(day.date), 'MMM dd, yyyy')}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-center">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-green-100 text-green-800">
                            {day.present}/{day.total}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-center hidden md:table-cell">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-red-100 text-red-800">
                            {day.absent}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-center hidden lg:table-cell">
                          <span className="px-2 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-800">
                            {day.late}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-center">
                          <span className={`px-2 sm:px-3 py-1 text-xs sm:text-sm font-bold rounded-full ${
                            day.total > 0 && (day.present / day.total * 100) >= 80 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-amber-100 text-amber-800'
                          }`}>
                            {day.total > 0 ? ((day.present / day.total) * 100).toFixed(1) : 0}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}

      {reportData.length === 0 && !loading && (
        <div className="bg-white rounded-xl shadow-md p-8 sm:p-12 text-center border border-gray-100">
          <div className="bg-indigo-100 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
            <FileText className="w-8 h-8 text-indigo-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No Report Generated</h3>
          <p className="text-gray-600 text-sm sm:text-base">Select filters and click "Generate Report" to view attendance data.</p>
        </div>
      )}
    </div>
  );
};

export default AttendanceReport;