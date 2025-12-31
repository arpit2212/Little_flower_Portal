# School Management System - Database Documentation

## Overview
This database powers a comprehensive school management system for classes from Nursery to 12th grade. It handles student information, attendance tracking, class management, teacher records, and a complete examination and marks management system.

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

---

### 2. **classes**
Stores class/section information.

| Column | Type | Description |
|--------|------|-------------|
| `id` | UUID | Primary Key |
| `name` | VARCHAR | Class name (Nur, LKG, UKG, 1st-12th) |
| `session` | VARCHAR | Academic session |
| `teacher_id` | UUID | Foreign Key to teachers (class teacher) |
| `created_at` | TIMESTAMP | Record creation timestamp |

**Relationships:**
- `teacher_id` → `teachers.id`
- Referenced by `students.class_id`
- Referenced by `attendance.class_id`

**Valid Class Names:**
- Pre-primary: `Nur`, `LKG`, `UKG`
- Primary: `1st`, `2nd`, `3rd`, `4th`, `5th`
- Middle: `6th`, `7th`
- Secondary: `8th`, `9th`, `10th`
- Senior Secondary: `11th`, `12th`

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

### 5. **subjects**
Stores all subjects available across different classes.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary Key |
| `class_level` | VARCHAR(20) | Class level (Nur, LKG, 1st, etc.) |
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

**Nursery, LKG, UKG:**
- English Oral, English Written
- Hindi Oral, Hindi Written
- Maths Oral, Maths Written

**Classes 1st to 5th:**
- English
- Hindi
- Mathematics
- EVS (Environmental Studies)

**Classes 6th & 7th:**
- English
- Hindi
- Sanskrit
- Mathematics
- Science
- Social Science

**Classes 8th to 10th:**
- English Internal, English Theory
- Hindi Internal, Hindi Theory
- Sanskrit Internal, Sanskrit Theory
- Mathematics Internal, Mathematics Theory
- Science Practical, Science Theory
- Social Science Internal, Social Science Theory

---

### 6. **exam_types**
Defines the types of examinations conducted.

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

---

### 7. **exam_configurations**
Defines exam setup: which subject, which exam, maximum marks, for which class.

| Column | Type | Description |
|--------|------|-------------|
| `id` | SERIAL | Primary Key |
| `class_level` | VARCHAR(20) | Class level (Nur, LKG, 1st, etc.) |
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
| `marks_obtained` | DECIMAL(5,2) | Marks scored by student |
| `remarks` | TEXT | Additional remarks/comments |
| `marked_by` | UUID | Foreign Key to teachers (who entered marks) |
| `marked_at` | TIMESTAMP | When marks were entered |
| `updated_at` | TIMESTAMP | Last update timestamp |

**Constraints:**
- `marks_obtained` must be >= 0
- Unique constraint on `(student_id, exam_configuration_id)` (one entry per student per exam)

**Relationships:**
- `student_id` → `students.id` (ON DELETE CASCADE)
- `exam_configuration_id` → `exam_configurations.id` (ON DELETE CASCADE)
- `marked_by` → `teachers.id`

**Trigger:** Automatically updates `updated_at` on any record modification

---

## Key Relationships Diagram

```
students (UUID)
    ├─→ attendance (via samagra_id)
    ├─→ student_marks (via student_id)
    └─→ classes (via class_id)

classes (UUID)
    ├─→ students
    ├─→ attendance
    └─→ teachers (via teacher_id)

teachers (UUID)
    ├─→ classes (as class teacher)
    ├─→ attendance (as marker)
    └─→ student_marks (as marker)

subjects (INT)
    └─→ exam_configurations

exam_types (INT)
    └─→ exam_configurations

exam_configurations (INT)
    ├─→ subjects
    ├─→ exam_types
    └─→ student_marks
```

---

## Exam & Marks System Workflow

### Step 1: Setup Exam Configuration
Teacher creates an exam configuration by selecting:
- Class level (e.g., "5th")
- Subject (e.g., "Mathematics")
- Exam type (e.g., "Half Yearly")
- Maximum marks (e.g., 50)
- Academic year (e.g., "2024-25")

This creates one record in `exam_configurations`.

