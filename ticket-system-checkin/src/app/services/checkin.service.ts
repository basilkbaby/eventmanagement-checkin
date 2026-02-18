// services/checkin.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';
import { CheckinRequest, CheckinResponse } from '../core/models/order.model';


@Injectable({
  providedIn: 'root'
})
export class CheckinService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;



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

