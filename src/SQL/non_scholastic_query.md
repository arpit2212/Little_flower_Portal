-- Table to store non-scholastic activity types
CREATE TABLE non_scholastic_categories (
    id SERIAL PRIMARY KEY,
    category_name VARCHAR(100) NOT NULL UNIQUE,
    display_order INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table to store non-scholastic activities for each class
CREATE TABLE non_scholastic_activities (
    id SERIAL PRIMARY KEY,
    class_level VARCHAR(20) NOT NULL,
    category_id INT NOT NULL,
    activity_name VARCHAR(100) NOT NULL,
    has_grade BOOLEAN DEFAULT TRUE,
    is_numeric BOOLEAN DEFAULT FALSE,
    unit VARCHAR(20),
    display_order INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (category_id) REFERENCES non_scholastic_categories(id) ON DELETE CASCADE,
    UNIQUE (class_level, category_id, activity_name)
);

-- Table to store student non-scholastic grades/scores
CREATE TABLE student_non_scholastic (
    id SERIAL PRIMARY KEY,
    student_id UUID NOT NULL,
    activity_id INT NOT NULL,
    academic_year VARCHAR(20) NOT NULL,
    exam_type_id INT NOT NULL,
    grade VARCHAR(5),
    numeric_value DECIMAL(10,2),
    remarks TEXT,
    marked_by UUID NOT NULL,
    marked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (student_id) REFERENCES students(id) ON DELETE CASCADE,
    FOREIGN KEY (activity_id) REFERENCES non_scholastic_activities(id) ON DELETE CASCADE,
    FOREIGN KEY (exam_type_id) REFERENCES exam_types(id) ON DELETE CASCADE,
    FOREIGN KEY (marked_by) REFERENCES teachers(id),
    UNIQUE (student_id, activity_id, academic_year, exam_type_id),
    CHECK (
        (grade IS NOT NULL AND grade IN ('A+', 'A', 'B', 'C', 'D') AND numeric_value IS NULL) OR
        (grade IS NULL AND numeric_value IS NOT NULL)
    )
);

-- Create function for updating updated_at timestamp
CREATE OR REPLACE FUNCTION update_non_scholastic_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for student_non_scholastic
CREATE TRIGGER update_student_non_scholastic_updated_at
    BEFORE UPDATE ON student_non_scholastic
    FOR EACH ROW
    EXECUTE FUNCTION update_non_scholastic_updated_at();

-- Insert categories
INSERT INTO non_scholastic_categories (category_name, display_order) VALUES
('CO-CURRICULAR ACTIVITY', 1),
('PERSONAL ATTRIBUTES', 2),
('HEALTH ASPECTS', 3),
('ATTENDANCE', 4);

-- Insert activities for Nursery, KG1, KG2
INSERT INTO non_scholastic_activities (class_level, category_id, activity_name, has_grade, is_numeric, display_order) VALUES
-- CO-CURRICULAR ACTIVITY for Nursery
('Nursery', 1, 'General Knowledge', TRUE, FALSE, 1),
('Nursery', 1, 'Art & Craft', TRUE, FALSE, 2),
('Nursery', 1, 'Cultural Activity', TRUE, FALSE, 3),
('Nursery', 1, 'Yoga', TRUE, FALSE, 4),
('Nursery', 1, 'Sports', TRUE, FALSE, 5),

-- PERSONAL ATTRIBUTES for Nursery
('Nursery', 2, 'Regularity & Neatness', TRUE, FALSE, 1),
('Nursery', 2, 'Concept Formation', TRUE, FALSE, 2),
('Nursery', 2, 'Exploration', TRUE, FALSE, 3),
('Nursery', 2, 'Motor Skills', TRUE, FALSE, 4),
('Nursery', 2, 'Overall Development', TRUE, FALSE, 5),

-- HEALTH ASPECTS for Nursery
('Nursery', 3, 'Height', FALSE, TRUE, 1),
('Nursery', 3, 'Weight', FALSE, TRUE, 2),
('Nursery', 3, 'Physical Development', TRUE, FALSE, 3),

-- ATTENDANCE for Nursery
('Nursery', 4, 'Total Working Days', FALSE, TRUE, 1),
('Nursery', 4, 'Total Days Attended', FALSE, TRUE, 2),

-- CO-CURRICULAR ACTIVITY for KG1
('KG1', 1, 'General Knowledge', TRUE, FALSE, 1),
('KG1', 1, 'Art & Craft', TRUE, FALSE, 2),
('KG1', 1, 'Cultural Activity', TRUE, FALSE, 3),
('KG1', 1, 'Yoga', TRUE, FALSE, 4),
('KG1', 1, 'Sports', TRUE, FALSE, 5),

-- PERSONAL ATTRIBUTES for KG1
('KG1', 2, 'Regularity & Neatness', TRUE, FALSE, 1),
('KG1', 2, 'Concept Formation', TRUE, FALSE, 2),
('KG1', 2, 'Exploration', TRUE, FALSE, 3),
('KG1', 2, 'Motor Skills', TRUE, FALSE, 4),
('KG1', 2, 'Overall Development', TRUE, FALSE, 5),

-- HEALTH ASPECTS for KG1
('KG1', 3, 'Height', FALSE, TRUE, 1),
('KG1', 3, 'Weight', FALSE, TRUE, 2),
('KG1', 3, 'Physical Development', TRUE, FALSE, 3),

-- ATTENDANCE for KG1
('KG1', 4, 'Total Working Days', FALSE, TRUE, 1),
('KG1', 4, 'Total Days Attended', FALSE, TRUE, 2),

-- CO-CURRICULAR ACTIVITY for KG2
('KG2', 1, 'General Knowledge', TRUE, FALSE, 1),
('KG2', 1, 'Art & Craft', TRUE, FALSE, 2),
('KG2', 1, 'Cultural Activity', TRUE, FALSE, 3),
('KG2', 1, 'Yoga', TRUE, FALSE, 4),
('KG2', 1, 'Sports', TRUE, FALSE, 5),

-- PERSONAL ATTRIBUTES for KG2
('KG2', 2, 'Regularity & Neatness', TRUE, FALSE, 1),
('KG2', 2, 'Concept Formation', TRUE, FALSE, 2),
('KG2', 2, 'Exploration', TRUE, FALSE, 3),
('KG2', 2, 'Motor Skills', TRUE, FALSE, 4),
('KG2', 2, 'Overall Development', TRUE, FALSE, 5),

-- HEALTH ASPECTS for KG2
('KG2', 3, 'Height', FALSE, TRUE, 1),
('KG2', 3, 'Weight', FALSE, TRUE, 2),
('KG2', 3, 'Physical Development', TRUE, FALSE, 3),

-- ATTENDANCE for KG2
('KG2', 4, 'Total Working Days', FALSE, TRUE, 1),
('KG2', 4, 'Total Days Attended', FALSE, TRUE, 2);

-- Insert activities for Classes 1st to 10th
INSERT INTO non_scholastic_activities (class_level, category_id, activity_name, has_grade, is_numeric, display_order) 
SELECT 
    class_level,
    category_id,
    activity_name,
    has_grade,
    is_numeric,
    display_order
FROM (
    VALUES
    -- CO-CURRICULAR ACTIVITY
    ('1st', 1, 'Computer', TRUE, FALSE, 1),
    ('1st', 1, 'Cultural Activity', TRUE, FALSE, 2),
    ('1st', 1, 'General Knowledge', TRUE, FALSE, 3),
    ('1st', 1, 'Art & Craft', TRUE, FALSE, 4),
    ('1st', 1, 'Sports', TRUE, FALSE, 5),
    
    -- PERSONAL ATTRIBUTES
    ('1st', 2, 'Punctuality & Punctuality', TRUE, FALSE, 1),
    ('1st', 2, 'Neatness & Cleanliness', TRUE, FALSE, 2),
    ('1st', 2, 'Discipline & Responsibility', TRUE, FALSE, 3),
    ('1st', 2, 'Leadership Quality', TRUE, FALSE, 4),
    ('1st', 2, 'Overall Development', TRUE, FALSE, 5),
    
    -- HEALTH ASPECTS
    ('1st', 3, 'Height', FALSE, TRUE, 1),
    ('1st', 3, 'Weight', FALSE, TRUE, 2),
    ('1st', 3, 'Physical Development', TRUE, FALSE, 3),
    
    -- ATTENDANCE
    ('1st', 4, 'Total Working Days', FALSE, TRUE, 1),
    ('1st', 4, 'Total Days Attended', FALSE, TRUE, 2)
) AS activities(class_level, category_id, activity_name, has_grade, is_numeric, display_order)
UNION ALL
SELECT 
    class_level,
    category_id,
    activity_name,
    has_grade,
    is_numeric,
    display_order
FROM (
    VALUES
    -- CO-CURRICULAR ACTIVITY for 2nd
    ('2nd', 1, 'Computer', TRUE, FALSE, 1),
    ('2nd', 1, 'Cultural Activity', TRUE, FALSE, 2),
    ('2nd', 1, 'General Knowledge', TRUE, FALSE, 3),
    ('2nd', 1, 'Art & Craft', TRUE, FALSE, 4),
    ('2nd', 1, 'Sports', TRUE, FALSE, 5),
    ('2nd', 2, 'Punctuality & Punctuality', TRUE, FALSE, 1),
    ('2nd', 2, 'Neatness & Cleanliness', TRUE, FALSE, 2),
    ('2nd', 2, 'Discipline & Responsibility', TRUE, FALSE, 3),
    ('2nd', 2, 'Leadership Quality', TRUE, FALSE, 4),
    ('2nd', 2, 'Overall Development', TRUE, FALSE, 5),
    ('2nd', 3, 'Height', FALSE, TRUE, 1),
    ('2nd', 3, 'Weight', FALSE, TRUE, 2),
    ('2nd', 3, 'Physical Development', TRUE, FALSE, 3),
    ('2nd', 4, 'Total Working Days', FALSE, TRUE, 1),
    ('2nd', 4, 'Total Days Attended', FALSE, TRUE, 2),

    -- CO-CURRICULAR ACTIVITY for 3rd
    ('3rd', 1, 'Computer', TRUE, FALSE, 1),
    ('3rd', 1, 'Cultural Activity', TRUE, FALSE, 2),
    ('3rd', 1, 'General Knowledge', TRUE, FALSE, 3),
    ('3rd', 1, 'Art & Craft', TRUE, FALSE, 4),
    ('3rd', 1, 'Sports', TRUE, FALSE, 5),
    ('3rd', 2, 'Punctuality & Punctuality', TRUE, FALSE, 1),
    ('3rd', 2, 'Neatness & Cleanliness', TRUE, FALSE, 2),
    ('3rd', 2, 'Discipline & Responsibility', TRUE, FALSE, 3),
    ('3rd', 2, 'Leadership Quality', TRUE, FALSE, 4),
    ('3rd', 2, 'Overall Development', TRUE, FALSE, 5),
    ('3rd', 3, 'Height', FALSE, TRUE, 1),
    ('3rd', 3, 'Weight', FALSE, TRUE, 2),
    ('3rd', 3, 'Physical Development', TRUE, FALSE, 3),
    ('3rd', 4, 'Total Working Days', FALSE, TRUE, 1),
    ('3rd', 4, 'Total Days Attended', FALSE, TRUE, 2),

    -- CO-CURRICULAR ACTIVITY for 4th
    ('4th', 1, 'Computer', TRUE, FALSE, 1),
    ('4th', 1, 'Cultural Activity', TRUE, FALSE, 2),
    ('4th', 1, 'General Knowledge', TRUE, FALSE, 3),
    ('4th', 1, 'Art & Craft', TRUE, FALSE, 4),
    ('4th', 1, 'Sports', TRUE, FALSE, 5),
    ('4th', 2, 'Punctuality & Punctuality', TRUE, FALSE, 1),
    ('4th', 2, 'Neatness & Cleanliness', TRUE, FALSE, 2),
    ('4th', 2, 'Discipline & Responsibility', TRUE, FALSE, 3),
    ('4th', 2, 'Leadership Quality', TRUE, FALSE, 4),
    ('4th', 2, 'Overall Development', TRUE, FALSE, 5),
    ('4th', 3, 'Height', FALSE, TRUE, 1),
    ('4th', 3, 'Weight', FALSE, TRUE, 2),
    ('4th', 3, 'Physical Development', TRUE, FALSE, 3),
    ('4th', 4, 'Total Working Days', FALSE, TRUE, 1),
    ('4th', 4, 'Total Days Attended', FALSE, TRUE, 2),

    -- CO-CURRICULAR ACTIVITY for 5th
    ('5th', 1, 'Computer', TRUE, FALSE, 1),
    ('5th', 1, 'Cultural Activity', TRUE, FALSE, 2),
    ('5th', 1, 'General Knowledge', TRUE, FALSE, 3),
    ('5th', 1, 'Art & Craft', TRUE, FALSE, 4),
    ('5th', 1, 'Sports', TRUE, FALSE, 5),
    ('5th', 2, 'Punctuality & Punctuality', TRUE, FALSE, 1),
    ('5th', 2, 'Neatness & Cleanliness', TRUE, FALSE, 2),
    ('5th', 2, 'Discipline & Responsibility', TRUE, FALSE, 3),
    ('5th', 2, 'Leadership Quality', TRUE, FALSE, 4),
    ('5th', 2, 'Overall Development', TRUE, FALSE, 5),
    ('5th', 3, 'Height', FALSE, TRUE, 1),
    ('5th', 3, 'Weight', FALSE, TRUE, 2),
    ('5th', 3, 'Physical Development', TRUE, FALSE, 3),
    ('5th', 4, 'Total Working Days', FALSE, TRUE, 1),
    ('5th', 4, 'Total Days Attended', FALSE, TRUE, 2),

    -- CO-CURRICULAR ACTIVITY for 6th
    ('6th', 1, 'Computer', TRUE, FALSE, 1),
    ('6th', 1, 'Cultural Activity', TRUE, FALSE, 2),
    ('6th', 1, 'General Knowledge', TRUE, FALSE, 3),
    ('6th', 1, 'Art & Craft', TRUE, FALSE, 4),
    ('6th', 1, 'Sports', TRUE, FALSE, 5),
    ('6th', 2, 'Punctuality & Punctuality', TRUE, FALSE, 1),
    ('6th', 2, 'Neatness & Cleanliness', TRUE, FALSE, 2),
    ('6th', 2, 'Discipline & Responsibility', TRUE, FALSE, 3),
    ('6th', 2, 'Leadership Quality', TRUE, FALSE, 4),
    ('6th', 2, 'Overall Development', TRUE, FALSE, 5),
    ('6th', 3, 'Height', FALSE, TRUE, 1),
    ('6th', 3, 'Weight', FALSE, TRUE, 2),
    ('6th', 3, 'Physical Development', TRUE, FALSE, 3),
    ('6th', 4, 'Total Working Days', FALSE, TRUE, 1),
    ('6th', 4, 'Total Days Attended', FALSE, TRUE, 2),

    -- CO-CURRICULAR ACTIVITY for 7th
    ('7th', 1, 'Computer', TRUE, FALSE, 1),
    ('7th', 1, 'Cultural Activity', TRUE, FALSE, 2),
    ('7th', 1, 'General Knowledge', TRUE, FALSE, 3),
    ('7th', 1, 'Art & Craft', TRUE, FALSE, 4),
    ('7th', 1, 'Sports', TRUE, FALSE, 5),
    ('7th', 2, 'Punctuality & Punctuality', TRUE, FALSE, 1),
    ('7th', 2, 'Neatness & Cleanliness', TRUE, FALSE, 2),
    ('7th', 2, 'Discipline & Responsibility', TRUE, FALSE, 3),
    ('7th', 2, 'Leadership Quality', TRUE, FALSE, 4),
    ('7th', 2, 'Overall Development', TRUE, FALSE, 5),
    ('7th', 3, 'Height', FALSE, TRUE, 1),
    ('7th', 3, 'Weight', FALSE, TRUE, 2),
    ('7th', 3, 'Physical Development', TRUE, FALSE, 3),
    ('7th', 4, 'Total Working Days', FALSE, TRUE, 1),
    ('7th', 4, 'Total Days Attended', FALSE, TRUE, 2),

    -- CO-CURRICULAR ACTIVITY for 8th
    ('8th', 1, 'Computer', TRUE, FALSE, 1),
    ('8th', 1, 'Cultural Activity', TRUE, FALSE, 2),
    ('8th', 1, 'General Knowledge', TRUE, FALSE, 3),
    ('8th', 1, 'Art & Craft', TRUE, FALSE, 4),
    ('8th', 1, 'Sports', TRUE, FALSE, 5),
    ('8th', 2, 'Punctuality & Punctuality', TRUE, FALSE, 1),
    ('8th', 2, 'Neatness & Cleanliness', TRUE, FALSE, 2),
    ('8th', 2, 'Discipline & Responsibility', TRUE, FALSE, 3),
    ('8th', 2, 'Leadership Quality', TRUE, FALSE, 4),
    ('8th', 2, 'Overall Development', TRUE, FALSE, 5),
    ('8th', 3, 'Height', FALSE, TRUE, 1),
    ('8th', 3, 'Weight', FALSE, TRUE, 2),
    ('8th', 3, 'Physical Development', TRUE, FALSE, 3),
    ('8th', 4, 'Total Working Days', FALSE, TRUE, 1),
    ('8th', 4, 'Total Days Attended', FALSE, TRUE, 2),

    -- CO-CURRICULAR ACTIVITY for 9th
    ('9th', 1, 'Computer', TRUE, FALSE, 1),
    ('9th', 1, 'Cultural Activity', TRUE, FALSE, 2),
    ('9th', 1, 'General Knowledge', TRUE, FALSE, 3),
    ('9th', 1, 'Art & Craft', TRUE, FALSE, 4),
    ('9th', 1, 'Sports', TRUE, FALSE, 5),
    ('9th', 2, 'Punctuality & Punctuality', TRUE, FALSE, 1),
    ('9th', 2, 'Neatness & Cleanliness', TRUE, FALSE, 2),
    ('9th', 2, 'Discipline & Responsibility', TRUE, FALSE, 3),
    ('9th', 2, 'Leadership Quality', TRUE, FALSE, 4),
    ('9th', 2, 'Overall Development', TRUE, FALSE, 5),
    ('9th', 3, 'Height', FALSE, TRUE, 1),
    ('9th', 3, 'Weight', FALSE, TRUE, 2),
    ('9th', 3, 'Physical Development', TRUE, FALSE, 3),
    ('9th', 4, 'Total Working Days', FALSE, TRUE, 1),
    ('9th', 4, 'Total Days Attended', FALSE, TRUE, 2),

    -- CO-CURRICULAR ACTIVITY for 10th
    ('10th', 1, 'Computer', TRUE, FALSE, 1),
    ('10th', 1, 'Cultural Activity', TRUE, FALSE, 2),
    ('10th', 1, 'General Knowledge', TRUE, FALSE, 3),
    ('10th', 1, 'Art & Craft', TRUE, FALSE, 4),
    ('10th', 1, 'Sports', TRUE, FALSE, 5),
    ('10th', 2, 'Punctuality & Punctuality', TRUE, FALSE, 1),
    ('10th', 2, 'Neatness & Cleanliness', TRUE, FALSE, 2),
    ('10th', 2, 'Discipline & Responsibility', TRUE, FALSE, 3),
    ('10th', 2, 'Leadership Quality', TRUE, FALSE, 4),
    ('10th', 2, 'Overall Development', TRUE, FALSE, 5),
    ('10th', 3, 'Height', FALSE, TRUE, 1),
    ('10th', 3, 'Weight', FALSE, TRUE, 2),
    ('10th', 3, 'Physical Development', TRUE, FALSE, 3),
    ('10th', 4, 'Total Working Days', FALSE, TRUE, 1),
    ('10th', 4, 'Total Days Attended', FALSE, TRUE, 2)
) AS activities(class_level, category_id, activity_name, has_grade, is_numeric, display_order);

-- Add indexes for better query performance
CREATE INDEX idx_non_scholastic_activities_class ON non_scholastic_activities(class_level);
CREATE INDEX idx_non_scholastic_activities_category ON non_scholastic_activities(category_id);
CREATE INDEX idx_student_non_scholastic_student ON student_non_scholastic(student_id);
CREATE INDEX idx_student_non_scholastic_activity ON student_non_scholastic(activity_id);
CREATE INDEX idx_student_non_scholastic_year ON student_non_scholastic(academic_year);

-- Add Percentage of Attendance for classes 1st to 10th
INSERT INTO non_scholastic_activities (class_level, category_id, activity_name, has_grade, is_numeric, display_order) VALUES
('1st', 4, 'Percentage of Attendance', FALSE, TRUE, 3),
('2nd', 4, 'Percentage of Attendance', FALSE, TRUE, 3),
('3rd', 4, 'Percentage of Attendance', FALSE, TRUE, 3),
('4th', 4, 'Percentage of Attendance', FALSE, TRUE, 3),
('5th', 4, 'Percentage of Attendance', FALSE, TRUE, 3),
('6th', 4, 'Percentage of Attendance', FALSE, TRUE, 3),
('7th', 4, 'Percentage of Attendance', FALSE, TRUE, 3),
('8th', 4, 'Percentage of Attendance', FALSE, TRUE, 3),
('9th', 4, 'Percentage of Attendance', FALSE, TRUE, 3),
('10th', 4, 'Percentage of Attendance', FALSE, TRUE, 3);

-- Also add for Nursery, KG1, KG2 for consistency
INSERT INTO non_scholastic_activities (class_level, category_id, activity_name, has_grade, is_numeric, display_order) VALUES
('Nursery', 4, 'Percentage of Attendance', FALSE, TRUE, 3),
('KG1', 4, 'Percentage of Attendance', FALSE, TRUE, 3),
('KG2', 4, 'Percentage of Attendance', FALSE, TRUE, 3);



-- Verify the setup
SELECT 
    nsa.class_level,
    nsc.category_name,
    COUNT(nsa.id) as activity_count
FROM non_scholastic_activities nsa
JOIN non_scholastic_categories nsc ON nsa.category_id = nsc.id
GROUP BY nsa.class_level, nsc.category_name, nsc.display_order
ORDER BY 
    CASE nsa.class_level
        WHEN 'Nursery' THEN 1
        WHEN 'KG1' THEN 2
        WHEN 'KG2' THEN 3
        WHEN '1st' THEN 4
        WHEN '2nd' THEN 5
        WHEN '3rd' THEN 6
        WHEN '4th' THEN 7
        WHEN '5th' THEN 8
        WHEN '6th' THEN 9
        WHEN '7th' THEN 10
        WHEN '8th' THEN 11
        WHEN '9th' THEN 12
        WHEN '10th' THEN 13
    END,
    nsc.display_order;