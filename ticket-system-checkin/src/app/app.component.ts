// app.component.ts
import { Component, inject, OnInit } from '@angular/core';
import { NavigationEnd, Router, RouterOutlet } from '@angular/router';
import { MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { CommonModule } from '@angular/common';
import { AuthService } from './services/auth.service';
import { filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule,
    RouterOutlet,
    MatSnackBarModule,
    MatProgressSpinnerModule],
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  private router = inject(Router);
  private authService = inject(AuthService);
  
  isLoading = false;
  isScannerPage = false;
  currentRoute = '';

  ngOnInit() {
    // Track route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.urlAfterRedirects;
        this.isScannerPage = this.currentRoute.includes('/scanner');
        
        // Scroll to top on route change
        window.scrollTo(0, 0);
      });
    
    // Check authentication status on app start
    this.checkAuthStatus();
    
    // Handle page visibility changes
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        // App came back to foreground - refresh session if needed
        this.authService.refreshSession();
      }
    });
  }
  
  private checkAuthStatus() {
    // You can add logic here to check authentication on app load
    // For example: Check for stored session, validate token, etc.
    const isAuthenticated = this.authService.isAuthenticated();
    
    if (!isAuthenticated && this.currentRoute !== '/login') {
      // If not authenticated and not on login page, redirect to login
      // Note: This will be handled by the AuthGuard for protected routes
    }
  }
}