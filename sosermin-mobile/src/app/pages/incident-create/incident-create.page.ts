import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon, IonSpinner, AlertController } from '@ionic/angular/standalone';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { Router } from '@angular/router';
import { GeolocationService } from '../../services/geolocation';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { App } from '@capacitor/app';
import { ServerUrlService } from '../../services/server-url.service';
import { addIcons } from 'ionicons';
import { arrowBackOutline, cameraOutline, locationOutline } from 'ionicons/icons';

@Component({
  selector: 'app-incident-create',
  templateUrl: './incident-create.page.html',
  styleUrls: ['./incident-create.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon, IonSpinner, ReactiveFormsModule, HttpClientModule]
})
export class IncidentCreatePage {
  private fb = inject(FormBuilder);
  private http = inject(HttpClient);
  private router = inject(Router);
  private geolocationService = inject(GeolocationService);
  private alertCtrl = inject(AlertController);
  private serverUrl = inject(ServerUrlService);

  ubicacion: { latitud: number; longitud: number } | null = null;
  cargandoUbicacion: boolean = false;
  fotoBase64: string | null = null;

  incidentForm: FormGroup = this.fb.group({
    title: ['', [Validators.required, Validators.minLength(3)]],
    categoria: ['Seguridad', [Validators.required]],
    description: ['', [Validators.required, Validators.minLength(5)]],
    severity: ['Medium', [Validators.required]]
  });

  constructor() {
    addIcons({ arrowBackOutline, cameraOutline, locationOutline });
  }

  isInvalid(controlName: string): boolean {
    const control = this.incidentForm.get(controlName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  async capturarUbicacion() {
    this.cargandoUbicacion = true;
    try {
      const coords: any = await this.geolocationService.obtenerUbicacionActual();
      this.ubicacion = {
        latitud: coords.latitud,
        longitud: coords.longitud
      };
    } catch (error) {
      const alert = await this.alertCtrl.create({
        header: 'Permiso GPS restringido',
        message: 'No se obtuvo la ubicación. ¿Deseas abrir los ajustes del sistema para habilitarlo?',
        buttons: [
          { text: 'Abrir Ajustes', handler: () => console.log('Abrir ajustes') },
          { text: 'Cancelar', role: 'cancel' }
        ]
      });
      await alert.present();
    } finally {
      this.cargandoUbicacion = false;
    }
  }

  async tomarFoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 70,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Camera
      });
      if (image.base64String) {
        this.fotoBase64 = `data:image/jpeg;base64,${image.base64String}`;
      }
    } catch (err) {
      console.warn('Cámara cancelada o denegada:', err);
    }
  }

  volverAlHome() {
    this.router.navigate(['/home-client']);
  }

  onSubmit() {
    if (this.incidentForm.invalid) {
      this.incidentForm.markAllAsTouched();
      return;
    }

    const payload = {
      ...this.incidentForm.value,
      latitud: this.ubicacion?.latitud || null,
      longitud: this.ubicacion?.longitud || null,
      fotoEvidencia: this.fotoBase64,
      clienteId: localStorage.getItem('userId') || null
    };

    // Respaldo local offline-first
    const stored = JSON.parse(localStorage.getItem('offline_incidents') || '[]');
    stored.push(payload);
    localStorage.setItem('offline_incidents', JSON.stringify(stored));

    const backendUrl = `${this.serverUrl.getApiUrl()}/incidents`;
    const token = localStorage.getItem('token') || '';
    const headers = { Authorization: `Bearer ${token}` };

    this.http.post(backendUrl, payload, { headers }).subscribe({
      next: (response: any) => {
        console.log('Incidencia creada con éxito', response);
        this.router.navigate(['/home-client']);
      },
      error: (err: any) => {
        console.warn('Sin conexión backend, guardado local.', err);
        this.router.navigate(['/home-client']);
      }
    });
  }
}
