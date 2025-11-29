# Backend Specification: Global Mock Data Mode Control

## Overview
Admin should be able to control mock data visibility globally (affecting all users across all browsers/devices). This requires backend storage and API endpoints.

## Requirements

### 1. Database Schema

Add a new collection/table to store the global mock mode setting:

**Option A: Separate Settings Collection (Recommended)**
```javascript
// MongoDB Schema (settings.model.js)
const SettingsSchema = new Schema({
  key: { type: String, unique: true, required: true },
  value: { type: Schema.Types.Mixed, required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'user' },
  updatedAt: { type: Date, default: Date.now }
});

// Create default document
{
  key: "mock_data_enabled",
  value: false, // boolean
  updatedBy: null,
  updatedAt: new Date()
}
```

**Option B: Add to Existing User/Admin Model**
- Not recommended as this is a global setting, not user-specific

### 2. API Endpoints

#### 2.1 Get Mock Mode Status
**Endpoint:** `GET /api/public/settings/mock-mode`

**Description:** Get current mock data mode status (public endpoint, no auth required)

**Response:**
```json
{
  "success": true,
  "data": {
    "enabled": false
  }
}
```

**Implementation:**
```javascript
// routes/api/public/settings.routes.js
router.get('/mock-mode', settingsController.getMockMode);

// controllers/settings.controller.js
exports.getMockMode = async (req, res) => {
  try {
    const setting = await SettingsModel.findOne({ key: 'mock_data_enabled' });
    return sendSuccessResponse(res, {
      enabled: setting?.value || false
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};
```

#### 2.2 Update Mock Mode Status (Admin Only)
**Endpoint:** `PUT /api/admin/settings/mock-mode`

**Description:** Update mock data mode (admin only)

**Request Body:**
```json
{
  "enabled": true
}
```

**Response:**
```json
{
  "success": true,
  "message": "Mock data mode updated successfully",
  "data": {
    "enabled": true,
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Implementation:**
```javascript
// routes/api/admin/settings.routes.js
const { authorization } = require('../../../middleware/authorization.middleware');
const constants = require('../../../utils/constants');

router.put('/mock-mode', 
  authorization([constants.roles.admin, constants.roles.supervisor]), 
  settingsController.updateMockMode
);

