import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

@Component({
  selector: 'app-register',
  templateUrl: './register.page.html',
  styleUrls: ['./register.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent]
})
export class RegisterPage {
  nombre = '';
  cedula = '';
  email = '';
  password = '';
  rol = 'CLIENTE';
  errorMessage = '';

  private authService = inject(AuthService);
  private router = inject(Router);

  onRegister() {
    this.errorMessage = '';

    if (!this.nombre.trim() || !this.cedula.trim() || !this.password.trim()) {
      this.errorMessage = 'Nombre, cedula y contrasena son obligatorios.';
      return;
    }

    const payload = {
      nombre: this.nombre.trim(),
      cedula: this.cedula.trim(),
      usuario: this.cedula.trim(),
      email: this.email.trim(),
      password: this.password,
      rol: this.rol
    };

    this.authService.register(payload).subscribe({
      next: () => {
        this.router.navigateByUrl('/login', { replaceUrl: true });
      },
      error: (err: any) => {
        console.error('Error en el registro:', err);
        this.errorMessage = err?.error?.mensaje || err?.error?.message || 'No se pudo completar el registro.';
      }
    });
  }

  volverAlLogin() {
    this.router.navigateByUrl('/login');
  }
}
