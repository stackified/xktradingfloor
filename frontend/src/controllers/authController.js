import api from "./api.js";

// Demo accounts for testing (mock authentication)
// TODO: Replace with real backend API calls
const DEMO_ACCOUNTS = [
  {
    email: "admin@xktrading.com",
    password: "admin123",
    id: "demo-admin-001",
    name: "Admin User",
    role: "admin",
    country: "IN",
    avatar: "/assets/users/default-avatar.jpg",
  },
  {
    email: "operator@xktrading.com",
    password: "operator123",
    id: "demo-operator-001",
    name: "Operator User",
    role: "operator",
    country: "IN",
    avatar: "/assets/users/default-avatar.jpg",
  },
  {
    email: "demo@xktrading.com",
    password: "demo123",
    id: "demo-user-001",
    name: "Demo User",
    role: "user",
    country: "IN",
    avatar: "/assets/users/default-avatar.jpg",
  },
  {
    email: "john@xktrading.com",
    password: "password123",
    id: "demo-user-002",
    name: "John Trader",
    role: "user",
    country: "US",
    avatar: "/assets/users/default-avatar.jpg",
  },
  {
    email: "sarah@xktrading.com",
    password: "password123",
    id: "demo-user-003",
    name: "Sarah Investor",
    role: "user",
    country: "GB",
    avatar: "/assets/users/default-avatar.jpg",
  },
];

// Placeholder auth handlers. Replace with real endpoints later.
export async function signup({ name, email, country, password }) {
  // return api.post('/auth/signup', { name, email, country, password });
  return { data: { id: "mock-user", name, email, country, role: "user" } };
}

export async function login({ email, password }) {
  // return api.post('/auth/login', { email, password });

  // Mock authentication: Check against demo accounts
  const account = DEMO_ACCOUNTS.find(
    (acc) =>
      acc.email.toLowerCase() === email.toLowerCase() &&
      acc.password === password
  );

  if (account) {
    // Return account data without password
    const { password: _, ...userData } = account;
    return { data: userData };
  }

  // Fallback: If email contains "admin" or "operator", assign role (for backward compatibility)
  // Password is ignored in fallback mode
  const role = email?.includes("admin")
    ? "admin"
    : email?.includes("operator")
    ? "operator"
    : "user";
  // return { data: { id: 'mock-user', name: 'Guest', email, role, country: 'IN' } };
  return {
    data: {
      id: "mock-user",
      name: email.split("@")[0] || "Guest",
      email,
      role,
      country: "IN",
      avatar: "/assets/users/default-avatar.jpg",
    },
  };
}

export async function logoutRequest() {
  // return api.post('/auth/logout');
  return { data: { success: true } };
}

// Export demo accounts for display in Login page
export { DEMO_ACCOUNTS };
