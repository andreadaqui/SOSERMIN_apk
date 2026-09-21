import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonBadge, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonTextarea, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  cameraOutline,
  checkmarkCircleOutline,
  eyeOutline,
  imageOutline,
  locateOutline,
  logOutOutline,
  pauseOutline,
  playOutline,
  refreshOutline
} from 'ionicons/icons';
import { Camera, CameraResultType, CameraSource } from '@capacitor/camera';
import { Geolocation } from '@capacitor/geolocation';

type TechTab = 'activas' | 'historial';
type SortMode = 'PRIORIDAD' | 'FECHA' | 'ESTADO';

@Component({
  selector: 'app-tech-dashboard',
  templateUrl: './tech-dashboard.component.html',
  styleUrls: ['./tech-dashboard.component.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonList, IonItem, IonLabel, IonBadge, IonButton, IonIcon, IonButtons, IonTextarea]
})
export class TechDashboardComponent implements OnInit {
  activeTab: TechTab = 'activas';
  incidents: any[] = [];
  userId: number | null = null;

  searchTerm = '';
  statusFilter = 'TODOS';
  priorityFilter = 'TODOS';
  sortMode: SortMode = 'PRIORIDAD';
  selectedIncidentId: number | null = null;
  finalizingIncidentId: number | null = null;
  message = '';

  comentarios = '';
  fotoAntesBase64: string | null = null;
  fotoCierreBase64: string | null = null;

  private apiService = inject(ApiService);
  private router = inject(Router);

  constructor() {
    addIcons({
      cameraOutline,
      checkmarkCircleOutline,
      eyeOutline,
      imageOutline,
      locateOutline,
      logOutOutline,
      pauseOutline,
      playOutline,
      refreshOutline
    });
  }

  ngOnInit() {
    const id = localStorage.getItem('userId');
    if (id) {
      this.userId = parseInt(id, 10);
    }
    this.loadIncidents();
  }

  ionViewWillEnter() {
    this.loadIncidents();
  }

  loadIncidents() {
    if (!this.userId) {
      this.message = 'No se encontro el usuario tecnico en la sesion.';
      return;
    }

    this.apiService.getIncidents(this.userId).subscribe({
      next: (data) => {
        this.incidents = data || [];
      },
      error: (err) => {
        console.error('Error loading incidents', err);
        this.message = 'No se pudieron cargar tus tareas.';
      }
    });
  }

  setTab(tab: TechTab) {
    this.activeTab = tab;
    this.selectedIncidentId = null;
    this.cancelarFinalizar();
  }

  get activeIncidents() {
    return this.applyTaskFilters(
      this.incidents.filter((incident) => ['Asignado', 'En Proceso', 'Pausado'].includes(this.getState(incident)))
    );
  }

  get historyIncidents() {
    return this.applyTaskFilters(
      this.incidents.filter((incident) => ['Finalizado', 'Cancelado'].includes(this.getState(incident)))
    );
  }

  get pendingCount() {
    return this.incidents.filter(i => this.getState(i) === 'Asignado').length;
  }

  get inProcessCount() {
    return this.incidents.filter(i => this.getState(i) === 'En Proceso').length;
  }

  get pausedCount() {
    return this.incidents.filter(i => this.getState(i) === 'Pausado').length;
  }

  get finishedCount() {
    return this.incidents.filter(i => this.getState(i) === 'Finalizado').length;
  }

  toggleDetail(incident: any) {
    this.selectedIncidentId = this.selectedIncidentId === incident.id ? null : incident.id;
    if (this.selectedIncidentId !== incident.id) {
      this.cancelarFinalizar();
    }
  }

  async capturarFotoAntes(incident: any) {
    const photo = await this.takePhoto();
    if (!photo) return;

    this.fotoAntesBase64 = photo;
    incident.fotoAntesTecnicoUrl = photo;
    this.apiService.updateIncident(incident.id, { fotoAntesTecnicoUrl: photo }).subscribe({
      next: () => {
        this.message = 'Evidencia antes guardada.';
        this.loadIncidents();
      },
      error: (err) => {
        console.error('Error saving before photo', err);
        this.message = 'No se pudo guardar la evidencia antes.';
      }
    });
  }

  async iniciarTrabajo(incident: any) {
    const beforePhoto = incident.fotoAntesTecnicoUrl || this.fotoAntesBase64;
    if (!beforePhoto) {
      this.message = 'Toma una foto antes de iniciar el trabajo.';
      this.selectedIncidentId = incident.id;
      return;
    }

    const coords = await this.getCurrentCoordinates();
    const payload: any = {
      estado: 'En Proceso',
      fotoAntesTecnicoUrl: beforePhoto
    };

    if (coords) {
      payload.latitudInicio = coords.latitude;
      payload.longitudInicio = coords.longitude;
    }

    this.apiService.updateIncident(incident.id, payload).subscribe({
      next: () => {
        this.message = coords
          ? 'Trabajo iniciado con GPS registrado.'
          : 'Trabajo iniciado. No se pudo registrar GPS.';
        this.fotoAntesBase64 = null;
        this.loadIncidents();
      },
      error: (err) => {
        console.error('Error starting work', err);
        this.message = err?.error?.mensaje || 'No se pudo iniciar el trabajo.';
      }
    });
  }

  pausarTrabajo(incident: any) {
    this.apiService.updateIncident(incident.id, { estado: 'Pausado' }).subscribe({
      next: () => {
        this.message = 'Trabajo pausado.';
        this.loadIncidents();
      },
      error: (err) => {
        console.error('Error pausing work', err);
        this.message = 'No se pudo pausar el trabajo.';
      }
    });
  }

  reanudarTrabajo(incident: any) {
    this.apiService.updateIncident(incident.id, { estado: 'En Proceso' }).subscribe({
      next: () => {
        this.message = 'Trabajo reanudado.';
        this.loadIncidents();
      },
      error: (err) => {
        console.error('Error resuming work', err);
        this.message = 'No se pudo reanudar el trabajo.';
      }
    });
  }

  prepararFinalizar(incident: any) {
    this.selectedIncidentId = incident.id;
    this.finalizingIncidentId = incident.id;
    this.comentarios = incident.comentarios || '';
    this.fotoCierreBase64 = incident.fotoResolucionUrl || null;
  }

  cancelarFinalizar() {
    this.finalizingIncidentId = null;
    this.comentarios = '';
    this.fotoCierreBase64 = null;
  }

  async tomarFotoCierre() {
    const photo = await this.takePhoto();
    if (photo) {
      this.fotoCierreBase64 = photo;
    }
  }

  async finalizarTrabajo() {
    if (!this.finalizingIncidentId) return;

    if (!this.comentarios.trim() || !this.fotoCierreBase64) {
      this.message = 'Para finalizar debes registrar informe y foto de cierre.';
      return;
    }

    const coords = await this.getCurrentCoordinates();
    const payload: any = {
      estado: 'Finalizado',
      comentarios: this.comentarios.trim(),
      fotoResolucionUrl: this.fotoCierreBase64
    };

    if (coords) {
      payload.latitudCierre = coords.latitude;
      payload.longitudCierre = coords.longitude;
    }

    this.apiService.updateIncident(this.finalizingIncidentId, payload).subscribe({
      next: () => {
        this.message = coords
          ? 'Trabajo finalizado con GPS de cierre.'
          : 'Trabajo finalizado. No se pudo registrar GPS de cierre.';
        this.cancelarFinalizar();
        this.selectedIncidentId = null;
        this.loadIncidents();
      },
      error: (err) => {
        console.error('Error finishing work', err);
        this.message = err?.error?.mensaje || 'No se pudo finalizar el trabajo.';
      }
    });
  }

  openMap(lat?: number, lng?: number) {
    if (lat === undefined || lat === null || lng === undefined || lng === null) {
      this.message = 'Esta tarea no tiene coordenadas registradas.';
      return;
    }

    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  }

  getStatusColor(estado: string): string {
    switch (estado) {
      case 'Asignado': return 'primary';
      case 'En Proceso': return 'tertiary';
      case 'Pausado': return 'warning';
      case 'Finalizado': return 'success';
      case 'Cancelado': return 'danger';
      default: return 'medium';
    }
  }

  getPriorityLabel(priority: string) {
    switch (priority) {
      case 'High': return 'Alta';
      case 'Low': return 'Baja';
      default: return 'Media';
    }
  }

  getPriorityRank(priority: string) {
    switch (priority) {
      case 'High': return 1;
      case 'Medium': return 2;
      case 'Low': return 3;
      default: return 4;
    }
  }

  getState(incident: any) {
    return incident.estado || 'Asignado';
  }

  formatHours(start?: string, end?: string) {
    if (!start || !end) return 'Sin dato';

    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();
    if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime < startTime) {
      return 'Sin dato';
    }

    const hours = (endTime - startTime) / 36e5;
    return hours < 1 ? `${Math.round(hours * 60)} min` : `${hours.toFixed(1)} h`;
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  private applyTaskFilters(source: any[]) {
    const term = this.searchTerm.trim().toLowerCase();

    return source
      .filter((incident) => {
        const matchesSearch = !term ||
          String(incident.id || '').includes(term) ||
          String(incident.title || '').toLowerCase().includes(term) ||
          String(incident.description || '').toLowerCase().includes(term) ||
          String(incident.clienteNombre || '').toLowerCase().includes(term);
        const matchesStatus = this.statusFilter === 'TODOS' || this.getState(incident) === this.statusFilter;
        const matchesPriority = this.priorityFilter === 'TODOS' || String(incident.severity || 'Medium') === this.priorityFilter;

        return matchesSearch && matchesStatus && matchesPriority;
      })
      .sort((a, b) => {
        if (this.sortMode === 'PRIORIDAD') {
          const rankDiff = this.getPriorityRank(a.severity) - this.getPriorityRank(b.severity);
          if (rankDiff !== 0) return rankDiff;
        }

        if (this.sortMode === 'ESTADO') {
          const stateDiff = this.getState(a).localeCompare(this.getState(b));
          if (stateDiff !== 0) return stateDiff;
        }

        return new Date(b.fecha || 0).getTime() - new Date(a.fecha || 0).getTime();
      });
  }

  private async takePhoto() {
    try {
      const image = await Camera.getPhoto({
        quality: 70,
        allowEditing: false,
        resultType: CameraResultType.Base64,
        source: CameraSource.Prompt
      });

      return `data:image/jpeg;base64,${image.base64String}`;
    } catch (error) {
      console.error('Error taking photo', error);
      this.message = 'No se capturo ninguna foto.';
      return null;
    }
  }

  private async getCurrentCoordinates() {
    try {
      const position = await Geolocation.getCurrentPosition({
        enableHighAccuracy: true,
        timeout: 10000
      });

      return {
        latitude: position.coords.latitude,
        longitude: position.coords.longitude
      };
    } catch (error) {
      console.error('Error getting location', error);
      return null;
    }
  }
}
