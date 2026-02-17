// interceptors/auth.interceptor.ts
import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Clone the request and add the authorization header
  const authReq = req.clone({
    headers: req.headers.set('Authorization', `Bearer ${authService.getToken()}`)
  });
  
  return next(authReq);
};