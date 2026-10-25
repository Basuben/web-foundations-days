-- Day 6: A School Database (SQLite)
PRAGMA foreign_keys = ON;

-- 1. Tables ---------------------------------------------------------------

CREATE TABLE students (
  student_id INTEGER PRIMARY KEY,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL UNIQUE
);

CREATE TABLE courses (
  course_id INTEGER PRIMARY KEY,
  title     TEXT NOT NULL,
  credits   INTEGER NOT NULL
);

CREATE TABLE enrolments (
  enrolment_id INTEGER PRIMARY KEY,
  student_id   INTEGER NOT NULL,
  course_id    INTEGER NOT NULL,
  grade        TEXT,
  FOREIGN KEY (student_id) REFERENCES students (student_id),
  FOREIGN KEY (course_id)  REFERENCES courses (course_id),
  UNIQUE (student_id, course_id)
);

-- 2. Sample data ----------------------------------------------------------

INSERT INTO students (name, email) VALUES
  ('Amina Otieno',  'amina@school.test'),
  ('Brian Kiptoo',  'brian@school.test'),
  ('Cynthia Wanjiru', 'cynthia@school.test'),
  ('David Mwangi',  'david@school.test');

INSERT INTO courses (title, credits) VALUES
  ('Web Foundations', 3),
  ('Databases',       4),
  ('Python Basics',   3);

INSERT INTO enrolments (student_id, course_id, grade) VALUES
  (1, 1, 'A'),
  (1, 2, 'B'),
  (2, 1, 'B'),
  (2, 3, NULL),
  (3, 1, 'A'),
  (3, 2, 'C');

-- 3. Queries --------------------------------------------------------------

-- Q1: all courses for one student (by name)
SELECT courses.title, enrolments.grade
FROM students
JOIN enrolments ON enrolments.student_id = students.student_id
JOIN courses    ON courses.course_id     = enrolments.course_id
WHERE students.name = 'Amina Otieno';

-- Q2: all students on one course
SELECT students.name, students.email
FROM courses
JOIN enrolments ON enrolments.course_id  = courses.course_id
JOIN students   ON students.student_id   = enrolments.student_id
WHERE courses.title = 'Web Foundations';

-- Q3: the number of students per course (courses with none show 0)
SELECT courses.title, COUNT(enrolments.student_id) AS student_count
FROM courses
LEFT JOIN enrolments ON enrolments.course_id = courses.course_id
GROUP BY courses.course_id, courses.title
ORDER BY student_count DESC;

-- Q4: students who have no enrolments
SELECT students.name
FROM students
LEFT JOIN enrolments ON enrolments.student_id = students.student_id
WHERE enrolments.enrolment_id IS NULL;

-- Q5: update one enrolment's grade (Brian's Python Basics grade)
UPDATE enrolments
SET grade = 'B'
WHERE student_id = 2 AND course_id = 3;

-- Check the update worked
SELECT students.name, courses.title, enrolments.grade
FROM enrolments
JOIN students ON students.student_id = enrolments.student_id
JOIN courses  ON courses.course_id   = enrolments.course_id
WHERE enrolments.student_id = 2 AND enrolments.course_id = 3;
