import React from 'react';

const MarksheetTemplate = ({ data, componentRef }) => {
  if (!data) return null;

  const { student, scholastic, totals, nonScholastic, session, result } = data;

  // Pair Co-Curricular and Personal Attributes for side-by-side display
  const coCurricular = nonScholastic?.coCurricular || [];
  const personalAttributes = nonScholastic?.personalAttributes || [];
  const maxRows = Math.max(coCurricular.length, personalAttributes.length);
  const activityRows = [];
  
  for (let i = 0; i < maxRows; i++) {
    activityRows.push({
      co: coCurricular[i] || { name: '', grade: '' },
      pa: personalAttributes[i] || { name: '', grade: '' }
    });
  }

  // Ensure at least some rows if empty
  if (activityRows.length === 0) {
      activityRows.push({ co: { name: '', grade: '' }, pa: { name: '', grade: '' } });
  }

  return (
    <div ref={componentRef}>
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
            size: A4;
            margin: 0;
        }
        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
        }
        .page {
            width: 210mm;
            height: 296mm;
            padding: 5mm; /* Reduced padding for more space */
            background: white;
            font-family: Georgia, serif; /* Changed font */
            color: black;
            margin: 0 auto;
            overflow: hidden;
        }
        
        /* Main Borders */
        .outer-border {
            border: 3px solid black;
            padding: 5px;
            height: 100%;
            display: flex;
            flex-direction: column;
        }
        .inner-border {
            border: 1px solid black;
            padding: 10px;
            flex-grow: 1;
            position: relative;
            display: flex;
            flex-direction: column;
            /* justify-content: space-between; Removed to prevent unwanted gaps */
        }

        /* Header */
        .header {
            display: flex;
            border-bottom: 2px solid #333;
            padding-bottom: 5px;
            margin-bottom: 5px;
            align-items: center;
        }
        .logo-container {
            margin-right: 15px;
        }
        .logo {
            width: 70px;
            height: 70px;
            border-radius: 50%;
            border: 2px solid #ccc;
            object-fit: cover;
        }
        .school-info {
            text-align: center;
            flex-grow: 1;
        }
        .school-name {
            color: #0066cc;
            font-size: 20px; /* Slightly smaller for Georgia */
            font-weight: bold;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 2px;
            line-height: 1.2;
        }
        .school-address {
            font-size: 10px;
            margin-bottom: 2px;
        }
        .school-contact {
            font-size: 9px;
            margin-top: 1px;
        }
        .school-contact a {
            color: #0066cc;
            text-decoration: none;
        }

        /* Title */
        .title-section {
            text-align: center;
            margin-bottom: 8px;
        }
        .title-main {
            color: #5b21b6;
            font-size: 14px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 2px;
        }
        .title-session {
            color: #dc2626;
            font-size: 12px;
            font-weight: bold;
        }

        /* Student Info */
        .student-info-container {
            display: flex;
            margin-bottom: 8px;
        }
        .student-details {
            flex-grow: 1;
        }
        .student-table {
            width: 100%;
            font-size: 10px;
            border-collapse: collapse;
        }
        .student-table td {
            padding: 2px 0;
            vertical-align: middle;
        }
        .label {
            font-weight: bold;
            width: 110px;
        }
        .value {
            font-weight: normal;
            text-transform: uppercase;
        }
        .photo-container {
            margin-left: 10px;
            width: 80px;
            height: 100px;
            border: 1px solid #999;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f0f0f0;
            overflow: hidden;
        }
        .student-photo {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        /* Section Headers */
        .section-header {
            font-size: 11px;
            font-weight: bold;
            background: #e5e7eb;
            border: 1px solid black;
            padding: 2px 8px;
            margin-bottom: 0; /* Attach to table */
            display: inline-block;
            border-bottom: none; /* Look like a tab */
        }
        
        /* Tables */
        .marks-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px; /* Slightly larger for readability */
            margin-bottom: 12px;
            border: 1px solid black;
        }
        .marks-table th, .marks-table td {
            border: 1px solid black;
            padding: 6px 4px; /* Increased padding to prevent overlap */
            text-align: center;
            vertical-align: middle;
            line-height: 1.3; /* Increased line-height */
        }
        .marks-table th {
            background-color: #f3f4f6;
            font-weight: bold;
            font-size: 10px;
            padding: 8px 4px; /* More padding for headers */
        }
        .subject-col {
            text-align: left !important;
            padding-left: 8px !important;
            font-weight: normal;
        }
        .grand-total {
            font-weight: bold;
            background-color: #f9fafb;
        }

        /* Non-Scholastic & Health */
        .dual-table-container {
            display: flex;
            border: 1px solid black;
            margin-bottom: 12px;
        }
        .half-table {
            width: 50%;
        }
        .half-table:first-child {
            border-right: 1px solid black;
        }
        .sub-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
        }
        .sub-table th {
            background-color: white;
            font-weight: bold;
            border-bottom: 1px solid black;
            padding: 6px 4px;
            text-align: center;
            font-size: 10px;
        }
        .sub-table td {
            padding: 6px 8px; /* Comfortable padding */
            border-bottom: 1px solid #ddd;
            vertical-align: middle;
            line-height: 1.3;
        }
        .sub-table tr:last-child td {
            border-bottom: none;
        }
        .sub-table td:last-child {
            border-left: 1px solid black;
            text-align: center;
            width: 30%;
        }

        /* Health Specific */
        .health-row td {
            border-bottom: 1px solid #000;
        }
        .health-row:last-child td {
            border-bottom: none;
        }

        /* Result */
        .result-box {
            border: 1px solid black;
            padding: 8px;
            font-size: 12px;
            font-weight: bold;
            margin-top: 5px;
            margin-bottom: 30px; /* Space before signatures */
        }

        /* Signatures */
        .signatures {
            display: flex;
            justify-content: space-between;
            padding: 0 30px; /* More horizontal padding */
            margin-bottom: 20px;
            margin-top: auto;
        }
        .sig-block {
            text-align: center;
            font-weight: bold;
            font-size: 12px;
            width: 180px; /* Wider signature block */
            border-top: 1px solid #333;
            padding-top: 8px;
            margin-top: 40px; /* Space for the actual signature above the line */
        }
        .principal-sig {
            /* Standardize Principal signature */
        }
      `}} />

      <div className="page">
        <div className="outer-border">
            <div className="inner-border">
                
                {/* Header */}
                <div className="header">
                    <div className="logo-container">
                        <img src="https://via.placeholder.com/80" alt="Logo" className="logo" />
                    </div>
                    <div className="school-info">
                        <div className="school-name">LITTLE FLOWER CONVENT HR. SEC. SCHOOL</div>
                        <div className="school-address">Opposite Capital Mall, Narmadapuram Road, Misrod Bhopal-26. (MP)</div>
                        <div className="school-contact">Affiliated to MP. BOARD, Affiliation No. 632437</div>
                        <div className="school-contact">
                            Email: <a href="mailto:littlefloweragp@gamil.com">littlefloweragp@gamil.com</a>, 
                            <a href="#">www.littleflowerschoolmisrod.com</a>
                        </div>
                    </div>
                </div>

                {/* Title */}
                <div className="title-section">
                    <div className="title-main">RECORD OF ANNUAL ACADEMIC PERFORMANCE</div>
                    <div className="title-session">{session || '2025-26'}</div>
                </div>

                {/* Student Info */}
                <div className="student-info-container">
                    <div className="student-details">
                        <table className="student-table">
                            <tbody>
                                <tr>
                                    <td className="label">Name of Student</td>
                                    <td className="value">: {student.name}</td>
                                </tr>
                                <tr>
                                    <td className="label">Father's Name</td>
                                    <td className="value">: {student.fatherName}</td>
                                </tr>
                                <tr>
                                    <td className="label">Mother's Name</td>
                                    <td className="value">: {student.motherName}</td>
                                </tr>
                                <tr>
                                    <td className="label">Date of Birth</td>
                                    <td className="value">: {student.dob}</td>
                                    <td className="label" style={{textAlign: 'right', paddingRight: '5px'}}>Class:</td>
                                    <td className="value">{student.class} - Sec: {student.section}</td>
                                    <td className="label" style={{textAlign: 'right', paddingRight: '5px'}}>Scholar No:</td>
                                    <td className="value">{student.scholarNo}</td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="photo-container">
                        <img 
                            src={student.photo || "https://via.placeholder.com/80x100"} 
                            alt="Student" 
                            className="student-photo"
                            onError={(e) => { e.target.src = "https://via.placeholder.com/80x100"; }}
                        />
                    </div>
                </div>

                {/* Scholastic Section */}
                <div className="section-header">SCHOLASTIC</div>
                <table className="marks-table">
                    <thead>
                        <tr>
                            <th rowSpan="2" style={{width: '25%'}}>SUBJECT</th>
                            <th colSpan="2">UNIT TEST</th>
                            <th colSpan="2">I TERMINAL</th>
                            <th colSpan="2">II TERMINAL</th>
                            <th colSpan="2">ANNUAL EXAM</th>
                            <th rowSpan="2" style={{width: '10%'}}>ANNUAL<br/>AGGREGATE<br/>(Grade)</th>
                        </tr>
                        <tr>
                            <th style={{width: '6%'}}>Max</th>
                            <th style={{width: '6%'}}>OBT</th>
                            <th style={{width: '6%'}}>Max</th>
                            <th style={{width: '6%'}}>OBT</th>
                            <th style={{width: '6%'}}>Max</th>
                            <th style={{width: '6%'}}>OBT</th>
                            <th style={{width: '6%'}}>Max</th>
                            <th style={{width: '6%'}}>OBT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scholastic.map((sub, index) => (
                            <tr key={index}>
                                <td className="subject-col">{sub.subject}</td>
                                <td>{sub.unitTest.max}</td>
                                <td>{sub.unitTest.obt}</td>
                                <td>{sub.term1.max}</td>
                                <td>{sub.term1.obt}</td>
                                <td>{sub.term2.max}</td>
                                <td>{sub.term2.obt}</td>
                                <td>{sub.annual.max}</td>
                                <td>{sub.annual.obt}</td>
                                <td>{sub.grade}</td>
                            </tr>
                        ))}
                        <tr className="grand-total">
                            <td className="subject-col">Grand Total</td>
                            <td>{totals.unitTest.max}</td>
                            <td>{totals.unitTest.obt}</td>
                            <td>{totals.term1.max}</td>
                            <td>{totals.term1.obt}</td>
                            <td>{totals.term2.max}</td>
                            <td>{totals.term2.obt}</td>
                            <td>{totals.annual.max}</td>
                            <td>{totals.annual.obt}</td>
                            <td></td>
                        </tr>
                        <tr>
                            <td className="subject-col">Percentage %</td>
                            <td colSpan="2"></td>
                            <td colSpan="2"></td>
                            <td colSpan="2"></td>
                            <td colSpan="2"></td>
                            <td>{totals.aggregatePercentage}</td>
                        </tr>
                    </tbody>
                </table>

                {/* Non Scholastic Section */}
                <div className="section-header">NON SCHOLASTIC</div>
                <div className="dual-table-container">
                    <div className="half-table">
                        <table className="sub-table">
                            <thead>
                                <tr>
                                    <th colSpan="2">CO-CURRICULAR ACTIVITY</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activityRows.map((row, i) => (
                                    <tr key={i}>
                                        <td>{row.co.name}</td>
                                        <td>{row.co.grade}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                    <div className="half-table">
                        <table className="sub-table">
                            <thead>
                                <tr>
                                    <th colSpan="2">PERSONAL ATTRIBUTES</th>
                                </tr>
                            </thead>
                            <tbody>
                                {activityRows.map((row, i) => (
                                    <tr key={i}>
                                        <td>{row.pa.name}</td>
                                        <td>{row.pa.grade}</td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Health & Attendance */}
                <div className="dual-table-container" style={{marginBottom: '10px'}}>
                    <div className="half-table">
                        <table className="sub-table">
                            <thead>
                                <tr>
                                    <th colSpan="2">HEALTH ASPECTS</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="health-row">
                                    <td>Height (in cm)</td>
                                    <td>{nonScholastic?.health?.height || '-'}</td>
                                </tr>
                                <tr className="health-row">
                                    <td>Weight (in kg)</td>
                                    <td>{nonScholastic?.health?.weight || '-'}</td>
                                </tr>
                                <tr className="health-row">
                                    <td>Physical Development</td>
                                    <td>{nonScholastic?.health?.physical || '-'}</td>
                                </tr>
                                <tr className="health-row">
                                    <td>Division: -</td>
                                    <td></td>
                                </tr>
                                <tr className="health-row">
                                    <td>Remark: -</td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                    <div className="half-table">
                        <table className="sub-table">
                            <thead>
                                <tr>
                                    <th colSpan="2">ATTENDANCE</th>
                                </tr>
                            </thead>
                            <tbody>
                                <tr className="health-row">
                                    <td>Total Working Days</td>
                                    <td>{nonScholastic?.attendance?.workingDays || '-'}</td>
                                </tr>
                                <tr className="health-row">
                                    <td>Total Days Attended</td>
                                    <td>{nonScholastic?.attendance?.attended || '-'}</td>
                                </tr>
                                <tr className="health-row">
                                    <td>Percentage of Attendance</td>
                                    <td>{nonScholastic?.attendance?.percentage || '-'}</td>
                                </tr>
                                <tr className="health-row">
                                    <td>Date of Issue: -</td>
                                    <td></td>
                                </tr>
                                <tr className="health-row">
                                    <td>School Reopen On: -</td>
                                    <td></td>
                                </tr>
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Result */}
                <div className="result-box">
                    Result: - {result || "Pass & Congratulations! Promoted to Next Class"}
                </div>

                {/* Signatures */}
                <div className="signatures">
                    <div className="sig-block">Teacher's Signature</div>
                    <div className="sig-block">Parent's Signature</div>
                    <div className="sig-block principal-sig">Principal</div>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
};

export default MarksheetTemplate;
