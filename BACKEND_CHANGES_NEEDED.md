# Backend Changes Required

This document lists all backend API changes needed to fully support the new frontend features.

## 1. About Page Management

**Current Status**: Frontend uses localStorage for about page data.

**Required Endpoints**:

### GET `/api/admin/about`
- **Description**: Get about page data (founder information)
- **Auth**: Admin only
- **Response**:
```json
{
  "success": true,
  "data": {
    "name": "Sahil",
    "designation": "Founder",
    "description": "<p>HTML content here</p>",
    "image": "/path/to/image.jpg"
  }
}
```

### PUT `/api/admin/about`
- **Description**: Update about page data
- **Auth**: Admin only
- **Body**:
```json
{
  "name": "Sahil",
  "designation": "Founder",
  "description": "<p>HTML content</p>",
  "image": "/path/to/image.jpg"
}
```
- **Validation**: 
  - Sanitize HTML in `description` field (use DOMPurify or similar)
  - Validate image URL or handle image upload
- **Response**: Same as GET endpoint

**Database Schema**:
- Create `About` model or add to `Settings` collection
- Fields: `name`, `designation`, `description` (HTML), `image`, `updatedAt`, `updatedBy`

## 2. Blog Flagging Enhancement

**Current Status**: Frontend sends flag reason and description, but backend may need to handle additional fields.

**Required Changes**:

### PATCH `/api/admin/blogs/:id/flag`
- **Description**: Flag a blog post with reason and description
- **Auth**: Admin only
- **Body**:
```json
{
  "flagType": "spam",
  "reason": "spam",
  "description": "Additional details about why this is being flagged"
}
```
- **Validation**:
  - `flagType`: Must be one of: "spam", "inappropriate", "misinformation", "duplicate", "other"
  - `description`: Optional string
- **Database**: Store flag with metadata:
  - `flagType`
  - `description`
  - `flaggedBy` (user ID)
  - `flaggedAt` (timestamp)

**Response**:
```json
{
  "success": true,
  "data": {
    "blogId": "...",
    "flags": [
      {
        "flagType": "spam",
        "description": "...",
        "flaggedBy": "...",
        "flaggedAt": "..."
      }
    ]
  }
}
```

## 3. Blog Category Management

**Current Status**: Categories are hardcoded in frontend.

**Optional Enhancement** (if dynamic categories are needed):

### GET `/api/public/categories`
- **Description**: Get list of available blog categories
- **Auth**: Public
- **Response**:
```json
{
  "success": true,
  "data": [
    "Trading",
    "Stocks",
    "Forex",
    "Crypto",
    "Options",
    "Personal Finance",
    "Technical Analysis",
    "Market News"
  ]
}
```

**Note**: If categories remain static, no backend changes needed. Frontend will continue using hardcoded list.

## 4. Rich Text Content Sanitization

**Current Status**: Frontend uses React Quill which outputs HTML.

**Required Changes**:

1. **Install HTML Sanitization Library**:
   ```bash
   npm install dompurify
   npm install jsdom  # For Node.js environment
   ```

2. **Sanitize on Save**:
   - In blog controller (`createBlog`, `updateBlog`):
     - Sanitize `content` field before saving
     - Sanitize `description` field in about controller
   - Example:
     ```javascript
     const createDOMPurify = require('dompurify');
     const { JSDOM } = require('jsdom');
     const window = new JSDOM('').window;
     const DOMPurify = createDOMPurify(window);
     
     const sanitizedContent = DOMPurify.sanitize(req.body.content, {
       ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'u', 's', 'ul', 'ol', 'li', 'a', 'h1', 'h2', 'h3'],
       ALLOWED_ATTR: ['href', 'target']
     });
     ```

3. **Allowed HTML Tags** (recommended):
   - `p`, `br` - Paragraphs and line breaks
   - `strong`, `em`, `u`, `s` - Text formatting
   - `ul`, `ol`, `li` - Lists
   - `a` - Links (with href and target attributes)
   - `h1`, `h2`, `h3` - Headers

## 5. Company Management API

**Current Status**: Frontend expects full CRUD operations.

**Required Endpoints** (if not already implemented):

### GET `/api/admin/companies`
- **Description**: Get all companies with filters
- **Auth**: Admin only
- **Query Params**: `search`, `status`, `category`
- **Response**: Paginated list of companies

### POST `/api/admin/companies`
- **Description**: Create new company
- **Auth**: Admin only
- **Body**: FormData with company fields and images
- **Response**: Created company object

### PUT `/api/admin/companies/:id`
- **Description**: Update company
- **Auth**: Admin only
- **Body**: FormData with updated fields
- **Response**: Updated company object

### DELETE `/api/admin/companies/:id`
- **Description**: Delete company
- **Auth**: Admin only
- **Response**: Success message

### PATCH `/api/admin/companies/:id/toggle-status`
- **Description**: Toggle company status (approved/pending/blocked)
- **Auth**: Admin only
- **Response**: Updated company with new status

**Note**: Ensure rich text content in `description` field is sanitized.

## 6. Blog Content Validation

**Current Status**: Frontend validates summary length (min 20 chars).

**Backend Validation** (recommended):

- **Summary (`excerpt`)**: 
  - Minimum length: 20 characters
  - Maximum length: 500 characters (recommended)
- **Content**: 
  - Required field
  - Minimum length: 50 characters (after stripping HTML)
  - Sanitize HTML before saving
- **Category**: 
  - Must be from allowed list
  - Required field

## 7. Error Handling

**Current Status**: Frontend handles errors gracefully.

**Backend Recommendations**:

- Return consistent error format:
  ```json
  {
    "success": false,
    "message": "Error message",
    "errors": {
      "field": "Field-specific error"
    }
  }
  ```
- Use appropriate HTTP status codes:
  - 400: Bad Request (validation errors)
  - 401: Unauthorized
  - 403: Forbidden (admin-only endpoints)
  - 404: Not Found
  - 500: Internal Server Error

## Summary

**Priority 1 (Required for Production)**:
1. About page API endpoints (GET/PUT `/api/admin/about`)
2. Blog flagging enhancement (accept reason and description)
3. Rich text content sanitization (DOMPurify)

**Priority 2 (Recommended)**:
4. Blog content validation (summary length, content validation)
5. Company management API (if not already complete)

**Priority 3 (Optional)**:
6. Dynamic category management (if categories need to be dynamic)

## Testing Checklist

- [ ] About page data persists correctly
- [ ] Blog flagging stores reason and description
- [ ] Rich text content is sanitized (XSS protection)
- [ ] HTML tags are properly stripped/cleaned
- [ ] Admin-only endpoints are properly protected
- [ ] Error messages are user-friendly
- [ ] File uploads work correctly (images)
