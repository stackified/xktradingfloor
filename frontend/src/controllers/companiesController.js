import api from './api.js';

// Helper to get current user from session
function getCurrentUser() {
  const s = sessionStorage.getItem('xktf_user');
  return s ? JSON.parse(s) : null;
}

// Helper to load companies from JSON
async function loadCompanies() {
  const { default: companies } = await import('../models/companies.json');
  return companies;
}

// Helper to save companies to JSON (mock - in real app this would be API call)
async function saveCompanies(companies) {
  // In a real app, this would be: return api.put('/companies', companies);
  // For now, we'll use localStorage as a mock persistence layer
  localStorage.setItem('xktf_companies', JSON.stringify(companies));
  return { data: companies };
}

// Get all companies (with optional filters)
export async function getAllCompanies(filters = {}) {
  // return api.get('/companies', { params: filters });
  let companies = await loadCompanies();
  
  // Check localStorage for any updates
  const stored = localStorage.getItem('xktf_companies');
  if (stored) {
    try {
      companies = JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing stored companies:', e);
    }
  }

  // Apply filters
  if (filters.category) {
    companies = companies.filter(c => c.category === filters.category);
  }
  if (filters.status) {
    companies = companies.filter(c => c.status === filters.status);
  }
  if (filters.operatorId) {
    companies = companies.filter(c => c.operatorId === filters.operatorId);
  }
  if (filters.minRating) {
    companies = companies.filter(c => c.ratingsAggregate >= filters.minRating);
  }
  if (filters.search) {
    const searchLower = filters.search.toLowerCase();
    companies = companies.filter(c => 
      c.name.toLowerCase().includes(searchLower) ||
      c.details?.toLowerCase().includes(searchLower) ||
      c.description?.toLowerCase().includes(searchLower)
    );
  }

  return { data: companies };
}

// Get company by ID
export async function getCompanyById(companyId) {
  // return api.get(`/companies/${companyId}`);
  const companies = await loadCompanies();
  const stored = localStorage.getItem('xktf_companies');
  let allCompanies = companies;
  
  if (stored) {
    try {
      allCompanies = JSON.parse(stored);
    } catch (e) {
      console.error('Error parsing stored companies:', e);
    }
  }

  const company = allCompanies.find(c => c.id === companyId);
  if (!company) {
    throw new Error('Company not found');
  }
  return { data: company };
}

// Create company (operator only)
export async function createCompany(companyData) {
  // return api.post('/companies', companyData);
  const user = getCurrentUser();
  if (!user || user.role !== 'operator') {
    throw new Error('Only operators can create companies');
  }

  const companies = await loadCompanies();
  const stored = localStorage.getItem('xktf_companies');
  let allCompanies = stored ? JSON.parse(stored) : companies;

  const newCompany = {
    id: `cmp-${Date.now()}`,
    ...companyData,
    operatorId: user.id,
    status: 'pending', // Can be set to 'approved' by admin
    ratingsAggregate: 0,
    totalReviews: 0,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    promoCodes: companyData.promoCodes || []
  };

  allCompanies.push(newCompany);
  await saveCompanies(allCompanies);
  return { data: newCompany };
}

// Update company (operator can only update their own)
export async function updateCompany(companyId, updates) {
  // return api.put(`/companies/${companyId}`, updates);
  const user = getCurrentUser();
  const companies = await loadCompanies();
  const stored = localStorage.getItem('xktf_companies');
  let allCompanies = stored ? JSON.parse(stored) : companies;

  const companyIndex = allCompanies.findIndex(c => c.id === companyId);
  if (companyIndex === -1) {
    throw new Error('Company not found');
  }

  const company = allCompanies[companyIndex];
  
  // Operators can only update their own companies, admins can update any
  if (user?.role === 'operator' && company.operatorId !== user.id) {
    throw new Error('You can only update your own companies');
  }
  if (!user || (user.role !== 'operator' && user.role !== 'admin')) {
    throw new Error('Only operators and admins can update companies');
  }

  allCompanies[companyIndex] = {
    ...company,
    ...updates,
    updatedAt: new Date().toISOString()
  };

  await saveCompanies(allCompanies);
  return { data: allCompanies[companyIndex] };
}

