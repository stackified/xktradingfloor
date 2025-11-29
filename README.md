# XK Trading Floor

A comprehensive full-stack trading education and community platform featuring academy courses, broker reviews, blogs, podcasts, and merchandise. Built with React frontend and Express.js backend.

## 📦 Project Structure

This is a monorepo containing both frontend and backend applications:

```
xktradingfloor/
├── frontend/          # React + Vite frontend application
│   ├── public/        # Static assets (images, logos, etc.)
│   ├── src/           # Source code
│   │   ├── components/ # React components organized by feature
│   │   ├── controllers/ # API controllers (currently using mock data)
│   │   ├── models/     # Mock data and data models
│   │   ├── pages/      # Page components
│   │   ├── redux/      # Redux store and slices
│   │   ├── routes/     # React Router configuration
│   │   └── utils/      # Utility functions
│   ├── package.json
│   └── vite.config.js
├── backend/           # Express.js backend application
│   ├── bin/           # Server entry point
│   ├── controllers/   # Request handlers
│   ├── models/        # Mongoose database models
│   ├── routes/        # API routes
│   │   └── api/       # API route organization
│   │       ├── admin/    # Admin-only routes
│   │       ├── protected/ # Authenticated user routes
│   │       ├── public/   # Public routes
│   │       └── auth.routes.js # Authentication routes
│   ├── middleware/    # Express middleware
│   ├── utils/         # Utility functions
│   ├── package.json
│   └── app.js
├── .gitignore
└── README.md
```

## 🚀 Overview

XK Trading Floor is a modern full-stack web application designed to empower traders through education, data, and community. The platform provides a complete ecosystem for traders to learn, review trading companies, access educational resources, and connect with a supportive trading community.

### Key Features

- **🏠 Home Page**: Engaging hero section, community information, featured events, and "How It Works" guide
- **🎓 Academy**: Expert-led programs, live workshops, strategy sessions, trading bootcamps, and free learning resources
- **📝 Blog**: Educational articles covering trading strategies, psychology, risk management with search and filtering
- **⭐ Reviews**: Comprehensive review system for brokers, prop firms, and crypto exchanges with ratings and filtering
- **🎙️ Podcasts**: Trading insights and educational content in audio format
- **🛍️ Merchandise**: E-commerce functionality for trading-related products with shopping cart
- **👤 User Dashboards**: Personalized dashboards for users, operators, and admins with analytics
- **🔐 Authentication**: Secure user registration, login, and role-based access control (JWT-based)
- **📊 Analytics**: Dashboard with charts and analytics for admins and operators

### Admin Panel Features

- **📊 Enhanced Admin Dashboard**: 
  - Dynamic charts and visualizations (Companies over time, Reviews over time, Rating distribution, Company status breakdown)
  - Mock data toggle for testing and development
  - Real-time statistics and metrics
  - Beautiful gradient cards with icons and animations

- **📝 Blog Management**:
  - Rich text editor (WYSIWYG) with formatting toolbar (bold, italic, underline, lists, links, etc.)
  - Fixed category dropdown (Trading, Stocks, Forex, Crypto, Options, Personal Finance, Technical Analysis, Market News)
  - Chip-based tag input (comma-separated, visual chips)
  - Chip-based SEO keywords input
  - Summary field with character validation (minimum 20 characters)
  - Custom modals for delete confirmation and flagging
  - Flag system with dropdown reasons (Spam, Inappropriate, Misinformation, Duplicate Content, Other)
  - Removed Purge option (consolidated with Delete)

- **🏢 Company Management**:
  - Full company management interface (similar to blog management)
  - Rich text editor for full descriptions
  - Character-limited short description (max 150 characters)
  - Status management (Approved, Pending, Blocked)
  - Custom confirmation modals

- **📄 About Page Editor**:
  - Admin-only editable About section
  - Rich text editor for founder description
  - Profile image upload
  - Accessible from profile dropdown menu
  - Real-time preview and save functionality

- **🔒 Security Features**:
  - Input sanitization for rich text content
  - XSS protection in editor output
  - Protected admin routes
  - No sensitive data exposure in DOM
  - Secure form validation

## 📖 Usage Guide

### Managing Blogs

1. **Creating a Blog Post**:
   - Navigate to `/admin/blogs` and click "Create New Blog"
   - Fill in the title (required)
   - Write a summary (minimum 20 characters recommended)
   - Use the rich text editor for content with formatting options:
     - Headers (H1, H2, H3)
     - Bold, italic, underline, strikethrough
     - Ordered and unordered lists
     - Links
     - Text alignment
   - Select a category from the dropdown (fixed list, cannot create new)
   - Add tags: Type a tag and press comma to create a chip
   - Add SEO keywords: Type a keyword and press comma to create a chip
   - Upload a featured image (optional)
   - Set status (Draft, Published, Archived)
   - Click "Save blog"

2. **Editing a Blog Post**:
   - Go to `/admin/blogs`
   - Click "Edit" on any blog post
   - The rich text editor will load existing content (not raw HTML)
   - Make changes and save

