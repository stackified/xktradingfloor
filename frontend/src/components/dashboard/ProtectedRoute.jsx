import React from 'react';
import { Navigate } from 'react-router-dom';
import { useSelector } from 'react-redux';
import { getUserCookie } from '../../utils/cookies.js';

export default function ProtectedRoute({ children, role }) {
  const reduxUser = useSelector((state) => state.auth.user);
  const user = reduxUser || (typeof window !== 'undefined' ? getUserCookie() : null);
  
  if (!user) return <Navigate to="/login" replace />;
  if (role && user.role !== role) return <Navigate to="/" replace />;
  return children;
}


