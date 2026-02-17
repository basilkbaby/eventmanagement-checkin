// services/checkin.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

export interface CheckinRequest {
  ticketId: string;
  staffId: string;
  staffName: string;
  eventId: string;
  deviceId: string;
  notes?: string;
}

export interface CheckinResponse {
  success: boolean;
  checkinId?: string;
  timestamp?: string;
  error?: string;
}

@Injectable({
  providedIn: 'root'
})
export class CheckinService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  async confirmCheckin(request: CheckinRequest): Promise<CheckinResponse> {
    try {
      return await firstValueFrom(
        this.http.post<CheckinResponse>(`${this.apiUrl}/checkin/confirm`, request)
      );
    } catch (error: any) {
      console.error('Check-in error:', error);
      return {
        success: false,
        error: error.message || 'Check-in failed'
      };
    }
  }

  async getCheckinStats(eventId: string) {
    try {
      return await firstValueFrom(
        this.http.get<any>(`${this.apiUrl}/checkin/stats/${eventId}`)
      );
    } catch (error) {
      console.error('Error fetching stats:', error);
      return {
        totalTickets: 0,
        checkedIn: 0,
        pending: 0,
        checkinRate: 0
      };
    }
  }

  async searchTickets(query: string, eventId: string) {
    try {
      return await firstValueFrom(
        this.http.get<any>(`${this.apiUrl}/checkin/search`, {
          params: { query, eventId }
        })
      );
    } catch (error) {
      console.error('Search error:', error);
      return { tickets: [], error: 'Search failed' };
    }
  }
}