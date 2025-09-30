export const mockUser = {
    id: '123e4567-e89b-12d3-a456-426614174000',
    email: 'test@university.edu',
    role: 'student' as const,
    first_name: 'John',
    last_name: 'Doe',
    university_id: '456e7890-e89b-12d3-a456-426614174000',
};

export const mockUniversity = {
    id: '456e7890-e89b-12d3-a456-426614174000',
  name: 'Test University',
  code: 'TU',
  address: '123 Test Street',
};

export const mockCompany = {
    id: '789e0123-e89b-12d3-a456-426614174000',
    name: 'Test Company Inc.',
    industry: 'Technology',
    is_verified: true,
};