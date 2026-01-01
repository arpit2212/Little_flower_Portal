# School Management System - Database Documentation

## Overview
This database powers a comprehensive school management system for classes from Nursery to 12th grade. It handles student information, attendance tracking, class management, teacher records, a complete examination and marks management system (scholastic), and a comprehensive non-scholastic grading system.

## Database Type
**PostgreSQL** with UUID primary keys for core entities (students, teachers, classes)

---

## Table Structure

### 1. **students**
Stores all student information and personal details.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `name` | VARCHAR | Student name |
| `roll_number` | VARCHAR | Roll number |
| `class_id` | UUID | Foreign Key to classes table |
| `parent_contact` | VARCHAR | Parent contact number |
| `admission_date` | DATE | Date of admission |
| `created_at` | TIMESTAMP | Record creation timestamp |
| `scholar_number` | VARCHAR | Scholar number |
| `student_name` | VARCHAR | Full student name |
| `father_name` | VARCHAR | Father's name |
| `mother_name` | VARCHAR | Mother's name |
| `date_of_birth` | DATE | Date of birth |
| `session` | VARCHAR | Academic session |
| `rte` | VARCHAR | RTE status |
| `date_of_admission` | VARCHAR | Admission date |
| `caste` | VARCHAR | Caste category |
| `address` | VARCHAR | Residential address |
| `aadhar_number` | VARCHAR | Aadhar card number |
| `mobile_no` | VARCHAR | Primary mobile number |
| `other_no` | VARCHAR | Secondary contact number |
| `pen_number` | VARCHAR | PEN number |
| `family_id` | INT | Family identifier |
| `samagra_id` | INT | Samagra ID |
| `house` | VARCHAR | House assignment |
| `gender` | VARCHAR | Gender |
| `appear_id` | VARCHAR | Appear ID |
| `profile_image` | TEXT | Profile image data |

**Relationships:**
- `class_id` → `classes.id`
- Referenced by `attendance.samagra_id`
- Referenced by `student_marks.student_id`
- Referenced by `student_non_scholastic.student_id`

---

### 2. **classes**
Stores class/section information.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `name` | VARCHAR | Class name (Nursery, KG1, KG2, 1st-10th) |
| `session` | VARCHAR | Academic session |
| `teacher_id` | UUID | Foreign Key to teachers (class teacher) |
| `created_at` | TIMESTAMP | Record creation timestamp |

**Relationships:**
- `teacher_id` → `teachers.id`
- Referenced by `students.class_id`
- Referenced by `attendance.class_id`

**Valid Class Names:**
- Pre-primary: `Nursery`, `KG1`, `KG2`
- Primary: `1st`, `2nd`, `3rd`, `4th`, `5th`
- Middle: `6th`, `7th`
- Secondary: `8th`, `9th`, `10th`

---

### 3. **teachers**
Stores teacher information.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `clerk_user_id` | VARCHAR | Clerk authentication user ID |
| `name` | VARCHAR | Teacher name |
| `email` | VARCHAR | Email address |
| `created_at` | TIMESTAMP | Record creation timestamp |

**Relationships:**
- Referenced by `classes.teacher_id`
- Referenced by `attendance.marked_by`
- Referenced by `student_marks.marked_by`
- Referenced by `student_non_scholastic.marked_by`

---

### 4. **attendance**
Tracks daily student attendance.

| Column | Type | Description |
|--------|------|-------------|
| `id` | INT | Primary Key (Serial) |
| `samagra_id` | INT | Foreign Key to students |
| `class_id` | UUID | Foreign Key to classes |
| `date` | DATE | Attendance date |
| `status` | VARCHAR | Attendance status (Present/Absent/Late) |
| `marked_by` | UUID | Foreign Key to teachers |
| `remarks` | TEXT | Additional remarks |
| `created_at` | TIMESTAMP | Record creation timestamp |

**Relationships:**
- `samagra_id` → `students.samagra_id`
- `class_id` → `classes.id`
- `marked_by` → `teachers.id`

---

## SCHOLASTIC (Academic Subjects) SYSTEM

### 5. **subjects**
Stores all academic subjects available across different classes.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary Key |
| `class_level` | VARCHAR(20) | Class level (Nursery, KG1, KG2, 1st, etc.) |
| `subject_name` | VARCHAR(100) | Name of the subject |
| `is_theory` | BOOLEAN | Theory component flag |
| `is_practical` | BOOLEAN | Practical component flag |
| `is_internal` | BOOLEAN | Internal assessment flag |
| `is_oral` | BOOLEAN | Oral examination flag |
| `is_written` | BOOLEAN | Written examination flag |
| `created_at` | TIMESTAMP | Record creation timestamp |

