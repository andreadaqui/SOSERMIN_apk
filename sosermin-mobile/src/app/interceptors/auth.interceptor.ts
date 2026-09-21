import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Obtenemos el token almacenado en el estado de la aplicación
  const token = authService.getToken ? authService.getToken() : null;
  
  let clonedReq = req;
  if (token) {
    clonedReq = req.clone({
      setHeaders: { Authorization: `Bearer ${token}` }
    });
  }

  return next(clonedReq).pipe(
    catchError((error: HttpErrorResponse) => {
      // Manejo de error 401: No autorizado / Token vencido
      if (error.status === 401) {
        console.warn('Sesión expirada o no autorizada (401). Redirigiendo al login.');
        if (authService.logout) {
          authService.logout();
        }
        router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
      } 
      // Manejo de error 403: Prohibido / Sin permisos suficientes
      else if (error.status === 403) {
        console.warn('Acceso prohibido (403). No tienes privilegios para este recurso.');
        router.navigate(['/app/home']);
      }
      
      return throwError(() => error);
    })
  );
};