// services/ticket.service.ts
import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { BehaviorSubject, catchError, firstValueFrom, Observable, of, tap } from 'rxjs';
import { CheckinRequest, CheckinResponse, Order, Ticket } from '../core/models/order.model';

@Injectable({
  providedIn: 'root'
})
export class TicketService {
  private http = inject(HttpClient);
  private orders: Order[] = [];
  private ordersSubject = new BehaviorSubject<Order[]>([]);
  private tickets: Ticket[] = [];
   private recentCheckins: Map<string, CheckinResponse> = new Map();

  // API endpoints from your backend
  private apiUrl = environment.apiUrl + '/api/orders';

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

  getOrder(orderId: string): Observable<Order> {
    return this.http.get<Order>(`${this.apiUrl}/${orderId}`).pipe(
      tap(order => {
        // Cache the order locally
        const index = this.orders.findIndex(o => o.orderId === orderId);
        if (index >= 0) {
          this.orders[index] = order;
        } else {
          this.orders.push(order);
        }
      }),
      catchError(error => {
        console.error('Error fetching order:', error);
        throw error;
      })
    );
  }

  confirmCheckin(request: CheckinRequest): Observable<CheckinResponse> {
    return this.http.post<CheckinResponse>(
      `${this.apiUrl}/${request.orderId}/checkin`, 
      {
        seatIds: request.seatIds,
        staffId: request.staffId,
        staffName: request.staffName,
        eventId: request.eventId
      }
    ).pipe(
      tap(response => {
        // Cache the check-in result
        const cacheKey = `${request.orderId}_${Date.now()}`;
        this.recentCheckins.set(cacheKey, response);
        
        // Clean up old cache entries (keep last 10)
        if (this.recentCheckins.size > 10) {
          const oldestKey = Array.from(this.recentCheckins.keys())[0];
          this.recentCheckins.delete(oldestKey);
        }
        
        console.log('Check-in successful:', response);
      }),
      catchError(error => {
        console.error('Error during check-in:', error);
        throw error;
      })
    );
  }
}