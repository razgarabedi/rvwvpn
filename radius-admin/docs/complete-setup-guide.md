# Complete FreeRADIUS3 Admin Dashboard Setup Guide

This guide provides a comprehensive overview of the fully aligned FreeRADIUS3 admin dashboard with PostgreSQL database integration.

## 🎯 Overview

The admin dashboard is now completely aligned with FreeRADIUS3 requirements and provides:

- ✅ **User Management**: Create, edit, delete RADIUS users
- ✅ **Group Management**: Assign users to groups with attributes
- ✅ **NAS Management**: Configure Network Access Server devices
- ✅ **Attribute Management**: Set user and group reply attributes
- ✅ **FreeRADIUS3 Compatibility**: Perfect schema alignment

## 🗄️ Database Schema

### Core FreeRADIUS3 Tables

| Table | Purpose | Key Fields |
|-------|---------|------------|
| `radcheck` | User authentication | `UserName`, `Attribute`, `Value` |
| `radreply` | User reply attributes | `UserName`, `Attribute`, `Value` |
| `radgroupcheck` | Group authentication | `GroupName`, `Attribute`, `Value` |
| `radgroupreply` | Group reply attributes | `GroupName`, `Attribute`, `Value` |
| `radusergroup` | User-group mapping | `UserName`, `GroupName`, `priority` |
| `radacct` | Accounting records | `UserName`, `AcctSessionId`, `NASIPAddress` |
| `radpostauth` | Post-auth logging | `username`, `authdate`, `reply` |
| `nas` | NAS devices | `nasname`, `secret`, `type` |
| `nasreload` | NAS reload tracking | `NASIPAddress`, `ReloadTime` |

### Field Naming Convention

All fields use the exact FreeRADIUS3 naming convention:
- **PascalCase**: `UserName`, `Attribute`, `Value`, `GroupName`
- **Exact matches**: Field names match FreeRADIUS3 expectations exactly

## 🚀 API Endpoints

### User Management
- `GET /api/radius/users` - List all users
- `POST /api/radius/users` - Create new user
- `PUT /api/radius/users/[id]` - Update user
- `DELETE /api/radius/users/[id]` - Delete user
- `POST /api/radius/users/assign-group` - Assign user to group
- `POST /api/radius/users/reply-attributes` - Add user reply attributes

### Group Management
- `GET /api/radius/groups` - List all groups with attributes
- `POST /api/radius/groups` - Create new group

### NAS Management
- `GET /api/radius/nas` - List all NAS devices
- `POST /api/radius/nas` - Create new NAS device
- `PUT /api/radius/nas/[id]` - Update NAS device
- `DELETE /api/radius/nas/[id]` - Delete NAS device

## 🎨 Frontend Components

### Enhanced User Management (`enhanced-user-management.tsx`)

Features:
- **Tabbed Interface**: Users, Groups, NAS Devices
- **User Creation**: Username, password, group assignment
- **Attribute Management**: Session timeout, idle timeout
- **Group Assignment**: Assign users to groups
- **Real-time Updates**: Automatic refresh after changes

### User Interface Elements

```tsx
// User creation form with group assignment
<form onSubmit={handleSubmit}>
  <Input name="username" placeholder="Username" required />
  <Input name="password" type="password" placeholder="Password" required />
  <Select name="group" placeholder="Select Group (optional)">
    {groups.map(group => <SelectItem value={group.name}>{group.name}</SelectItem>)}
  </Select>
  <Input name="sessionTimeout" type="number" placeholder="Session Timeout" />
  <Input name="idleTimeout" type="number" placeholder="Idle Timeout" />
</form>
```

## 🔧 Setup Instructions

### 1. Database Setup

```bash
# Set environment variables
$env:DATABASE_URL="postgresql://postgres:a3eilm2s2y@localhost:5432/freeradius_db?schema=public"

# Push schema to database
npx prisma db push

# Generate Prisma client
npx prisma generate
```

