# Debug Checklist for Admin Assign → SP Seeing Assigned Installs

## 1. Reproduce the Bug

### Create an install with status 'requested'
```bash
curl -X POST \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"vehicleId":"<VEHICLE_ID>","notes":"Install device"}' \
  http://localhost:3000/api/installs/vehicles/<VEHICLE_ID>/request-install
```

### Create a user with role 'service-provider'
```bash
curl -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"sp@example.com","password":"TestPass123!","firstName":"Service","lastName":"Provider","role":"service"}' \
  http://localhost:3000/api/auth/register
```

### Call POST /api/admin/assign-install
```bash
curl -X POST \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"installId":"<INSTALL_ID>","serviceProviderId":"<SP_ID>"}' \
  http://localhost:3000/api/admin/assign-install
```

### Immediately query DB
```bash
# In mongo shell
use blockx
db.installs.findOne({_id: ObjectId("<INSTALL_ID>")})
```

Expected result:
```json
{
  "_id": ObjectId("<INSTALL_ID>"),
  "serviceProviderId": ObjectId("<SP_ID>"),
  "assignedAt": ISODate("..."),
  "status": "assigned"
}
```

## 2. Verify JWT Middleware

Check that JWT middleware sets `req.user.id` and `req.user.role`:

In any controller, temporarily add:
```javascript
console.log('User ID:', req.user?.id);
console.log('User Role:', req.user?.role);
```

## 3. Check Naming Consistency

Confirm schema field name is `serviceProviderId` (camelCase):

In `backend/src/models/Install.model.ts`:
```typescript
export interface IInstall extends Document {
  // ... other fields
  serviceProviderId?: mongoose.Types.ObjectId;
  // ... other fields
}
```

## 4. Manual Test Commands

### Assign Installation
```bash
curl -X POST \
  -H "Authorization: Bearer <ADMIN_JWT>" \
  -H "Content-Type: application/json" \
  -d '{"installId":"<INSTALL_ID>","serviceProviderId":"<SP_ID>"}' \
  http://localhost:3000/api/admin/assign-install
```

### Verify DB Record
```bash
# In mongo shell
use blockx
db.installs.findOne({_id: ObjectId("<INSTALL_ID>")})
```

### Fetch for Service Provider
```bash
curl -H "Authorization: Bearer <SP_JWT>" \
  "http://localhost:3000/api/service/installs/assigned"
```

## 5. Edge Cases to Test

1. Install already assigned → Should return 409
2. Non-existent install ID → Should return 404
3. Invalid service provider ID → Should return 400
4. Service provider with wrong role → Should return 400
5. Unauthenticated requests → Should return 401
6. Unauthorized requests (non-admin) → Should return 403

## 6. WebSocket Debugging

To verify socket events are working:

1. In frontend, add temporary log:
```javascript
useEffect(() => {
  socket.on('install_assigned', (data) => {
    console.log('Received install_assigned event:', data);
  });
  
  return () => {
    socket.off('install_assigned');
  };
}, [socket]);
```

2. Check backend logs for:
```
Emitted socket event to user <USER_ID>: install_assigned
```

## 7. Common Issues and Solutions

### Issue: Service provider doesn't see assigned installs
**Solution**: Check that:
1. Install document has correct `serviceProviderId`
2. Install document has `status` = 'assigned'
3. Service provider is using correct JWT token
4. Query in serviceInstalls.routes.ts filters correctly

### Issue: WebSocket events not received
**Solution**: Check that:
1. Frontend emits 'join_user' with user ID on connect
2. Backend handles 'join_user' event and adds socket to room
3. Backend emits event to correct user room
4. Frontend listens for the correct event name

### Issue: Atomic update fails
**Solution**: Check that:
1. Query conditions match the document state
2. `$in` operator is used correctly for status filtering
3. Field names match exactly (camelCase consistency)