3. **Flagging a Blog Post**:
   - Click "Flag" on any blog post
   - Select a reason from dropdown (Spam, Inappropriate, Misinformation, Duplicate Content, Other)
   - Optionally add additional details
   - Click "Flag Content"

4. **Deleting a Blog Post**:
   - Click "Delete" on any blog post
   - Confirm deletion in the custom modal (not browser alert)

### Managing Companies

1. **Creating a Company**:
   - Navigate to `/admin/companies` and click "Add Company"
   - Fill in company name, category, and website
   - Upload company logo
   - Write short description (max 150 characters)
   - Use rich text editor for full description
   - Upload company images (multiple)
   - Set status (Admin only)
   - Save

2. **Editing a Company**:
   - Go to `/admin/companies`
   - Click "Edit" on any company
   - Make changes and save

3. **Company Management**:
   - View all companies with filters (search, status, category)
   - Toggle company status (Approve/Block)
   - Delete companies with confirmation modal

### Editing About Page

1. **Accessing the Editor**:
   - Log in as admin
   - Click on your profile dropdown in the header
   - Select "Edit About Section"

2. **Editing Founder Information**:
   - Update name and designation
   - Upload new profile image
   - Edit description using rich text editor
   - Save changes

3. **Viewing Changes**:
   - Changes are saved to localStorage (backend integration needed for production)
   - Visit `/about` to see updated information

### Using the Rich Text Editor

The rich text editor (React Quill) provides:
- **Formatting Toolbar**: Bold, italic, underline, strikethrough
- **Headers**: H1, H2, H3
- **Lists**: Ordered and unordered
- **Links**: Add hyperlinks to text
- **Alignment**: Left, center, right
- **Clean**: Remove all formatting

**Security Note**: All editor content is sanitized before saving to prevent XSS attacks.

### Using Chip Inputs (Tags & SEO Keywords)

1. **Adding Tags/Keywords**:
   - Type your tag/keyword
   - Press comma (`,`) or Enter
   - The tag becomes a visual chip below the input

2. **Removing Tags/Keywords**:
   - Click the X icon on any chip
   - Or press Backspace when input is empty to remove the last chip

3. **Best Practices**:
   - Use lowercase for consistency
   - Keep tags concise (1-2 words)
   - Separate multiple concepts with different tags

### Admin Dashboard

1. **Mock Data Toggle**:
   - Toggle ON: Shows mock data + real API data
   - Toggle OFF: Shows only real API data
   - Useful for testing and development

2. **Charts and Analytics**:
   - Companies Over Time: Area chart showing company growth
   - Reviews Over Time: Line chart showing review activity
   - Rating Distribution: Bar chart showing rating breakdown
   - Company Status: Pie chart showing status distribution

### Security Best Practices

- **Input Validation**: All forms validate input on the frontend before submission
- **XSS Protection**: Rich text editor content is sanitized
- **Protected Routes**: Admin routes require authentication and admin role
- **No Data Exposure**: Sensitive information is not exposed in DOM or console
- **Secure Storage**: About page data stored in localStorage (backend integration recommended)

### Backend Integration Notes

**Required Backend Changes** (for production):

1. **About Page Storage**:
   - Currently uses localStorage
   - Backend should provide:
     - `GET /api/admin/about` - Get about page data
     - `PUT /api/admin/about` - Update about page data
   - Store: name, designation, description (HTML), image URL

2. **Blog Flagging**:
   - Backend should accept flag reason and description
   - Store flags with metadata (who flagged, when, reason, description)

3. **Category Management**:
   - Categories are currently hardcoded in frontend
   - Backend could provide category list if dynamic categories are needed

4. **Rich Text Content**:
   - Backend should sanitize HTML content on save
   - Recommended: Use DOMPurify or similar on backend

## 🛠️ Tech Stack

### Frontend

**Core Technologies:**

- **React 18.3.1** - UI library
- **Vite 5.4.10** - Build tool and dev server
- **React Router DOM 6.26.2** - Client-side routing
- **Redux Toolkit 2.2.7** - State management
- **React Redux 9.1.2** - React bindings for Redux

**Styling & UI:**

- **Tailwind CSS 3.4.14** - Utility-first CSS framework
- **Framer Motion 11.2.13** - Animation library
- **Lucide React 0.474.0** - Icon library
- **@heroicons/react 2.1.5** - Additional icons

**Additional Libraries:**

- **Axios 1.7.7** - HTTP client (configured for backend integration)
- **Recharts 2.15.4** - Chart library for analytics dashboards
- **React Helmet Async 2.0.5** - SEO and document head management
- **React Quill 2.0.0** - Rich text editor component
- **Cross-env 7.0.3** - Cross-platform environment variables

### Backend

**Core Technologies:**

- **Node.js** - JavaScript runtime
- **Express.js 4.16.1** - Web framework
- **Mongoose 8.18.1** - MongoDB object modeling
- **MongoDB** - NoSQL database

**Security & Authentication:**

