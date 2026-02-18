// components/staff-login/staff-login.component.ts
import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { AuthService, LoginResponse } from '../../services/auth.service';


@Component({
  selector: 'app-staff-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatIconModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatSelectModule
  ],
  templateUrl: './staff-login.component.html',
  styleUrls: ['./staff-login.component.scss']
})
export class StaffLoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  public authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup;
  isLoading = signal(false);
  isLoadingEvents = signal(false);
  errorMessage = signal('');
  hidePassword = true;
  returnUrl: string;
  
  // For staff/event access
  showEventSelection = signal(false);
  accessibleEvents: any[] = [];
  selectedEvent: any = null;
  ticketData: any = null;
  currentUserId: string = '';

  constructor() {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', Validators.required]
    });

    // Get return URL from query params
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/scanner';
  }

  ngOnInit(): void {
    // Handle ticket data from QR code
    this.route.queryParams.subscribe(params => {
      if (params['orderId'] && params['ticketId'] && params['code']) {
        this.ticketData = {
          orderId: params['orderId'],
          ticketId: params['ticketId'],
          code: params['code']
        };
        localStorage.setItem('pending_ticket', JSON.stringify(this.ticketData));
        
        // Update return URL with ticket data for confirmation page
        if (this.returnUrl.includes('confirm')) {
          this.returnUrl = `/confirm?orderId=${this.ticketData.orderId}&ticketId=${this.ticketData.ticketId}&code=${this.ticketData.code}`;
        }
      } else {
        // Try to get from localStorage
        const stored = localStorage.getItem('pending_ticket');
        if (stored) {
          this.ticketData = JSON.parse(stored);
          
          // Update return URL with stored ticket data
          if (this.returnUrl.includes('confirm')) {
            this.returnUrl = `/confirm?orderId=${this.ticketData.orderId}&ticketId=${this.ticketData.ticketId}&code=${this.ticketData.code}`;
          }
        }
      }
    });

    // If already logged in, check event access and redirect
    if (this.authService.isAuthenticated()) {
      const user = this.authService.getCurrentUser();
      if (user) {
        this.currentUserId = user.id;
        this.fetchUserEvents(this.currentUserId);
      }
    }
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      // Mark all fields as touched to show errors
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { email, password } = this.loginForm.value;

    // Using the existing login method
    this.authService.login(email, password).subscribe({
      next: (response: LoginResponse) => {
        this.isLoading.set(false);
        
        // Store user ID
        this.currentUserId = response.userId;
        
        // Store staff info
        localStorage.setItem('staff_context', JSON.stringify({
          userId: response.userId,
          email: response.email,
          firstName: response.firstName,
          lastName: response.lastName,
          roles: response.roles
        }));

        // Check if user has staff role
        const user = this.authService.getCurrentUser();
        
        // Fetch user's accessible events using userId
        this.fetchUserEvents(response.userId);
      },
      error: (error) => {
        this.isLoading.set(false);
        this.errorMessage.set(error.error?.message || error.message || 'Login failed. Please check your credentials.');
        this.loginForm.get('password')?.reset();
        console.error('Login error:', error);
      }
    });
  }

  private fetchUserEvents(userId: string): void {
    this.isLoadingEvents.set(true);
    
    // Call the event service to get user's accessible events
    this.authService.getUserEvents(userId).subscribe({
      next: (events) => {
        this.isLoadingEvents.set(false);
        this.accessibleEvents = events;
        
        // Store events in localStorage
        localStorage.setItem('accessible_events', JSON.stringify(events));
        
        if (events.length === 0) {
          this.errorMessage.set('You do not have access to any events. Please contact administrator.');
        } else if (events.length === 1) {
          // Auto-select single event
          this.selectedEvent = events[0];
          localStorage.setItem('selected_event', JSON.stringify(this.selectedEvent));
          this.router.navigate([this.returnUrl]);
        } else {
          // Show event selection for multiple events
          this.showEventSelection.set(true);
        }
      },
      error: (error) => {
        this.isLoadingEvents.set(false);
        console.error('Error fetching user events:', error);
        this.errorMessage.set('Failed to load event access. Please try again.');
      }
    });
  }

  onEventSelected(event: any): void {
    this.selectedEvent = event;
    localStorage.setItem('selected_event', JSON.stringify(this.selectedEvent));
    this.router.navigate([this.returnUrl]);
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  get f() {
    return this.loginForm.controls;
  }
}