**Unique Constraint:** `(class_level, subject_name)`

**Relationships:**
- Referenced by `exam_configurations.subject_id`

#### Subject Structure by Class

**Nursery, KG1, KG2:**
- English Oral, English Written
- Hindi Oral, Hindi Written
- Maths Oral, Maths Written
- **6 subjects each**

**Classes 1st to 5th:**
- English Internal, English Theory
- Hindi Internal, Hindi Theory
- Mathematics Internal, Mathematics Theory
- EVS Internal, EVS Theory
- **8 subjects each**

**Classes 6th to 10th:**
- English Internal, English Theory
- Hindi Internal, Hindi Theory
- Sanskrit Internal, Sanskrit Theory
- Mathematics Internal, Mathematics Theory
- Science Practical, Science Theory
- Social Science Internal, Social Science Theory
- **12 subjects each**

---

### 6. **exam_types**
Defines the types of examinations conducted (used for both scholastic and non-scholastic).

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary Key |
| `exam_name` | VARCHAR(50) | Name of exam type |
| `display_order` | INT | Display order for UI |
| `created_at` | TIMESTAMP | Record creation timestamp |

**Pre-populated Exam Types:**
1. Unit Test
2. I-Term
3. Half Yearly
4. Annual Exam

**Relationships:**
- Referenced by `exam_configurations.exam_type_id`
- Referenced by `student_non_scholastic.exam_type_id`

---

### 7. **exam_configurations**
Defines exam setup: which subject, which exam, maximum marks, for which class.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary Key |
| `class_level` | VARCHAR(20) | Class level (Nursery, KG1, 1st, etc.) |
| `subject_id` | INT | Foreign Key to subjects |
| `exam_type_id` | INT | Foreign Key to exam_types |
| `max_marks` | INT | Maximum marks (10,20,30...100) |
| `academic_year` | VARCHAR(20) | Academic year (e.g., "2024-25") |
| `created_at` | TIMESTAMP | Record creation timestamp |

**Constraints:**
- `max_marks` must be one of: 10, 20, 30, 40, 50, 60, 70, 80, 90, 100
- Unique constraint on `(class_level, subject_id, exam_type_id, academic_year)`

**Relationships:**
- `subject_id` → `subjects.id` (ON DELETE CASCADE)
- `exam_type_id` → `exam_types.id` (ON DELETE CASCADE)
- Referenced by `student_marks.exam_configuration_id`

---

### 8. **student_marks**
Stores individual student marks for each exam configuration.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary Key |
| `student_id` | UUID | Foreign Key to students |
| `exam_configuration_id` | INT | Foreign Key to exam_configurations |
| `marks_obtained` | DECIMAL(5,2) | Marks scored (NULL if absent) |
| `is_absent` | BOOLEAN | TRUE if student was absent |
| `remarks` | TEXT | Additional remarks/comments |
| `marked_by` | UUID | Foreign Key to teachers (who entered marks) |
| `marked_at` | TIMESTAMP | When marks were entered |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Constraints:**
- `marks_obtained` must be >= 0 when present
- Either marks_obtained OR is_absent must be set
- Unique constraint on `(student_id, exam_configuration_id)`

**Relationships:**
- `student_id` → `students.id` (ON DELETE CASCADE)
- `exam_configuration_id` → `exam_configurations.id` (ON DELETE CASCADE)
- `marked_by` → `teachers.id`

**Trigger:** Automatically updates `updated_at` on any record modification

---

## NON-SCHOLASTIC SYSTEM

### 9. **non_scholastic_categories**
Stores categories for non-scholastic activities.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary Key |
| `category_name` | VARCHAR(100) | Category name |
| `display_order` | INT | Display order for UI |
| `created_at` | TIMESTAMP | Record creation timestamp |

**Pre-populated Categories:**
1. CO-CURRICULAR ACTIVITY
2. PERSONAL ATTRIBUTES
3. HEALTH ASPECTS
4. ATTENDANCE

**Relationships:**
- Referenced by `non_scholastic_activities.category_id`

---

