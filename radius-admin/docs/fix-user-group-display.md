# Fix User Group Display in Edit Form

## Problem Description

When editing a user that has been assigned to a group, the group selection dropdown would not show the currently assigned group. The form would always display an empty group selection, making it difficult for users to see or modify existing group assignments.

## Root Cause

The issue was in the `handleEdit` function in the enhanced user management component. When opening the edit dialog, the code was setting the group field to an empty string instead of fetching the user's actual group assignments from the database.

```typescript
// Before (problematic code)
setFormData({
  username: user.username,
  password: user.value,
  group: "" // Always empty - not fetching actual group
})
```

## Solution Implemented

### 1. Created User Group API Endpoint

Added a new API endpoint to fetch user group assignments:

**File**: `src/app/api/radius/users/[username]/groups/route.ts`

- **GET**: Fetches all group assignments for a specific user
- **PUT**: Updates user's group assignments (replaces all existing assignments)

### 2. Enhanced Edit Handler

Updated the `handleEdit` function to fetch and display the user's current group:

```typescript
const handleEdit = async (user: RadUser) => {
  setEditingUser(user)
  
  // Fetch user's current group assignments
  try {
    const response = await fetch(`/api/radius/users/${encodeURIComponent(user.username)}/groups`)
    let currentGroup = ""
    
    if (response.ok) {
      const userGroups = await response.json()
      // Get the first group (highest priority) if user has groups
      if (userGroups && userGroups.length > 0) {
        currentGroup = userGroups[0].groupname
      }
    }
    
    setFormData({
      username: user.username,
      password: user.value,
      group: currentGroup // Now shows actual assigned group
    })
  } catch (error) {
    console.error("Error fetching user details:", error)
    setFormData({
      username: user.username,
      password: user.value,
      group: ""
    })
  }
  
  setIsDialogOpen(true)
}
```

### 3. Enhanced Form Submission

Updated the form submission handler to properly handle group updates for existing users:

```typescript
// Handle group assignment/update
if (editingUser) {
  // For existing users, update group assignment
  if (formData.group) {
    await updateUserGroup(formData.username, formData.group)
  } else {
    // Remove user from all groups if no group selected
    await updateUserGroup(formData.username, "")
  }
} else {
  // For new users, assign to group if selected
  if (formData.group) {
    await assignUserToGroup(formData.username, formData.group)
  }
}
```

### 4. Added Group Update Function

Created a new function to handle group updates for existing users:

```typescript
const updateUserGroup = async (username: string, groupName: string) => {
  try {
    const response = await fetch(`/api/radius/users/${encodeURIComponent(username)}/groups`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        groupName
      }),
    })

    if (!response.ok) {
      console.error("Failed to update user group")
    }
  } catch (error) {
    console.error("Error updating user group:", error)
  }
}
```

## Files Modified

1. **`src/app/api/radius/users/[username]/groups/route.ts`** - New API endpoint for user group operations
2. **`src/components/enhanced-user-management.tsx`** - Updated edit handler and form submission
3. **`scripts/test-user-group-display.js`** - Test script to verify functionality

## Database Schema

The solution works with the existing database schema:

- **`radUserGroup`** table stores user-group assignments
- **`radGroupCheck`** table stores group definitions
- **`radCheck`** table stores user credentials

## Key Features

- ✅ **Displays Current Group**: Shows the user's currently assigned group when editing
- ✅ **Group Updates**: Allows changing user group assignments
- ✅ **Group Removal**: Allows removing users from groups
- ✅ **Error Handling**: Graceful fallback if group fetch fails
- ✅ **Priority Support**: Handles multiple group assignments (shows highest priority)
- ✅ **URL Encoding**: Properly handles usernames with special characters

## Testing

Run the test script to verify functionality:

```bash
cd radius-admin
node scripts/test-user-group-display.js
```

## Usage

1. **View Current Group**: When editing a user, the group dropdown will show their current assignment
2. **Change Group**: Select a different group from the dropdown to change the assignment
3. **Remove Group**: Select an empty option to remove the user from all groups
4. **Save Changes**: Click save to apply the group changes

## Benefits

- **Better UX**: Users can see and modify existing group assignments
- **Data Integrity**: Proper handling of group updates and removals
- **Error Resilience**: Graceful handling of API failures
- **Consistency**: Works the same way for both new and existing users
- **Maintainability**: Clean separation of concerns with dedicated API endpoints

This fix ensures that the user management interface provides complete visibility and control over user group assignments, making it much easier to manage user permissions and access control.
