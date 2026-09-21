import { Injectable } from '@angular/core';
import { environment } from '../../environments/environment';

const LEGACY_SERVER_URL_KEYS = ['serverApiUrl', 'serverApiUrlV2'];

@Injectable({
  providedIn: 'root'
})
export class ServerUrlService {
  getBaseUrl(): string {
    this.clearSavedServerUrls();

    const location = window.location;
    if (location.protocol.startsWith('http') && location.hostname && location.port === '8100') {
      return `${location.protocol}//${location.hostname}:3000`;
    }

    return this.normalizeUrl(environment.apiUrl);
  }

  getApiUrl(): string {
    return `${this.getBaseUrl()}/api`;
  }

  saveBaseUrl(url: string) {
    this.clearSavedServerUrls();
  }

  clearBaseUrl() {
    this.clearSavedServerUrls();
  }

  private clearSavedServerUrls() {
    for (const key of LEGACY_SERVER_URL_KEYS) {
      localStorage.removeItem(key);
    }
  }

  private normalizeUrl(url: string): string {
    let normalized = String(url || '').trim().replace(/\/+$/, '');

    if (normalized.endsWith('/api')) {
      normalized = normalized.slice(0, -4);
    }

    if (normalized && !/^https?:\/\//i.test(normalized)) {
      const isLocalAddress = /^(localhost|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[0-1])\.)/i.test(normalized);
      normalized = `${isLocalAddress ? 'http' : 'https'}://${normalized}`;
    }

    return normalized;
  }
}
