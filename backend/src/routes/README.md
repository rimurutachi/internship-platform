# Authentication Routes API

This document describes the refactored authentication routes that provide a clean, secure, and well-organized API for user authentication and management.

## File Structure

```
backend/src/
├── routes/
│   ├── authRoutes.ts          # Main auth routes (refactored)
│   └── README.md             # This documentation
├── services/
│   └── authService.ts        # Business logic layer
├── middleware/
│   ├── auth.ts              # Authentication middleware
│   └── validation.ts        # Input validation middleware
├── utils/
│   └── responseUtils.ts     # Standardized response utilities
└── types/
    └── auth.ts              # TypeScript interfaces
```

## API Endpoints

### 1. User Login
```http
POST /auth/login
Content-Type: application/json

{
  "email": "user@example.com",
  "password": "password123"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "success": true,
    "access_token": "jwt_token_here",
    "refresh_token": "refresh_token_here",
    "user": {...},
    "expires_at": 1234567890
  }
}
```

### 2. User Registration
```http
POST /auth/register
Content-Type: application/json

{
  "email": "newuser@example.com",
  "password": "password123",
  "first_name": "John",
  "last_name": "Doe",
  "role": "student",
  "university_code": "UST",
  "profile_data": {...}
}
```

### 3. Get User Profile
```http
GET /auth/profile
Authorization: Bearer <access_token>
```

### 4. Update User Profile
```http
PUT /auth/profile
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "first_name": "Updated Name",
  "profile_data": {...}
}
```

### 5. Get All Users (Admin Only)
```http
GET /auth/users
Authorization: Bearer <admin_access_token>
```

### 6. Logout
```http
POST /auth/logout
Authorization: Bearer <access_token>
```

## Key Improvements

### ✅ **Clean Architecture**
- **Separation of Concerns**: Business logic moved to service layer
- **Middleware Chain**: Validation, sanitization, and authentication
- **Type Safety**: Strong TypeScript interfaces

### ✅ **Enhanced Security**
- **Input Validation**: Comprehensive validation middleware
- **Input Sanitization**: XSS protection and data cleaning
- **Role-based Access**: Proper authorization checks

### ✅ **Better Error Handling**
- **Standardized Responses**: Consistent API response format
- **Detailed Error Messages**: Clear error descriptions
- **Proper HTTP Status Codes**: Appropriate status codes for different scenarios

### ✅ **Improved Maintainability**
- **Modular Code**: Easy to test and modify
- **Async Error Handling**: Proper async/await error management
- **Documentation**: Clear API documentation

### ✅ **Performance Optimizations**
- **Efficient Database Queries**: Optimized Supabase queries
- **Reduced Code Duplication**: DRY principles applied
- **Better Resource Management**: Proper error boundaries

## Usage Examples

### Frontend Integration
```typescript
// Login
const loginUser = async (credentials: LoginRequest) => {
  const response = await fetch('/auth/login', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(credentials)
  });
  return response.json();
};

// Get Profile
const getUserProfile = async (token: string) => {
  const response = await fetch('/auth/profile', {
    headers: { 'Authorization': `Bearer ${token}` }
  });
  return response.json();
};
```

### Testing
```typescript
// Example test case
describe('Auth Routes', () => {
  test('should login user with valid credentials', async () => {
    const response = await request(app)
      .post('/auth/login')
      .send({
        email: 'test@example.com',
        password: 'password123'
      });
    
    expect(response.status).toBe(200);
    expect(response.body.success).toBe(true);
  });
});
```

## Environment Variables Required

```env
SUPABASE_URL=your_supabase_url
SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_KEY=your_supabase_service_key
```

## Error Codes Reference

| Status Code | Error Type | Description |
|-------------|------------|-------------|
| 400 | Validation Error | Invalid input data |
| 401 | Authentication Error | Invalid or missing token |
| 403 | Authorization Error | Insufficient permissions |
| 404 | Not Found | Resource not found |
| 500 | Internal Server Error | Server-side error |

This refactored structure makes the authentication system more robust, secure, and maintainable while providing a better developer experience.
