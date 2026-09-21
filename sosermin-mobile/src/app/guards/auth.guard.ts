import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service'; // Ajusta la ruta de tu servicio si es necesario

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isAuthenticated()) {
    return true;
  } else {
    // Si no está autenticado, lo manda al login y guarda la URL a la que quería entrar
    return router.createUrlTree(['/login'], { 
      queryParams: { returnUrl: state.url } 
    });
  }
};