- **JWT (jsonwebtoken 9.0.2)** - Token-based authentication
- **Bcrypt 6.0.0** - Password hashing
- **Helmet 8.1.0** - Security headers
- **CORS 2.8.5** - Cross-origin resource sharing

**Additional Libraries:**

- **Cookie-parser 1.4.4** - Cookie parsing middleware
- **Morgan 1.9.1** - HTTP request logger
- **Compression 1.8.1** - Response compression
- **Dotenv 17.2.2** - Environment variable management
- **Express-useragent 1.0.15** - User agent parsing
- **@sendgrid/mail 8.1.4** - Email service integration
- **@sentry/node 10.11.0** - Error tracking and monitoring
- **AWS SDK 2.1692.0 & @aws-sdk/client-s3 3.937.0** - Cloudflare R2 (S3-compatible) file storage integration
- **Multer 2.0.2** - File upload handling
- **Day.js 1.11.19** - Date manipulation library

**Development:**

- **Nodemon 3.1.10** - Development server auto-reload
- **Debug 2.6.9** - Debug logging

## 📁 Detailed Project Structure

### Frontend Structure

```
frontend/src/
├── components/          # Reusable React components
│   ├── academy/        # Academy components (EventsGrid, FreeResources, PodcastSection, RegisterModal)
│   ├── blog/           # Blog components (BlogCard, BlogList, BlogSearch, BlogCategories, BlogSidebar)
│   ├── dashboard/      # Dashboard components (ActivityChart, OverviewCard, PieChartWidget, ProtectedRoute)
│   ├── home/           # Home page components (HeroSection, FeaturedEvents, LatestBlogs, etc.)
│   ├── merch/          # Merchandise components (ProductCard, ProductGrid, CartSidebar, etc.)
│   ├── reviews/        # Review system components (ReviewCard, CompanyCard, RatingFilter, etc.)
│   ├── shared/         # Shared components (ImageWithFallback, SectionHeader, etc.)
│   ├── ui/             # UI components (Cards)
│   ├── Header.jsx      # Main navigation header
│   └── Footer.jsx      # Footer component
├── controllers/        # API controllers (currently using mock data)
│   ├── api.js          # Axios instance configuration
│   ├── authController.js
│   ├── blogsController.js
│   ├── companiesController.js
│   ├── eventsController.js
│   ├── productsController.js
│   └── ...
├── models/             # Mock data (JSON/JS files)
│   ├── blogsData.js
│   ├── eventsData.js
│   ├── productsData.js
│   └── ...
├── pages/              # Page components (routes)
│   ├── Home.jsx
│   ├── Academy.jsx
│   ├── Blog.jsx
│   ├── BlogPost.jsx
│   ├── Reviews.jsx
│   ├── Merch.jsx
│   ├── Dashboard.jsx
│   ├── AdminDashboard.jsx
│   ├── OperatorDashboard.jsx
│   ├── Login.jsx
│   ├── Signup.jsx
│   └── ...
├── redux/              # Redux state management
│   ├── slices/
│   │   ├── authSlice.js      # Authentication state
│   │   ├── cartSlice.js      # Shopping cart state
│   │   └── analyticsSlice.js # Analytics state
│   └── store.js        # Redux store configuration
├── routes/
│   └── Router.jsx      # React Router configuration
├── styles/
│   └── globals.css     # Global styles
├── utils/              # Utility functions
│   ├── assets.js       # Asset path utilities
│   └── cookies.js      # Cookie management
├── App.jsx             # Main App component
└── main.jsx            # Application entry point
```

### Backend Structure

```
backend/
├── bin/
│   └── www             # Server entry point (HTTP server setup)
├── controllers/
│   └── auth.controller.js  # Authentication controller (signup, login, etc.)
├── models/             # Mongoose database models
│   ├── user.model.js       # User schema with roles
│   ├── blog.model.js       # Blog post schema
│   ├── event.model.js      # Event schema
│   ├── company.model.js    # Company/broker schema
│   ├── review.model.js     # Review schema
│   ├── product.model.js    # Product schema
│   ├── podcast.model.js    # Podcast schema
│   ├── course.model.js     # Course schema
│   └── permissions.model.js # Permission management schema
├── routes/
│   ├── index.js        # Main router (mounts /api routes)
│   └── api/
│       ├── index.js        # API router (organizes public/protected/admin routes)
│       ├── auth.routes.js  # Authentication endpoints
│       ├── public/
│       │   └── index.js    # Public API routes (ready for implementation)
│       ├── protected/
│       │   └── index.js    # Protected user routes (ready for implementation)
│       └── admin/
│           └── index.js    # Admin-only routes (ready for implementation)
├── middleware/
│   ├── index.js            # Global middleware (CORS, Helmet, Compression)
│   ├── authentication.middleware.js  # JWT authentication middleware
│   ├── authorization.middleware.js   # Role-based access control middleware
│   └── file-upload.middleware.js     # File upload handling with Multer
├── helpers/
│   ├── email.helper.js     # Email service helper (SendGrid integration)
│   └── s3.helper.js         # AWS S3 file storage operations
├── utils/
│   ├── database.js         # MongoDB connection setup
│   ├── environment.js      # Environment variable configuration
│   ├── constants.js        # Application constants (roles, etc.)
│   ├── response.js         # Standardized API response helpers
│   └── fn.js               # Utility functions (pagination, regex escaping)
├── app.js              # Express app configuration
└── package.json        # Backend dependencies
```