### 10. **non_scholastic_activities**
Stores all non-scholastic activities for each class level.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary Key |
| `class_level` | VARCHAR(20) | Class level (Nursery, KG1, 1st, etc.) |
| `category_id` | INT | Foreign Key to non_scholastic_categories |
| `activity_name` | VARCHAR(100) | Name of the activity |
| `has_grade` | BOOLEAN | If TRUE, uses grade (A+, A, B, C, D) |
| `is_numeric` | BOOLEAN | If TRUE, uses numeric value |
| `unit` | VARCHAR(20) | Unit of measurement (cm, kg, etc.) |
| `display_order` | INT | Display order within category |
| `created_at` | TIMESTAMP | Record creation timestamp |

**Unique Constraint:** `(class_level, category_id, activity_name)`

**Relationships:**
- `category_id` → `non_scholastic_categories.id` (ON DELETE CASCADE)
- Referenced by `student_non_scholastic.activity_id`

#### Non-Scholastic Activities by Class

**Nursery, KG1, KG2:**

*CO-CURRICULAR ACTIVITY (Grades: A+, A, B, C, D)*
- General Knowledge
- Art & Craft
- Cultural Activity
- Yoga
- Sports

*PERSONAL ATTRIBUTES (Grades: A+, A, B, C, D)*
- Regularity & Neatness
- Concept Formation
- Exploration
- Motor Skills
- Overall Development

*HEALTH ASPECTS*
- Height (numeric - cm)
- Weight (numeric - kg)
- Physical Development (Grades: A+, A, B, C, D)

*ATTENDANCE*
- Total Working Days (numeric)
- Total Days Attended (numeric)
- Percentage of Attendance (numeric - calculated)

---

**Classes 1st to 10th:**

*CO-CURRICULAR ACTIVITY (Grades: A+, A, B, C, D)*
- Computer
- Cultural Activity
- General Knowledge
- Art & Craft
- Sports

*PERSONAL ATTRIBUTES (Grades: A+, A, B, C, D)*
- Punctuality & Punctuality
- Neatness & Cleanliness
- Discipline & Responsibility
- Leadership Quality
- Overall Development

*HEALTH ASPECTS*
- Height (numeric - cm)
- Weight (numeric - kg)
- Physical Development (Grades: A+, A, B, C, D)

*ATTENDANCE*
- Total Working Days (numeric)
- Total Days Attended (numeric)
- Percentage of Attendance (numeric - calculated)

---

### 11. **student_non_scholastic**
Stores student grades/scores for non-scholastic activities.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary Key |
| `student_id` | UUID | Foreign Key to students |
| `activity_id` | INT | Foreign Key to non_scholastic_activities |
| `academic_year` | VARCHAR(20) | Academic year (e.g., "2024-25") |
| `exam_type_id` | INT | Foreign Key to exam_types |
| `grade` | VARCHAR(5) | Grade (A+, A, B, C, D) |
| `numeric_value` | DECIMAL(10,2) | Numeric value (for height, weight, days) |
| `remarks` | TEXT | Additional remarks/comments |
| `marked_by` | UUID | Foreign Key to teachers |
| `marked_at` | TIMESTAMP | When record was created |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Constraints:**
- Either `grade` OR `numeric_value` must be set (not both)
- `grade` must be one of: A+, A, B, C, D
- Unique constraint on `(student_id, activity_id, academic_year, exam_type_id)`

**Relationships:**
- `student_id` → `students.id` (ON DELETE CASCADE)
- `activity_id` → `non_scholastic_activities.id` (ON DELETE CASCADE)
- `exam_type_id` → `exam_types.id` (ON DELETE CASCADE)
- `marked_by` → `teachers.id`

**Trigger:** Automatically updates `updated_at` on any record modification

---

## Complete Database Relationships Diagram

```
students (UUID)
    ├─→ attendance (via samagra_id)
    ├─→ student_marks (via student_id)
    ├─→ student_non_scholastic (via student_id)
    └─→ classes (via class_id)

classes (UUID)
    ├─→ students
    ├─→ attendance
    └─→ teachers (via teacher_id)

teachers (UUID)
    ├─→ classes (as class teacher)
    ├─→ attendance (as marker)
    ├─→ student_marks (as marker)
    └─→ student_non_scholastic (as marker)

subjects (INT)
    └─→ exam_configurations

exam_types (INT)
    ├─→ exam_configurations
    └─→ student_non_scholastic

exam_configurations (INT)
    ├─→ subjects
    ├─→ exam_types
    └─→ student_marks

non_scholastic_categories (INT)
    └─→ non_scholastic_activities

non_scholastic_activities (INT)
    ├─→ non_scholastic_categories
    └─→ student_non_scholastic
```

