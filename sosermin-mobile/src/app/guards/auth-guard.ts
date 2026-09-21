import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';

export const authGuard: CanActivateFn = (route, state) => {
  const router = inject(Router);
  
  // Verifica si el usuario ha iniciado sesión comprobando el almacenamiento local
  const sesionActiva = localStorage.getItem('rol') || localStorage.getItem('token');

  if (sesionActiva) {
    return true;
  } else {
    // Si no hay sesión, lo redirige de inmediato al login
    router.navigate(['/login']);
    return false;
  }
};