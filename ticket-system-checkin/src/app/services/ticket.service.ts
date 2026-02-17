// services/ticket.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { firstValueFrom } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private http = inject(HttpClient);
  private apiUrl = environment.apiUrl;

  async verifyTicket(ticketId: string, code: string, orderId?: string) {
    return firstValueFrom(
      this.http.post<any>(`${this.apiUrl}/checkin/verify`, {
        ticketId,
        verificationCode: code,
        orderId
      })
    );
  }

  async checkinTicket(ticketId: string, staffId: string, deviceId: string) {
    return firstValueFrom(
      this.http.post<any>(`${this.apiUrl}/checkin/confirm`, {
        ticketId,
        staffId,
        deviceId,
        timestamp: new Date().toISOString()
      })
    );
  }
}