---

## System Workflows

### Scholastic (Academic) Marks Workflow

**Step 1: Setup Exam Configuration**
Teacher creates an exam configuration by selecting:
- Class level (e.g., "5th")
- Subject (e.g., "Mathematics")
- Exam type (e.g., "Half Yearly")
- Maximum marks (e.g., 50)
- Academic year (e.g., "2024-25")

This creates one record in `exam_configurations`.

**Step 2: Enter Student Marks**
For each student in that class:
- Teacher enters marks obtained (must be ≤ max_marks)
- OR marks student as absent
- Can add remarks/comments
- System records who entered marks and when
- Creates record in `student_marks`

**Step 3: Query and Reports**
You can query marks by:
- Student (all exams for a student)
- Class (all students in a class for an exam)
- Subject (performance across exams)
- Exam type (compare performance across subjects)

---

### Non-Scholastic Grading Workflow

**Step 1: Select Activity**
Teacher selects:
- Class level (e.g., "5th")
- Category (e.g., "CO-CURRICULAR ACTIVITY")
- Activity (e.g., "Sports")
- Exam type (e.g., "Annual Exam")
- Academic year (e.g., "2024-25")

**Step 2: Enter Grades/Values**
For each student:
- If activity has grades: Enter A+, A, B, C, or D
- If activity is numeric: Enter value (height in cm, weight in kg, days count)
- Can add remarks
- System records who entered data and when
- Creates record in `student_non_scholastic`

**Step 3: Calculate Attendance Percentage**
- System calculates: (Total Days Attended / Total Working Days) × 100
- Stores in Percentage of Attendance field

---

## Important Indexes

Performance optimization indexes:

**Scholastic Indexes:**
- `idx_student_marks_student` on `student_marks(student_id)`
- `idx_student_marks_config` on `student_marks(exam_configuration_id)`
- `idx_student_marks_absent` on `student_marks(is_absent)`
- `idx_exam_config_class` on `exam_configurations(class_level)`
- `idx_exam_config_year` on `exam_configurations(academic_year)`
- `idx_subjects_class` on `subjects(class_level)`

**Non-Scholastic Indexes:**
- `idx_non_scholastic_activities_class` on `non_scholastic_activities(class_level)`
- `idx_non_scholastic_activities_category` on `non_scholastic_activities(category_id)`
- `idx_student_non_scholastic_student` on `student_non_scholastic(student_id)`
- `idx_student_non_scholastic_activity` on `student_non_scholastic(activity_id)`
- `idx_student_non_scholastic_year` on `student_non_scholastic(academic_year)`

---

## Sample Queries

### Get Complete Report Card (Scholastic + Non-Scholastic)

```sql
-- Scholastic Marks
SELECT 
    s.name as student_name,
    s.roll_number,
    c.name as class_name,
    'SCHOLASTIC' as section_type,
    sub.subject_name as item_name,
    et.exam_name,
    CASE 
        WHEN sm.is_absent = TRUE THEN 'ABSENT'
        ELSE CAST(sm.marks_obtained AS VARCHAR)
    END as value,
    ec.max_marks,
    CASE 
        WHEN sm.is_absent = FALSE THEN ROUND((sm.marks_obtained / ec.max_marks * 100), 2)
        ELSE NULL
    END as percentage
FROM student_marks sm
JOIN students s ON sm.student_id = s.id
JOIN classes c ON s.class_id = c.id
JOIN exam_configurations ec ON sm.exam_configuration_id = ec.id
JOIN subjects sub ON ec.subject_id = sub.id
JOIN exam_types et ON ec.exam_type_id = et.id
WHERE s.id = 'student-uuid-here'
    AND ec.academic_year = '2024-25'
    AND et.exam_name = 'Annual Exam'

UNION ALL

-- Non-Scholastic Grades
SELECT 
    s.name as student_name,
    s.roll_number,
    c.name as class_name,
    'NON-SCHOLASTIC' as section_type,
    nsc.category_name || ' - ' || nsa.activity_name as item_name,
    et.exam_name,
    COALESCE(sn.grade, CAST(sn.numeric_value AS VARCHAR)) as value,
    NULL as max_marks,
    NULL as percentage
FROM student_non_scholastic sn
JOIN students s ON sn.student_id = s.id
JOIN classes c ON s.class_id = c.id
JOIN non_scholastic_activities nsa ON sn.activity_id = nsa.id
JOIN non_scholastic_categories nsc ON nsa.category_id = nsc.id
JOIN exam_types et ON sn.exam_type_id = et.id
WHERE s.id = 'student-uuid-here'
    AND sn.academic_year = '2024-25'
    AND et.exam_name = 'Annual Exam'
ORDER BY section_type, item_name;
```

