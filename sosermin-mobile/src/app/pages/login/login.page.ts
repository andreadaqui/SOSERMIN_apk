import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, NavController } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { timeout } from 'rxjs';
import { addIcons } from 'ionicons';
import { eyeOffOutline, eyeOutline } from 'ionicons/icons';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent]
})
export class LoginPage {
  usuario = '';
  password = '';
  errorMessage = '';
  isLoading = false;
  showPassword = false;

  private authService = inject(AuthService);
  private router = inject(Router);
  private navCtrl = inject(NavController);

  constructor() {
    addIcons({ eyeOutline, eyeOffOutline });
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  private normalizeRole(role: string): 'ADMIN' | 'TECNICO' | 'CLIENTE' {
    const normalized = role
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();

    if (normalized === 'ADMIN' || normalized === 'ADMINISTRADOR' || normalized === 'SUPERVISOR') {
      return 'ADMIN';
    }

    if (normalized === 'TECNICO' || normalized === 'PERSONAL DE CAMPO') {
      return 'TECNICO';
    }

    return 'CLIENTE';
  }

  onLogin() {
    if (this.isLoading) {
      return;
    }

    this.errorMessage = '';

    if (!this.usuario.trim() || !this.password.trim()) {
      this.errorMessage = 'Ingresa tu cedula y contrasena.';
      return;
    }

    this.isLoading = true;

    this.authService.login({
      usuario: this.usuario.trim(),
      password: this.password
    }).pipe(timeout(30000)).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const token = res?.token || res?.access_token || res?.accessToken;

        if (!token) {
          this.errorMessage = 'No se recibio token de acceso.';
          return;
        }

        const rol = this.normalizeRole(res?.usuario?.rol || res?.rol || res?.user?.rol || 'CLIENTE');
        const userId = res?.usuario?.id || res?.user?.id || res?.id;
        const userName = res?.usuario?.nombre || res?.user?.nombre || res?.nombre;
        
        localStorage.setItem('token', token);
        localStorage.setItem('rol', rol);
        if (userId) {
          localStorage.setItem('userId', userId.toString());
        }
        if (userName) {
          localStorage.setItem('userName', userName);
        }

        let targetRoute = '/home-client';
        if (rol === 'ADMIN') {
          targetRoute = '/admin-dashboard';
        } else if (rol === 'TECNICO') {
          targetRoute = '/tech-dashboard';
        }

        this.navCtrl.navigateRoot(targetRoute, {
          animated: true,
          animationDirection: 'forward'
        });
      },
      error: (error) => {
        this.isLoading = false;

        if (error.name === 'TimeoutError') {
          this.errorMessage = 'El servidor tarda demasiado en responder. Revisa tu conexion e intenta de nuevo.';
          return;
        }

        if (error.status === 0) {
          this.errorMessage = 'No se pudo conectar con el servidor.';
          return;
        }

        if (error.status === 401) {
          this.errorMessage = 'Cedula o contrasena incorrectos.';
          return;
        }

        this.errorMessage = error?.error?.mensaje || `Error del servidor (${error.status}).`;
      }
    });
  }

  irAlRegistro() {
    this.router.navigate(['/register']);
  }
}
