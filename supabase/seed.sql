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
