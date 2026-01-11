import React, { useRef } from 'react';

// Sample Data
const sampleData = {
  session: "2024-25",
  
  student: {
    name: "RAJESH KUMAR SHARMA",
    fatherName: "RAMESH KUMAR SHARMA",
    motherName: "SUNITA SHARMA",
    dob: "15-08-2012",
    class: "X",
    section: "A",
    scholarNo: "2024-ST-1234",
    photo: "https://via.placeholder.com/80x100"
  },
  
  scholastic: [
    {
      subject: "ENGLISH",
      unitTest: { max: 20, obt: 16 },
      term1: { max: 80, obt: 68 },
      term2: { max: 80, obt: 72 },
      annual: { max: 100, obt: 85 },
      grade: "A1"
    },
    {
      subject: "HINDI",
      unitTest: { max: 20, obt: 18 },
      term1: { max: 80, obt: 70 },
      term2: { max: 80, obt: 75 },
      annual: { max: 100, obt: 88 },
      grade: "A1"
    },
    {
      subject: "MATHEMATICS",
      unitTest: { max: 20, obt: 17 },
      term1: { max: 80, obt: 72 },
      term2: { max: 80, obt: 76 },
      annual: { max: 100, obt: 90 },
      grade: "A1"
    },
    {
      subject: "SCIENCE",
      unitTest: { max: 20, obt: 15 },
      term1: { max: 80, obt: 65 },
      term2: { max: 80, obt: 70 },
      annual: { max: 100, obt: 82 },
      grade: "A2"
    },
    {
      subject: "SOCIAL SCIENCE",
      unitTest: { max: 20, obt: 16 },
      term1: { max: 80, obt: 67 },
      term2: { max: 80, obt: 71 },
      annual: { max: 100, obt: 84 },
      grade: "A1"
    },
    {
      subject: "COMPUTER",
      unitTest: { max: 20, obt: 19 },
      term1: { max: 80, obt: 75 },
      term2: { max: 80, obt: 78 },
      annual: { max: 100, obt: 92 },
      grade: "A1"
    }
  ],
  
  totals: {
    unitTest: { max: 120, obt: 101 },
    term1: { max: 480, obt: 417 },
    term2: { max: 480, obt: 442 },
    annual: { max: 600, obt: 521 },
    aggregatePercentage: "86.83%"
  },
  
  nonScholastic: {
    coCurricular: [
      { name: "Sports/Games", grade: "A" },
      { name: "Music", grade: "B" },
      { name: "Dance", grade: "A" },
      { name: "Art & Craft", grade: "B" },
      { name: "Drama", grade: "A" }
    ],
    
    personalAttributes: [
      { name: "Discipline", grade: "A" },
      { name: "Regularity & Punctuality", grade: "A" },
      { name: "Neatness", grade: "B" },
      { name: "Courtesy", grade: "A" },
      { name: "Responsibility", grade: "A" }
    ],
    
    health: {
      height: "152",
      weight: "45",
      physical: "Good"
    },
    
    attendance: {
      workingDays: "220",
      attended: "210",
      percentage: "95.45%"
    }
  },
  
  result: "Pass & Congratulations! Promoted to Class XI"
};

