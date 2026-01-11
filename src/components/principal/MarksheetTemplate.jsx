import React, { forwardRef } from 'react';
import schoolLogo from '../../assets/school logo.jpg';

const MarksheetTemplate = forwardRef(({ data }, ref) => {
  if (!data) return null;

  const { student, scholastic, totals, nonScholastic, session, result } = data;

  // Pair Co-Curricular and Personal Attributes for side-by-side display
  const coCurricular = nonScholastic?.coCurricular || [];
  const personalAttributes = nonScholastic?.personalAttributes || [];
  const maxRows = Math.max(coCurricular.length, personalAttributes.length, 5); // Ensure at least 5 rows like sample
  const activityRows = [];
  
  for (let i = 0; i < maxRows; i++) {
    activityRows.push({
      co: coCurricular[i] || { name: '', grade: '' },
      pa: personalAttributes[i] || { name: '', grade: '' }
    });
  }

  // Result handling
  const division = typeof result === 'object' ? result.division : '';
  const remark = typeof result === 'object' ? result.remark : '';

  return (
    <div ref={ref}>
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
            size: A4;
            margin: 10mm;
        }
        @font-face {
            font-family: 'Cambria';
            src: local('Cambria');
        }
        * {
            box-sizing: border-box;
            -webkit-print-color-adjust: exact;
        }
        .page {
            width: 210mm;
            min-height: 297mm;
            padding: 10px;
            background: white;
            font-family: 'Cambria', serif;
            color: black;
            margin: 0 auto;
            position: relative;
            font-size: 11pt;
            line-height: 1.15;
        }
        
        /* New Section Wrappers */
        .main-section {
            border: 2px solid black;
            padding: 10px;
            height: 100%;
            position: relative;
            margin: 5px;
        }

        .main-header {
            display: flex;
            align-items: center;
            gap: 0px;
            margin-bottom: 10px;
        }

        .header-logo {
            width: 80px;
            flex: 0 0 80px;
            display: flex;
            align-items: center;
            justify-content: center;
        }

        .header-logo img {
            width: 70px;
            height: 70px;
            object-fit: contain;
        }

        .header-details {
            flex: 1;
            text-align: center;
        }

        .school-name {
            display: block;
            color: #006FBF;
            font-size: 26pt;
            font-weight: bold;
            font-family: 'Calibri', sans-serif;
            line-height: 1;
        }

        .school-address {
            display: block;
            color: #333;
            font-size: 11pt;
            font-family: 'Cambria', serif;
            margin-top: 5px;
            line-height: 1.2;
        }

        .school-email {
            display: block;
            color: #000;
            font-size: 9pt;
            font-family: 'Cambria', serif;
            margin-top: 3px;
            line-height: 1.2;
        }

        .school-email a {
            color: #000;
            text-decoration: none;
            font-weight: normal;
        }

        .student-info-section {
            margin-bottom: 15px;
            position: relative;
        }

        .scholastic-section {
            margin-bottom: 15px;
        }

        .non-scholastic-section {
            margin-bottom: 15px;
        }

        .final-result-section {
            margin-top: 5px;
        }

        /* Title */
        .title-section {
            text-align: center;
            margin-top: 10px;
            margin-bottom: 15px;
        }
        .title-main {
            font-size: 13pt;
            font-family: 'Arial', sans-serif;
            font-weight: bold;
            color: #18A303;
            text-transform: uppercase;
        }
        .title-session {
            font-size: 13pt;
            font-family: 'Arial', sans-serif;
            font-weight: bold;
            color: #C9211E;
            margin-top: 5px;
        }
        .divider-line {
            border-top: 2px solid #000;
            width: 100%;
            margin: 5px auto;
            height: 2px;
        }

        /* Student Info Internal */
        .student-info {
            font-family: 'Cambria', serif;
            font-size: 11pt;
            position: relative;
        }
        .info-row {
            margin-bottom: 5px;
        }
        .info-label {
            font-weight: bold;
            display: inline-block;
            width: 140px;
        }
        .info-value {
            font-weight: normal;
        }
        .photo-box {
            position: absolute;
            top: 0;
            right: 0;
            width: 90px;
            height: 110px;
            border: 1px solid #000;
            padding: 2px;
        }
        .student-photo {
            width: 100%;
            height: 100%;
            object-fit: cover;
        }

        /* Tables */
        table {
            width: 100%;
            border-collapse: collapse;
            font-size: 11pt;
            font-family: 'Cambria', serif;
        }
        .main-table {
            border: 1px solid black;
        }
        .main-table th, .main-table td {
            border: 1px solid black;
            padding: 3px;
            text-align: center;
        }
        .subject-col {
            text-align: left !important;
            padding-left: 5px !important;
            width: 25%;
        }
        
        /* Footer/Signatures */
        .signatures {
            margin-top: 60px;
            display: flex;
            justify-content: space-between;
            padding: 0 50px;
            font-weight: bold;
        }
        .sig-line {
            border-top: 1px solid black;
            width: 150px;
            text-align: center;
            padding-top: 5px;
        }

      `}} />

      <div className="page">
        {/* Main Section with Black Border */}
        <div className="main-section">
            
            {/* Header Area */}
            <div style={{ display: 'flex', flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2px', borderBottom: '2px solid black', paddingBottom: '5px'}}>
                {/* Left Div: School Logo */}
                <div style={{ width: '100px', display: 'flex', justifyContent: 'center', alignItems: 'flex-start' }}>
                    <img 
                        src={schoolLogo} 
                        alt="School Logo" 
                        style={{ width: '100px', height: 'auto' }} 
                    />
                </div>
                {/* Right Div: School Details */}
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
                    {/* School Name */}
                    <span style={{ 
                        color: '#006ebe', 
                        fontSize: '35px', 
                        fontFamily: 'Calibri, sans-serif', 
                        fontWeight: 'bold',
                        display: 'block',
                        marginBottom: '-4px'
                    }}>
                        LITTLE FLOWER CONVENT HR. SEC. SCHOOL
                    </span>
                    
                    {/* School Address */}
                    <span style={{ 
                        color: 'black', 
                        fontSize: '14px', 
                        fontFamily: 'Liberation Serif, serif',
                        display: 'block',
                        marginTop: '2px',
                        whiteSpace: 'pre-line'
                    }}>
                        {`Opposite Capital Mall, Narmadapuram Road, Misrod Bhopal-26. (MP)`}
                    </span>
                    <span style={{ 
                        color: 'black', 
                        fontSize: '12px', 
                        fontFamily: 'Liberation Serif, serif',
                        display: 'block',
                        marginTop: '2px',
                        whiteSpace: 'pre-line'
                    }}>
                        {`Affiliated to MP. BOARD, Affiliation No. 632437`}
                    </span>
                    
                    {/* Email ID */}
                    <span style={{ 
                        color: 'black', 
                        fontSize: '12px', 
                        fontFamily: 'inherit',
                        display: 'block',
                        marginTop: '2px'
                    }}>
<b>Email - 
<a href="mailto:littlefloweragp@gamil.com" style={{color: '#3333ff', textDecoration: 'underline'}}>
  littlefloweragp@gamil.com
</a></b>,
<b> 
<a href="http://www.littleflowerschoolmisrod.com/" style={{color: '#3333ff', textDecoration: 'underline'}}>
  www.littleflowerschoolmisrod.com
</a></b>
                    </span>
                </div>
            </div>

            {/* Student Info Section */}
            <div className="student-info-section" style={{ marginBottom: '10px' }}>
                
                {/* 1st Detail Box */}
                <div style={{ display: 'flex', flexDirection: 'row',  }}>
                    
                    {/* Left Div: Details */}
                    <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
                        
                        {/* Upper Div: Title & Session */}
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'center', 
                            justifyContent: 'center',
                            padding: '2px 0',
                            
                        }}>
                            <span style={{ 
                                color: '#18a303', 
                                fontSize: '20px', 
                                fontFamily: 'Arial, sans-serif', 
                                fontWeight: 'bold', 
                                marginLeft : '120px'
                            }}>
                                RECORD OF ANNUAL ACADEMIC PERFORMANCE
                            </span>
                            <span style={{ 
                                color: '#c8201d', 
                                fontSize: '20px', 
                                fontFamily: 'Arial, sans-serif', 
                                fontWeight: 'bold',
                                marginTop: '5px',
                                marginLeft : '120px'
                            }}>
                                {session || '2025-26'}
                            </span>
                        </div>

                        {/* Lower Div: Student Personal Info */}
                        <div style={{ 
                            display: 'flex', 
                            flexDirection: 'column', 
                            alignItems: 'flex-start',
                            padding: '10px',
                            gap: '5px'
                        }}>
                            {/* Student Name */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ width: '130px', color: 'black', fontSize: '15px', fontFamily: 'Cambria, serif', fontWeight: 'bold' }}>
                                    Name of Student
                                </span>
                                <span style={{ color: 'black', fontSize: '15px', fontFamily: 'Cambria, serif', fontWeight: 'bold' }}>:</span>
                                <span style={{ color: 'black', fontSize: '15px', fontFamily: 'Cambria, serif', fontWeight: 'bold' }}>
                                    {student.name}
                                </span>
                            </div>

                            {/* Father's Name */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ width: '130px', color: 'black', fontSize: '15px', fontFamily: 'Cambria, serif', fontWeight: 'bold' }}>
                                    Father’s Name
                                </span>
                                <span style={{ color: 'black', fontSize: '15px', fontFamily: 'Cambria, serif', fontWeight: 'bold' }}>:</span>
                                <span style={{ color: 'black', fontSize: '15px', fontFamily: 'Cambria, serif' }}>
                                    {student.fatherName}
                                </span>
                            </div>

                            {/* Mother's Name */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ width: '130px', color: 'black', fontSize: '15px', fontFamily: 'Cambria, serif', fontWeight: 'bold' }}>
                                    Mother’s Name
                                </span>
                                <span style={{ color: 'black', fontSize: '15px', fontFamily: 'Cambria, serif', fontWeight: 'bold' }}>:</span>
                                <span style={{ color: 'black', fontSize: '15px', fontFamily: 'Cambria, serif' }}>
                                    {student.motherName}
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Right Div: Student Photo */}
                    <div style={{ 
                        width: '120px', 
                        
                        display: 'flex', 
                        justifyContent: 'center', 
                        alignItems: 'center',
                        padding: '5px'
                    }}>
                        <img 
                            src={student.photo || "https://via.placeholder.com/90x110"} 
                            alt="Student" 
                            style={{ width: '90px', height: '110px', objectFit: 'cover', border: '1px solid #ccc' }}
                        />
                    </div>
                </div>

                {/* 2nd Detail Box */}
                <div style={{ 
                    display: 'flex', 
                    flexDirection: 'row', 
                    marginTop : '-6px',
                    padding: '0px 10px',
                    justifyContent: 'space-between'
                }}>
                    {/* Date of Birth */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <span style={{ color: 'black', fontSize: '15px', fontFamily: 'Cambria, serif', fontWeight: 'bold' }}>
                            Date of Birth
                        </span>
                        <span style={{ color: 'black', fontSize: '15px', fontFamily: 'Cambria, serif', fontWeight: 'bold',marginLeft: '34px' }}>:</span>
                        <span style={{ color: 'black', fontSize: '15px', fontFamily: 'Cambria, serif', marginLeft: '-16px' }}>
                            {(() => {
                                const d = new Date(student.dob);
                                return `${d.getDate()} ${d.toLocaleString('default', { month: 'long' })} ${d.getFullYear()}`;
                            })()}
                        </span>
                    </div>

                    {/* Class */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ color: 'black', fontSize: '15px', fontFamily: 'Cambria, serif', fontWeight: 'bold', marginLeft: '-70px' }}>
                            Class
                        </span>
                        <span style={{ color: 'black', fontSize: '15px', fontFamily: 'Cambria, serif', fontWeight: 'bold' }}>:</span>
                        <span style={{ color: 'black', fontSize: '15px', fontFamily: 'Cambria, serif', fontWeight: 'bold' }}>
                            {student.class}
                        </span>
                        <span style={{ color: 'black', fontSize: '15px', fontFamily: 'Cambria, serif', fontWeight: 'bold' }}>
                            - Sec: A
                        </span>
                    </div>

                    {/* Scholar No */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                        <span style={{ color: 'black', fontSize: '15px', fontFamily: 'Cambria, serif', fontWeight: 'bold' }}>
                            Scholar No
                        </span>
                        <span style={{ color: 'black', fontSize: '15px', fontFamily: 'Cambria, serif', fontWeight: 'bold' }}>:</span>
                        <span style={{ color: 'black', fontSize: '15px', fontFamily: 'Cambria, serif', fontWeight: 'bold' }}>
                            {student.scholarNo}
                        </span>
                    </div>
                </div>

            </div>

            {/* Scholastic Section */}
            <div className="scholastic-section">
                <table className="main-table">
                    <thead>
                        <tr>
                            <th colSpan="10" style={{textAlign: 'left', padding: '5px'}}><b>SCHOLASTIC</b></th>
                        </tr>
                        <tr>
                            <th rowSpan="2" className="subject-col">SUBJECT</th>
                            <th colSpan="2">UNIT TEST</th>
                            <th colSpan="2">I TERMINAL</th>
                            <th colSpan="2">II TERMINAL</th>
                            <th colSpan="2">ANNUAL EXAM</th>
                            <th rowSpan="2" style={{width: '80px'}}>ANNUAL<br/>AGGREGATE<br/><span style={{fontSize: '9pt'}}>(Grade)</span></th>
                        </tr>
                        <tr>
                            <th>Max</th>
                            <th>OBT</th>
                            <th>Max</th>
                            <th>OBT</th>
                            <th>Max</th>
                            <th>OBT</th>
                            <th>Max</th>
                            <th>OBT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scholastic.map((sub, index) => (
                            <tr key={index}>
                                <td className="subject-col">{sub.subject}</td>
                                <td>{sub.unitTest.max !== '-' ? sub.unitTest.max : ''}</td>
                                <td>{sub.unitTest.obt !== '-' ? sub.unitTest.obt : ''}</td>
                                <td>{sub.term1.max !== '-' ? sub.term1.max : ''}</td>
                                <td>{sub.term1.obt !== '-' ? sub.term1.obt : ''}</td>
                                <td>{sub.term2.max !== '-' ? sub.term2.max : ''}</td>
                                <td>{sub.term2.obt !== '-' ? sub.term2.obt : ''}</td>
                                <td>{sub.annual.max !== '-' ? sub.annual.max : ''}</td>
                                <td>{sub.annual.obt !== '-' ? sub.annual.obt : ''}</td>
                                <td>{sub.grade}</td>
                            </tr>
                        ))}
                        {/* Grand Total Row */}
                        <tr style={{fontWeight: 'bold'}}>
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
                        {/* Percentage Row */}
                        <tr>
                            <td className="subject-col" style={{fontWeight: 'bold'}}>Percentage %</td>
                            <td colSpan="2"></td>
                            <td colSpan="2"></td>
                            <td colSpan="2"></td>
                            <td colSpan="2"></td>
                            <td style={{fontWeight: 'bold'}}>{totals.aggregatePercentage}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Non Scholastic Section */}
            <div className="non-scholastic-section">
                <table className="main-table">
                    <thead>
                        <tr>
                            <th colSpan="5" style={{textAlign: 'left', padding: '5px'}}><b>NON SCHOLASTIC</b></th>
                        </tr>
                        <tr>
                            <th colSpan="3" style={{width: '50%'}}>CO-CURRICULAR ACTIVITY</th>
                            <th colSpan="2" style={{width: '50%'}}>PERSONAL ATTRIBUTES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activityRows.map((row, i) => (
                            <tr key={i}>
                                <td colSpan="2" style={{textAlign: 'left', paddingLeft: '5px'}}>{row.co.name}</td>
                                <td>{row.co.grade}</td>
                                <td style={{textAlign: 'left', paddingLeft: '5px'}}>{row.pa.name}</td>
                                <td>{row.pa.grade}</td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Final Result Section (Includes Health, Attendance, Result, Signatures) */}
            <div className="final-result-section">
                <table className="main-table" style={{borderTop: 'none'}}>
                    <thead>
                        <tr>
                            <th colSpan="3" style={{width: '50%'}}>HEALTH ASPECTS</th>
                            <th colSpan="2" style={{width: '50%'}}>ATTENDANCE</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr>
                            <td colSpan="2" style={{textAlign: 'left', paddingLeft: '5px'}}>Height (in cm)</td>
                            <td>{nonScholastic?.health?.height || ''}</td>
                            <td style={{textAlign: 'left', paddingLeft: '5px'}}>Total Working Days</td>
                            <td>{nonScholastic?.attendance?.workingDays || ''}</td>
                        </tr>
                        <tr>
                            <td colSpan="2" style={{textAlign: 'left', paddingLeft: '5px'}}>Weight (in kg)</td>
                            <td>{nonScholastic?.health?.weight || ''}</td>
                            <td style={{textAlign: 'left', paddingLeft: '5px'}}>Total Days Attended</td>
                            <td>{nonScholastic?.attendance?.attended || ''}</td>
                        </tr>
                        <tr>
                            <td colSpan="2" style={{textAlign: 'left', paddingLeft: '5px'}}>Physical Development</td>
                            <td>{nonScholastic?.health?.physical || ''}</td>
                            <td style={{textAlign: 'left', paddingLeft: '5px'}}>Percentage of Attendance</td>
                            <td>{nonScholastic?.attendance?.percentage || ''}</td>
                        </tr>
                        <tr>
                            <td colSpan="3" style={{textAlign: 'left', paddingLeft: '5px', height: '30px'}}>Division: - {division}</td>
                            <td colSpan="2" style={{textAlign: 'left', paddingLeft: '5px'}}>Date of Issue: -</td>
                        </tr>
                        <tr>
                            <td colSpan="3" style={{textAlign: 'left', paddingLeft: '5px', height: '30px'}}>Remark: - {remark}</td>
                            <td colSpan="2" style={{textAlign: 'left', paddingLeft: '5px'}}>School Reopen On: -</td>
                        </tr>
                    </tbody>
                </table>

                <div className="signatures">
                    <div className="sig-line">Class Teacher</div>
                    <div className="sig-line">Principal</div>
                    <div className="sig-line">Parent</div>
                </div>
            </div>

        </div>
      </div>
    </div>
  );
});

export default MarksheetTemplate;
