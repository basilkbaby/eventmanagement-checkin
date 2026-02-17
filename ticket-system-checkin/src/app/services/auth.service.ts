// services/auth.service.ts
import { Injectable, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface StaffSession {
  staffId: string;
  staffName: string;
  eventId: string;
  eventName: string;
  token: string;
  expiresAt: string;
  permissions: string[];
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;
  private readonly SESSION_KEY = 'staff_session';
  
  private session = signal<StaffSession | null>(null);

  constructor() {
    // Load session from localStorage on initialization
    this.loadSession();
  }

  private loadSession() {
    const sessionStr = localStorage.getItem(this.SESSION_KEY);
    if (sessionStr) {
      try {
        const sessionData = JSON.parse(sessionStr);
        this.session.set(sessionData);
      } catch (error) {
        console.error('Error loading session:', error);
        localStorage.removeItem(this.SESSION_KEY);
      }
    }
  }

  async login(staffId: string, pin: string, eventCode: string): Promise<boolean> {
    try {
      const response = await firstValueFrom(
        this.http.post<{ success: boolean; token: string; staffId: string; staffName: string; eventId: string; eventName: string; permissions: string[] }>(
          `${this.apiUrl}/auth/staff-login`,
          { staffId, pin, eventCode }
        )
      );

      if (response.success && response.token) {
        const sessionData: StaffSession = {
          staffId: response.staffId,
          staffName: response.staffName,
          eventId: response.eventId,
          eventName: response.eventName,
          token: response.token,
          expiresAt: new Date(Date.now() + 12 * 60 * 60 * 1000).toISOString(), // 12 hours
          permissions: response.permissions || []
        };

        this.saveSession(sessionData);
        return true;
      }

      return false;
    } catch (error) {
      console.error('Login error:', error);
      return false;
    }
  }

  private saveSession(sessionData: StaffSession) {
    localStorage.setItem(this.SESSION_KEY, JSON.stringify(sessionData));
    this.session.set(sessionData);
  }

  isAuthenticated(): boolean {
    const currentSession = this.session();
    if (!currentSession) return false;

    // Check if session is expired
    return new Date(currentSession.expiresAt) > new Date();
  }

  getSession(): StaffSession | null {
    return this.session();
  }

  getCurrentStaff() {
    const session = this.session();
    return {
      id: session?.staffId,
      name: session?.staffName,
      eventId: session?.eventId
    };
  }

  getToken(): string {
    return this.session()?.token || '';
  }

  logout() {
    localStorage.removeItem(this.SESSION_KEY);
    this.session.set(null);
  }

  refreshSession() {
    this.loadSession();
  }
}