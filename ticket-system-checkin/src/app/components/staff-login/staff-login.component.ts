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
import { AuthService } from '../../services/auth.service';

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
    MatProgressSpinnerModule
  ],
  templateUrl: './staff-login.component.html',
  styleUrls: ['./staff-login.component.scss']
})
export class StaffLoginComponent implements OnInit {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loginForm: FormGroup;
  isLoading = signal(false);
  errorMessage = signal('');
  redirectPath = '/scanner';
  ticketData: any = null;

  constructor() {
    this.loginForm = this.fb.group({
      staffId: ['', [Validators.required]],
      pin: ['', [Validators.required, Validators.minLength(4)]],
      eventCode: ['', [Validators.required]]
    });
  }

  async ngOnInit() {
    // Check for redirect parameter and ticket data
    this.route.queryParams.subscribe(params => {
      if (params['redirect']) {
        this.redirectPath = `/${params['redirect']}`;
      }

      // Check if we have ticket data from QR code
      if (params['orderId'] && params['ticketId'] && params['code']) {
        this.ticketData = {
          orderId: params['orderId'],
          ticketId: params['ticketId'],
          code: params['code']
        };
        localStorage.setItem('pending_ticket', JSON.stringify(this.ticketData));
      } else {
        // Try to get from localStorage
        const stored = localStorage.getItem('pending_ticket');
        if (stored) {
          this.ticketData = JSON.parse(stored);
        }
      }

      // Build redirect URL with ticket data
      if (this.ticketData && this.redirectPath === '/confirm') {
        this.redirectPath += `?orderId=${this.ticketData.orderId}&ticketId=${this.ticketData.ticketId}&code=${this.ticketData.code}`;
      }
    });

    // Auto-redirect if already authenticated
    if (this.authService.isAuthenticated()) {
      this.router.navigate([this.redirectPath]);
    }
  }

  async onSubmit() {
    if (this.loginForm.invalid) {
      Object.keys(this.loginForm.controls).forEach(key => {
        this.loginForm.get(key)?.markAsTouched();
      });
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set('');

    const { staffId, pin, eventCode } = this.loginForm.value;

    try {
      const success = await this.authService.login(staffId, pin, eventCode);

      if (success) {
        this.router.navigate([this.redirectPath]);
      } else {
        this.errorMessage.set('Invalid credentials');
        this.loginForm.get('pin')?.reset();
      }
    } catch (error) {
      this.errorMessage.set('Login failed. Please try again.');
      console.error('Login error:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  get f() {
    return this.loginForm.controls;
  }
}