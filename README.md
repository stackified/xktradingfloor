# XK Trading Floor

A full-stack trading education and community platform featuring academy courses, broker reviews, blogs, podcasts, and merchandise.

**🌐 Live Demo:** [https://stackified.github.io/xktradingfloor/](https://stackified.github.io/xktradingfloor/)

## 📦 Project Structure

```
xktradingfloor/
├── frontend/          # React + Vite frontend application
│   ├── src/
│   │   ├── components/ # React components
│   │   ├── controllers/ # API controllers
│   │   ├── pages/      # Page components
│   │   ├── redux/      # Redux store
│   │   └── routes/     # React Router
│   └── package.json
├── backend/           # Express.js backend application
│   ├── controllers/   # Request handlers
│   ├── models/        # Database models
│   ├── routes/        # API routes
│   ├── middleware/    # Express middleware
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

## 🛠️ Tech Stack

### Frontend

- React 18.3.1
- Vite 5.4.10
- React Router DOM 6.26.2
- Redux Toolkit 2.2.7
- Tailwind CSS 3.4.14
- Framer Motion 11.2.13
- React Quill 2.0.0 (Rich text editor)
- Recharts 2.15.4 (Charts)

### Backend

- Node.js
- Express.js 4.16.1
- MongoDB with Mongoose 8.18.1
- JWT Authentication
- File upload support

## 🚦 Getting Started

### Prerequisites

- Node.js (v16 or higher)
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
npm run preview      # Preview production build
```

### Backend

```bash
npm start            # Start production server
npm run dev          # Start development server with auto-reload
```

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

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License

This project is private and proprietary.

## 📞 Support

For support, please contact the development team or visit the contact page.

---

**Built with ❤️ by Stackified.**
