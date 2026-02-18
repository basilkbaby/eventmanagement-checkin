// app.routes.ts
import { Routes } from '@angular/router';
import { AuthGuard } from './guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'scanner',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./components/staff-login/staff-login.component')
      .then(m => m.StaffLoginComponent)
  },
  {
    path: 'scanner',
    loadComponent: () => import('./components/scanner/scanner.component')
      .then(m => m.ScannerComponent),
    //canActivate: [AuthGuard]
  },
  {
    path: 'confirm',
    loadComponent: () => import('./components/ticket-confirm/ticket-confirm.component')
      .then(m => m.TicketConfirmComponent),
    //canActivate: [AuthGuard]
  },
//   {
//     path: 'manual',
//     loadComponent: () => import('./components/manual-entry/manual-entry.component')
//       .then(m => m.ManualEntryComponent),
//     canActivate: [AuthGuard]
//   },
//   {
//     path: 'dashboard',
//     loadComponent: () => import('./components/dashboard/dashboard.component')
//       .then(m => m.DashboardComponent),
//     canActivate: [AuthGuard]
//   },
//   {
//     path: 'error',
//     loadComponent: () => import('./components/error/error.component')
//       .then(m => m.ErrorComponent)
//   },
  {
    path: '**',
    redirectTo: 'login'
  }
];