## 🚦 Getting Started

### Prerequisites

- **Node.js** (v16 or higher recommended)
- **npm** or **yarn** package manager
- **MongoDB** (local or remote instance)

### Installation

1. **Clone the repository:**

```bash
git clone <repository-url>
cd xktradingfloor
```

2. **Frontend Setup:**

```bash
cd frontend
npm install
```

3. **Backend Setup:**

```bash
cd ../backend
npm install
```

4. **Environment Configuration:**

Create a `.env` file in the `backend/` directory:

```env
# Server Configuration
NODE_ENV=development
PORT=3000
SERVER=http://localhost:3000
DOMAIN=http://localhost:3000
FRONTEND_URL=http://localhost:5173

# Database
DB_URI=mongodb://localhost:27017/xktradingfloor

# JWT Configuration
JWT_SECRET=your-secret-key-here
JWT_EXPIRED_IN=24h

# Cookie Configuration
COOKIE_EXPIRE_MS=86400000

# Master Password (optional, for admin bypass)
MASTER_PASSWORD=your-master-password

# Optional: SendGrid Email (for email notifications)
# SENDGRID_API_KEY=your-sendgrid-api-key

# Cloudflare R2 Configuration (for file uploads - currently in use)
R2_BUCKET_NAME=your-r2-bucket-name
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_REGION=auto
R2_PUBLIC_DOMAIN=https://your-public-domain.com

# Optional: AWS S3 Configuration (alternative storage, helper available but not currently used)
# S3_PUBLIC_BUCKET=your-public-bucket-name
# S3_PRIVATE_BUCKET=your-private-bucket-name
# IAM_USER_KEY=your-aws-access-key
# IAM_USER_SECRET=your-aws-secret-key
# S3_REGION=us-east-1
```

5. **Frontend Environment (Optional):**

Create a `.env` file in the `frontend/` directory for API configuration:

```env
VITE_API_BASE_URL=http://localhost:3000/api
VITE_BASE_PATH=/
```

### Running the Application

**Start the Backend Server:**

```bash
cd backend
npm start        # Production mode
# OR
npm run dev      # Development mode with nodemon (auto-reload)
```

Backend will run on `http://localhost:3000` (or the port specified in `.env`).

**Start the Frontend Development Server:**

```bash
cd frontend
npm run dev
```

Frontend will be available at `http://localhost:5173` (default Vite port).

**Note:** Both servers need to be running simultaneously for full functionality.

## 📡 API Documentation

### Base URL

- **Development**: `http://localhost:3000/api`
- **Production**: Configure via `SERVER` environment variable

### Authentication Endpoints

All authentication endpoints are public (no authentication required):

| Method | Endpoint                    | Description                 | Request Body                                                |
| ------ | --------------------------- | --------------------------- | ----------------------------------------------------------- |
| POST   | `/api/auth/signup`          | User registration           | `{ email, password, fullName, mobileNumber, role? }`        |
| POST   | `/api/auth/login`           | User login                  | `{ email, password }`                                       |
| POST   | `/api/auth/update-password` | Update password (protected) | `{ userId, currentPassword, newPassword, confirmPassword }` |
| POST   | `/api/auth/reactivateUser`  | Reactivate deleted user     | `{ email }`                                                 |

**Response Format:**

Success Response:

```json
{
  "success": true,
  "message": "Success message",
  "data": { ... },
  "token": "jwt-token", // For login endpoint
  "pagination": { // For paginated endpoints
    "page": 1,
    "limit": 10,
    "totalItems": 100,
    "totalPages": 10,
    "currentPage": 1,
    "pageSize": 10
  }
}
```

Error Response:

```json
{
  "success": false,
  "message": "Error message",
  "error": "Detailed error information"
}
```

**Authentication:**

- JWT tokens are sent via HTTP-only cookies
- Tokens can also be sent via `Authorization: Bearer <token>` header
- Cookie domain is configured via `DOMAIN` environment variable

### Admin Blog Endpoints

All admin blog endpoints require authentication and admin role (Admin or SubAdmin):

| Method | Endpoint                               | Description                  | Authentication         |
| ------ | -------------------------------------- | ---------------------------- | ---------------------- |
| POST   | `/api/admin/blogs/addblog`             | Create blog post             | ✅ Admin + File Upload |
| GET    | `/api/admin/blogs/getallblogs`         | Get all blogs (with filters) | ✅ Admin               |
| GET    | `/api/admin/blogs/blogs/:id`           | Get blog by ID               | ✅ Admin               |
| PUT    | `/api/admin/blogs/blogs/:id`           | Update blog post             | ✅ Admin               |
| DELETE | `/api/admin/blogs/blogs/:id`           | Soft delete blog             | ✅ Admin               |
| DELETE | `/api/admin/blogs/blogs/:id/permanent` | Permanent delete             | ✅ Admin               |

