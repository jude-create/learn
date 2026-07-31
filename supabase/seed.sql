-- Seed data for application tables only.
-- Create matching Auth users first in Supabase Auth, then replace the UUIDs below
-- with those auth.users IDs. Do not commit real passwords.

insert into public.profiles (id, full_name, role, bio)
values
  ('00000000-0000-0000-0000-000000000001', 'Avery Admin', 'admin', 'Platform administrator'),
  ('00000000-0000-0000-0000-000000000011', 'Maya Chen', 'instructor', 'Mathematics educator focused on clear foundations.'),
  ('00000000-0000-0000-0000-000000000012', 'Jon Bell', 'instructor', 'Science and academic skills educator.'),
  ('00000000-0000-0000-0000-000000000021', 'Sam Rivera', 'student', null),
  ('00000000-0000-0000-0000-000000000022', 'Nia Brooks', 'student', null),
  ('00000000-0000-0000-0000-000000000023', 'Leo Grant', 'student', null),
  ('00000000-0000-0000-0000-000000000024', 'Priya Shah', 'student', null)
on conflict (id) do update set full_name = excluded.full_name, role = excluded.role, bio = excluded.bio;

insert into public.courses (id, title, slug, description, category, level, status, instructor_id)
values
  ('10000000-0000-0000-0000-000000000001', 'College Algebra Foundations', 'college-algebra-foundations', 'Build confidence with expressions, equations, functions and practical problem solving.', 'Mathematics', 'beginner', 'published', '00000000-0000-0000-0000-000000000011'),
  ('10000000-0000-0000-0000-000000000002', 'Academic Writing Studio', 'academic-writing-studio', 'Plan essays, build stronger paragraphs and revise arguments with clearer evidence.', 'English', 'intermediate', 'published', '00000000-0000-0000-0000-000000000012'),
  ('10000000-0000-0000-0000-000000000003', 'Physics: Motion and Forces', 'physics-motion-and-forces', 'Understand motion, acceleration, Newton''s laws and the diagrams used to explain them.', 'Physics', 'intermediate', 'published', '00000000-0000-0000-0000-000000000012'),
  ('10000000-0000-0000-0000-000000000004', 'Human Biology Essentials', 'human-biology-essentials', 'A draft course covering cells, organs, body systems and scientific study habits.', 'Biology', 'beginner', 'draft', '00000000-0000-0000-0000-000000000011')
on conflict (id) do update set title = excluded.title, status = excluded.status;

insert into public.course_modules (id, course_id, title, position)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'Algebra Basics', 1),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'Functions and Graphs', 2),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000002', 'Writing Clear Arguments', 1),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000003', 'Mechanics Core', 1)
on conflict (id) do update set title = excluded.title;

insert into public.lessons (id, module_id, title, slug, content, position)
values
  ('30000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000001', 'Solving Linear Equations', 'solving-linear-equations', 'Linear equations become easier when you isolate the unknown one step at a time and check your result.', 1),
  ('30000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000001', 'Working With Inequalities', 'working-with-inequalities', 'Inequalities follow familiar equation rules, with one important change when multiplying or dividing by a negative number.', 2),
  ('30000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000002', 'Reading Function Graphs', 'reading-function-graphs', 'Graphs show relationships visually. Learn to identify intercepts, slope and practical meaning from a curve.', 1),
  ('30000000-0000-0000-0000-000000000004', '20000000-0000-0000-0000-000000000003', 'Thesis Statements', 'thesis-statements', 'A strong thesis makes a clear claim and gives the reader a useful map for the essay.', 1),
  ('30000000-0000-0000-0000-000000000005', '20000000-0000-0000-0000-000000000004', 'Newton''s Laws in Everyday Motion', 'newtons-laws-in-everyday-motion', 'Newton''s laws explain how forces change motion, from a rolling ball to a braking car.', 1)
on conflict (id) do update set title = excluded.title, content = excluded.content;

