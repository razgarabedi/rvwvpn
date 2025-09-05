# User Management System

This document explains the RADIUS user management system and FreeRADIUS server configuration implemented in the Radius Admin dashboard.

## Overview

The system provides a complete CRUD (Create, Read, Update, Delete) interface for managing:
1. **FreeRADIUS Users** - User accounts and passwords for RADIUS authentication
2. **FreeRADIUS Server Configuration** - IP:port and secret settings for connecting to FreeRADIUS servers

It includes a web-based UI and RESTful API endpoints for programmatic access.

## API Endpoints

### User Management Endpoints
All user management endpoints are prefixed with `/api/radius/users`

### Server Configuration Endpoints
All server configuration endpoints are prefixed with `/api/radius/servers`

### Authentication
All endpoints require authentication via NextAuth.js session. Unauthenticated requests return a 401 Unauthorized status.

### Endpoints

#### GET /api/radius/users
**Description**: Fetch all RADIUS users

**Response**:
```json
[
  {
    "id": 1,
    "username": "john_doe",
    "attribute": "Cleartext-Password",
    "op": ":=",
    "value": "password123"
  }
]
```

**Status Codes**:
- `200` - Success
- `401` - Unauthorized
- `500` - Server Error

#### POST /api/radius/users
**Description**: Create a new RADIUS user

**Request Body**:
```json
{
  "username": "john_doe",
  "password": "password123"
}
```

**Response**:
```json
{
  "id": 1,
  "username": "john_doe",
  "attribute": "Cleartext-Password",
  "op": ":=",
  "value": "password123"
}
```

**Status Codes**:
- `201` - Created
- `400` - Bad Request (missing fields)
- `401` - Unauthorized
- `409` - Conflict (user already exists)
- `500` - Server Error

#### PUT /api/radius/users/[id]
**Description**: Update an existing RADIUS user

**Request Body**:
```json
{
  "username": "john_doe_updated",
  "password": "newpassword123"
}
```

**Response**:
```json
{
  "id": 1,
  "username": "john_doe_updated",
  "attribute": "Cleartext-Password",
  "op": ":=",
  "value": "newpassword123"
}
```

**Status Codes**:
- `200` - Success
- `400` - Bad Request (missing fields or invalid ID)
- `401` - Unauthorized
- `404` - Not Found
- `409` - Conflict (username already exists)
- `500` - Server Error

#### DELETE /api/radius/users/[id]
**Description**: Delete a RADIUS user

**Response**:
```json
{
  "message": "User deleted successfully"
}
```

**Status Codes**:
- `200` - Success
- `400` - Bad Request (invalid ID)
- `401` - Unauthorized
- `404` - Not Found
- `500` - Server Error

#### GET /api/radius/servers
**Description**: Fetch all FreeRADIUS server configurations

**Response**:
```json
[
  {
    "id": "clx1234567890",
    "name": "Main RADIUS Server",
    "host": "192.168.1.100",
    "port": 1813,
    "secret": "testing123",
    "isActive": true,
    "description": "Primary FreeRADIUS server",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z"
  }
]
```

**Status Codes**:
- `200` - Success
- `401` - Unauthorized
- `500` - Server Error

#### POST /api/radius/servers
**Description**: Create a new FreeRADIUS server configuration

**Request Body**:
```json
{
  "name": "Main RADIUS Server",
  "host": "192.168.1.100",
  "port": 1813,
  "secret": "testing123",
  "description": "Primary FreeRADIUS server",
  "isActive": true
}
```

**Response**:
```json
{
  "id": "clx1234567890",
  "name": "Main RADIUS Server",
  "host": "192.168.1.100",
  "port": 1813,
  "secret": "testing123",
  "isActive": true,
  "description": "Primary FreeRADIUS server",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z"
}
```

**Status Codes**:
- `201` - Created
- `400` - Bad Request (missing fields or invalid port)
- `401` - Unauthorized
- `409` - Conflict (server name already exists)
- `500` - Server Error

#### PUT /api/radius/servers/[id]
**Description**: Update an existing FreeRADIUS server configuration

**Request Body**:
```json
{
  "name": "Updated RADIUS Server",
  "host": "192.168.1.101",
  "port": 1813,
  "secret": "newsecret123",
  "description": "Updated server configuration",
  "isActive": false
}
```

**Response**:
```json
{
  "id": "clx1234567890",
  "name": "Updated RADIUS Server",
  "host": "192.168.1.101",
  "port": 1813,
  "secret": "newsecret123",
  "isActive": false,
  "description": "Updated server configuration",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T12:00:00.000Z"
}
```

**Status Codes**:
- `200` - Success
- `400` - Bad Request (missing fields or invalid port)
- `401` - Unauthorized
- `404` - Not Found
- `409` - Conflict (server name already exists)
- `500` - Server Error

#### DELETE /api/radius/servers/[id]
**Description**: Delete a FreeRADIUS server configuration

**Response**:
```json
{
  "message": "Server configuration deleted successfully"
}
```

**Status Codes**:
- `200` - Success
- `401` - Unauthorized
- `404` - Not Found
- `500` - Server Error

## Database Schema

### RadCheck Table
The user management system uses the `RadCheck` table from the FreeRADIUS schema:

```sql
CREATE TABLE "RadCheck" (
  "id" SERIAL PRIMARY KEY,
  "username" VARCHAR NOT NULL,
  "attribute" VARCHAR DEFAULT 'Cleartext-Password',
  "op" VARCHAR DEFAULT ':=',
  "value" VARCHAR NOT NULL,
  UNIQUE("username", "attribute")
);
```

