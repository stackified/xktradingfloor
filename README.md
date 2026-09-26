# XK Trading Floor

A full-stack trading education and community platform featuring academy courses, broker reviews, blogs, podcasts, and merchandise.

**🌐 Live Site:** [https://xktradingfloor.com](https://xktradingfloor.com)

**🧪 Staging:** [https://stackified.github.io/xktradingfloor/](https://stackified.github.io/xktradingfloor/)

## 📦 Project Structure

```
xktradingfloor/
├── frontend/          # React + Vite frontend application
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── controllers/ # API controllers
│   │   ├── contexts/   # React contexts
│   │   ├── models/     # Data models/types
│   │   ├── pages/      # Page components
│   │   ├── redux/      # Redux store
│   │   ├── routes/     # React Router
│   │   └── utils/      # Shared utilities (analytics, rich text, etc.)
│   ├── scripts/        # Sitemap, prerender and hydration-check scripts
│   └── package.json
├── backend/           # Express.js backend application
│   ├── bin/           # Server entry point (www)
│   ├── controllers/   # Request handlers
│   ├── emails/        # EJS email templates
│   ├── helpers/       # Helper functions
│   ├── middleware/    # Express middleware
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   ├── services/      # Email and spread-data services
│   ├── utils/         # Utility functions
│   └── package.json
└── README.md
```

## 🚀 Features

- **🏠 Home Page**: Hero section, community information, featured events
- **🎓 Academy**: Trading programs, workshops, bootcamps, and free resources
- **📝 Blog**: Educational articles with search and filtering
- **⭐ Reviews**: Review system for brokers, prop firms, and crypto exchanges
- **🎙️ Podcasts**: Trading insights and educational content
- **🛍️ Merchandise**: E-commerce functionality with shopping cart
- **👤 Dashboards**: Personalized dashboards for users, operators, and admins
- **🔐 Authentication**: User registration, login, and role-based access control
- **📧 Email Campaigns**: Admin email campaign management with CSV upload, draft management, and campaign history
- **📧 Email Notifications**: Automated emails via Brevo
- **☁️ Cloud Storage**: File upload and storage via Cloudflare R2
- **🛡️ Error Monitoring**: Real-time error tracking and performance monitoring via Sentry
- **📊 Analytics**: Google Analytics 4 integration for tracking website performance and user behavior

## 🛠️ Tech Stack

### Frontend

- React 18.3.1
- Vite 7.3.1
- React Router DOM 6.26.2
- Redux Toolkit 2.2.7
- Tailwind CSS 3.4.14
- Framer Motion 11.2.13
- Lucide React 0.474.0
- React Helmet Async 2.0.5
- Tiptap 3 (Rich text editor)
- Recharts 2.15.4 (Charts)

### Backend

- Node.js
- Express.js 4.16.1
- MongoDB with Mongoose 8.18.1
- JWT Authentication
- AWS SDK S3 client (Cloudflare R2 storage)
- Brevo (Email)
- Sentry (Monitoring)
- EJS (Templates)
- File upload support

## 🚦 Getting Started

### Prerequisites

- Node.js 20.19 or higher (Vite 7 requirement; CI uses Node 22)
- npm or yarn
- MongoDB (local or remote instance)

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
   - Create `.env` files in both `frontend/` and `backend/` directories
   - Configure required environment variables (see `.env.example` files if available)

### Running the Application

**Start the Backend Server:**

```bash
cd backend
npm run dev    # Development mode
# OR
npm start      # Production mode
```

**Start the Frontend Development Server:**

```bash
cd frontend
npm run dev
```

## 📝 Available Scripts

### Frontend

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run build:prod   # Production build with base "/" plus prerender (used for xktradingfloor.com)
npm run build:gith   # Build with base "/xktradingfloor/" plus prerender (used for GitHub Pages staging)
npm run preview      # Preview production build
```

### Backend

```bash
npm start            # Start production server
npm run dev          # Start development server with auto-reload
```

## 🌍 Deployment

- **Production:** pushes to `main` build the frontend (`npm run build:prod`) and upload it to Bluehost over FTP, serving [xktradingfloor.com](https://xktradingfloor.com).
- **Staging:** pushes to `dev` build the frontend (`npm run build:gith`) and publish it to the `gh-pages` branch, serving [stackified.github.io/xktradingfloor](https://stackified.github.io/xktradingfloor/).
- **Backend:** the Express API is hosted on Render.

The workflows live in `.github/workflows/`.

## 🎨 Styling

The application uses:

- **Tailwind CSS** for utility-first styling
- **Framer Motion** for animations
- Modern dark theme with responsive design

## 📱 Responsive Design

Fully responsive and optimized for:

- Desktop (1920px+)
- Laptop (1024px - 1919px)
- Tablet (768px - 1023px)
- Mobile (320px - 767px)

## 📊 Analytics Integration

The application includes Google Analytics 4 (GA4) integration for comprehensive website analytics:

- **Measurement ID**: `G-GYPE81F8N8`
- **Stream ID**: `13130862580`
- **Automatic Page View Tracking**: All route changes are automatically tracked
- **Custom Event Tracking**: Utility functions available for tracking button clicks, form submissions, searches, and user engagement

### Analytics Features

- Real-time page view tracking
- Custom event tracking (button clicks, form submissions, link clicks)
- Search query tracking
- User engagement metrics
- Automatic route change detection

Analytics utilities are available in `frontend/src/utils/analytics.js` for custom event tracking throughout the application.

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

Proprietary. Copyright (c) 2025-2026 XK Trading Floor. All rights reserved. Designed and developed by [Stackified](https://github.com/stackified). See [LICENSE](LICENSE).

## 📞 Support

For support, please contact the development team or visit the contact page.

---

**Built with ❤️ by Stackified.**