insert into public.enrolments (student_id, course_id)
values
  ('00000000-0000-0000-0000-000000000021', '10000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000022', '10000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000023', '10000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000024', '10000000-0000-0000-0000-000000000003')
on conflict (student_id, course_id) do nothing;

insert into public.lesson_progress (student_id, lesson_id, is_completed, completed_at)
values
  ('00000000-0000-0000-0000-000000000021', '30000000-0000-0000-0000-000000000001', true, now()),
  ('00000000-0000-0000-0000-000000000022', '30000000-0000-0000-0000-000000000001', true, now()),
  ('00000000-0000-0000-0000-000000000023', '30000000-0000-0000-0000-000000000004', true, now())
on conflict (student_id, lesson_id) do update set is_completed = excluded.is_completed, completed_at = excluded.completed_at;

insert into public.comments (id, lesson_id, user_id, parent_comment_id, content, is_pinned, is_accepted_answer)
values
  ('40000000-0000-0000-0000-000000000001', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000021', null, 'The step-by-step check at the end helped me catch sign mistakes.', true, false),
  ('40000000-0000-0000-0000-000000000002', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000022', null, 'Why do we do the same operation to both sides of the equation?', false, true),
  ('40000000-0000-0000-0000-000000000003', '30000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000011', '40000000-0000-0000-0000-000000000002', 'Because both sides are equal, applying the same operation keeps the balance true.', false, false)
on conflict (id) do update set content = excluded.content;

insert into public.comment_votes (comment_id, user_id)
values
  ('40000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000022'),
  ('40000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000021')
on conflict (comment_id, user_id) do nothing;

insert into public.schools (id, name, slug, country, state, is_verified)
values
  ('50000000-0000-0000-0000-000000000001', 'University of Lagos', 'unilag', 'Nigeria', 'Lagos', true),
  ('50000000-0000-0000-0000-000000000002', 'University of Nigeria, Nsukka', 'unn', 'Nigeria', 'Enugu', true),
  ('50000000-0000-0000-0000-000000000003', 'Nnamdi Azikiwe University', 'unizik', 'Nigeria', 'Anambra', true)
on conflict (id) do update set name = excluded.name, is_verified = excluded.is_verified;

insert into public.departments (id, school_id, name, slug)
values
  ('51000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', 'Computer Science', 'computer-science'),
  ('51000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', 'Mathematics', 'mathematics'),
  ('51000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000002', 'Electrical Engineering', 'electrical-engineering'),
  ('51000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000003', 'Computer Science', 'computer-science'),
  ('51000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000003', 'Economics', 'economics')
on conflict (school_id, slug) do update set name = excluded.name;

update public.profiles
set school_id = '50000000-0000-0000-0000-000000000001',
    department_id = '51000000-0000-0000-0000-000000000001',
    programme = 'BSc Computer Science',
    graduation_year = 2028,
    onboarding_completed = true
where id in ('00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000022');

update public.profiles
set school_id = '50000000-0000-0000-0000-000000000002',
    department_id = '51000000-0000-0000-0000-000000000003',
    programme = 'BEng Electrical Engineering',
    graduation_year = 2027,
    onboarding_completed = true
where id in ('00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000024');

insert into public.academic_courses (
  id,
  school_id,
  department_id,
  course_code,
  normalised_course_code,
  title,
  slug,
  description,
  academic_level,
  semester,
  status,
  created_by
)
values
  ('52000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000001', 'CSC 101', 'CSC101', 'Introduction to Computer Science', 'csc-101-introduction-to-computer-science', 'Foundational computing concepts, problem solving and programming ideas.', 100, 'first', 'active', '00000000-0000-0000-0000-000000000010'),
  ('52000000-0000-0000-0000-000000000002', '50000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000001', 'CSC 301', 'CSC301', 'Data Structures and Algorithms', 'csc-301-data-structures-and-algorithms', 'Arrays, lists, trees, graphs, algorithm analysis and implementation tradeoffs.', 300, 'first', 'active', '00000000-0000-0000-0000-000000000010'),
  ('52000000-0000-0000-0000-000000000003', '50000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000002', 'MTH 201', 'MTH201', 'Linear Algebra', 'mth-201-linear-algebra', 'Vector spaces, matrices, determinants, eigenvalues and linear transformations.', 200, 'second', 'active', '00000000-0000-0000-0000-000000000010'),
  ('52000000-0000-0000-0000-000000000004', '50000000-0000-0000-0000-000000000002', '51000000-0000-0000-0000-000000000003', 'EEE 305', 'EEE305', 'Digital Electronics', 'eee-305-digital-electronics', 'Number systems, logic gates, combinational circuits and sequential design.', 300, 'first', 'active', '00000000-0000-0000-0000-000000000010'),
  ('52000000-0000-0000-0000-000000000005', '50000000-0000-0000-0000-000000000003', '51000000-0000-0000-0000-000000000004', 'CSC 201', 'CSC201', 'Computer Programming II', 'csc-201-computer-programming-ii', 'Structured programming, data representation and practical problem solving.', 200, 'second', 'active', '00000000-0000-0000-0000-000000000010'),
  ('52000000-0000-0000-0000-000000000006', '50000000-0000-0000-0000-000000000003', '51000000-0000-0000-0000-000000000005', 'ECO 101', 'ECO101', 'Principles of Economics', 'eco-101-principles-of-economics', 'Introductory microeconomics, macroeconomics and economic reasoning.', 100, 'first', 'active', '00000000-0000-0000-0000-000000000010')
on conflict (id) do update set title = excluded.title, status = excluded.status;

insert into public.course_moderators (course_id, user_id, assigned_by, is_active)
values
  ('52000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000021', '00000000-0000-0000-0000-000000000010', true),
  ('52000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000023', '00000000-0000-0000-0000-000000000010', true)
on conflict (course_id, user_id) do update set is_active = excluded.is_active;

insert into public.materials (
  id,
  course_id,
  uploader_id,
  title,
  description,
  material_type,
  academic_session,
  semester,
  storage_path,
  original_file_name,
  mime_type,
  file_size,
  file_hash,
  status,
  approved_by,
  approved_at,
  download_count
)
values
  ('53000000-0000-0000-0000-000000000001', '52000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000022', 'CSC 301 Heap and Graph Notes', 'Clean handwritten summary for priority queues and graph traversal.', 'notes', '2025/2026', 'first', 'materials/50000000-0000-0000-0000-000000000001/52000000-0000-0000-0000-000000000002/00000000-0000-0000-0000-000000000022/heap-graph-notes.pdf', 'heap-graph-notes.pdf', 'application/pdf', 245760, 'demo-hash-csc301-heap-graph-notes', 'approved', '00000000-0000-0000-0000-000000000021', now(), 3),
  ('53000000-0000-0000-0000-000000000002', '52000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000021', 'CSC 301 2024 Past Exam', 'Past examination paper with question topics labelled.', 'past_exam', '2024/2025', 'first', 'materials/50000000-0000-0000-0000-000000000001/52000000-0000-0000-0000-000000000002/00000000-0000-0000-0000-000000000021/csc301-2024-past-exam.pdf', 'csc301-2024-past-exam.pdf', 'application/pdf', 188416, 'demo-hash-csc301-2024-past-exam', 'pending', null, null, 0),
  ('53000000-0000-0000-0000-000000000003', '52000000-0000-0000-0000-000000000004', '00000000-0000-0000-0000-000000000024', 'EEE 305 Logic Gates Slides', 'Lecture slides covering Boolean algebra and gate simplification.', 'lecture_slides', '2025/2026', 'first', 'materials/50000000-0000-0000-0000-000000000002/52000000-0000-0000-0000-000000000004/00000000-0000-0000-0000-000000000024/logic-gates-slides.pdf', 'logic-gates-slides.pdf', 'application/pdf', 391168, 'demo-hash-eee305-logic-gates-slides', 'rejected', null, null, 0)
on conflict (id) do update set title = excluded.title, status = excluded.status;

insert into public.upload_rewards (user_id, material_id, cycle_start, cycle_end, credits_awarded)
values
  ('00000000-0000-0000-0000-000000000022', '53000000-0000-0000-0000-000000000001', public.current_cycle_start(), public.current_cycle_end(), 2)
on conflict (material_id) do nothing;

insert into public.download_events (user_id, material_id, cycle_start, cycle_end, is_first_download_in_cycle, credit_consumed)
values
  ('00000000-0000-0000-0000-000000000021', '53000000-0000-0000-0000-000000000001', public.current_cycle_start(), public.current_cycle_end(), true, 1),
  ('00000000-0000-0000-0000-000000000023', '53000000-0000-0000-0000-000000000001', public.current_cycle_start(), public.current_cycle_end(), true, 1)
on conflict do nothing;

insert into public.discussion_threads (id, course_id, author_id, title, body, tags, is_pinned)
values
  ('54000000-0000-0000-0000-000000000001', '52000000-0000-0000-0000-000000000002', '00000000-0000-0000-0000-000000000022', 'How should I choose between BFS and DFS?', 'I understand both traversals individually, but I am not sure how to decide which one to use in exam questions.', array['graphs', 'algorithms'], true)
on conflict (id) do update set title = excluded.title, body = excluded.body;

insert into public.discussion_answers (id, thread_id, author_id, body)
values
  ('55000000-0000-0000-0000-000000000001', '54000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000021', 'Use BFS when shortest path by edge count matters or when exploring level by level. DFS is useful for backtracking, cycle checks and topological-style reasoning.')
on conflict (id) do update set body = excluded.body;

update public.discussion_threads
set accepted_answer_id = '55000000-0000-0000-0000-000000000001'
where id = '54000000-0000-0000-0000-000000000001';

insert into public.answer_votes (answer_id, user_id, vote_value)
values
  ('55000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000022', 1)
on conflict (answer_id, user_id) do update set vote_value = excluded.vote_value;

insert into public.material_votes (material_id, user_id, vote_value)
values
  ('53000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000021', 1),
  ('53000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000023', 1)
on conflict (material_id, user_id) do update set vote_value = excluded.vote_value;

insert into public.reputation_events (user_id, event_type, points, entity_type, entity_id, unique_event_key, description)
values
  ('00000000-0000-0000-0000-000000000022', 'approved_upload', 10, 'material', '53000000-0000-0000-0000-000000000001', 'seed:approved_upload:53000000-0000-0000-0000-000000000001', 'Approved upload seed reward'),
  ('00000000-0000-0000-0000-000000000021', 'accepted_answer', 15, 'discussion_answer', '55000000-0000-0000-0000-000000000001', 'seed:accepted_answer:55000000-0000-0000-0000-000000000001', 'Accepted answer seed reward')
on conflict (unique_event_key) do nothing;

insert into public.content_flags (id, reporter_id, target_type, target_id, course_id, reason, description, status)
values
  ('56000000-0000-0000-0000-000000000001', '00000000-0000-0000-0000-000000000022', 'material', '53000000-0000-0000-0000-000000000003', '52000000-0000-0000-0000-000000000004', 'low_quality', 'Several slides are unreadable and appear incomplete.', 'open')
on conflict (id) do update set status = excluded.status;

insert into public.course_suggestions (
  id,
  school_id,
  department_id,
  course_code,
  normalised_course_code,
  course_title,
  academic_level,
  semester,
  suggested_by,
  status
)
values
  ('57000000-0000-0000-0000-000000000001', '50000000-0000-0000-0000-000000000001', '51000000-0000-0000-0000-000000000001', 'CSC 405', 'CSC405', 'Artificial Intelligence', 400, 'second', '00000000-0000-0000-0000-000000000021', 'pending')
on conflict (id) do update set status = excluded.status;
