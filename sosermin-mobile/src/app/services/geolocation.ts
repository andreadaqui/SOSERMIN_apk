import { Injectable } from '@angular/core';
import { Geolocation } from '@capacitor/geolocation';

@Injectable({
  providedIn: 'root'
})
export class GeolocationService {

  constructor() { }

  async obtenerUbicacionActual() {
    try {
      const coordinates = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      return {
        latitud: coordinates.coords.latitude,
        longitud: coordinates.coords.longitude
      };
    } catch (error) {
      console.error('Error al obtener la geolocalización:', error);
      throw error;
    }
  }
}