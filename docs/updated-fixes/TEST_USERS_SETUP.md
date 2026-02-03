# Demo Test Users & Credentials

**⚠️ IMPORTANT:** Create these test users in Supabase before defense!

---

## Test Users Setup

### 1. Student User
```
Email: student.test@cvsu.edu.ph
Password: TestStudent123!
Role: student
First Name: Juan
Last Name: Dela Cruz
Student Number: 2021-12345
University: Cavite State University (CvSU)
```

**Assigned To:**
- Supervisor: Maria Santos
- Advisor: Dr. Pedro Reyes

---

### 2. Supervisor User
```
Email: supervisor.test@company.com
Password: TestSupervisor123!
Role: supervisor
First Name: Maria
Last Name: Santos
Company: Tech Solutions Inc.
Position: Senior Developer
```

**Supervising Students:**
- Juan Dela Cruz
- (Add more if needed)

---

### 3. Advisor User
```
Email: advisor.test@cvsu.edu.ph
Password: TestAdvisor123!
Role: advisor
First Name: Dr. Pedro
Last Name: Reyes
University: Cavite State University (CvSU)
Department: Computer Science
```

**Advising Students:**
- Juan Dela Cruz
- (Add more if needed)

---

### 4. Admin User
```
Email: admin.test@cvsu.edu.ph
Password: TestAdmin123!
Role: admin
First Name: Admin
Last Name: User
University: Cavite State University (CvSU)
```

**Permissions:**
- Full system access
- User management
- Rubrics management
- System settings

---

## Setup Instructions

### Option 1: Manual Creation (Supabase Dashboard)

1. Go to Supabase Dashboard → Authentication → Users
2. Click "Add User"
3. Enter email and password
4. Go to SQL Editor and run:

```sql
-- Update user metadata after creation
UPDATE auth.users
SET raw_app_meta_data = jsonb_set(
  raw_app_meta_data,
  '{role}',
  '"student"'::jsonb
)
WHERE email = 'student.test@cvsu.edu.ph';

-- Insert into users table
INSERT INTO users (
  id,
  email,
  first_name,
  last_name,
  role,
  student_number,
  university_id
) VALUES (
  (SELECT id FROM auth.users WHERE email = 'student.test@cvsu.edu.ph'),
  'student.test@cvsu.edu.ph',
  'Juan',
  'Dela Cruz',
  'student',
  '2021-12345',
  (SELECT id FROM universities WHERE name = 'Cavite State University' LIMIT 1)
);
```

Repeat for all users, changing role, email, and names accordingly.

---

### Option 2: SQL Script (Faster)

Run this SQL in Supabase SQL Editor:

