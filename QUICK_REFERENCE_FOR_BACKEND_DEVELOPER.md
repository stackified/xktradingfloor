# Quick Reference: Mock Data Mode Backend Implementation

## What's Needed

Admin needs to control mock data visibility globally (across all browsers/devices). Currently it only works in the same browser because it uses localStorage.

## Required Backend Changes

### 1. Database
- Create a `settings` collection/table
- Store one document: `{ key: "mock_data_enabled", value: boolean }`

### 2. Two API Endpoints

**Public Endpoint (No Auth Required):**
```
GET /api/public/settings/mock-mode
Response: { "success": true, "data": { "enabled": false } }
```

**Admin Endpoint (Admin Only):**
```
PUT /api/admin/settings/mock-mode
Body: { "enabled": true }
Response: { "success": true, "data": { "enabled": true } }
```

### 3. Files to Create

1. `backend/models/settings.model.js` - MongoDB schema
2. `backend/controllers/settings.controller.js` - Controller logic
3. `backend/routes/api/public/settings.routes.js` - Public routes
4. `backend/routes/api/admin/settings.routes.js` - Admin routes

### 4. Implementation Details

See `BACKEND_MOCK_MODE_SPECIFICATION.md` for complete code examples and step-by-step instructions.

## Quick Start

1. Create Settings model with key-value structure
2. Create controller with `getMockMode()` and `updateMockMode()` methods
3. Add public route for GET (no auth)
4. Add admin route for PUT (admin auth required)
5. Initialize default value: `false`

## Testing

- ✅ GET endpoint returns current status
- ✅ PUT endpoint updates status (admin only)
- ✅ Non-admin users get 403 on PUT
- ✅ Setting persists in database

That's it! Full specification is in `BACKEND_MOCK_MODE_SPECIFICATION.md`

