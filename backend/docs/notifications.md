# Notifications API Documentation

## Overview

The Notifications API provides real-time notification and activity tracking for users across different roles. It includes REST endpoints for CRUD operations and WebSocket events for real-time updates.

## Base URL

```
http://localhost:3000/api
```

## Authentication

All endpoints require authentication via Bearer token:

```
Authorization: Bearer <jwt_token>
```

## Endpoints

### Get User Notifications

**GET** `/users/notifications`

Retrieve paginated notifications for the authenticated user.

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 20 | Number of notifications per page |
| `unread` | boolean | false | Filter for unread notifications only |

#### Response

```json
{
  "status": "success",
  "message": "Notifications retrieved successfully",
  "data": {
    "notifications": [
      {
        "id": "507f1f77bcf86cd799439011",
        "title": "Vehicle Registered",
        "message": "Your Honda Civic has been successfully registered",
        "type": "verification",
        "priority": "medium",
        "read": false,
        "createdAt": "2023-01-01T10:00:00Z",
        "actionUrl": "/vehicles",
        "actionLabel": "View vehicles"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 5,
      "totalNotifications": 100,
      "limit": 20
    },
    "unreadCount": 3
  }
}
```

### Mark Notification as Read

**PATCH** `/users/notifications/:id/read`

Mark a specific notification as read.

#### Parameters

| Parameter | Type | Description |
|-----------|------|-------------|
| `id` | string | Notification ID |

#### Response

```json
{
  "status": "success",
  "message": "Notification marked as read"
}
```

### Mark All Notifications as Read

**PATCH** `/users/notifications/read-all`

Mark all notifications for the authenticated user as read.

#### Response

```json
{
  "status": "success",
  "message": "All notifications marked as read",
  "data": {
    "markedCount": 5
  }
}
```

### Get User Activity

**GET** `/users/activity`

Retrieve user activity history (transformed from notifications).

#### Query Parameters

| Parameter | Type | Default | Description |
|-----------|------|---------|-------------|
| `page` | number | 1 | Page number for pagination |
| `limit` | number | 10 | Number of activities per page |

#### Response

```json
{
  "status": "success",
  "message": "Activity history retrieved successfully",
  "data": {
    "activity": [
      {
        "id": "507f1f77bcf86cd799439011",
        "title": "Vehicle Registered",
        "subtext": "Your Honda Civic has been successfully registered",
        "icon": "check-circle",
        "entityId": "vehicle-123",
        "createdAt": "2023-01-01T10:00:00Z",
        "type": "verification"
      }
    ],
    "pagination": {
      "currentPage": 1,
      "totalPages": 3,
      "totalItems": 30,
      "limit": 10
    }
  }
}
```

## WebSocket Events

### Connection

Connect to the WebSocket server:

```javascript
const socket = io('http://localhost:5000', {
  auth: {
    userId: 'user_id',
    userRole: 'owner'
  }
});
```

### Events

#### `notification_created`

Emitted when a new notification is created for the user.

```javascript
socket.on('notification_created', (data) => {
  console.log('New notification:', data.notification);
});
```

**Payload:**
```json
{
  "notification": {
    "id": "507f1f77bcf86cd799439011",
    "title": "Vehicle Registered",
    "message": "Your Honda Civic has been successfully registered",
    "type": "verification",
    "priority": "medium",
    "createdAt": "2023-01-01T10:00:00Z",
    "read": false,
    "actionUrl": "/vehicles",
    "actionLabel": "View vehicles"
  }
}
```

#### `activity_created`

Emitted when new activity is created for the user's role.

```javascript
socket.on('activity_created', (data) => {
  console.log('New activity:', data.activity);
});
```

**Payload:**
```json
{
  "activity": {
    "id": "507f1f77bcf86cd799439011",
    "title": "Vehicle Registered",
    "subtext": "Your Honda Civic has been successfully registered",
    "icon": "check-circle",
    "entityId": "vehicle-123",
    "createdAt": "2023-01-01T10:00:00Z",
    "type": "verification"
  }
}
```

## Notification Types

| Type | Description | Icon |
|-----|-------------|------|
| `security` | Security-related notifications | shield |
| `fraud_alert` | Fraud detection alerts | alert-triangle |
| `transaction` | Financial transactions | dollar-sign |
| `system` | System updates | settings |
| `verification` | Verification processes | check-circle |
| `reminder` | Reminder notifications | clock |
| `marketing` | Marketing communications | megaphone |
| `update` | General updates | refresh-cw |

## Error Responses

### 401 Unauthorized

```json
{
  "status": "error",
  "message": "Access denied. No token provided."
}
```

### 403 Forbidden

```json
{
  "status": "error",
  "message": "Access denied. Not authorized to access this notification."
}
```

### 404 Not Found

```json
{
  "status": "error",
  "message": "Notification not found"
}
```

### 500 Internal Server Error

```json
{
  "status": "error",
  "message": "Failed to fetch notifications"
}
```

## Testing

### Manual Testing with cURL

#### 1. Get Notifications

```bash
curl -X GET "http://localhost:3000/api/users/notifications?page=1&limit=5" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 2. Mark Notification as Read

```bash
curl -X PATCH "http://localhost:3000/api/users/notifications/NOTIFICATION_ID/read" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 3. Mark All as Read

```bash
curl -X PATCH "http://localhost:3000/api/users/notifications/read-all" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

#### 4. Get Activity

```bash
curl -X GET "http://localhost:3000/api/users/activity?limit=10" \
  -H "Authorization: Bearer YOUR_JWT_TOKEN"
```

### Automated Testing

Run the test suite:

```bash
# Backend tests
npm test -- --testPathPattern=api.notifications.test.ts

# Frontend tests
npm test -- --testPathPattern=notifications
```

## Rate Limiting

- **User endpoints**: 100 requests per 15 minutes
- **Update endpoints**: 50 requests per 15 minutes

## Security Considerations

1. **Authentication Required**: All endpoints require valid JWT tokens
2. **User Isolation**: Users can only access their own notifications
3. **Role-based Access**: Activity events are scoped by user role
4. **Input Validation**: All parameters are validated and sanitized
5. **Rate Limiting**: Prevents abuse and ensures fair usage

## Performance Notes

1. **Database Indexing**: Notifications are indexed by `userId` and `createdAt`
2. **Pagination**: Large result sets are paginated to prevent memory issues
3. **WebSocket Scaling**: Consider Redis adapter for multiple server instances
4. **Caching**: Consider implementing Redis caching for frequently accessed data

## Troubleshooting

### Common Issues

1. **Socket Connection Failed**
   - Check if Socket.IO server is running on port 5000
   - Verify CORS settings allow your frontend domain

2. **Authentication Errors**
   - Ensure JWT token is valid and not expired
   - Check token format: `Bearer <token>`

3. **No Real-time Updates**
   - Verify user is connected to correct socket rooms
   - Check if notification service is emitting events

### Debug Mode

Enable debug logging:

```bash
DEBUG=socket.io:* npm start
```

## Changelog

### v1.0.0
- Initial implementation
- REST API endpoints
- WebSocket real-time updates
- Role-based activity tracking
- Comprehensive test coverage
