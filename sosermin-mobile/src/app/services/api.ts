import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
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
    return this.http.post<any>(`${this.apiUrl}/login`, credentials);
  }
}