### Get Class-wise Scholastic Performance

```sql
SELECT 
    s.name as student_name,
    s.roll_number,
    sub.subject_name,
    ec.max_marks,
    CASE 
        WHEN sm.is_absent = TRUE THEN 'ABSENT'
        ELSE CAST(sm.marks_obtained AS VARCHAR)
    END as marks,
    CASE 
        WHEN sm.is_absent = FALSE THEN ROUND((sm.marks_obtained / ec.max_marks * 100), 2)
        ELSE NULL
    END as percentage
FROM student_marks sm
JOIN students s ON sm.student_id = s.id
JOIN exam_configurations ec ON sm.exam_configuration_id = ec.id
JOIN subjects sub ON ec.subject_id = sub.id
JOIN exam_types et ON ec.exam_type_id = et.id
WHERE ec.class_level = '5th'
    AND et.exam_name = 'Half Yearly'
    AND ec.academic_year = '2024-25'
ORDER BY s.roll_number, sub.subject_name;
```

### Get Non-Scholastic Report for a Student

```sql
SELECT 
    nsc.category_name,
    nsa.activity_name,
    et.exam_name,
    CASE 
        WHEN nsa.has_grade = TRUE THEN sn.grade
        ELSE CAST(sn.numeric_value AS VARCHAR) || COALESCE(' ' || nsa.unit, '')
    END as result,
    sn.remarks
FROM student_non_scholastic sn
JOIN non_scholastic_activities nsa ON sn.activity_id = nsa.id
JOIN non_scholastic_categories nsc ON nsa.category_id = nsc.id
JOIN exam_types et ON sn.exam_type_id = et.id
WHERE sn.student_id = 'student-uuid-here'
    AND sn.academic_year = '2024-25'
    AND et.exam_name = 'Annual Exam'
ORDER BY nsc.display_order, nsa.display_order;
```

### Calculate and Display Attendance Percentage

```sql
SELECT 
    s.name,
    s.roll_number,
    MAX(CASE WHEN nsa.activity_name = 'Total Working Days' THEN sn.numeric_value END) as total_working_days,
    MAX(CASE WHEN nsa.activity_name = 'Total Days Attended' THEN sn.numeric_value END) as total_days_attended,
    MAX(CASE WHEN nsa.activity_name = 'Percentage of Attendance' THEN sn.numeric_value END) as attendance_percentage
FROM student_non_scholastic sn
JOIN students s ON sn.student_id = s.id
JOIN non_scholastic_activities nsa ON sn.activity_id = nsa.id
WHERE nsa.activity_name IN ('Total Working Days', 'Total Days Attended', 'Percentage of Attendance')
    AND sn.academic_year = '2024-25'
    AND sn.exam_type_id = 4  -- Annual Exam
GROUP BY s.id, s.name, s.roll_number
ORDER BY s.roll_number;
```

### Get Class-wise Non-Scholastic Summary

```sql
SELECT 
    nsc.category_name,
    nsa.activity_name,
    COUNT(sn.id) as total_entries,
    CASE 
        WHEN nsa.has_grade = TRUE THEN 
            'A+: ' || COUNT(CASE WHEN sn.grade = 'A+' THEN 1 END)::VARCHAR ||
            ', A: ' || COUNT(CASE WHEN sn.grade = 'A' THEN 1 END)::VARCHAR ||
            ', B: ' || COUNT(CASE WHEN sn.grade = 'B' THEN 1 END)::VARCHAR ||
            ', C: ' || COUNT(CASE WHEN sn.grade = 'C' THEN 1 END)::VARCHAR ||
            ', D: ' || COUNT(CASE WHEN sn.grade = 'D' THEN 1 END)::VARCHAR
        ELSE 
            'Avg: ' || ROUND(AVG(sn.numeric_value), 2)::VARCHAR
    END as summary
FROM student_non_scholastic sn
JOIN non_scholastic_activities nsa ON sn.activity_id = nsa.id
JOIN non_scholastic_categories nsc ON nsa.category_id = nsc.id
WHERE nsa.class_level = '5th'
    AND sn.academic_year = '2024-25'
    AND sn.exam_type_id = 4  -- Annual Exam
GROUP BY nsc.category_name, nsc.display_order, nsa.activity_name, nsa.display_order, nsa.has_grade
ORDER BY nsc.display_order, nsa.display_order;
```