**Create Blog Request:**

- **Content-Type**: `multipart/form-data`
- **Fields**:
  - `title` (string, required)
  - `content` (string, required)
  - `excerpt` (string, optional)
  - `categories` (array, optional)
  - `tags` (array, optional)
  - `status` (enum: 'draft', 'published', 'archived', default: 'draft')
  - `isFeatured` (boolean, optional)
  - `seoKeywords` (array, optional)
  - `featuredImage` (file, optional) - Single image file
  - `images` (files, optional) - Up to 4 image files

**Get All Blogs Query Parameters:**

- `page` (number) - Page number
- `size` (number) - Items per page
- `search` (string) - Search in title, excerpt, content
- `status` (string) - Filter by status (in request body)

### Public Blog Endpoints

**Note:** These controller methods exist but routes are not yet connected. Controllers ready in `blog.controller.js`:

| Method | Endpoint                  | Description                        | Status                                          |
| ------ | ------------------------- | ---------------------------------- | ----------------------------------------------- |
| GET    | `/api/public/blogs`       | Get published blogs (with filters) | ⚠️ Route needed                                 |
| GET    | `/api/public/blogs/:slug` | Get published blog by slug         | ⚠️ Route needed (slug field commented in model) |

**Get Published Blogs Query Parameters:**

- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 10)
- `category` (string) - Filter by category
- `tag` (string) - Filter by tag
- `search` (string) - Search in title, excerpt, content
- `featured` (boolean) - Filter featured posts (pass 'true' as string)

**Note:** The `slug` field exists in the blog model but is currently commented out. The `getBlogBySlug` controller method exists but requires the slug field to be enabled in the model.

### Health Check

| Method | Endpoint | Description         |
| ------ | -------- | ------------------- |
| GET    | `/ping`  | Server health check |

## 🎯 Features Breakdown

### Authentication System

**Frontend:**

- User registration and login pages
- Cookie-based session management
- Protected routes with role-based access
- Redux state management for auth
- Automatic user sync from cookies

**Backend:**

- JWT-based authentication
- Password hashing with bcrypt
- Role-based access control (Admin, User, SubAdmin)
- Cookie and Bearer token support
- User activation/deactivation
- Soft delete support (users can be reactivated)
- Master password bypass option (for development)
- Password reset functionality (controllers exist, routes commented out)

**API Endpoints:**

- `POST /api/auth/signup` - User registration
- `POST /api/auth/login` - User login
- `POST /api/auth/update-password` - Update password (protected, requires authentication)
- `POST /api/auth/reactivateUser` - Reactivate user account
- `GET /ping` - Health check endpoint

### Academy Section

**Features:**

- Event listings (workshops, webinars, bootcamps)
- Event registration modal
- Free resources (ebooks, guides, videos, sheets)
- Podcast integration with episode listings
- Filtering and categorization
- Event details pages

**Current Implementation:**

- Frontend uses mock data from `models/eventsData.js`
- Event registration form (frontend-only, ready for API integration)
- Backend models ready (`event.model.js`, `podcast.model.js`, `course.model.js`)

### Review System

**Features:**

- Company listings (brokers, prop firms, crypto exchanges)
- Filtering by type, rating, and status
- Pagination support
- Review submission and display
- Company detail pages with aggregated reviews
- Operator dashboard for company management

**User Roles:**

- **Users**: Can view companies and submit reviews
- **Operators**: Can create/edit companies they manage
- **Admins**: Full access to all companies and reviews

**Current Implementation:**

- Frontend uses mock data
- Backend models ready (`company.model.js`, `review.model.js`)
- Operator dashboard for managing companies
- Review rating aggregation

### Blog System

**Features:**

- Blog post listings with pagination
- Search functionality (title, content, excerpt)
- Category and tag filtering
- Individual blog post pages (by ID or slug)
- Author information display
- Featured posts section
- View tracking
- Draft, published, and archived status management
- File upload with AWS S3 storage

**Backend Implementation (✅ Partially Complete):**

- **Admin Routes** (Protected, requires admin role):

  - `POST /api/admin/blogs/addblog` - Create blog post with file upload (featured image + multiple images)
  - `GET /api/admin/blogs/getallblogs` - Get all blogs with filters (status, search, pagination)
  - `GET /api/admin/blogs/blogs/:id` - Get blog by ID
  - `PUT /api/admin/blogs/blogs/:id` - Update blog post
  - `DELETE /api/admin/blogs/blogs/:id` - Soft delete blog post
  - `DELETE /api/admin/blogs/blogs/:id/permanent` - Permanently delete blog post

- **Public Routes** (Controllers ready, routes pending):

  - `getPublishedBlogs()` - Get published blogs with filtering (category, tag, search, featured)
  - `getBlogBySlug()` - Get published blog by slug

- **File Upload Features:**

  - AWS S3 integration for image storage
  - Support for featured image (single) and multiple images (up to 4)
  - Automatic file cleanup after S3 upload
  - MIME type validation (images, PDFs)
  - Organized folder structure in S3 (`Blogs/` folder)

