-- Table to store subject configurations for each class
CREATE TABLE subjects (
    id SERIAL PRIMARY KEY,
    class_level VARCHAR(20) NOT NULL,
    subject_name VARCHAR(100) NOT NULL,
    is_theory BOOLEAN DEFAULT FALSE,
    is_practical BOOLEAN DEFAULT FALSE,
    is_internal BOOLEAN DEFAULT FALSE,
    is_oral BOOLEAN DEFAULT FALSE,
    is_written BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (class_level, subject_name)
);

-- Table to store exam types
CREATE TABLE exam_types (
    id SERIAL PRIMARY KEY,
    exam_name VARCHAR(50) NOT NULL UNIQUE,
    display_order INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to store exam configurations (max marks for each subject in each exam)
CREATE TABLE exam_configurations (
    id SERIAL PRIMARY KEY,
    class_level VARCHAR(20) NOT NULL,
    subject_id INT NOT NULL,
    exam_type_id INT NOT NULL,
    max_marks INT NOT NULL CHECK (max_marks IN (10,20,30,40,50,60,70,80,90,100)),
    academic_year VARCHAR(20) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (subject_id) REFERENCES subjects(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_type_id) REFERENCES exam_types(id) ON DELETE CASCADE,
    UNIQUE (class_level, subject_id, exam_type_id, academic_year)
);

-- Main table to store student marks
CREATE TABLE student_marks (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL,
    exam_configuration_id INT NOT NULL,
    marks_obtained DECIMAL(5,2) NOT NULL CHECK (marks_obtained >= 0),
    remarks TEXT,
    marked_by UUID NOT NULL,
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_configuration_id) REFERENCES exam_configurations(id) ON DELETE CASCADE,
    FOREIGN KEY (marked_by) REFERENCES teachers(id),
    UNIQUE (student_id, exam_configuration_id)
);

-- Create function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for student_marks
CREATE TRIGGER update_student_marks_updated_at
    BEFORE UPDATE ON student_marks
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Insert exam types
INSERT INTO exam_types (exam_name, display_order) VALUES
('Unit Test', 1),
('I-Term', 2),
('Half Yearly', 3),
('Annual Exam', 4);

-- Insert subjects for Nur, LKG, UKG
INSERT INTO subjects (class_level, subject_name, is_oral, is_written) VALUES
('Nur', 'English Oral', TRUE, FALSE),
('Nur', 'English Written', FALSE, TRUE),
('Nur', 'Hindi Oral', TRUE, FALSE),
('Nur', 'Hindi Written', FALSE, TRUE),
('Nur', 'Maths Oral', TRUE, FALSE),
('Nur', 'Maths Written', FALSE, TRUE),
('LKG', 'English Oral', TRUE, FALSE),
('LKG', 'English Written', FALSE, TRUE),
('LKG', 'Hindi Oral', TRUE, FALSE),
('LKG', 'Hindi Written', FALSE, TRUE),
('LKG', 'Maths Oral', TRUE, FALSE),
('LKG', 'Maths Written', FALSE, TRUE),
('UKG', 'English Oral', TRUE, FALSE),
('UKG', 'English Written', FALSE, TRUE),
('UKG', 'Hindi Oral', TRUE, FALSE),
('UKG', 'Hindi Written', FALSE, TRUE),
('UKG', 'Maths Oral', TRUE, FALSE),
('UKG', 'Maths Written', FALSE, TRUE);

-- Insert subjects for Class 1 to 5
INSERT INTO subjects (class_level, subject_name) VALUES
('1st', 'English'),
('1st', 'Hindi'),
('1st', 'Mathematics'),
('1st', 'EVS'),
('2nd', 'English'),
('2nd', 'Hindi'),
('2nd', 'Mathematics'),
('2nd', 'EVS'),
('3rd', 'English'),
('3rd', 'Hindi'),
('3rd', 'Mathematics'),
('3rd', 'EVS'),
('4th', 'English'),
('4th', 'Hindi'),
('4th', 'Mathematics'),
('4th', 'EVS'),
('5th', 'English'),
('5th', 'Hindi'),
('5th', 'Mathematics'),
('5th', 'EVS');