// Delete company (operator can only delete their own)
export async function deleteCompany(companyId) {
  // return api.delete(`/companies/${companyId}`);
  const user = getCurrentUser();
  const companies = await loadCompanies();
  const stored = localStorage.getItem('xktf_companies');
  let allCompanies = stored ? JSON.parse(stored) : companies;

  const companyIndex = allCompanies.findIndex(c => c.id === companyId);
  if (companyIndex === -1) {
    throw new Error('Company not found');
  }

  const company = allCompanies[companyIndex];
  
  // Operators can only delete their own companies, admins can delete any
  if (user?.role === 'operator' && company.operatorId !== user.id) {
    throw new Error('You can only delete your own companies');
  }
  if (!user || (user.role !== 'operator' && user.role !== 'admin')) {
    throw new Error('Only operators and admins can delete companies');
  }

  allCompanies.splice(companyIndex, 1);
  await saveCompanies(allCompanies);
  return { data: { success: true } };
}

// Add promo code to company
export async function addPromoCode(companyId, promoData) {
  // return api.post(`/companies/${companyId}/promo-codes`, promoData);
  const user = getCurrentUser();
  const companies = await loadCompanies();
  const stored = localStorage.getItem('xktf_companies');
  let allCompanies = stored ? JSON.parse(stored) : companies;

  const companyIndex = allCompanies.findIndex(c => c.id === companyId);
  if (companyIndex === -1) {
    throw new Error('Company not found');
  }

  const company = allCompanies[companyIndex];
  
  if (user?.role === 'operator' && company.operatorId !== user.id) {
    throw new Error('You can only add promo codes to your own companies');
  }
  if (!user || (user.role !== 'operator' && user.role !== 'admin')) {
    throw new Error('Only operators and admins can add promo codes');
  }

  const newPromo = {
    id: `promo-${Date.now()}`,
    ...promoData,
    createdAt: new Date().toISOString()
  };

  company.promoCodes = company.promoCodes || [];
  company.promoCodes.push(newPromo);
  company.updatedAt = new Date().toISOString();

  allCompanies[companyIndex] = company;
  await saveCompanies(allCompanies);
  return { data: newPromo };
}

// Update promo code
export async function updatePromoCode(companyId, promoId, updates) {
  // return api.put(`/companies/${companyId}/promo-codes/${promoId}`, updates);
  const user = getCurrentUser();
  const companies = await loadCompanies();
  const stored = localStorage.getItem('xktf_companies');
  let allCompanies = stored ? JSON.parse(stored) : companies;

  const companyIndex = allCompanies.findIndex(c => c.id === companyId);
  if (companyIndex === -1) {
    throw new Error('Company not found');
  }

  const company = allCompanies[companyIndex];
  
  if (user?.role === 'operator' && company.operatorId !== user.id) {
    throw new Error('You can only update promo codes for your own companies');
  }
  if (!user || (user.role !== 'operator' && user.role !== 'admin')) {
    throw new Error('Only operators and admins can update promo codes');
  }

  const promoIndex = company.promoCodes.findIndex(p => p.id === promoId);
  if (promoIndex === -1) {
    throw new Error('Promo code not found');
  }

  company.promoCodes[promoIndex] = {
    ...company.promoCodes[promoIndex],
    ...updates
  };
  company.updatedAt = new Date().toISOString();

  allCompanies[companyIndex] = company;
  await saveCompanies(allCompanies);
  return { data: company.promoCodes[promoIndex] };
}

// Delete promo code
export async function deletePromoCode(companyId, promoId) {
  // return api.delete(`/companies/${companyId}/promo-codes/${promoId}`);
  const user = getCurrentUser();
  const companies = await loadCompanies();
  const stored = localStorage.getItem('xktf_companies');
  let allCompanies = stored ? JSON.parse(stored) : companies;

  const companyIndex = allCompanies.findIndex(c => c.id === companyId);
  if (companyIndex === -1) {
    throw new Error('Company not found');
  }

  const company = allCompanies[companyIndex];
  
  if (user?.role === 'operator' && company.operatorId !== user.id) {
    throw new Error('You can only delete promo codes from your own companies');
  }
  if (!user || (user.role !== 'operator' && user.role !== 'admin')) {
    throw new Error('Only operators and admins can delete promo codes');
  }

  company.promoCodes = company.promoCodes.filter(p => p.id !== promoId);
  company.updatedAt = new Date().toISOString();

  allCompanies[companyIndex] = company;
  await saveCompanies(allCompanies);
  return { data: { success: true } };
}

