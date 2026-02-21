// components/ticket-confirm/ticket-confirm.component.ts
import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TicketService } from '../../services/ticket.service';
import { AuthService } from '../../services/auth.service';
import { CheckinResponse, CheckinResult, Order, OrderSeatDto } from '../../core/models/order.model';

@Component({
  selector: 'app-ticket-confirm',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    MatCardModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDividerModule,
    MatCheckboxModule,
    FormsModule,
    DatePipe
  ],
  templateUrl: './ticket-confirm.component.html',
  styleUrls: ['./ticket-confirm.component.scss']
})
export class TicketConfirmComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ticketService = inject(TicketService);
  private authService = inject(AuthService);

  orderData = signal<Order | null>(null);
  isLoading = signal(true);
  isCheckingIn = signal(false);
  errorMessage = signal('');
  success = signal(false);
  checkinResult = signal<{ checkedInCount: number; totalSelected: number } | null>(null);

  // For partial check-in - using seatId (not the entity ID)
  selectedSeats = signal<Set<string>>(new Set<string>());
  checkInMode = signal<'all' | 'partial'>('all');

  async ngOnInit() {
    this.route.queryParams.subscribe(async params => {
      if (params['orderId'] && params['ticketId'] && params['code']) {
        await this.loadOrderDetails(params['orderId']);
      } else {
        const stored = localStorage.getItem('pending_ticket');
        if (stored) {
          const ticketData = JSON.parse(stored);
          await this.loadOrderDetails(ticketData.orderId);
        } else {
          this.errorMessage.set('No ticket data provided');
          this.isLoading.set(false);
        }
      }
    });
  }

  async loadOrderDetails(orderId: string): Promise<void> {
    try {
      this.ticketService.getOrder(orderId).subscribe({
        next: (order: Order) => {

          // Get event data from localStorage
          const eventDataStr = localStorage.getItem('selected_event');
          let currentEventId: string | null = null;
          
          if (eventDataStr) {
            try {
              const eventData = JSON.parse(eventDataStr);
              currentEventId = eventData.eventId;
            } catch (error) {
              console.error('Error parsing event data from localStorage:', error);
            }
          }

          // Validate event match
          if (currentEventId && order.eventId !== currentEventId) {
            this.errorMessage.set('This ticket is for a different event');
            this.success.set(false);
          }

          this.orderData.set(order);
          
          // Don't auto-select any seats
          this.selectedSeats.set(new Set<string>());
          this.isLoading.set(false);
        },
        error: (error: any) => {
          console.error('Error loading order:', error);
          this.errorMessage.set('Failed to load ticket details');
          this.isLoading.set(false);
        }
      });
    } catch (error: any) {
      console.error('Error loading order:', error);
      this.errorMessage.set('Failed to load ticket details');
      this.isLoading.set(false);
    }
  }

  toggleSeatSelection(seatId: string) {
    const current = new Set<string>(this.selectedSeats());
    if (current.has(seatId)) {
      current.delete(seatId);
    } else {
      current.add(seatId);
    }
    this.selectedSeats.set(current);
    
    // Update mode based on selection
    const totalSeats = this.orderData()?.seats?.length || 0;
    if (current.size === totalSeats) {
      this.checkInMode.set('all');
    } else if (current.size > 0) {
      this.checkInMode.set('partial');
    }
  }

  selectAllSeats() {
    const order = this.orderData();
    if (order?.seats) {
      // Only select seats that are NOT checked in
      const availableSeats = order.seats
        .filter(seat => !seat.isCheckedIn)
        .map(seat => seat.seatId);
      
      const allSeatIds = new Set<string>(availableSeats);
      this.selectedSeats.set(allSeatIds);
      this.checkInMode.set('all');
    }
  }

  deselectAllSeats() {
    this.selectedSeats.set(new Set<string>());
    this.checkInMode.set('partial');
  }

  confirmCheckin() {
    if (this.selectedSeats().size === 0) {
      this.errorMessage.set('Please select at least one seat to check in');
      return;
    }

    this.isCheckingIn.set(true);
    this.errorMessage.set('');
    this.checkinResult.set(null);

    const staffInfo = this.authService.getCurrentUser();
    const order = this.orderData();
    
    if (!order) {
      this.errorMessage.set('Order data not found');
      this.isCheckingIn.set(false);
      return;
    }

     // Get event data from localStorage
    const eventDataStr = localStorage.getItem('selected_event');
    let eventId = order.eventId; // Default to order's eventId
    
    if (eventDataStr) {
      try {
        const eventData = JSON.parse(eventDataStr);
        eventId = eventData.eventId;
        console.log('Using event from localStorage:', eventData.eventName);
      } catch (error) {
        console.error('Error parsing event data from localStorage:', error);
      }
    }


    // Get the seat IDs that are selected
    const selectedSeatIds = Array.from(this.selectedSeats());

    this.ticketService.confirmCheckin({
      orderId: order.orderId,
      seatIds: selectedSeatIds,
      staffId: staffInfo?.id ?? "",
      staffName: staffInfo?.firstName ?? "",
      eventId: eventId,
    }).subscribe({
      next: (response: CheckinResponse) => {
        if (response.success) {
          // Update local seat status
          const updatedOrder = { ...order };
          updatedOrder.seats = order.seats.map(seat => ({
            ...seat,
            isCheckedIn: selectedSeatIds.includes(seat.seatId) ? true : seat.isCheckedIn
          }));
          this.orderData.set(updatedOrder);

          // Clear selection
          this.selectedSeats.set(new Set<string>());

          // Show detailed success message
          if (response.data) {
            const { checkedInCount, totalSelected, results } = response.data;
            this.checkinResult.set({ checkedInCount, totalSelected });
            
            const failedCount = results.filter((r: CheckinResult) => !r.success).length;
            
            if (failedCount === 0) {
              // All selected seats checked in successfully
              this.success.set(true);
              this.errorMessage.set(''); // Clear any error messages
              console.log(`✅ Successfully checked in ${checkedInCount} of ${totalSelected} seats`);
            } else {
              // Some seats failed
              const failedSeats = results
                .filter((r: CheckinResult) => !r.success)
                .map((r: CheckinResult) => r.seatNumber)
                .join(', ');
              this.errorMessage.set(`Failed to check in seats: ${failedSeats}`);
              this.success.set(true); // Still show success for the ones that worked
            }
          } else {
            // Simple success message if no detailed data
            this.success.set(true);
          }
        } else {
          // API returned success: false
          this.errorMessage.set(response.message || 'Check-in failed');
          this.isCheckingIn.set(false);
        }
      },
      error: (error: any) => {
        console.error('Check-in error:', error);
        
        // Extract error message
        let errorMsg = 'Check-in failed';
        if (error.error?.message) {
          errorMsg = error.error.message;
        } else if (error.message) {
          errorMsg = error.message;
        } else if (typeof error.error === 'string') {
          errorMsg = error.error;
        }
        
        this.errorMessage.set(errorMsg);
        this.isCheckingIn.set(false);
      }
    });
  }

  scanAnother() {
    this.router.navigate(['/scanner']);
  }

  getCheckedInCount(): number {
    return this.orderData()?.seats?.filter(seat => seat.isCheckedIn).length || 0;
  }

  getSelectedCount(): number {
    return this.selectedSeats().size;
  }

  getRemainingCount(): number {
    const total = this.orderData()?.seats?.length || 0;
    const checkedIn = this.getCheckedInCount();
    return total - checkedIn;
  }

  areAllCheckedIn(): boolean {
    return this.getRemainingCount() === 0;
  }

  isSeatCheckedIn(seat: OrderSeatDto): boolean {
    return seat.isCheckedIn === true;
  }

  getCheckedInSeats(): OrderSeatDto[] {
    return this.orderData()?.seats?.filter(seat => seat.isCheckedIn) || [];
  }

  private getDeviceId(): string {
    let deviceId = localStorage.getItem('device_id');
    if (!deviceId) {
      deviceId = 'device_' + Math.random().toString(36).substr(2, 9);
      localStorage.setItem('device_id', deviceId);
    }
    return deviceId;
  }

  ngOnDestroy() {
    localStorage.removeItem('pending_ticket');
  }
}