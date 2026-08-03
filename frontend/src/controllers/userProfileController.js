import api from "./api.js";

export async function getPublicUserProfile(userId) {
  const response = await api.get(`/users/${userId}`);
  if (response.data?.success && response.data?.data) {
    return { data: { ...response.data.data, id: response.data.data.id } };
  }
  return response;
}

export async function getVerifiedTraders({ page = 1, size = 24 } = {}) {
  const response = await api.get("/users/verified-traders", { params: { page, size } });
  if (response.data?.success) {
    const docs = response.data.data || [];
    return {
      data: docs.map((trader) => ({ ...trader, id: trader.id })),
      pagination: response.data.pagination || null,
    };
  }
  return { data: [], pagination: null };
}

export async function getMyProfile() {
  const response = await api.get("/user/me");
  if (response.data?.success && response.data?.data) {
    return { data: response.data.data };
  }
  return response;
}

export async function updateMyProfile(payload, avatarFile = null) {
  let response;
  if (avatarFile) {
    const formData = new FormData();
    Object.entries(payload).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        formData.append(key, value);
      }
    });
    formData.append("profileImage", avatarFile);
    response = await api.patch("/user/me", formData, {
      headers: { "Content-Type": "multipart/form-data" },
    });
  } else {
    response = await api.patch("/user/me", payload);
  }
  if (response.data?.success && response.data?.data) {
    return { data: response.data.data };
  }
  return response;
}

export async function applyForVerifiedTrader({ applicationNote, brokerStatements, payoutProofs }) {
  const formData = new FormData();
  if (applicationNote) formData.append("applicationNote", applicationNote);
  (brokerStatements || []).forEach((file) => formData.append("brokerStatements", file));
  (payoutProofs || []).forEach((file) => formData.append("payoutProofs", file));

  const response = await api.post("/user/verified-trader/apply", formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  if (response.data?.success && response.data?.data) {
    return { data: response.data.data };
  }
  return response;
}

export async function listVerifiedTraderApplications(params = {}) {
  const response = await api.get("/admin/users/verified-trader/applications", { params });
  if (response.data?.success) {
    const docs = Array.isArray(response.data.data)
      ? response.data.data
      : response.data.data?.docs || [];
    const pagination = response.data.pagination || response.data.data?.pagination || null;
    return {
      data: docs.map((app) => ({ ...app, id: app.id || app._id })),
      pagination,
    };
  }
  return { data: [], pagination: null };
}

export async function inviteVerifiedTrader(payload) {
  const response = await api.post("/admin/users/verified-trader/invite", payload);
  return response.data;
}

export async function scheduleVerifiedTraderCall(userId, scheduledCallAt) {
  const response = await api.post(`/admin/users/verified-trader/${userId}/schedule-call`, {
    scheduledCallAt,
  });
  return response.data;
}

export async function decideVerifiedTraderApplication(userId, payload) {
  const response = await api.post(`/admin/users/verified-trader/${userId}/decide`, payload);
  return response.data;
}
