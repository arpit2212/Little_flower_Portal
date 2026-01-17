import React, { forwardRef } from 'react';
import schoolLogo from '../../assets/school logo.jpg';

const getNextClassLabel = (cls) => {
  if (!cls) return '';

  const raw = String(cls).trim().toLowerCase();

  if (raw === 'nursery') return 'LKG';
  if (raw === 'lkg') return 'UKG';
  if (raw === 'ukg') return '1st';

  if (raw === 'kg1' || raw === 'kg 1' || raw === 'kg-i' || raw === 'kg i') {
    return 'UKG';
  }

  if (raw === 'kg2' || raw === 'kg 2' || raw === 'kg-ii' || raw === 'kg ii') {
    return '1st';
  }

  const match = raw.match(/(\d+)/);
  if (!match) return cls;

  const num = parseInt(match[1], 10) + 1;
  const mod10 = num % 10;
  const mod100 = num % 100;

  let suffix = 'th';
  if (mod10 === 1 && mod100 !== 11) suffix = 'st';
  else if (mod10 === 2 && mod100 !== 12) suffix = 'nd';
  else if (mod10 === 3 && mod100 !== 13) suffix = 'rd';

  return `${num}${suffix}`;
};

const getDivisionFromTotals = (totals) => {
  if (!totals) return '';

  const parseSafe = (v) => {
    const n = parseFloat(v || 0);
    return Number.isNaN(n) ? 0 : n;
  };

  const allMax =
    parseSafe(totals.unitTest?.max) +
    parseSafe(totals.term1?.max) +
    parseSafe(totals.term2?.max) +
    parseSafe(totals.annual?.max);

  const allObt =
    parseSafe(totals.unitTest?.obt) +
    parseSafe(totals.term1?.obt) +
    parseSafe(totals.term2?.obt) +
    parseSafe(totals.annual?.obt);

  if (allMax <= 0) return '';

  const value = (allObt / allMax) * 100;

  if (value >= 60) return <>1<sup>st</sup> </>;
  if (value >= 45) return <>2<sup>nd</sup> </>;
  if (value >= 33) return <>3<sup>rd</sup> </>;
  return 'Detain';
};

const renderClassWithSup = (cls) => {
  if (!cls) return '';
  const raw = String(cls).trim().toLowerCase();
  if (raw === 'nursery') return 'Nursery';
  if (raw === 'lkg') return 'LKG';
  if (raw === 'ukg') return 'UKG';
  const isKg = raw.includes('kg');
  const match = raw.match(/(\d+)/);
  if (!match) return cls;
  const num = parseInt(match[1], 10);
  const mod10 = num % 10;
  const mod100 = num % 100;
  let suffix = 'th';
  if (mod10 === 1 && mod100 !== 11) suffix = 'st';
  else if (mod10 === 2 && mod100 !== 12) suffix = 'nd';
  else if (mod10 === 3 && mod100 !== 13) suffix = 'rd';
  return (
    <>
      {isKg ? 'KG' : ''}
      {isKg ? '' : ''}
      {num}
      <sup>{suffix}</sup>
    </>
  );
};

const formatFatherName = (name) => {
  const n = String(name || '').trim();
  if (!n) return '';
  if (/(^|\s)mr\.?\b/i.test(n)) return n;
  return `Mr. ${n}`;
};

const formatMotherName = (name) => {
  const n = String(name || '').trim();
  if (!n) return '';
  if (/(^|\s)mrs\.?\b/i.test(n)) return n;
  return `Mrs. ${n}`;
};

