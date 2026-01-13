-- Function to get class position stats (bypasses RLS)
CREATE OR REPLACE FUNCTION get_class_position_stats(
  p_exam_id UUID,
  p_student_id UUID
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  student_total INTEGER;
  student_position INTEGER;
  total_students INTEGER;
  class_average NUMERIC;
BEGIN
  -- Get this student's total marks
  SELECT COALESCE(SUM(marks), 0) INTO student_total
  FROM academic_results
  WHERE exam_id = p_exam_id AND student_id = p_student_id;
  
  -- Calculate all students' totals and determine position
  WITH student_totals AS (
    SELECT 
      ar.student_id,
      SUM(ar.marks) as total_marks
    FROM academic_results ar
    WHERE ar.exam_id = p_exam_id
    GROUP BY ar.student_id
  ),
  ranked AS (
    SELECT 
      student_id,
      total_marks,
      ROW_NUMBER() OVER (ORDER BY total_marks DESC) as position
    FROM student_totals
  )
  SELECT 
    r.position,
    (SELECT COUNT(*) FROM student_totals),
    (SELECT AVG(total_marks) FROM student_totals)
  INTO student_position, total_students, class_average
  FROM ranked r
  WHERE r.student_id = p_student_id;
  
  result := json_build_object(
    'position', COALESCE(student_position, 0),
    'totalStudents', COALESCE(total_students, 0),
    'classAverage', COALESCE(class_average, 0),
    'studentTotal', COALESCE(student_total, 0)
  );
  
  RETURN result;
END;
$$;

-- Function to get previous exam position (bypasses RLS)
CREATE OR REPLACE FUNCTION get_previous_exam_position(
  p_current_exam_id UUID,
  p_student_id UUID,
  p_class_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  prev_exam_id UUID;
  prev_position INTEGER;
  current_exam_date DATE;
BEGIN
  -- Get current exam date
  SELECT start_date INTO current_exam_date
  FROM exams WHERE id = p_current_exam_id;
  
  -- Find previous exam for this class
  SELECT id INTO prev_exam_id
  FROM exams
  WHERE class_name = p_class_name
    AND start_date < current_exam_date
  ORDER BY start_date DESC
  LIMIT 1;
  
  IF prev_exam_id IS NULL THEN
    RETURN json_build_object('previousPosition', NULL, 'previousExamId', NULL);
  END IF;
  
  -- Calculate previous position
  WITH student_totals AS (
    SELECT ar.student_id, SUM(ar.marks) as total_marks
    FROM academic_results ar
    WHERE ar.exam_id = prev_exam_id
    GROUP BY ar.student_id
  ),
  ranked AS (
    SELECT student_id, ROW_NUMBER() OVER (ORDER BY total_marks DESC) as position
    FROM student_totals
  )
  SELECT r.position INTO prev_position
  FROM ranked r
  WHERE r.student_id = p_student_id;
  
  RETURN json_build_object(
    'previousPosition', prev_position,
    'previousExamId', prev_exam_id
  );
END;
$$;

-- Function to get class improvement rankings (bypasses RLS)
CREATE OR REPLACE FUNCTION get_class_improvement_rankings(
  p_exam_id UUID,
  p_class_name TEXT
)
RETURNS JSON
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result JSON;
  prev_exam_id UUID;
  current_exam_date DATE;
BEGIN
  -- Get current exam date
  SELECT start_date INTO current_exam_date
  FROM exams WHERE id = p_exam_id;
  
  -- Find previous exam
  SELECT id INTO prev_exam_id
  FROM exams
  WHERE class_name = p_class_name
    AND start_date < current_exam_date
  ORDER BY start_date DESC
  LIMIT 1;
  
  IF prev_exam_id IS NULL THEN
    RETURN '[]'::JSON;
  END IF;
  
  -- Calculate improvement rankings
  WITH current_totals AS (
    SELECT ar.student_id, SUM(ar.marks) as total_marks
    FROM academic_results ar
    WHERE ar.exam_id = p_exam_id
    GROUP BY ar.student_id
  ),
  previous_totals AS (
    SELECT ar.student_id, SUM(ar.marks) as total_marks
    FROM academic_results ar
    WHERE ar.exam_id = prev_exam_id
    GROUP BY ar.student_id
  ),
  improvements AS (
    SELECT 
      c.student_id,
      (c.total_marks - COALESCE(p.total_marks, 0)) as diff
    FROM current_totals c
    INNER JOIN previous_totals p ON c.student_id = p.student_id
  )
  SELECT json_agg(row_to_json(improvements) ORDER BY diff DESC)
  INTO result
  FROM improvements;
  
  RETURN COALESCE(result, '[]'::JSON);
END;
$$;