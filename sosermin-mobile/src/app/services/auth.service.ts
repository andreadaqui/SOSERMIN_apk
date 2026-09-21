import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ServerUrlService } from './server-url.service';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private http = inject(HttpClient);
  private serverUrl = inject(ServerUrlService);

  private get apiUrl(): string {
    return this.serverUrl.getApiUrl();
  }

  login(credentials: { email?: string; usuario?: string; password?: string; pass?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, {
      usuario: credentials.email || credentials.usuario,
      password: credentials.password || credentials.pass
    });
  }

  register(userData: { nombre?: string; cedula?: string; usuario?: string; email?: string; password?: string; pass?: string; rol?: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, {
      nombre: userData.nombre || 'Nuevo Usuario',
      cedula: userData.cedula || '',
      email: userData.email || '',
      usuario: userData.email || userData.usuario || userData.cedula,
      password: userData.password || userData.pass,
      rol: userData.rol || 'CLIENTE'
    });
  }

  logout() {
    localStorage.removeItem('token');
  }

  getToken(): string | null {
    return localStorage.getItem('token');
  }

  isLoggedIn(): boolean {
    return !!this.getToken();
  }
}