### Field Descriptions
- **id**: Auto-incrementing primary key
- **username**: User identifier (unique per attribute)
- **attribute**: RADIUS attribute type (default: "Cleartext-Password")
- **op**: RADIUS operation (default: ":=")
- **value**: Password or attribute value (stored as plaintext)

### RadiusServerConfig Table
The server configuration system uses the `RadiusServerConfig` table:

```sql
CREATE TABLE "RadiusServerConfig" (
  "id" TEXT PRIMARY KEY,
  "name" TEXT UNIQUE NOT NULL,
  "host" TEXT NOT NULL,
  "port" INTEGER NOT NULL,
  "secret" TEXT NOT NULL,
  "isActive" BOOLEAN DEFAULT true,
  "description" TEXT,
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

### Field Descriptions
- **id**: CUID primary key
- **name**: Unique server configuration name
- **host**: IP address or hostname of the FreeRADIUS server
- **port**: Port number (typically 1813 for accounting, 1812 for authentication)
- **secret**: Shared secret for authenticating with the FreeRADIUS server
- **isActive**: Whether this server configuration is currently active
- **description**: Optional description of the server configuration
- **createdAt**: Creation timestamp
- **updatedAt**: Last update timestamp

## UI Components

### User Management Component
**File**: `src/components/user-management.tsx`

**Features**:
- User table with pagination
- Add/Edit user dialog
- Delete confirmation
- Real-time updates
- Loading states
- Error handling

### Server Configuration Component
**File**: `src/components/server-config.tsx`

**Features**:
- Server configuration table with status indicators
- Add/Edit server configuration dialog
- Delete confirmation
- Real-time updates
- Loading states
- Error handling
- Active/Inactive status management

### Table Columns
1. **Username**: User identifier
2. **Attribute**: RADIUS attribute type
3. **Password**: Masked password display
4. **Actions**: Edit and Delete buttons

### Dialog Form
**Fields**:
- **Username**: Text input (required)
- **Password**: Password input (required)

**Validation**:
- Both fields are required
- Username must be unique
- Password is stored as plaintext (FreeRADIUS requirement)

## User Interface Flow

### 1. Viewing Users
1. User navigates to dashboard
2. Component fetches users via `GET /api/radius/users`
3. Users are displayed in a table format
4. Loading state shown during fetch

### 2. Adding a User
1. User clicks "Add New User" button
2. Dialog opens with empty form
3. User fills in username and password
4. Form submits to `POST /api/radius/users`
5. On success: dialog closes, table refreshes
6. On error: error message displayed

### 3. Editing a User
1. User clicks "Edit" button on a user row
2. Dialog opens with pre-populated form
3. User modifies username and/or password
4. Form submits to `PUT /api/radius/users/[id]`
5. On success: dialog closes, table refreshes
6. On error: error message displayed

### 4. Deleting a User
1. User clicks "Delete" button on a user row
2. Confirmation dialog appears
3. User confirms deletion
4. Request sent to `DELETE /api/radius/users/[id]`
5. On success: table refreshes
6. On error: error message displayed

## Security Considerations

### Authentication
- All API endpoints require valid NextAuth.js session
- Session validation performed on each request
- Unauthenticated requests are rejected with 401 status

### Password Storage
- Passwords stored as plaintext in database
- This is intentional for FreeRADIUS compatibility
- FreeRADIUS handles password verification
- Consider additional security measures for production

### Input Validation
- Username and password are required fields
- Username uniqueness enforced at database level
- SQL injection prevented by Prisma ORM
- XSS protection via React's built-in escaping

## Error Handling

### Client-Side
- Loading states during API calls
- Error messages for failed operations
- Form validation before submission
- Confirmation dialogs for destructive actions

### Server-Side
- Comprehensive error logging
- Appropriate HTTP status codes
- Detailed error messages for debugging
- Graceful handling of database errors

## Usage Examples

### JavaScript/TypeScript
```typescript
// Fetch all users
const response = await fetch('/api/radius/users')
const users = await response.json()

// Create a new user
const newUser = await fetch('/api/radius/users', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'newuser',
    password: 'password123'
  })
})

// Update a user
const updatedUser = await fetch('/api/radius/users/1', {
  method: 'PUT',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    username: 'updateduser',
    password: 'newpassword123'
  })
})

// Delete a user
await fetch('/api/radius/users/1', {
  method: 'DELETE'
})
```

### cURL Examples
```bash
# Get all users
curl -X GET http://localhost:3000/api/radius/users

# Create a user
curl -X POST http://localhost:3000/api/radius/users \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","password":"testpass"}'

# Update a user
curl -X PUT http://localhost:3000/api/radius/users/1 \
  -H "Content-Type: application/json" \
  -d '{"username":"updateduser","password":"newpass"}'

# Delete a user
curl -X DELETE http://localhost:3000/api/radius/users/1
```

## Troubleshooting

### Common Issues

1. **Users not loading**
   - Check database connection
   - Verify authentication status
   - Check browser console for errors

2. **Cannot create user**
   - Ensure username is unique
   - Check required fields are provided
   - Verify database permissions

3. **Cannot edit/delete user**
   - Verify user exists
   - Check user ID is valid
   - Ensure proper authentication

### Debug Mode
Enable detailed logging by checking the browser console and server logs for error messages and stack traces.

## Future Enhancements

- Password strength validation
- Bulk user operations
- User search and filtering
- Export/import functionality
- Audit logging
- User groups management
- Advanced RADIUS attributes