- **Additional Features:**
  - Author population from User model (fullName, email, profileImage)
  - Automatic view counter increment on read
  - Published date tracking (auto-set when status changes to 'published')
  - Soft delete support (isDeleted flag)
  - Full-text search with regex escaping for security
  - Pagination support with customizable page size

**Frontend Implementation:**

- Uses mock data from `models/blogsData.js`
- Blog listing page with search and filters
- Individual blog post pages
- SEO optimization with React Helmet
- Ready for API integration (Axios instance configured)

### Merchandise (E-commerce)

**Features:**

- Product catalog with filtering
- Product detail pages
- Shopping cart functionality (Redux-managed)
- Cart sidebar component
- Product image galleries

**Current Implementation:**

- Frontend uses mock data from `models/productsData.js`
- Redux cart state management
- Backend model ready (`product.model.js`)
- Payment integration pending

### Dashboards

**User Dashboard:**

- Personal analytics and activity tracking
- Recent activity feed
- Quick actions

**Operator Dashboard:**

- Company management interface
- Review moderation
- Company creation and editing

**Admin Dashboard:**

- Full platform administration
- Analytics charts (Recharts integration)
- User management
- Content management

**Current Implementation:**

- Frontend dashboards with mock analytics data
- Protected routes with role verification
- Backend permission system ready

## 🎨 Styling & Design

The application uses a modern dark theme with professional design:

**Color Palette:**

- **Primary Color**: `#2B6EF2` (Blue)
- **Background**: `#0B0F19` (Dark blue-black)
- **Card Background**: `#0E1422`
- **Accent Colors**: Custom theme colors defined in Tailwind config

**Typography:**

- **Fonts**: Inter and Poppins (via Google Fonts)
- Responsive typography with Tailwind utilities

**Design System:**

- Custom Tailwind configuration extends default theme
- Framer Motion animations for smooth transitions
- Responsive grid layouts
- Mobile-first approach

## 📱 Responsive Design

The application is fully responsive and optimized for:

- **Desktop**: 1920px and above
- **Laptop**: 1024px - 1919px
- **Tablet**: 768px - 1023px
- **Mobile**: 320px - 767px

All components are built with mobile-first responsive design principles.

## 📤 File Upload & Storage

The application uses **Cloudflare R2** (S3-compatible object storage) for file storage with comprehensive upload capabilities. An AWS S3 helper is also available as an alternative.

### File Upload Features

- **Storage**: Cloudflare R2 (S3-compatible, currently in use)
- **Alternative**: AWS S3 helper available (`backend/helpers/s3.helper.js`)
- **Middleware**: Multer with MIME type validation
- **Supported File Types**:
  - Images: BMP, GIF, JPEG, PNG, SVG, TIFF, ICO
  - PDFs: Application/PDF
  - Documents: Excel, Word, CSV, Text
  - Audio/Video: MP3, MP4, WAV, etc.

### R2 Helper Functions (Currently Used)

The `backend/helpers/r2.helper.js` provides:

- `uploadPublic()` - Upload files to public R2 bucket
- `uploadPrivate()` - Upload files to private R2 bucket
- `generatePresignedUploadUrl()` - Generate presigned URLs for direct client uploads
- `generatePresignedDownloadUrl()` - Generate temporary download URLs
- `deleteFiles()` - Delete multiple files from R2
- `deleteFolder()` - Delete entire folder structure
- `copyFile()` - Copy files between buckets or folders
- `getFileMetadata()` - Get file information
- `streamFile()` - Stream files directly from R2

### S3 Helper Functions (Available but Not Currently Used)

The `backend/helpers/s3.helper.js` provides similar functions for AWS S3 storage as an alternative option.

### File Upload Configuration

**Blog Image Upload:**

- Featured image: Single file, stored in `Blogs/` folder
- Additional images: Up to 4 files
- Automatic local file cleanup after R2 upload
- Organized by date (`YYYY-MM` structure)

**Environment Variables Required (Cloudflare R2):**

```env
R2_BUCKET_NAME=your-r2-bucket-name
R2_ACCESS_KEY_ID=your-r2-access-key-id
R2_SECRET_ACCESS_KEY=your-r2-secret-access-key
R2_ENDPOINT=https://your-account-id.r2.cloudflarestorage.com
R2_REGION=auto
R2_PUBLIC_DOMAIN=https://your-public-domain.com
```

**Note:** The application currently uses Cloudflare R2 for file storage. The blog controller (`blog.controller.js`) uses `r2.helper.js` for all file uploads.

## 🔐 Security Features

**Backend Security:**

- Helmet.js for security headers
- CORS configuration
- JWT token-based authentication
- Password hashing with bcrypt
- Role-based authorization middleware
- Request validation and sanitization
- Error tracking with Sentry
- File upload validation (MIME type checking)
- Cloudflare R2 secure file storage (S3-compatible)
- Master password bypass option (for development/admin)

**Frontend Security:**