// controllers/settings.controller.js
exports.updateMockMode = async (req, res) => {
  try {
    const { enabled } = req.body;
    const { _id: adminId } = req.user;

    if (typeof enabled !== 'boolean') {
      return sendErrorResponse(res, "Invalid value. 'enabled' must be a boolean", 400, true, true);
    }

    const setting = await SettingsModel.findOneAndUpdate(
      { key: 'mock_data_enabled' },
      { 
        value: enabled,
        updatedBy: adminId,
        updatedAt: new Date()
      },
      { 
        upsert: true, // Create if doesn't exist
        new: true 
      }
    );

    return sendSuccessResponse(res, {
      message: "Mock data mode updated successfully",
      data: {
        enabled: setting.value,
        updatedAt: setting.updatedAt
      }
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};
```

### 3. Backend File Structure

```
backend/
├── models/
│   └── settings.model.js          # New file
├── controllers/
│   └── settings.controller.js     # New file
├── routes/
│   └── api/
│       ├── public/
│       │   └── settings.routes.js # New file
│       └── admin/
│           └── settings.routes.js # New file
└── utils/
    └── constants.js                # Already exists
```

### 4. Implementation Steps

#### Step 1: Create Settings Model
```javascript
// backend/models/settings.model.js
const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SettingsSchema = new Schema(
  {
    key: { type: String, unique: true, required: true, index: true },
    value: { type: Schema.Types.Mixed, required: true },
    updatedBy: { type: Schema.Types.ObjectId, ref: 'user' },
    updatedAt: { type: Date, default: Date.now }
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

const SettingsModel = mongoose.model('settings', SettingsSchema);
module.exports = SettingsModel;
```

#### Step 2: Create Settings Controller
```javascript
// backend/controllers/settings.controller.js
const SettingsModel = require('../models/settings.model');
const { sendSuccessResponse, sendErrorResponse } = require('../utils/response');

// Get mock mode status (public)
exports.getMockMode = async (req, res) => {
  try {
    const setting = await SettingsModel.findOne({ key: 'mock_data_enabled' });
    const enabled = setting?.value || false;
    
    return sendSuccessResponse(res, {
      enabled
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};

// Update mock mode status (admin only)
exports.updateMockMode = async (req, res) => {
  try {
    const { enabled } = req.body;
    const { _id: adminId } = req.user;

    // Validate input
    if (typeof enabled !== 'boolean') {
      return sendErrorResponse(res, "Invalid value. 'enabled' must be a boolean", 400, true, true);
    }

    // Update or create setting
    const setting = await SettingsModel.findOneAndUpdate(
      { key: 'mock_data_enabled' },
      { 
        value: enabled,
        updatedBy: adminId,
        updatedAt: new Date()
      },
      { 
        upsert: true,
        new: true 
      }
    );

    return sendSuccessResponse(res, {
      message: "Mock data mode updated successfully",
      data: {
        enabled: setting.value,
        updatedAt: setting.updatedAt
      }
    });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};
```

#### Step 3: Create Public Settings Routes
```javascript
// backend/routes/api/public/settings.routes.js
const express = require('express');
const router = express.Router();
const settingsController = require('../../../controllers/settings.controller');

router.get('/mock-mode', settingsController.getMockMode);

module.exports = router;
```

#### Step 4: Create Admin Settings Routes
```javascript
// backend/routes/api/admin/settings.routes.js
const express = require('express');
const router = express.Router();
const settingsController = require('../../../controllers/settings.controller');
const { authorization } = require('../../../middleware/authorization.middleware');
const constants = require('../../../utils/constants');

router.put('/mock-mode', 
  authorization([constants.roles.admin, constants.roles.supervisor]), 
  settingsController.updateMockMode
);

module.exports = router;
```

#### Step 5: Register Routes
```javascript
// backend/routes/api/public/index.js
const express = require('express');
const router = express.Router();
const settingsRoutes = require('./settings.routes');

// ... existing routes ...
router.use('/settings', settingsRoutes);

module.exports = router;
```

```javascript
// backend/routes/api/admin/index.js
const express = require('express');
const router = express.Router();
const settingsRoutes = require('./settings.routes');

// ... existing routes ...
router.use('/settings', settingsRoutes);

module.exports = router;
```

#### Step 6: Initialize Default Setting (Optional - Migration Script)
```javascript
// backend/utils/initSettings.js (run once or on startup)
const SettingsModel = require('../models/settings.model');

async function initializeSettings() {
  try {
    const existing = await SettingsModel.findOne({ key: 'mock_data_enabled' });
    if (!existing) {
      await SettingsModel.create({
        key: 'mock_data_enabled',
        value: false,
        updatedAt: new Date()
      });
      console.log('Mock data mode setting initialized');
    }
  } catch (error) {
    console.error('Error initializing settings:', error);
  }
}

module.exports = { initializeSettings };
```

Call this in `backend/app.js` or `backend/bin/www`:
```javascript
const { initializeSettings } = require('./utils/initSettings');
// ... after database connection ...
initializeSettings();
```

### 5. Testing Checklist

- [ ] `GET /api/public/settings/mock-mode` returns current status (no auth required)
- [ ] `PUT /api/admin/settings/mock-mode` updates status (admin only)
- [ ] `PUT /api/admin/settings/mock-mode` rejects non-admin users (403)
- [ ] `PUT /api/admin/settings/mock-mode` validates boolean input
- [ ] Setting persists across server restarts
- [ ] Multiple admins can update (last update wins)
- [ ] Default value is `false` if not set

### 6. Frontend Integration (For Reference)

After backend is implemented, frontend will need to:

1. **Update `companiesController.js`:**
```javascript
// Replace localStorage check with API call
async function isMockModeEnabled() {
  try {
    const response = await api.get('/public/settings/mock-mode');
    return response.data.enabled || false;
  } catch (error) {
    // Fallback to localStorage for backward compatibility
    const stored = localStorage.getItem('xk_mock_mode');
    return stored === 'true';
  }
}
```

2. **Update `mockSlice.js`:**
```javascript
// Add async thunk to fetch from backend
export const fetchMockMode = createAsyncThunk(
  'mock/fetchMockMode',
  async (_, { rejectWithValue }) => {
    try {
      const response = await api.get('/public/settings/mock-mode');
      return response.data.enabled;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);

// Add async thunk to update on backend (admin only)
export const updateMockMode = createAsyncThunk(
  'mock/updateMockMode',
  async (enabled, { rejectWithValue }) => {
    try {
      const response = await api.put('/admin/settings/mock-mode', { enabled });
      return response.data.enabled;
    } catch (error) {
      return rejectWithValue(error.message);
    }
  }
);
```

3. **Update Reviews page toggle:**
```javascript
// Instead of dispatch(setMockMode(!mockMode))
dispatch(updateMockMode(!mockMode));
```

### 7. Additional Considerations

#### Caching (Optional but Recommended)
Since this setting changes infrequently, consider caching:
```javascript
// Simple in-memory cache with 5-minute TTL
let mockModeCache = { value: false, timestamp: 0 };
const CACHE_TTL = 5 * 60 * 1000; // 5 minutes

exports.getMockMode = async (req, res) => {
  try {
    const now = Date.now();
    if (now - mockModeCache.timestamp < CACHE_TTL) {
      return sendSuccessResponse(res, { enabled: mockModeCache.value });
    }
    
    const setting = await SettingsModel.findOne({ key: 'mock_data_enabled' });
    const enabled = setting?.value || false;
    
    mockModeCache = { value: enabled, timestamp: now };
    return sendSuccessResponse(res, { enabled });
  } catch (error) {
    return sendErrorResponse(res, error);
  }
};
```

#### WebSocket/Server-Sent Events (Optional - Real-time Updates)
For real-time updates without polling:
- Use WebSocket or SSE to push updates to all connected clients when admin changes setting
- More complex but provides instant updates

### 8. Summary

**What Backend Developer Needs to Do:**

1. ✅ Create `SettingsModel` (MongoDB schema)
2. ✅ Create `settings.controller.js` with `getMockMode` and `updateMockMode`
3. ✅ Create public route `GET /api/public/settings/mock-mode`
4. ✅ Create admin route `PUT /api/admin/settings/mock-mode` (protected)
5. ✅ Initialize default setting (false) in database
6. ✅ Test endpoints

**Endpoints Summary:**
- `GET /api/public/settings/mock-mode` - Get current status (public)
- `PUT /api/admin/settings/mock-mode` - Update status (admin only, body: `{ enabled: boolean }`)

**Database:**
- Collection: `settings`
- Document: `{ key: "mock_data_enabled", value: boolean }`

This will enable global mock data control across all browsers and devices! 🚀