const MarksheetTemplate = forwardRef(({ data }, ref) => {
  if (!data) return null;

  const { student, scholastic, totals, nonScholastic, session, result } = data;

  const isClass1To5 = (() => {
    if (!student || !student.class) return false;
    const raw = String(student.class).trim().toLowerCase();
    if (raw.includes('kg') || raw.includes('nursery')) return false;
    const match = raw.match(/(\d+)/);
    if (!match) return false;
    const num = parseInt(match[1], 10);
    return num >= 1 && num <= 5;
  })();

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

  const division = getDivisionFromTotals(totals);
  

  return (
    <div ref={ref}>
      <style dangerouslySetInnerHTML={{ __html: `
        @page {
            size: A4;
            margin: -2mm;
            width : 210mm;
            height : 300mm;
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
            padding: 0px;
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
            width: 18%;
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
        <div className="main-section" style={{  margin: '20px' }}>
            
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
            <div className="student-info-section" style={{ marginBottom: '10px', marginTop: '10px' }}>
                
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
                                color: '#006ebe', 
                                fontSize: '22px', 
                                fontFamily: 'Arial, sans-serif', 
                                fontWeight: 'bold', 
                                marginLeft : '120px'
                            }}>
                                ANNUAL ACADEMIC RECORD
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
                                    {formatFatherName(student.fatherName)}
                                </span>
                            </div>

                            {/* Mother's Name */}
                            <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                <span style={{ width: '130px', color: 'black', fontSize: '15px', fontFamily: 'Cambria, serif', fontWeight: 'bold' }}>
                                    Mother’s Name
                                </span>
                                <span style={{ color: 'black', fontSize: '15px', fontFamily: 'Cambria, serif', fontWeight: 'bold' }}>:</span>
                                <span style={{ color: 'black', fontSize: '15px', fontFamily: 'Cambria, serif' }}>
                                    {formatMotherName(student.motherName)}
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
                        <span style={{ color: 'black', fontSize: '15px', fontFamily: 'Cambria, serif', fontWeight: 'bold',marginLeft: '44px' }}>:</span>
                        <span style={{ color: 'black', fontSize: '15px', fontFamily: 'Cambria, serif', marginLeft: '-5px' }}>
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
                            {renderClassWithSup(student.class)}
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
            <div className="scholastic-section" style={{marginTop: '10px'}}>
                <table className="main-table">
                    <colgroup>
                        <col style={{ width: '18%' }} />
                        <col style={{ width: '8%' }} />
                        <col style={{ width: '9%' }} />
                        <col style={{ width: '7%' }} />
                        <col style={{ width: '8%' }} />
                        <col style={{ width: '8%' }} />
                        <col style={{ width: '8%' }} />
                        <col style={{ width: '9%' }} />
                        <col style={{ width: '10%' }} />
                        <col style={{ width: '11%' }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th colSpan="10" style={{textAlign: 'left', padding: '10px'}}><b>SCHOLASTIC</b></th>
                        </tr>
                        <tr style={{ padding: '10px'}}>
                            <th rowSpan="2" className="subject-col"style={{fontSize: '15px'}}>SUBJECT</th>
                            <th colSpan="2" style={{fontSize: '15px'}}>UNIT TEST</th>
                            <th colSpan="2" style={{fontSize: '15px'}}>I TERMINAL</th>
                            <th colSpan="2" style={{fontSize: '15px'}}>II TERMINAL</th>
                            <th colSpan="2" style={{fontSize: '15px'}}>ANNUAL EXAM</th>
                            <th rowSpan="2" style={{width: '18%'}}>ANNUAL<br/>AGGREGATE<br/><span style={{fontSize: '9pt'}}>(Grade)</span></th>
                        </tr>
                        <tr style={{ padding: '10px'}}>
                            <th style={{fontSize: '15px'}}>Max</th>
                            <th style={{fontSize: '15px'}}>OBT</th>
                            <th style={{fontSize: '15px'}}>Max</th>
                            <th style={{fontSize: '15px'}}>OBT</th>
                            <th style={{fontSize: '15px'}}>Max</th>
                            <th style={{fontSize: '15px'}}>OBT</th>
                            <th style={{fontSize: '15px'}}>Max</th>
                            <th style={{fontSize: '15px'}}>OBT</th>
                        </tr>
                    </thead>
                    <tbody>
                        {scholastic.map((sub, index) => (
                            <tr  key={index}>
                                <td style={{ 
                                                                            ...(isClass1To5 ? { padding: '7px' } : { padding: '5px' })


                                }}  className="subject-col">{sub.subject}</td>
                                <td style={{fontSize: '15px'}}>{sub.unitTest.max !== '-' ? sub.unitTest.max : ''}</td>
                                <td style={{fontSize: '15px'}}>{sub.unitTest.obt !== '-' ? sub.unitTest.obt : ''}</td>
                                <td style={{fontSize: '15px'}}>{sub.term1.max !== '-' ? sub.term1.max : ''}</td>
                                <td style={{fontSize: '15px'}}>{sub.term1.obt !== '-' ? sub.term1.obt : ''}</td>
                                <td style={{fontSize: '15px'}}>{sub.term2.max !== '-' ? sub.term2.max : ''}</td>
                                <td style={{fontSize: '15px'}}>{sub.term2.obt !== '-' ? sub.term2.obt : ''}</td>
                                <td style={{fontSize: '15px'}}>{sub.annual.max !== '-' ? sub.annual.max : ''}</td>
                                <td style={{fontSize: '15px'}}>{sub.annual.obt !== '-' ? sub.annual.obt : ''}</td>
                                <td style={{fontSize: '15px'}}><b>{sub.grade}</b></td>
                            </tr>
                        ))}
                        {/* Grand Total Row */}
                        <tr style={{fontWeight: 'bold'}}>
                            <td className="subject-col">Grand Total</td>
                            <td style={{fontSize: '15px'}}>{totals.unitTest.max}</td>
                            <td style={{fontSize: '15px'}}>{totals.unitTest.obt}</td>
                            <td style={{fontSize: '15px'}}>{totals.term1.max}</td>
                            <td style={{fontSize: '15px'}}>{totals.term1.obt}</td>
                            <td style={{fontSize: '15px'}}>{totals.term2.max}</td>
                            <td style={{fontSize: '15px'}}>{totals.term2.obt}</td>
                            <td style={{fontSize: '15px'}}>{totals.annual.max}</td>
                            <td style={{fontSize: '15px'}}>{totals.annual.obt}</td>
                            <td style={{fontSize: '15px'}}>{totals.aggregateGrade}</td>
                        </tr>
                        {/* Percentage Row */}
                        <tr>
                            <td className="subject-col" style={{fontSize: '15px', fontWeight: 'bold', padding: '7px'}}>Percentage %</td>
                           <td colSpan="2" style={{fontSize: '15px'}}> <b> {totals.unitTest.percentage ? `${totals.unitTest.percentage}%` : ''}</b></td>
                             <td colSpan="2" style={{fontSize: '15px'}}><b> {totals.term1.percentage ? `${totals.term1.percentage}%` : ''}</b></td>
                               <td colSpan="2" style={{fontSize: '15px'}}><b> {totals.term2.percentage ? `${totals.term2.percentage}%` : ''}</b></td>
                              <td colSpan="2" style={{fontSize: '15px'}}><b> {totals.annual.percentage ? `${totals.annual.percentage}%` : ''}</b></td>
                            <td style={{fontSize: '15px', fontWeight: 'bold'}}>{totals.aggregatePercentage}</td>
                        </tr>
                    </tbody>
                </table>
            </div>

            {/* Non Scholastic Section */}
            <div className="non-scholastic-section" style={{marginTop: '10px'}}>
                <table className="main-table">
                    <colgroup>
                        <col style={{ width: '17.5%' }} />
                        <col style={{ width: '17.5%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '35%' }} />
                        <col style={{ width: '15%' }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th colSpan="5" style={{fontSize: '15px', textAlign: 'left', padding: '5px'}}><b>NON SCHOLASTIC</b></th>
                        </tr>
                        <tr>
                            <th colSpan="3" style={{fontSize: '15px', width: '50%'}}>CO-CURRICULAR ACTIVITY</th>
                            <th colSpan="2" style={{fontSize: '15px', width: '50%'}}>PERSONAL ATTRIBUTES</th>
                        </tr>
                    </thead>
                    <tbody>
                        {activityRows.map((row, i) => (
                            <tr key={i}>
                                <td
                                    colSpan="2"
                                    style={{
                                        fontSize: '15px',
                                        textAlign: 'left',
                                        width: '35%',
                                        ...(isClass1To5 ? { padding: '7px' } : { padding: '0px', paddingLeft: '7px' })
                                    }}
                                >
                                    {row.co.name}
                                </td>
                                <td style={{fontSize: '15px', width: '15%'}}>
                                    <b>{row.co.grade}</b>
                                </td>
                                <td
                                    style={{fontSize: '15px', textAlign: 'left', paddingLeft: '5px', width: '35%'}}
                                >
                                    {row.pa.name}
                                </td>
                                <td style={{fontSize: '15px', width: '15%'}}>
                                    <b>{row.pa.grade}</b>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
            
            {/* Final Result Section (Includes Health, Attendance, Result, Signatures) */}
            <div className="final-result-section" style={{marginTop: '-15px'}}>
                <table className="main-table" style={{borderTop: 'none'}}>
                    <colgroup>
                        <col style={{ width: '17.5%' }} />
                        <col style={{ width: '17.5%' }} />
                        <col style={{ width: '15%' }} />
                        <col style={{ width: '35%' }} />
                        <col style={{ width: '15%' }} />
                    </colgroup>
                    <thead>
                        <tr>
                            <th colSpan="3" style={{fontSize: '15px', width: '50%'}}>HEALTH ASPECTS</th>
                            <th colSpan="2" style={{fontSize: '15px', width: '50%'}}>ATTENDANCE</th>
                        </tr>
                    </thead>
                    <tbody>
                        <tr >
                            <td
                                colSpan="2"
                                style={{
                                    fontSize: '15px',
                                    textAlign: 'left',
                                    width: '35%',
                                    ...(isClass1To5 ? { padding: '7px' } : { padding: 0, paddingLeft: '7px' })
                                }}
                            >
                                Height (in cm)
                            </td>
                            <td style={{fontSize: '15px', width: '15%'}}>
                                <b>{nonScholastic?.health?.height || ''}</b>
                            </td>
                            <td
                                style={{fontSize: '15px', textAlign: 'left', paddingLeft: '5px', width: '35%'}}
                            >
                                Total Working Days
                            </td>
                            <td style={{fontSize: '15px', width: '15%'}}>
                                <b>{nonScholastic?.attendance?.workingDays || ''}</b>
                            </td>
                        </tr>
                        <tr>
                            <td
                                colSpan="2"
                                style={{fontSize: '15px', textAlign: 'left', paddingLeft: '5px', width: '35%'}}
                            >
                                Weight (in kg)
                            </td>
                            <td style={{fontSize: '15px', width: '15%'}}>
                                <b>{nonScholastic?.health?.weight || ''}</b>
                            </td>
                            <td
                                style={{fontSize: '15px', textAlign: 'left', paddingLeft: '5px', width: '35%'}}
                            >
                                Total Days Attended
                            </td>
                            <td style={{fontSize: '15px', width: '15%'}}>
                                <b>{nonScholastic?.attendance?.attended || ''}</b>
                            </td>
                        </tr>
                        <tr>
                            <td
                                colSpan="2"
                                style={{fontSize: '15px', textAlign: 'left', paddingLeft: '5px', width: '35%'}}
                            >
                                Physical Development
                            </td>
                            <td style={{fontSize: '15px', width: '15%'}}>
                                <b>{nonScholastic?.health?.physical || ''}</b>
                            </td>
                            <td
                                style={{fontSize: '15px', textAlign: 'left', paddingLeft: '5px', width: '35%'}}
                            >
                                Percentage of Attendance
                            </td>
                            <td style={{fontSize: '15px', width: '15%'}}>
                                <b>{nonScholastic?.attendance?.percentage || ''}</b>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan="3" style={{fontSize: '15px', textAlign: 'left', paddingLeft: '5px', height: '30px'}}> <b>Division: {getDivisionFromTotals(totals)}</b></td>
                            <td colSpan="3" style={{fontSize: '15px', textAlign: 'left', paddingLeft: '5px'}}>
                                Date of Issue: <b>13<sup>th</sup> March 2026</b>
                            </td>
                        </tr>
                        <tr>
                            <td
                                colSpan="3"
                                style={{fontSize: '13px', textAlign: 'left', padding: '2px', height: '35px', fontWeight: 'bold'}}
                            >
                                Result:{' '}
                                {totals?.aggregateGrade === 'F'
                                    ? `Detain to same Class ${student.class}`
                                    : `Pass & Congratulations! Promoted to next class ${getNextClassLabel(student.class)}`}
                            </td>
                            <td colSpan="3" style={{fontSize: '15px', textAlign: 'left', paddingLeft: '5px'}}>
                                School Reopen On: <b>23<sup>rd</sup> March 2026</b>
                            </td>
                        </tr>
                    </tbody>
                </table>

                <table
                    className="main-table "
                    style={{marginTop: '0px'}}
                >
                    <colgroup>
                        <col style={{ width: '25%' }} />
                        <col style={{ width: '24.5%' }} />
                        <col style={{ width: '50.5%' }} />
                    </colgroup>
                    <tbody>
                        <tr>
                            <td
                                style={{
                                    height: '80px',
                                    verticalAlign: 'bottom',
                                    fontWeight: 'bold',
                                    paddingBottom: '5px',
                                    width: '25%',
                                    textAlign: 'center'
                                }}
                            >
                                Teacher's Signature
                            </td>
                           <td
                                style={{
                                    height: '80px',
                                    verticalAlign: 'bottom',
                                    fontWeight: 'bold',
                                    paddingBottom: '5px',
                                    width: '25%',
                                    textAlign: 'center'
                                }}
                            >
                                Parent's Signature
                            </td>
                            <td
                                style={{
                                    height: '140px',
                                    verticalAlign: 'bottom',
                                    fontWeight: 'bold',
                                    paddingBottom: '5px',
                                    width: '50%',
                                    textAlign: 'center'
                                }}
                            >
                                Principal
                            </td>
                        </tr>
                    </tbody>
                </table>
            </div>

        </div>
      </div>
    </div>
  );
});

export default MarksheetTemplate;