- Protected routes
- Secure cookie handling
- Token-based authentication
- XSS protection through React's built-in escaping

## 🗄️ Database Schema

**User Model:**

- Full name, email, mobile number
- Profile image, gender, date of birth
- Password (hashed with bcrypt)
- Role (Admin, User, SubAdmin)
- Active/deleted status (soft delete support)
- Module access permissions (via Permissions model)
- Password reset tokens and expiry

**Blog Model:**

- Title, content, excerpt
- Author (ObjectId reference to User)
- Featured image, multiple images array
- Categories, tags arrays
- Status (draft, published, archived)
- Published date, view count
- Featured flag, SEO keywords
- Soft delete support
- Timestamps

**Event Model:**

- Title, description
- Date, location
- Timestamps

**Company Model:**

- Name, description, category
- Status (pending/approved)
- Ratings aggregate
- Operator ID reference
- Promo codes

**Review Model:**

- Company ID reference
- User ID reference
- Rating, comment
- Timestamps

**Product Model:**

- Name, description
- Price, image
- Timestamps

**Podcast Model:**

- Title, description
- URL
- Timestamps

**Course Model:**

- (Schema ready for implementation)

**Permissions Model:**

- User ID reference
- Module-based permissions
- Granular access control
- Used for role-based feature access beyond basic role checks

## 🔧 Configuration

### Frontend Configuration

**Vite Configuration (`vite.config.js`):**

- Dynamic base path support for different deployment environments
- React plugin configuration
- Build optimization settings

**Tailwind Configuration (`tailwind.config.js`):**

- Custom color palette
- Theme extensions
- Content paths for purging

### Backend Configuration

**Environment Variables:**

- Server port and domain
- Database connection URI
- JWT secret and expiration
- Cookie expiration
- Optional: SendGrid API key for emails
- AWS S3 configuration (bucket names, IAM keys, region)
- Master password (for admin bypass)

**Middleware Configuration:**

- CORS with credentials support
- Helmet security headers
- Compression for responses
- User agent parsing
- Request logging with Morgan

## 📝 Available Scripts

### Frontend Scripts

Run from `frontend/` directory:

```bash
npm run dev          # Start development server
npm run build        # Build for production (default)
npm run build:local  # Build for localhost (base path: /)
npm run build:gith   # Build for GitHub Pages (base path: /xktradingfloor/)
npm run build:prod   # Build for production root domain (base path: /)
npm run preview      # Preview production build locally
```

### Backend Scripts

Run from `backend/` directory:

```bash
npm start            # Start production server
npm run dev          # Start development server with nodemon (auto-reload)
```

## 🚀 Deployment

### Frontend Deployment

The frontend builds to static files ready for deployment:

**Build Outputs:**

- **GitHub Pages**: `frontend/docs/` (use `npm run build:gith`)
- **Production**: `frontend/dist/` (use `npm run build:prod`)

**Deployment Targets:**

- Static hosting: Netlify, Vercel, GitHub Pages
- CDN: Cloudflare, AWS CloudFront
- Traditional servers: Nginx, Apache

**Base Path Configuration:**
The application supports multiple deployment environments:

1. **Localhost**: `http://localhost:5173/` (base path: `/`)
2. **GitHub Pages**: `https://stackified.github.io/xktradingfloor/` (base path: `/xktradingfloor/`)
3. **Root Domain**: `https://xktrading.com/` (base path: `/`)

### Backend Deployment

**Requirements:**

- Node.js runtime environment
- MongoDB database (local or cloud instance like MongoDB Atlas)
- Environment variables configured

**Deployment Options:**

- **Platform as a Service**: Heroku, Railway, Render, DigitalOcean App Platform
- **Virtual Private Server**: AWS EC2, DigitalOcean Droplet, Linode
- **Container Platforms**: Docker with Docker Compose, Kubernetes

**Environment Setup:**

1. Set all required environment variables
2. Ensure MongoDB is accessible
3. Configure CORS for your frontend domain
4. Set up SSL/HTTPS
5. Configure domain and DNS

### Deployment Checklist

**Frontend:**

- [ ] Update API base URL in environment variables
- [ ] Configure base path for deployment environment
- [ ] Optimize images and assets
- [ ] Test all routes and features
- [ ] Set up analytics tracking
- [ ] Configure SEO meta tags

**Backend:**

- [ ] Set up MongoDB database (local or cloud)
- [ ] Configure all environment variables
- [ ] Set up CORS for frontend domain
- [ ] Configure JWT secrets
- [ ] Set up error monitoring (Sentry)
- [ ] Configure email service (SendGrid) if needed
- [ ] Configure Cloudflare R2 bucket and access credentials (or AWS S3 if using alternative)
- [ ] Set up SSL/HTTPS
- [ ] Configure domain and DNS
- [ ] Set up backup strategy for database
- [ ] Configure logging and monitoring
- [ ] Test file upload functionality

## 🔄 Current Development Status

### Implemented Features ✅

- **Frontend:**

  - Complete UI/UX for all pages
  - Component architecture
  - Routing and navigation
  - State management (Redux)
  - Mock data integration
  - Responsive design
  - Authentication flow (frontend)
  - Shopping cart functionality (Redux)
  - Dashboard components with charts

