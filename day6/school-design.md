# School Database Design

## Tables

### students
- Holds one row per student.
- `student_id` is the primary key.
- `name` is required, and `email` is required and unique so no two students share an address.

### courses
- Holds one row per course.
- `course_id` is the primary key.
- `title` and `credits` are both required.

### enrolments
- Holds one row for each time a student is enrolled on a course.
- `student_id` and `course_id` are foreign keys that point to the other two tables.
- `grade` is the only data that belongs to the pairing itself. It can be empty until the course is marked.
- A `UNIQUE (student_id, course_id)` rule stops the same student enrolling on the same course twice.

## Relationships

- **One student to many enrolments:** one student can have many enrolment rows, but each row belongs to one student.
- **One course to many enrolments:** one course can have many enrolment rows, but each row belongs to one course.
- **Students to courses is many-to-many:** a student takes several courses and a course has several students.
- **Why a join table is needed:** a relational table cannot store a list in one cell. Putting course ids in the students table (or student ids in the courses table) would break the one-value-per-cell rule and make queries messy. The `enrolments` table turns one many-to-many link into two one-to-many links. It also gives the grade a natural home, because a grade belongs to a student on a course and not to either one alone.

## Index

I would add an index on `enrolments(course_id)`:

```sql
CREATE INDEX idx_enrolments_course_id ON enrolments (course_id);
```

- The unique rule on `(student_id, course_id)` already creates an index that helps look-ups by student.
- Queries such as "all students on one course" and "students per course" start from the course, so they need a fast way to find every enrolment for a course.
- Without it, the database scans the whole enrolments table, which gets slow as the school grows.

## SQL or NoSQL

I would choose SQL for this system. School data is structured and highly related: students, courses and enrolments always have the same shape, and the questions we ask (who is on this course, who has no enrolments, how many students per course) are joins and counts that SQL does well. The rules also matter. A unique email, a foreign key that stops an enrolment pointing at a missing student, and a guard against double enrolment are all enforced by the database itself, so bad data cannot get in. Transactions keep a change such as moving a student between courses all or nothing. A NoSQL document store could suit very flexible or very large data, but this system is small, consistent and relational, so the extra flexibility would cost us safety without giving us a benefit.
