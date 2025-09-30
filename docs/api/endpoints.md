# Intern-Galing API Documentation

## Base URL
- Development: http://localhost:5000
- Production: https://api.intern-galing.com

## Authentication
All API requests require authentication via JWT token in header:
\```
Authorization: Bearer <jwt_token>
\```

## Endpoints

### Health Check
**GET** `/health`

Returns API status.

**Response:**
\```json
{
  "status": "OK",
  "message": "Intern-Galing API is running smoothly."
}
\```

### Authentication

#### Login
**POST** `/auth/login`

**Body:**
\```json
{
  "email": "user@example.com",
  "password": "password123"
}
\```

**Response:**
\```json
{
  "success": true,
  "data": {
    "user": {
      "id": "uuid",
      "email": "user@example.com", 
      "role": "student"
    },
    "token": "jwt_token_here"
  }
}
\```

### Users

#### Get User Profile
**GET** `/users/profile`

Requires authentication.

**Response:**
\```json
{
  "success": true,
  "data": {
    "id": "uuid",
    "email": "user@example.com",
    "role": "student",
    "first_name": "John",
    "last_name": "Doe"
  }
}
\```

#### Update User Profile
**PUT** `/users/profile`

**Body:**
\```json
{
  "first_name": "John",
  "last_name": "Doe"
}
\```

### Error Responses
All errors follow this format:
\```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
\```

## Rate Limiting
- 100 requests per 15 minutes per IP
- Returns HTTP 429 when exceeded

## Status Codes
- 200: Success
- 201: Created
- 400: Bad Request
- 401: Unauthorized  
- 403: Forbidden
- 404: Not Found
- 429: Too Many Requests
- 500: Internal Server Error