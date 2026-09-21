import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonBadge, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { ApiService } from '../../services/api.service';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  addOutline,
  cameraOutline,
  checkmarkCircleOutline,
  chatboxEllipsesOutline,
  constructOutline,
  eyeOutline,
  imageOutline,
  locateOutline,
  logOutOutline,
  refreshOutline,
  starOutline,
  timeOutline
} from 'ionicons/icons';

type ClientTab = 'activas' | 'historial' | 'alertas';

@Component({
  selector: 'app-home-client',
  templateUrl: './home-client.component.html',
  styleUrls: ['./home-client.component.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonList, IonItem, IonLabel, IonBadge, IonButton, IonIcon, IonButtons]
})
export class HomeClientComponent implements OnInit {
  activeTab: ClientTab = 'activas';
  incidents: any[] = [];
  userId: number | null = null;
  userName = 'Cliente';

  searchTerm = '';
  statusFilter = 'TODOS';
  priorityFilter = 'TODOS';
  selectedIncidentId: number | null = null;
  message = '';
  clientComment = '';
  selectedRating = 0;

  private apiService = inject(ApiService);
  private router = inject(Router);

  constructor() {
    addIcons({
      addOutline,
      cameraOutline,
      checkmarkCircleOutline,
      chatboxEllipsesOutline,
      constructOutline,
      eyeOutline,
      imageOutline,
      locateOutline,
      logOutOutline,
      refreshOutline,
      starOutline,
      timeOutline
    });
  }

  ngOnInit() {
    const id = localStorage.getItem('userId');
    this.userName = localStorage.getItem('userName') || 'Cliente';
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
      this.message = 'No se encontro el cliente en la sesion.';
      return;
    }

    this.apiService.getIncidentsByClient(this.userId).subscribe({
      next: (data) => {
        this.incidents = data || [];
      },
      error: (err) => {
        console.error('Error loading client incidents', err);
        this.message = 'No se pudieron cargar tus solicitudes.';
      }
    });
  }

  setTab(tab: ClientTab) {
    this.activeTab = tab;
    this.selectedIncidentId = null;
  }

  get activeIncidents() {
    return this.applyFilters(
      this.incidents.filter((incident) => !['Finalizado', 'Cancelado'].includes(this.getState(incident)))
    );
  }

  get historyIncidents() {
    return this.applyFilters(
      this.incidents.filter((incident) => ['Finalizado', 'Cancelado'].includes(this.getState(incident)))
    );
  }

  get notifications() {
    return this.incidents
      .filter((incident) => this.getState(incident) !== 'Pendiente' || incident.comentarios || incident.tecnicoNombre)
      .slice(0, 12);
  }

  get totalCount() {
    return this.incidents.length;
  }

  get pendingCount() {
    return this.incidents.filter(i => this.getState(i) === 'Pendiente').length;
  }

  get activeCount() {
    return this.incidents.filter(i => ['Asignado', 'En Proceso', 'Pausado'].includes(this.getState(i))).length;
  }

  get finishedCount() {
    return this.incidents.filter(i => this.getState(i) === 'Finalizado').length;
  }

  nuevoReporte() {
    this.router.navigate(['/incidents/new']);
  }

  toggleDetail(incident: any) {
    if (this.selectedIncidentId === incident.id) {
      this.selectedIncidentId = null;
      return;
    }

    this.selectedIncidentId = incident.id;
    this.clientComment = incident.comentarioCliente || '';
    this.selectedRating = Number(incident.calificacion || 0);
  }

  guardarComentario(incident: any) {
    this.apiService.updateIncident(incident.id, {
      comentarioCliente: this.clientComment.trim()
    }).subscribe({
      next: () => {
        this.message = 'Observacion guardada correctamente.';
        this.loadIncidents();
      },
      error: (err) => {
        console.error('Error saving client comment', err);
        this.message = 'No se pudo guardar la observacion.';
      }
    });
  }

  calificarServicio(incident: any, rating: number) {
    if (this.getState(incident) !== 'Finalizado') {
      this.message = 'Solo puedes calificar solicitudes finalizadas.';
      return;
    }

    this.selectedRating = rating;
    this.apiService.updateIncident(incident.id, { calificacion: rating }).subscribe({
      next: () => {
        this.message = 'Calificacion registrada.';
        incident.calificacion = rating;
        this.loadIncidents();
      },
      error: (err) => {
        console.error('Error rating incident', err);
        this.message = 'No se pudo registrar la calificacion.';
      }
    });
  }

  openMap(lat?: number, lng?: number) {
    if (lat === undefined || lat === null || lng === undefined || lng === null) {
      this.message = 'Esta solicitud no tiene coordenadas registradas.';
      return;
    }

    window.open(`https://www.google.com/maps/search/?api=1&query=${lat},${lng}`, '_blank');
  }

  getStatusIcon(estado: string): string {
    switch (estado) {
      case 'Finalizado': return 'checkmark-circle-outline';
      case 'Asignado':
      case 'En Proceso':
      case 'Pausado': return 'construct-outline';
      default: return 'time-outline';
    }
  }

  getStatusColor(estado: string): string {
    switch (estado) {
      case 'Pendiente': return 'warning';
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

  getState(incident: any) {
    return incident.estado || 'Pendiente';
  }

  isStepDone(incident: any, step: string) {
    const state = this.getState(incident);
    const order = ['Pendiente', 'Asignado', 'En Proceso', 'Finalizado'];
    const normalizedState = state === 'Pausado' ? 'En Proceso' : state;
    return order.indexOf(normalizedState) >= order.indexOf(step);
  }

  getProgressPercent(incident: any) {
    const state = this.getState(incident);
    if (state === 'Finalizado') return 100;
    if (state === 'En Proceso' || state === 'Pausado') return 72;
    if (state === 'Asignado') return 44;
    return 18;
  }

  getNotificationText(incident: any) {
    const state = this.getState(incident);
    if (state === 'Finalizado') return 'Tu solicitud fue finalizada y esta lista para calificar.';
    if (state === 'En Proceso') return 'El tecnico esta atendiendo tu solicitud.';
    if (state === 'Pausado') return 'La atencion fue pausada temporalmente.';
    if (state === 'Asignado') return `Tecnico asignado: ${incident.tecnicoNombre || 'por confirmar'}.`;
    return 'Solicitud registrada.';
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  private applyFilters(source: any[]) {
    const term = this.searchTerm.trim().toLowerCase();

    return source.filter((incident) => {
      const matchesTerm = !term ||
        String(incident.id || '').includes(term) ||
        String(incident.title || '').toLowerCase().includes(term) ||
        String(incident.description || '').toLowerCase().includes(term) ||
        String(incident.categoria || '').toLowerCase().includes(term) ||
        String(incident.tecnicoNombre || '').toLowerCase().includes(term);
      const matchesStatus = this.statusFilter === 'TODOS' || this.getState(incident) === this.statusFilter;
      const matchesPriority = this.priorityFilter === 'TODOS' || String(incident.severity || 'Medium') === this.priorityFilter;

      return matchesTerm && matchesStatus && matchesPriority;
    });
  }
}