- **Backend:**
  - Express.js server setup
  - MongoDB connection
  - Complete authentication system (JWT)
  - User model and authentication endpoints
  - Database models for all entities (User, Blog, Event, Company, Review, Product, Podcast, Course, Permissions)
  - Middleware (auth, authorization, security, file upload)
  - Route structure (public/protected/admin)
  - **Blog Management System** (Admin):
    - Full CRUD operations for blog posts
    - File upload with Cloudflare R2 integration
    - Image handling (featured image + multiple images)
    - Search and filtering
    - Pagination support
    - Soft delete and permanent delete
    - View tracking
  - Cloudflare R2 file storage integration (S3-compatible)
  - AWS S3 helper available as alternative (not currently used)
  - File upload middleware (Multer) with MIME type validation
  - Email helper (SendGrid integration ready)
  - Standardized API response helpers
  - Utility functions (pagination, regex escaping)

### In Progress / Pending 🔄

- **Backend API Implementation:**

  - **Public API endpoints:**

    - Blog public routes (getPublishedBlogs, getBlogBySlug) - controllers ready, routes needed (note: slug field is commented out in blog model)
    - Events API endpoints
    - Companies/Reviews API endpoints
    - Products API endpoints
    - Podcasts API endpoints
    - Courses API endpoints
    - Free resources API endpoints

  - **Protected API endpoints:**

    - User profile management
    - User-specific operations
    - Review submission
    - Event registration

  - **Admin API endpoints:**
    - Events management (controllers commented out)
    - Products management (controllers commented out)
    - Companies management (controllers commented out)
    - Reviews management (controllers commented out)
    - Podcasts management (controllers commented out)
    - Courses management (controllers commented out)
    - Dashboard statistics

- **Frontend-Backend Integration:**

  - Replace mock data with API calls
  - Connect blog frontend to blog API endpoints
  - Error handling and loading states
  - Form submissions to backend
  - Real-time data updates
  - File upload UI integration

- **Additional Features:**
  - Payment gateway integration (merchandise)
  - Email notifications (helper ready, templates needed)
  - Password reset flow (controllers exist but routes commented)
  - Advanced search functionality
  - Comment system for blogs
  - Real-time updates
  - Slug generation for blog posts (model has commented slug field)

## ⚠️ Known Issues & Notes

### Code Issues

1. **Supervisor Role Reference**: The file `backend/routes/api/index.js` references `constants.roles.supervisor` in the admin route authorization, but this role is not defined in `backend/utils/constants.js`. The defined roles are: Admin, User, SubAdmin. This may cause runtime errors. Consider removing the supervisor reference or adding it to constants.

2. **Blog Slug Field**: The slug field in the blog model (`backend/models/blog.model.js`) is commented out. The `getBlogBySlug` controller method exists but cannot function until the slug field is enabled in the model.

3. **Public Blog Routes**: The public blog controller methods (`getPublishedBlogs`, `getBlogBySlug`) are implemented but not yet connected to routes in `backend/routes/api/public/index.js`.

## 🧪 Development Guidelines

### Code Organization

**Frontend:**

- **Component-based Architecture**: Modular, reusable components
- **Separation of Concerns**: Controllers, models, and views separated
- **Redux State Management**: Centralized state for auth, cart, and analytics
- **Custom Hooks**: Reusable logic extraction where applicable

**Backend:**

- **MVC Pattern**: Controllers handle requests, Models define schema, Routes define endpoints
- **Middleware Pattern**: Authentication, authorization, and utility middleware
- **Error Handling**: Standardized error responses
- **Database Abstraction**: Mongoose ODM for MongoDB

### Best Practices

- Use environment variables for configuration
- Implement proper error handling
- Follow RESTful API conventions
- Maintain consistent code style
- Write descriptive commit messages
- Use meaningful variable and function names
- Implement proper validation
- Document API endpoints

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 📞 Support

For support, please contact the development team or visit the contact page at `/contact`.

## 🔮 Future Enhancements

Potential features for future development:

- **Public API Routes**: Connect blog public endpoints (getPublishedBlogs, getBlogBySlug)
- **Content Management**: Complete CRUD APIs for Events, Products, Companies, Reviews, Podcasts, Courses
- **User Features**: Profile management, review submission, event registration
- **Real-time Features**: Chat or Discord integration, live streaming for webinars
- **Trading Tools**: Advanced trading tools and calculators
- **Mobile**: Mobile app version (React Native)
- **Analytics**: Enhanced analytics and reporting
- **Integrations**: Trading APIs, payment gateway for merchandise
- **Communication**: Email notification system (SendGrid helper ready)
- **Content**: Comment system for blog posts, slug generation (slug field exists in model but is commented out)
- **Education**: Course progress tracking, certificate generation
- **Social**: Social media integration
- **Security**: Two-factor authentication, password reset flow completion
- **Permissions**: Advanced permission system refinement

---

**Built with ❤️ by Stackified.**