---

## Data Validation Rules

### Scholastic (Academic) Rules:

1. **Marks Entry:**
   - Marks obtained cannot exceed max_marks in exam_configuration
   - Marks must be >= 0 when present
   - Student can be marked absent (is_absent = TRUE, marks_obtained = NULL)
   - One student can have only one marks entry per exam configuration

2. **Exam Configuration:**
   - Max marks must be one of: 10, 20, 30, 40, 50, 60, 70, 80, 90, 100
   - Cannot have duplicate configurations for same class+subject+exam+year

3. **Class Levels:**
   - Must match predefined class names: Nursery, KG1, KG2, 1st-10th
   - Subjects are specific to class levels

### Non-Scholastic Rules:

1. **Grade Entry:**
   - Grade must be one of: A+, A, B, C, D
   - Only for activities where `has_grade = TRUE`
   - Cannot enter numeric value if grade is required

2. **Numeric Entry:**
   - Only for activities where `is_numeric = TRUE`
   - Cannot enter grade if numeric value is required
   - Height typically in cm (range: 50-200)
   - Weight typically in kg (range: 5-150)
   - Days must be positive integers

3. **Attendance Calculation:**
   - Total Days Attended cannot exceed Total Working Days
   - Percentage = (Total Days Attended / Total Working Days) × 100
   - Percentage should be calculated and stored automatically

### General Rules:

1. **Academic Year:**
   - Format: "YYYY-YY" (e.g., "2024-25")
   - Must be consistent across all records

2. **Exam Types:**
   - Must use predefined exam types (Unit Test, I-Term, Half Yearly, Annual Exam)
   - Same exam types used for both scholastic and non-scholastic

---

## Notes for Developers

1. **UUID vs INT:** Core entities (students, teachers, classes) use UUID for distributed systems compatibility. Exam and non-scholastic systems use INT (SERIAL) for simpler sequencing.

2. **Cascade Deletes:** 
   - Deleting a student removes all their marks, non-scholastic records, and attendance
   - Deleting an exam configuration removes all associated marks
   - Deleting an activity removes all associated non-scholastic records
   - Be careful with bulk deletions

3. **Performance:** Indexes are optimized for common queries (student lookups, class reports, year-wise filtering)

4. **Extensibility:** 
   - Easy to add new subjects (insert into subjects table)
   - Easy to add new exam types (insert into exam_types)
   - Easy to add new non-scholastic activities (insert into non_scholastic_activities)
   - Max marks constraint can be modified if needed
   - Grade values can be modified (currently A+, A, B, C, D)

5. **Auto-updates:** 
   - The `updated_at` field in `student_marks` automatically updates via PostgreSQL trigger
   - The `updated_at` field in `student_non_scholastic` automatically updates via PostgreSQL trigger

6. **Data Integrity:**
   - CHECK constraints ensure either grade OR numeric value is set in non-scholastic
   - CHECK constraints ensure either marks OR absent status is set in scholastic
   - UNIQUE constraints prevent duplicate entries

7. **Frontend Integration:**
   - For attendance percentage: Calculate on frontend or backend before storing
   - For grade dropdowns: Use fixed values (A+, A, B, C, D)
   - For numeric fields: Validate ranges (height, weight, days)
   - Always link entries to exam_type for proper report generation

8. **Report Generation:**
   - Use UNION queries to combine scholastic and non-scholastic data
   - Consider creating views for frequently accessed report structures
   - Cache calculated percentages for performance

---

## Version History

- **v1.0** - Initial schema with students, classes, teachers, attendance
- **v2.0** - Added comprehensive scholastic exam and marks management system
- **v3.0** - Added comprehensive non-scholastic grading system with categories, activities, and student records

---

## Contact & Support

For schema modifications or questions, refer to this documentation and ensure all foreign key relationships are maintained.