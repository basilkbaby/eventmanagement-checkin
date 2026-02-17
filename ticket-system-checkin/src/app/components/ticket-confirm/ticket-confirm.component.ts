// components/ticket-confirm/ticket-confirm.component.ts
import { Component, OnInit, OnDestroy, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDividerModule } from '@angular/material/divider';
import { DatePipe } from '@angular/common';
import { TicketService } from '../../services/ticket.service';
import { CheckinService } from '../../services/checkin.service';
import { AuthService } from '../../services/auth.service';

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
    DatePipe
  ],
  templateUrl: './ticket-confirm.component.html',
  styleUrls: ['./ticket-confirm.component.scss']
})
export class TicketConfirmComponent implements OnInit, OnDestroy {
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private ticketService = inject(TicketService);
  private checkinService = inject(CheckinService);
  private authService = inject(AuthService);

  ticketData = signal<any>(null);
  ticketDetails = signal<any>(null);
  isLoading = signal(true);
  isCheckingIn = signal(false);
  errorMessage = signal('');
  success = signal(false);

  async ngOnInit() {
    this.route.queryParams.subscribe(async params => {
      if (params['orderId'] && params['ticketId'] && params['code']) {
        this.ticketData.set(params);
        await this.verifyTicket();
      } else {
        const stored = localStorage.getItem('pending_ticket');
        if (stored) {
          this.ticketData.set(JSON.parse(stored));
          await this.verifyTicket();
        } else {
          this.errorMessage.set('No ticket data provided');
          this.isLoading.set(false);
        }
      }
    });
  }

  async verifyTicket() {
    try {
      this.isLoading.set(true);
      this.errorMessage.set('');

      const data = this.ticketData();
      const result = await this.ticketService.verifyTicket(
        data.ticketId,
        data.code,
        data.orderId
      );

      if (result.valid) {
        this.ticketDetails.set(result.ticket);

        if (result.ticket.checkedIn) {
          this.errorMessage.set(`Already checked in at ${new Date(result.ticket.checkedInAt).toLocaleTimeString()}`);
        }
      } else {
        this.errorMessage.set(result.error || 'Invalid ticket');
      }
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Verification failed');
      console.error('Verification error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  async confirmCheckin() {
    const details = this.ticketDetails();
    if (!details || details.checkedIn) {
      return;
    }

    try {
      this.isCheckingIn.set(true);
      this.errorMessage.set('');

      const staffInfo = this.authService.getCurrentStaff();

      const result = await this.checkinService.confirmCheckin({
        ticketId: details.id,
        staffId: staffInfo.id ?? "",
        staffName: staffInfo.name ?? "",
        eventId: details.eventId,
        deviceId: this.getDeviceId()
      });

      if (result.success) {
        this.success.set(true);
        
        // Update ticket details
        this.ticketDetails.update(current => ({
          ...current,
          checkedIn: true,
          checkedInAt: new Date().toISOString()
        }));

        // Clear stored ticket data
        localStorage.removeItem('pending_ticket');

        // Auto-return to scanner after delay
        setTimeout(() => {
          this.router.navigate(['/scanner']);
        }, 3000);
      }
    } catch (error: any) {
      this.errorMessage.set(error.message || 'Check-in failed');
    } finally {
      this.isCheckingIn.set(false);
    }
  }

  scanAnother() {
    this.router.navigate(['/scanner']);
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