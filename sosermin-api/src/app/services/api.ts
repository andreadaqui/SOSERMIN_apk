import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);
  
  // URL de tu backend corriendo en Next.js
  private apiUrl = 'http://localhost:3000/api'; 

  // Método de login (ya lo tienes funcionando)
  login(credentials: { email: string; pass: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  // Nuevo método: Obtener todas las incidencias (con token de seguridad)
  getIncidents(): Observable<any> {
    const token = localStorage.getItem('token') || '';
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.get(`${this.apiUrl}/incidents`, { headers });
  }

  // Nuevo método: Crear una incidencia (con token de seguridad)
  createIncident(payload: { title: string; description: string; severity: string }): Observable<any> {
    const token = localStorage.getItem('token') || '';
    const headers = { Authorization: `Bearer ${token}` };
    return this.http.post(`${this.apiUrl}/incidents`, payload, { headers });
  }
}