// Marksheet Template Component
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
            min-height: 297mm;
            padding: 10mm;
            background: white;
            font-family: 'Cambria', 'Georgia', serif;
            color: black;
            margin: 0 auto;
            position: relative;
        }
        
        /* Main Borders */
        .outer-border {
            border: 2px solid #000;
            padding: 3px;
            height: 100%;
            display: flex;
            flex-direction: column;
        }
        .inner-border {
            border: 1px solid #000;
            padding: 15px;
            flex-grow: 1;
            position: relative;
            display: flex;
            flex-direction: column;
        }

        /* Header */
        .header {
            display: flex;
            flex-direction: column;
            align-items: center;
            margin-bottom: 10px;
            text-align: center;
        }
        .logo-container {
            margin-bottom: 5px;
        }
        .logo {
            width: 80px;
            height: 80px;
            object-fit: contain;
        }
        .school-info {
            text-align: center;
            width: 100%;
        }
        .school-name {
            color: #006FBF;
            font-size: 24px;
            font-weight: 900;
            text-transform: uppercase;
            letter-spacing: 0.5px;
            margin-bottom: 4px;
            line-height: 1.1;
            text-shadow: 0.5px 0px 0px #006FBF;
        }
        .school-address {
            font-size: 11px;
            margin-bottom: 2px;
            font-weight: 600;
        }
        .school-contact {
            font-size: 10px;
            margin-top: 1px;
        }
        .school-contact a {
            color: #000;
            text-decoration: none;
        }

        /* Title */
        .title-section {
            text-align: center;
            margin: 5px 0 15px 0;
            border-top: 1px solid #000;
            border-bottom: 1px solid #000;
            padding: 5px 0;
            background-color: #f9f9f9;
        }
        .title-main {
            color: #000;
            font-size: 16px;
            font-weight: bold;
            text-transform: uppercase;
            margin-bottom: 2px;
            letter-spacing: 1px;
        }
        .title-session {
            color: #C9211E;
            font-size: 14px;
            font-weight: bold;
        }

        /* Student Info */
        .student-info-container {
            display: flex;
            margin-bottom: 15px;
            border: 1px solid #000;
            padding: 8px;
        }
        .student-details {
            flex-grow: 1;
        }
        .student-table {
            width: 100%;
            font-size: 12px;
            border-collapse: collapse;
        }
        .student-table td {
            padding: 3px 0;
            vertical-align: top;
        }
        .label {
            font-weight: bold;
            width: 130px;
            color: #006FBF;
        }
        .value {
            font-weight: 600;
            text-transform: uppercase;
            color: #000;
        }
        .photo-container {
            margin-left: 15px;
            width: 90px;
            height: 110px;
            border: 1px solid #000;
            display: flex;
            align-items: center;
            justify-content: center;
            background: #f0f0f0;
            overflow: hidden;
            padding: 2px;
        }
        .student-photo {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        /* Section Headers */
        .section-header {
            font-size: 12px;
            font-weight: bold;
            background: #006FBF;
            color: white;
            padding: 4px 10px;
            margin-bottom: 0;
            display: block;
            text-align: center;
            border: 1px solid #000;
            border-bottom: none;
        }
        
        /* Tables */
        .marks-table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11px;
            margin-bottom: 15px;
            border: 1px solid black;
        }
        .marks-table th, .marks-table td {
            border: 1px solid black;
            padding: 4px;
            text-align: center;
            vertical-align: middle;
            line-height: 1.2;
        }
        .marks-table th {
            background-color: #e6f0f9;
            font-weight: bold;
            font-size: 10px;
            color: #000;
        }
        .subject-col {
            text-align: left !important;
            padding-left: 8px !important;
            font-weight: bold;
            width: 20%;
        }
        .grand-total {
            font-weight: bold;
            background-color: #f0f9ff;
        }

        /* Non-Scholastic & Health */
        .dual-table-container {
            display: flex;
            border: 1px solid black;
            margin-bottom: 15px;
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
            background-color: #e6f0f9;
            font-weight: bold;
            border-bottom: 1px solid black;
            padding: 5px;
            text-align: center;
            font-size: 10px;
        }
        .sub-table td {
            padding: 5px 8px;
            border-bottom: 1px solid #000;
            vertical-align: middle;
        }
        .sub-table tr:last-child td {
            border-bottom: none;
        }
        .sub-table td:last-child {
            border-left: 1px solid black;
            text-align: center;
            width: 30%;
            font-weight: bold;
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
            border: 2px solid #000;
            padding: 10px;
            font-size: 14px;
            font-weight: bold;
            margin-top: 5px;
            margin-bottom: 20px;
            text-align: center;
            background: #f9f9f9;
        }

        /* Signatures */
        .signatures {
            display: flex;
            justify-content: space-between;
            padding: 0 40px;
            margin-bottom: 10px;
            margin-top: auto;
        }
        .sig-block {
            text-align: center;
            font-weight: bold;
            font-size: 12px;
            width: 150px;
            border-top: 1px solid #000;
            padding-top: 5px;
            margin-top: 40px;
        }
        .principal-sig {
            /* Standardize Principal signature */
        }

        @media print {
            body {
                margin: 0;
                padding: 0;
            }
            .page {
                margin: 0;
                box-shadow: none;
            }
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

// Main App Component
export default function App() {
  const componentRef = useRef();

  const handlePrint = () => {
    window.print();
  };

  return (
    <div style={{ backgroundColor: '#e5e5e5', minHeight: '100vh', padding: '20px' }}>
      <div style={{ maxWidth: '210mm', margin: '0 auto', marginBottom: '20px' }}>
        <button 
          onClick={handlePrint}
          style={{
            backgroundColor: '#006FBF',
            color: 'white',
            padding: '10px 20px',
            border: 'none',
            borderRadius: '5px',
            fontSize: '16px',
            cursor: 'pointer',
            fontWeight: 'bold'
          }}
        >
          🖨️ Print Marksheet
        </button>
      </div>
      <MarksheetTemplate data={sampleData} componentRef={componentRef} />
    </div>
  );
}