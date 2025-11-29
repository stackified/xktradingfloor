import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getUserCookie } from '../../utils/cookies.js';

export default function ProtectedRoute({ children, role }) {
  const reduxUser = useSelector((state) => state.auth.user);
  const user = reduxUser || (typeof window !== 'undefined' ? getUserCookie() : null);
  
  if (!user) return <Navigate to="/login" replace />;
  
  // Check role (case-insensitive, handle both "Admin" and "admin")
  if (role) {
    const userRole = user.role?.toLowerCase();
    const requiredRole = role.toLowerCase();
    // Map common role variations
    const roleMap = {
      'admin': ['admin', 'subadmin', 'supervisor'],
      'operator': ['operator', 'subadmin'],
      'user': ['user'],
    };
    
    const allowedRoles = roleMap[requiredRole] || [requiredRole];
    if (!allowedRoles.includes(userRole)) {
      return <Navigate to="/" replace />;
    }
  }
  
  return children;
}