### 2. Test Data Creation

```bash
# Create test users and groups
node scripts/setup-freeradius-test.js

# Test user creation flow
node scripts/test-user-creation.js

# Verify database setup
node scripts/check-users.js
```

### 3. Start Development Server

```bash
npm run dev
```

## 🧪 Testing

### Manual Testing

1. **Create User**: Use the admin dashboard to create a new user
2. **Assign Group**: Assign user to a group
3. **Set Attributes**: Configure session and idle timeouts
4. **Verify Database**: Check that data is stored correctly

### Automated Testing

```bash
# Test complete user creation flow
node scripts/test-user-creation.js

# Test database connectivity
node scripts/check-users.js

# Test table structure
node scripts/check-tables.js
```

## 📊 User Creation Flow

### 1. Frontend Form Submission

```typescript
const formData = {
  username: "newuser",
  password: "newpass123",
  group: "users",
  sessionTimeout: "3600",
  idleTimeout: "1800"
}
```

### 2. API Processing

```typescript
// Create user in radcheck table
await prisma.radCheck.create({
  data: {
    UserName: username,
    Attribute: "Cleartext-Password",
    op: ":=",
    Value: password
  }
})

// Assign to group
await prisma.radUserGroup.create({
  data: {
    UserName: username,
    GroupName: group,
    priority: 1
  }
})

// Add reply attributes
await prisma.radReply.create({
  data: {
    UserName: username,
    Attribute: "Session-Timeout",
    op: "=",
    Value: sessionTimeout
  }
})
```

### 3. Database Storage

The user is now stored in multiple tables:
- `radcheck`: Authentication credentials
- `radusergroup`: Group membership
- `radreply`: User-specific attributes

## 🔍 Verification Methods

### 1. Database Queries

```sql
-- Check user authentication
SELECT * FROM radcheck WHERE "UserName" = 'testuser';

-- Check group assignment
SELECT * FROM radusergroup WHERE "UserName" = 'testuser';

-- Check reply attributes
SELECT * FROM radreply WHERE "UserName" = 'testuser';
```

### 2. FreeRADIUS3 Testing

```bash
# Test authentication
radtest testuser testpass123 192.168.1.100 0 testing123

# Expected output: Access-Accept
```

### 3. Admin Dashboard

- Navigate to the admin dashboard
- Check the Users tab for created users
- Verify group assignments
- Check NAS device configuration

## 🚨 Troubleshooting

### Common Issues

1. **Field Name Mismatches**
   - Ensure all API routes use `UserName`, `Attribute`, `Value`
   - Check Prisma schema field mappings

2. **Group Assignment Failures**
   - Verify group exists before assignment
   - Check user exists before group assignment

3. **Database Connection Issues**
   - Verify DATABASE_URL is correct
   - Check PostgreSQL is running
   - Ensure database exists

### Debug Steps

1. **Check Database Connection**
   ```bash
   node scripts/check-tables.js
   ```

2. **Test User Creation**
   ```bash
   node scripts/test-user-creation.js
   ```

3. **Verify API Endpoints**
   ```bash
   curl -X GET http://localhost:3000/api/radius/users
   ```

## 🎉 Success Indicators

Your setup is working correctly when:

- ✅ All FreeRADIUS3 tables exist with correct structure
- ✅ Users can be created via admin dashboard
- ✅ Group assignments work properly
- ✅ Reply attributes are set correctly
- ✅ FreeRADIUS3 can authenticate users
- ✅ No "relation does not exist" errors
- ✅ Database queries return expected results

## 📈 Next Steps

1. **Production Deployment**: Deploy to production environment
2. **FreeRADIUS3 Configuration**: Update FreeRADIUS3 config files
3. **Monitoring**: Set up logging and monitoring
4. **Backup**: Implement database backup strategy
5. **Security**: Review and enhance security measures

The admin dashboard is now fully aligned with FreeRADIUS3 and ready for production use!
