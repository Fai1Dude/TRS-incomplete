// src/services/api.js
const API_URL = 'http://localhost:5000/api';

class ApiService {
  constructor() {
    this.token = localStorage.getItem('token');
  }

  setToken(token) {
    this.token = token;
    localStorage.setItem('token', token);
  }

  getHeaders() {
    return {
      'Content-Type': 'application/json',
      ...(this.token ? { Authorization: `Bearer ${this.token}` } : {})
    };
  }

  async request(endpoint, options = {}) {
    try {
      const response = await fetch(`${API_URL}${endpoint}`, {
        ...options,
        headers: {
          ...this.getHeaders(),
          ...options.headers
        }
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'API request failed');
      }

      return data;
    } catch (error) {
      console.error('API Error:', error);
      throw error;
    }
  }

  // Auth endpoints
  async login(credentials) {
    return this.request('/auth/login', {
      method: 'POST',
      body: JSON.stringify(credentials)
    });
  }

  async verifyOtp(data) {
    return this.request('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  // Train endpoints
  async searchTrains(params) {
    const queryString = new URLSearchParams(params).toString();
    return this.request(`/trains/search?${queryString}`);
  }

  async getTrainDetails(trainId) {
    return this.request(`/trains/${trainId}`);
  }

  async getAvailableSeats(trainId, scheduleId) {
    return this.request(`/trains/${trainId}/seats?scheduleId=${scheduleId}`);
  }

  // Passenger endpoints
  async createReservation(data) {
    return this.request('/passenger/reservations', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async getActiveReservations(userId) {
    return this.request(`/passenger/reservations/active/${userId}`);
  }

  async getReservationHistory(userId) {
    return this.request(`/passenger/reservations/history/${userId}`);
  }

  async processPayment(reservationId, paymentData) {
    return this.request(`/passenger/reservations/${reservationId}/payment`, {
      method: 'POST',
      body: JSON.stringify(paymentData)
    });
  }

  async getLoyaltyInfo(userId) {
    return this.request(`/passenger/loyalty/${userId}`);
  }

  // Admin endpoints
  async getWaitlist() {
    return this.request('/admin/waitlist');
  }

  async promoteWaitlist(waitingId) {
    return this.request(`/admin/waitlist/promote/${waitingId}`, {
      method: 'POST'
    });
  }

  async assignStaff(data) {
    return this.request('/admin/staff/assign', {
      method: 'POST',
      body: JSON.stringify(data)
    });
  }

  async updateReservation(reservationId, data) {
    return this.request(`/admin/reservations/${reservationId}`, {
      method: 'PUT',
      body: JSON.stringify(data)
    });
  }

  // Report endpoints
  async getLoadFactor(date) {
    return this.request(`/reports/load-factor?date=${date}`);
  }

  async getDependents(date) {
    return this.request(`/reports/dependents?date=${date}`);
  }

  async getStationsReport(trainId) {
    return this.request(`/reports/stations/${trainId}`);
  }
}

export const apiService = new ApiService();