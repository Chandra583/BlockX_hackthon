# Admin Notifications API Documentation

## Overview

The Admin Notifications API provides real-time notification and activity management for admin users. It includes REST endpoints for fetching, marking as read, and managing admin-specific notifications, along with WebSocket events for real-time updates.

## Authentication

All admin notification endpoints require:
- Valid JWT token in Authorization header
- User role must be 'admin'

```bash
Authorization: Bearer <jwt_token>
```

## REST Endpoints

### 1. Get Admin Notifications

**GET** `/api/admin/notifications`

Retrieves paginated admin notifications.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)
- `unread` (optional): Filter unread notifications (true/false)

**Response:**
```json
{
  "status": "success",
  "message": "Admin notifications retrieved successfully",
  "data": {
    "notifications": [
      {
        "id": "notification_id",
        "title": "System Alert",
        "message": "Database maintenance scheduled",
        "type": "system",
        "priority": "high",
        "read": false,
        "createdAt": "2023-01-01T10:00:00Z",
        "actionUrl": "/admin/system",
        "actionLabel": "View Details"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalNotifications": 50,
      "limit": 10
    },
    "unreadCount": 7
  }
}
```

### 2. Mark Notification as Read

**POST** `/api/admin/notifications/:id/read`

Marks a specific notification as read.

**Response:**
```json
{
  "status": "success",
  "message": "Notification marked as read"
}
```

### 3. Mark All Notifications as Read

**POST** `/api/admin/notifications/read-all`

Marks all admin notifications as read.

**Response:**
```json
{
  "status": "success",
  "message": "All notifications marked as read",
  "data": {
    "markedCount": 5
  }
}
```

### 4. Get Admin Activity

**GET** `/api/admin/activity`

Retrieves admin activity feed.

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Items per page (default: 10)

**Response:**
```json
{
  "status": "success",
  "message": "Admin activity retrieved successfully",
  "data": {
    "activity": [
      {
        "id": "activity_id",
        "title": "System Health Check",
        "subtext": "All systems operational",
        "icon": "shield",
        "entityType": "system",
        "entityId": "system123",
        "createdAt": "2023-01-01T10:00:00Z",
        "type": "system",
        "actionUrl": "/admin/system"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 25,
      "limit": 10
    }
  }
}
```

## WebSocket Events

### Client → Server

**Join Admin Room:**
```javascript
socket.emit('join_admin');
```

### Server → Client

**1. New Admin Notification:**
```javascript
socket.on('notification_created_admin', (data) => {
  console.log('New admin notification:', data.notification);
});
```

**Data Structure:**
```json
{
  "notification": {
    "id": "notification_id",
    "title": "Security Alert",
    "message": "Suspicious activity detected",
    "type": "security",
    "priority": "urgent",
    "createdAt": "2023-01-01T10:00:00Z",
    "read": false,
    "actionUrl": "/admin/security",
    "actionLabel": "Investigate"
  }
}
```

**2. New Admin Activity:**
```javascript
socket.on('activity_created_admin', (data) => {
  console.log('New admin activity:', data.activity);
});
```

**Data Structure:**
```json
{
  "activity": {
    "id": "activity_id",
    "title": "User Registration",
    "subtext": "New user john.doe@example.com registered",
    "icon": "user-plus",
    "entityType": "user",
    "entityId": "user123",
    "createdAt": "2023-01-01T10:00:00Z",
    "type": "user_registration",
    "actionUrl": "/admin/users/user123"
  }
}
```

## Notification Types

| Type | Description | Icon | Priority |
|------|-------------|------|----------|
| `security` | Security alerts and threats | shield | high/urgent |
| `fraud_alert` | Fraud detection alerts | alert-triangle | high/urgent |
| `system` | System status and maintenance | database | medium/high |
| `user_registration` | New user registrations | user-plus | medium |
| `vehicle_approval` | Vehicle registration approvals | car | medium |
| `batch_anchor` | Blockchain batch anchoring | link | low/medium |
| `transaction` | Transaction confirmations | dollar-sign | low/medium |
| `reminder` | System reminders | clock | low |
| `update` | System updates | refresh-cw | low/medium |

## Activity Icons

| Icon Name | Component | Color |
|-----------|-----------|-------|
| `shield` | Shield | red |
| `alert-triangle` | AlertTriangle | red |
| `database` | Database | blue |
| `user-plus` | UserPlus | green |
| `car` | Car | blue |
| `link` | Link | purple |
| `dollar-sign` | DollarSign | green |
| `check-circle` | CheckCircle | green |
| `clock` | Clock | yellow |
| `settings` | Settings | gray |
| `wrench` | Wrench | orange |
| `bell` | Bell | gray |

## Testing

### Manual Testing

1. **Create Test Admin User:**
```bash
curl -X POST http://localhost:3000/api/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123",
    "firstName": "Admin",
    "lastName": "User",
    "role": "admin"
  }'
```

2. **Login as Admin:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@test.com",
    "password": "password123"
  }'
```

3. **Create Test Notification:**
```bash
curl -X POST http://localhost:3000/api/admin/notifications \
  -H "Authorization: Bearer <admin_token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "Test Admin Notification",
    "message": "This is a test notification for admin",
    "type": "system",
    "priority": "medium"
  }'
```

4. **Get Admin Notifications:**
```bash
curl -X GET http://localhost:3000/api/admin/notifications \
  -H "Authorization: Bearer <admin_token>"
```

5. **Mark Notification as Read:**
```bash
curl -X POST http://localhost:3000/api/admin/notifications/<notification_id>/read \
  -H "Authorization: Bearer <admin_token>"
```

6. **Get Admin Activity:**
```bash
curl -X GET http://localhost:3000/api/admin/activity \
  -H "Authorization: Bearer <admin_token>"
```

### Automated Testing

Run the test suite:
```bash
# Backend tests
npm test -- --testPathPattern=api.admin.notifications.test.ts

# Frontend tests
npm test -- --testPathPattern=admin.notifications
```

## Error Handling

### Common Error Responses

**401 Unauthorized:**
```json
{
  "status": "error",
  "message": "Access denied. Admin role required."
}
```

**404 Not Found:**
```json
{
  "status": "error",
  "message": "Notification not found or access denied"
}
```

**500 Internal Server Error:**
```json
{
  "status": "error",
  "message": "Failed to fetch admin notifications"
}
```

## Rate Limiting

- Admin notification endpoints: 50 requests per 15 minutes
- Mark as read endpoints: 10 requests per 15 minutes

## Security Considerations

1. **Role-based Access:** Only admin users can access admin notification endpoints
2. **Data Scoping:** Notifications are scoped to admin users or global admin notifications
3. **JWT Validation:** All requests require valid JWT tokens
4. **Rate Limiting:** Prevents abuse of notification endpoints
5. **Input Validation:** All inputs are validated and sanitized

## Performance Optimization

1. **Database Indexing:** Indexes on `userId`, `userRole`, `readAt`, and `createdAt`
2. **Pagination:** All list endpoints support pagination
3. **Caching:** Consider implementing Redis caching for frequently accessed data
4. **WebSocket Rooms:** Admin notifications use dedicated socket rooms for efficient delivery

## Monitoring

Monitor the following metrics:
- Notification delivery success rate
- WebSocket connection stability
- API response times
- Error rates by endpoint
- Admin user engagement with notifications
