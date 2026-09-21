import { Component } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from '../../services/auth.service'; // Asegúrate que la ruta a tu auth.service sea correcta

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
})
export class LoginPage {
  email = '';
  password = '';
  errorMessage = '';

  constructor(private authService: AuthService, private router: Router) {}

  onLogin() {
    this.errorMessage = '';
    
    const credentials = {
      usuario: this.email,
      password: this.password
    };

    this.authService.login(credentials).subscribe({
      next: (res: any) => {
        console.log('Respuesta exitosa del servidor:', res);
        
        if (res && res.token) {
          localStorage.setItem('token', res.token);
          
          // Asignación de rol con respaldo si el servidor no lo manda
          const rolAsignado = (res.usuario && res.usuario.rol) ? res.usuario.rol : 'administrativo';
          localStorage.setItem('rol', rolAsignado);

          this.router.navigateByUrl('/home', { replaceUrl: true });
        } else {
          this.errorMessage = 'El servidor no devolvió un token.';
        }
      },
      error: (err) => {
        console.error('Error en el login:', err);
        this.errorMessage = 'Usuario o contraseña incorrectos.';
      }
    });
  }

  irAlRegistro() {
    this.router.navigateByUrl('/register'); // Ajusta la ruta si es distinta en tu proyecto
  }

  volverAlWelcome() {
    this.router.navigateByUrl('/welcome'); // Ajusta la ruta si es distinta en tu proyecto
  }
}