-- Insert subjects for Class 6 & 7
INSERT INTO subjects (class_level, subject_name) VALUES
('6th', 'English'),
('6th', 'Hindi'),
('6th', 'Sanskrit'),
('6th', 'Mathematics'),
('6th', 'Science'),
('6th', 'Social Science'),
('7th', 'English'),
('7th', 'Hindi'),
('7th', 'Sanskrit'),
('7th', 'Mathematics'),
('7th', 'Science'),
('7th', 'Social Science');

-- Insert subjects for Class 8 to 10
INSERT INTO subjects (class_level, subject_name, is_internal, is_theory, is_practical) VALUES
('8th', 'English Internal', TRUE, FALSE, FALSE),
('8th', 'English Theory', FALSE, TRUE, FALSE),
('8th', 'Hindi Internal', TRUE, FALSE, FALSE),
('8th', 'Hindi Theory', FALSE, TRUE, FALSE),
('8th', 'Sanskrit Internal', TRUE, FALSE, FALSE),
('8th', 'Sanskrit Theory', FALSE, TRUE, FALSE),
('8th', 'Mathematics Internal', TRUE, FALSE, FALSE),
('8th', 'Mathematics Theory', FALSE, TRUE, FALSE),
('8th', 'Science Practical', FALSE, FALSE, TRUE),
('8th', 'Science Theory', FALSE, TRUE, FALSE),
('8th', 'Social Science Internal', TRUE, FALSE, FALSE),
('8th', 'Social Science Theory', FALSE, TRUE, FALSE),
('9th', 'English Internal', TRUE, FALSE, FALSE),
('9th', 'English Theory', FALSE, TRUE, FALSE),
('9th', 'Hindi Internal', TRUE, FALSE, FALSE),
('9th', 'Hindi Theory', FALSE, TRUE, FALSE),
('9th', 'Sanskrit Internal', TRUE, FALSE, FALSE),
('9th', 'Sanskrit Theory', FALSE, TRUE, FALSE),
('9th', 'Mathematics Internal', TRUE, FALSE, FALSE),
('9th', 'Mathematics Theory', FALSE, TRUE, FALSE),
('9th', 'Science Practical', FALSE, FALSE, TRUE),
('9th', 'Science Theory', FALSE, TRUE, FALSE),
('9th', 'Social Science Internal', TRUE, FALSE, FALSE),
('9th', 'Social Science Theory', FALSE, TRUE, FALSE),
('10th', 'English Internal', TRUE, FALSE, FALSE),
('10th', 'English Theory', FALSE, TRUE, FALSE),
('10th', 'Hindi Internal', TRUE, FALSE, FALSE),
('10th', 'Hindi Theory', FALSE, TRUE, FALSE),
('10th', 'Sanskrit Internal', TRUE, FALSE, FALSE),
('10th', 'Sanskrit Theory', FALSE, TRUE, FALSE),
('10th', 'Mathematics Internal', TRUE, FALSE, FALSE),
('10th', 'Mathematics Theory', FALSE, TRUE, FALSE),
('10th', 'Science Practical', FALSE, FALSE, TRUE),
('10th', 'Science Theory', FALSE, TRUE, FALSE),
('10th', 'Social Science Internal', TRUE, FALSE, FALSE),
('10th', 'Social Science Theory', FALSE, TRUE, FALSE);

-- Add indexes for better query performance
CREATE INDEX idx_student_marks_student ON student_marks(student_id);
CREATE INDEX idx_student_marks_config ON student_marks(exam_configuration_id);
CREATE INDEX idx_exam_config_class ON exam_configurations(class_level);
CREATE INDEX idx_exam_config_year ON exam_configurations(academic_year);
CREATE INDEX idx_subjects_class ON subjects(class_level);