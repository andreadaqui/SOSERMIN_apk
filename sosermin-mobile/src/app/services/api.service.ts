import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ServerUrlService } from './server-url.service';

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private http = inject(HttpClient);
  private serverUrl = inject(ServerUrlService);

  private get apiUrl(): string {
    return this.serverUrl.getApiUrl();
  }

  login(credentials: { email: string; pass: string }): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials);
  }

  getIncidents(tecnicoId?: number): Observable<any> {
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const url = tecnicoId ? `${this.apiUrl}/incidents?tecnicoId=${tecnicoId}` : `${this.apiUrl}/incidents`;
    return this.http.get(url, { headers });
  }

  getIncidentsByClient(clienteId: number): Observable<any> {
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.get(`${this.apiUrl}/incidents?clienteId=${clienteId}`, { headers });
  }

  createIncident(incidentData: any): Observable<any> {
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.post(`${this.apiUrl}/incidents`, incidentData, { headers });
  }

  getUsersByRole(role?: string): Observable<any> {
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    const url = role ? `${this.apiUrl}/users?role=${role}` : `${this.apiUrl}/users`;
    return this.http.get(url, { headers });
  }

  createUser(userData: any): Observable<any> {
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.post(`${this.apiUrl}/users`, userData, { headers });
  }

  updateUser(id: number, userData: any): Observable<any> {
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.put(`${this.apiUrl}/users/${id}`, userData, { headers });
  }

  deleteUser(id: number): Observable<any> {
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.delete(`${this.apiUrl}/users/${id}`, { headers });
  }

  updateIncident(id: number, data: any): Observable<any> {
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.put(`${this.apiUrl}/incidents/${id}`, data, { headers });
  }

  deleteIncident(id: number): Observable<any> {
    const token = localStorage.getItem('token') || '';
    const headers = new HttpHeaders({ Authorization: `Bearer ${token}` });
    return this.http.delete(`${this.apiUrl}/incidents/${id}`, { headers });
  }
}