### Step 2: Enter Student Marks
For each student in that class:
- Teacher enters marks obtained (must be ≤ max_marks)
- Can add remarks/comments
- System records who entered marks and when
- Creates record in `student_marks`

### Step 3: Query and Reports
You can query marks by:
- Student (all exams for a student)
- Class (all students in a class for an exam)
- Subject (performance across exams)
- Exam type (compare performance across subjects)

---

## Important Indexes

Performance optimization indexes:
- `idx_student_marks_student` on `student_marks(student_id)`
- `idx_student_marks_config` on `student_marks(exam_configuration_id)`
- `idx_exam_config_class` on `exam_configurations(class_level)`
- `idx_exam_config_year` on `exam_configurations(academic_year)`
- `idx_subjects_class` on `subjects(class_level)`

---

## Sample Queries

### Get all marks for a student
```sql
SELECT 
    s.name as student_name,
    c.name as class,
    sub.subject_name,
    et.exam_name,
    ec.max_marks,
    sm.marks_obtained,
    sm.remarks,
    t.name as marked_by
FROM student_marks sm
JOIN students s ON sm.student_id = s.id
JOIN exam_configurations ec ON sm.exam_configuration_id = ec.id
JOIN subjects sub ON ec.subject_id = sub.id
JOIN exam_types et ON ec.exam_type_id = et.id
JOIN classes c ON s.class_id = c.id
JOIN teachers t ON sm.marked_by = t.id
WHERE s.id = 'student-uuid-here'
ORDER BY et.display_order, sub.subject_name;
```

### Get class report for a specific exam
```sql
SELECT 
    s.name as student_name,
    s.roll_number,
    sub.subject_name,
    ec.max_marks,
    sm.marks_obtained,
    ROUND((sm.marks_obtained / ec.max_marks * 100), 2) as percentage
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

### Get subject-wise performance across exams
```sql
SELECT 
    et.exam_name,
    AVG(sm.marks_obtained) as avg_marks,
    MAX(sm.marks_obtained) as highest_marks,
    MIN(sm.marks_obtained) as lowest_marks,
    COUNT(sm.id) as total_students
FROM student_marks sm
JOIN exam_configurations ec ON sm.exam_configuration_id = ec.id
JOIN subjects sub ON ec.subject_id = sub.id
JOIN exam_types et ON ec.exam_type_id = et.id
WHERE sub.subject_name = 'Mathematics'
    AND ec.class_level = '5th'
    AND ec.academic_year = '2024-25'
GROUP BY et.exam_name, et.display_order
ORDER BY et.display_order;
```

---

## Data Validation Rules

1. **Marks Entry:**
   - Marks obtained cannot exceed max_marks in exam_configuration
   - Marks must be >= 0
   - One student can have only one marks entry per exam configuration

2. **Exam Configuration:**
   - Max marks must be one of: 10, 20, 30, 40, 50, 60, 70, 80, 90, 100
   - Cannot have duplicate configurations for same class+subject+exam+year

3. **Class Levels:**
   - Must match predefined class names
   - Subjects are specific to class levels

4. **Academic Year:**
   - Format: "YYYY-YY" (e.g., "2024-25")

---

## Notes for Developers

1. **UUID vs INT:** Core entities (students, teachers, classes) use UUID for distributed systems compatibility. Exam system uses INT (SERIAL) for simpler sequencing.

2. **Cascade Deletes:** 
   - Deleting a student removes all their marks and attendance
   - Deleting an exam configuration removes all associated marks
   - Be careful with bulk deletions

3. **Performance:** Indexes are optimized for common queries (student lookups, class reports, year-wise filtering)

4. **Extensibility:** 
   - Easy to add new subjects (just insert into subjects table)
   - Easy to add new exam types (insert into exam_types)
   - Max marks constraint can be modified if needed

5. **Auto-updates:** The `updated_at` field in `student_marks` automatically updates via PostgreSQL trigger

---

## Version History

- **v1.0** - Initial schema with students, classes, teachers, attendance
- **v2.0** - Added comprehensive exam and marks management system

---

## Contact & Support

For schema modifications or questions, refer to this documentation and ensure all foreign key relationships are maintained.