```sql
-- Create test users in auth.users (Note: Use Supabase Dashboard for this step)
-- Then run this script to populate users table

-- Get CvSU university ID
DO $$
DECLARE
  cvsu_id uuid;
  student_auth_id uuid;
  supervisor_auth_id uuid;
  advisor_auth_id uuid;
  admin_auth_id uuid;
  company_id uuid;
  internship_id uuid;
BEGIN
  -- Get university ID
  SELECT id INTO cvsu_id FROM universities WHERE name ILIKE '%Cavite State%' LIMIT 1;
  
  -- If no university, create it
  IF cvsu_id IS NULL THEN
    INSERT INTO universities (name, location, contact_email)
    VALUES ('Cavite State University', 'Indang, Cavite', 'info@cvsu.edu.ph')
    RETURNING id INTO cvsu_id;
  END IF;

  -- Get auth IDs (assumes you created users in Supabase Auth first)
  SELECT id INTO student_auth_id FROM auth.users WHERE email = 'student.test@cvsu.edu.ph';
  SELECT id INTO supervisor_auth_id FROM auth.users WHERE email = 'supervisor.test@company.com';
  SELECT id INTO advisor_auth_id FROM auth.users WHERE email = 'advisor.test@cvsu.edu.ph';
  SELECT id INTO admin_auth_id FROM auth.users WHERE email = 'admin.test@cvsu.edu.ph';

  -- Insert student
  INSERT INTO users (id, email, first_name, last_name, role, student_number, university_id, status)
  VALUES (student_auth_id, 'student.test@cvsu.edu.ph', 'Juan', 'Dela Cruz', 'student', '2021-12345', cvsu_id, 'active')
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role;

  -- Insert supervisor
  INSERT INTO users (id, email, first_name, last_name, role, company_name, position, university_id, status)
  VALUES (supervisor_auth_id, 'supervisor.test@company.com', 'Maria', 'Santos', 'supervisor', 'Tech Solutions Inc.', 'Senior Developer', cvsu_id, 'active')
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role;

  -- Insert advisor
  INSERT INTO users (id, email, first_name, last_name, role, department, university_id, status)
  VALUES (advisor_auth_id, 'advisor.test@cvsu.edu.ph', 'Dr. Pedro', 'Reyes', 'advisor', 'Computer Science', cvsu_id, 'active')
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role;

  -- Insert admin
  INSERT INTO users (id, email, first_name, last_name, role, university_id, status)
  VALUES (admin_auth_id, 'admin.test@cvsu.edu.ph', 'Admin', 'User', 'admin', cvsu_id, 'active')
  ON CONFLICT (id) DO UPDATE SET
    first_name = EXCLUDED.first_name,
    last_name = EXCLUDED.last_name,
    role = EXCLUDED.role;

  -- Create company
  INSERT INTO companies (name, industry, location, contact_email, university_id)
  VALUES ('Tech Solutions Inc.', 'Information Technology', 'Makati City', 'hr@techsolutions.com', cvsu_id)
  ON CONFLICT (name, university_id) DO NOTHING
  RETURNING id INTO company_id;
  
  IF company_id IS NULL THEN
    SELECT id INTO company_id FROM companies WHERE name = 'Tech Solutions Inc.' LIMIT 1;
  END IF;

  -- Create internship relationship
  INSERT INTO internships (
    student_id,
    supervisor_id,
    advisor_id,
    company_id,
    university_id,
    title,
    start_date,
    end_date,
    status
  ) VALUES (
    student_auth_id,
    supervisor_auth_id,
    advisor_auth_id,
    company_id,
    cvsu_id,
    'Software Development Internship',
    CURRENT_DATE - INTERVAL '2 months',
    CURRENT_DATE + INTERVAL '1 month',
    'active'
  )
  ON CONFLICT DO NOTHING;

  RAISE NOTICE 'Test users created successfully!';
  RAISE NOTICE 'CvSU ID: %', cvsu_id;
  RAISE NOTICE 'Student ID: %', student_auth_id;
  RAISE NOTICE 'Supervisor ID: %', supervisor_auth_id;
  RAISE NOTICE 'Advisor ID: %', advisor_auth_id;
  RAISE NOTICE 'Admin ID: %', admin_auth_id;
END $$;
```

---

## Quick Login URLs

**Save these for quick access during testing:**

- Landing: http://localhost:3000
- Login: http://localhost:3000/login
- Student Dashboard: http://localhost:3000/dashboard/student
- Supervisor Dashboard: http://localhost:3000/dashboard/supervisor
- Advisor Dashboard: http://localhost:3000/dashboard/advisor
- Admin Dashboard: http://localhost:3000/dashboard/admin

---

## Testing Scenarios

### Scenario 1: Complete Weekly Report Flow
1. Login as **student.test@cvsu.edu.ph**
2. Create weekly report
3. Logout
4. Login as **supervisor.test@company.com**
5. Approve report
6. Logout
7. Login as **student.test@cvsu.edu.ph**
8. Verify approved status

### Scenario 2: Complete Evaluation Flow
1. Login as **supervisor.test@company.com**
2. Create final evaluation for Juan Dela Cruz
3. Submit to advisor
4. Logout
5. Login as **advisor.test@cvsu.edu.ph**
6. Review evaluation
7. Approve (AI analytics triggered!)
8. Check logs for AI activity

### Scenario 3: Admin User Management
1. Login as **admin.test@cvsu.edu.ph**
2. Archive **student.test@cvsu.edu.ph**
3. Logout
4. Try login as **student.test@cvsu.edu.ph** → BLOCKED
5. Login as admin again
6. Unarchive student
7. Try login as student → SUCCESS

---

## Verification Checklist

After creating test users, verify:

- [ ] All users can login successfully
- [ ] Student sees weekly reports page
- [ ] Supervisor sees student reports and evaluations
- [ ] Advisor sees evaluation review page
- [ ] Admin sees user management and rubrics
- [ ] Internship relationship exists (student-supervisor-advisor)
- [ ] CvSU university exists in database
- [ ] Active rubric exists for CvSU

---

## Troubleshooting

### User can't login
- Check `auth.users` table - user exists?
- Check `users` table - user record exists?
- Check `raw_app_meta_data` - role set correctly?
- Verify password was set correctly

### Student has no supervisor
- Check `internships` table
- Verify `student_id`, `supervisor_id`, `advisor_id` are correct
- Status should be 'active'

### No evaluations/reports available
- Create sample data manually or use the testing flows
- Weekly reports must be submitted first
- Evaluations require active internship

---

**After creating test users, you're ready to start testing! 🚀**
