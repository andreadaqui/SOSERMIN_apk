import { Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonBadge, IonButton, IonButtons, IonContent, IonHeader, IonIcon, IonItem, IonLabel, IonList, IonSelect, IonSelectOption, IonTitle, IonToolbar } from '@ionic/angular/standalone';
import { ApiService } from '../../services/api.service';
import { addIcons } from 'ionicons';
import { barChartOutline, buildOutline, checkmarkCircleOutline, listOutline, logOutOutline, peopleOutline, refreshOutline, timeOutline, trashOutline } from 'ionicons/icons';
import { Router } from '@angular/router';
import { Capacitor } from '@capacitor/core';

type AdminTab = 'resumen' | 'asignacion' | 'usuarios' | 'auditoria';
type UserRole = 'ADMIN' | 'TECNICO' | 'CLIENTE';

type UserForm = {
  nombre: string;
  cedula: string;
  email: string;
  password: string;
  rol: UserRole;
  activo: boolean;
};

@Component({
  selector: 'app-admin-dashboard',
  templateUrl: './admin-dashboard.component.html',
  styleUrls: ['./admin-dashboard.component.scss'],
  standalone: true,
  imports: [IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonList, IonItem, IonLabel, IonBadge, IonSelect, IonSelectOption, IonButton, IonIcon, IonButtons]
})
export class AdminDashboardComponent implements OnInit {
  @ViewChild('userFormPanel') userFormPanel?: ElementRef<HTMLElement>;

  activeTab: AdminTab = 'resumen';
  incidents: any[] = [];
  users: any[] = [];
  technicians: any[] = [];

  totalIncidents = 0;
  pendingIncidents = 0;
  assignedIncidents = 0;
  inProcessIncidents = 0;
  pausedIncidents = 0;
  completedIncidents = 0;
  completionRate = 0;
  avgAssignmentHours = 0;
  avgResolutionHours = 0;
  documentedClosedIncidents = 0;
  undocumentedClosedIncidents = 0;

  statusFilter = 'TODOS';
  priorityFilter = 'TODOS';
  roleFilter = 'TODOS';
  activeFilter = 'TODOS';
  dateFrom = '';
  dateTo = '';
  searchTerm = '';
  userMessage = '';
  incidentMessage = '';
  editingUserId: number | null = null;
  userFormOpen = false;

  userForm: UserForm = this.getEmptyUserForm();

  private apiService = inject(ApiService);
  private router = inject(Router);

  constructor() {
    addIcons({
      barChartOutline,
      buildOutline,
      checkmarkCircleOutline,
      listOutline,
      logOutOutline,
      peopleOutline,
      refreshOutline,
      timeOutline,
      trashOutline
    });
  }

  ngOnInit() {
    this.loadData();
  }

  ionViewWillEnter() {
    this.loadData();
  }

  setTab(tab: AdminTab) {
    this.activeTab = tab;
  }

  loadData() {
    this.loadIncidents();
    this.loadUsers();
    this.loadTechnicians();
  }

  loadIncidents() {
    this.apiService.getIncidents().subscribe({
      next: (data) => {
        this.incidents = data || [];
        this.calculateMetrics();
      },
      error: (err) => {
        console.error('Error loading incidents', err);
        this.incidentMessage = 'No se pudieron cargar los reportes.';
      }
    });
  }

  loadUsers() {
    this.apiService.getUsersByRole().subscribe({
      next: (data) => {
        this.users = data || [];
      },
      error: (err) => {
        console.error('Error loading users', err);
        this.userMessage = 'No se pudieron cargar los usuarios.';
      }
    });
  }

  loadTechnicians() {
    this.apiService.getUsersByRole('TECNICO').subscribe({
      next: (data) => this.technicians = (data || []).filter((user: any) => user.activo !== false),
      error: (err) => console.error('Error loading technicians', err)
    });
  }

  calculateMetrics() {
    this.totalIncidents = this.incidents.length;
    this.pendingIncidents = this.incidents.filter(i => this.getState(i) === 'Pendiente').length;
    this.assignedIncidents = this.incidents.filter(i => this.getState(i) === 'Asignado').length;
    this.inProcessIncidents = this.incidents.filter(i => this.getState(i) === 'En Proceso').length;
    this.pausedIncidents = this.incidents.filter(i => this.getState(i) === 'Pausado').length;
    this.completedIncidents = this.incidents.filter(i => this.getState(i) === 'Finalizado').length;
    this.completionRate = this.totalIncidents
      ? Math.round((this.completedIncidents / this.totalIncidents) * 100)
      : 0;
    this.avgAssignmentHours = this.getAverageHours('fecha', 'fechaAsignacion');
    this.avgResolutionHours = this.getAverageHours('fecha', 'fechaCierre');
    this.documentedClosedIncidents = this.incidents.filter(i => this.getState(i) === 'Finalizado' && this.isClosedDocumented(i)).length;
    this.undocumentedClosedIncidents = this.completedIncidents - this.documentedClosedIncidents;
  }

  get assignmentIncidents() {
    return this.incidents.filter((incident) => {
      const state = this.getState(incident);
      return state === 'Pendiente' || state === 'Asignado' || state === 'En Proceso' || state === 'Pausado';
    });
  }

  get filteredIncidents() {
    const term = this.searchTerm.trim().toLowerCase();

    return this.incidents.filter((incident) => {
      const state = this.getState(incident);
      const matchesState = this.statusFilter === 'TODOS' || state === this.statusFilter;
      const matchesPriority = this.priorityFilter === 'TODOS' || String(incident.severity || 'Medium') === this.priorityFilter;
      const matchesDate = this.matchesDateFilter(incident);
      const matchesTerm = !term ||
        String(incident.title || '').toLowerCase().includes(term) ||
        String(incident.description || '').toLowerCase().includes(term) ||
        String(incident.categoria || '').toLowerCase().includes(term) ||
        String(incident.clienteNombre || '').toLowerCase().includes(term) ||
        String(incident.tecnicoNombre || '').toLowerCase().includes(term);

      return matchesState && matchesPriority && matchesDate && matchesTerm;
    });
  }

  get filteredUsers() {
    const term = this.searchTerm.trim().toLowerCase();

    return this.users.filter((user) => {
      const role = this.normalizeRole(user.rol);
      const matchesRole = this.roleFilter === 'TODOS' || role === this.roleFilter;
      const active = user.activo !== false;
      const matchesActive = this.activeFilter === 'TODOS' ||
        (this.activeFilter === 'ACTIVOS' && active) ||
        (this.activeFilter === 'INACTIVOS' && !active);
      const matchesTerm = !term ||
        String(user.nombre || '').toLowerCase().includes(term) ||
        String(user.cedula || '').toLowerCase().includes(term) ||
        String(user.email || '').toLowerCase().includes(term);

      return matchesRole && matchesActive && matchesTerm;
    });
  }

  assignTechnician(incidentId: number, event: any) {
    const techId = Number(event.detail.value);
    if (!techId) return;

    this.apiService.updateIncident(incidentId, { tecnicoId: techId }).subscribe({
      next: () => {
        this.incidentMessage = 'Tecnico asignado correctamente.';
        this.loadIncidents();
      },
      error: (err) => {
        console.error('Error assigning technician', err);
        this.incidentMessage = 'No se pudo asignar el tecnico.';
      }
    });
  }

  autoAssignIncident(incident: any) {
    if (!this.technicians.length) {
      this.incidentMessage = 'No hay tecnicos activos disponibles.';
      return;
    }

    const selected = [...this.technicians].sort((a, b) => {
      const workloadDiff = this.getTechnicianWorkload(a.id, 'Asignado') +
        this.getTechnicianWorkload(a.id, 'En Proceso') -
        (this.getTechnicianWorkload(b.id, 'Asignado') + this.getTechnicianWorkload(b.id, 'En Proceso'));

      if (workloadDiff !== 0) {
        return workloadDiff;
      }

      return String(a.nombre || '').localeCompare(String(b.nombre || ''));
    })[0];

    this.apiService.updateIncident(incident.id, { tecnicoId: selected.id }).subscribe({
      next: () => {
        this.incidentMessage = `Asignado automaticamente a ${selected.nombre}.`;
        this.loadIncidents();
      },
      error: (err) => {
        console.error('Error auto assigning technician', err);
        this.incidentMessage = 'No se pudo asignar automaticamente.';
      }
    });
  }

  startNewUser() {
    this.editingUserId = null;
    this.userForm = this.getEmptyUserForm();
    this.userMessage = '';
    this.userFormOpen = true;
    this.scrollToUserForm();
  }

  editUser(user: any) {
    this.editingUserId = user.id;
    this.userForm = {
      nombre: user.nombre || '',
      cedula: user.cedula || user.usuario || '',
      email: user.email || '',
      password: '',
      rol: this.normalizeRole(user.rol),
      activo: user.activo !== false,
    };
    this.userMessage = 'Editando usuario seleccionado.';
    this.activeTab = 'usuarios';
    this.userFormOpen = true;
    this.scrollToUserForm();
  }

  cancelUserForm() {
    this.editingUserId = null;
    this.userForm = this.getEmptyUserForm();
    this.userFormOpen = false;
    this.userMessage = '';
  }

  saveUser() {
    this.userMessage = '';

    if (!this.userForm.nombre.trim() || !this.userForm.cedula.trim()) {
      this.userMessage = 'Nombre y cedula son obligatorios.';
      return;
    }

    if (!this.editingUserId && !this.userForm.password.trim()) {
      this.userMessage = 'La contrasena es obligatoria para usuarios nuevos.';
      return;
    }

    const payload: any = {
      nombre: this.userForm.nombre.trim(),
      cedula: this.userForm.cedula.trim(),
      email: this.userForm.email.trim(),
      rol: this.userForm.rol,
      activo: this.userForm.activo,
    };

    if (this.userForm.password.trim()) {
      payload.password = this.userForm.password;
    }

    const request = this.editingUserId
      ? this.apiService.updateUser(this.editingUserId, payload)
      : this.apiService.createUser(payload);

    request.subscribe({
      next: () => {
        this.userMessage = this.editingUserId
          ? 'Usuario actualizado correctamente.'
          : 'Usuario creado correctamente.';
        this.editingUserId = null;
        this.userForm = this.getEmptyUserForm();
        this.userFormOpen = false;
        this.loadUsers();
        this.loadTechnicians();
      },
      error: (err) => {
        console.error('Error saving user', err);
        this.userMessage = err?.error?.mensaje || err?.error?.error || 'No se pudo guardar el usuario.';
      }
    });
  }

  toggleUserActive(user: any) {
    const nextActive = user.activo === false;

    this.apiService.updateUser(user.id, { activo: nextActive }).subscribe({
      next: () => {
        this.userMessage = nextActive ? 'Usuario activado correctamente.' : 'Usuario desactivado correctamente.';
        this.loadUsers();
        this.loadTechnicians();
      },
      error: (err) => {
        console.error('Error toggling user active state', err);
        this.userMessage = err?.error?.mensaje || 'No se pudo cambiar el estado del usuario.';
      }
    });
  }

  deleteUser(user: any) {
    const currentUserId = Number(localStorage.getItem('userId') || 0);

    if (user.id === currentUserId) {
      this.userMessage = 'No puedes eliminar tu propio usuario desde esta sesion.';
      return;
    }

    if (!window.confirm(`Eliminar usuario ${user.nombre}?`)) {
      return;
    }

    this.apiService.deleteUser(user.id).subscribe({
      next: () => {
        this.userMessage = 'Usuario eliminado correctamente.';
        this.loadUsers();
        this.loadTechnicians();
      },
      error: (err) => {
        console.error('Error deleting user', err);
        this.userMessage = err?.error?.mensaje || 'No se pudo eliminar el usuario.';
      }
    });
  }

  deleteIncident(incident: any) {
    if (!window.confirm(`Borrar auditoria/reporte #${incident.id} - ${incident.title || 'Sin titulo'}?`)) {
      return;
    }

    this.apiService.deleteIncident(incident.id).subscribe({
      next: () => {
        this.incidentMessage = 'Auditoria eliminada correctamente.';
        this.loadIncidents();
      },
      error: (err) => {
        console.error('Error deleting incident', err);
        this.incidentMessage = err?.error?.mensaje || err?.error?.error || 'No se pudo eliminar la auditoria.';
      }
    });
  }

  deleteFilteredIncidents() {
    const incidentIds = this.filteredIncidents.map((incident) => incident.id);

    if (!incidentIds.length) {
      this.incidentMessage = 'No hay auditorias filtradas para borrar.';
      return;
    }

    const confirmed = window.confirm(
      `Vas a borrar ${incidentIds.length} auditoria(s) segun los filtros actuales. Esta accion no se puede deshacer. Deseas continuar?`
    );

    if (!confirmed) {
      return;
    }

    this.incidentMessage = 'Borrando auditorias filtradas...';
    let completed = 0;
    let failed = 0;

    incidentIds.forEach((id) => {
      this.apiService.deleteIncident(id).subscribe({
        next: () => {
          completed += 1;
          this.finishFilteredDelete(completed, failed, incidentIds.length);
        },
        error: (err) => {
          console.error('Error deleting filtered incident', err);
          failed += 1;
          this.finishFilteredDelete(completed, failed, incidentIds.length);
        }
      });
    });
  }

  getTechnicianWorkload(techId: number, state?: string) {
    return this.incidents.filter((incident) => {
      const sameTech = Number(incident.tecnicoId) === Number(techId);
      return sameTech && (!state || this.getState(incident) === state);
    }).length;
  }

  getWorkloadPercent(techId: number) {
    const active = this.incidents.filter((incident) => {
      const state = this.getState(incident);
      return Number(incident.tecnicoId) === Number(techId) &&
        (state === 'Asignado' || state === 'En Proceso');
    }).length;

    const maxActive = Math.max(1, ...this.technicians.map(tech => {
      return this.incidents.filter((incident) => {
        const state = this.getState(incident);
        return Number(incident.tecnicoId) === Number(tech.id) &&
          (state === 'Asignado' || state === 'En Proceso');
      }).length;
    }));

    return Math.round((active / maxActive) * 100);
  }

  async exportReportsPdf() {
    this.incidentMessage = 'Generando reporte PDF...';

    try {
      const [{ jsPDF }, filesystemModule, shareModule] = await Promise.all([
        import('jspdf'),
        import('@capacitor/filesystem'),
        import('@capacitor/share')
      ]);

      const doc = new jsPDF({ unit: 'mm', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      const margin = 14;
      const maxWidth = pageWidth - margin * 2;
      let y = 16;

      const addText = (text: string, size = 10, style: 'normal' | 'bold' = 'normal', color = '#101828') => {
        doc.setFont('helvetica', style);
        doc.setFontSize(size);
        doc.setTextColor(color);
        const lines = doc.splitTextToSize(text, maxWidth);
        if (y + lines.length * 5 > pageHeight - margin) {
          doc.addPage();
          y = 16;
        }
        doc.text(lines, margin, y);
        y += lines.length * 5 + 2;
      };

      const addDivider = () => {
        if (y > pageHeight - 18) {
          doc.addPage();
          y = 16;
        }
        doc.setDrawColor('#d7e2da');
        doc.line(margin, y, pageWidth - margin, y);
        y += 6;
      };

      addText('Reporte de Auditoria SOSERMIN', 16, 'bold', '#0b6623');
      addText(`Generado: ${new Date().toLocaleString()}`, 9, 'normal', '#667085');
      addText(`Filtros: estado ${this.statusFilter}, prioridad ${this.priorityFilter}, desde ${this.dateFrom || 'sin filtro'}, hasta ${this.dateTo || 'sin filtro'}`, 9, 'normal', '#667085');
      addDivider();

      addText('Resumen operativo', 12, 'bold');
      addText(`Total reportes: ${this.totalIncidents} | Pendientes: ${this.pendingIncidents} | Asignados: ${this.assignedIncidents} | En proceso: ${this.inProcessIncidents} | Finalizados: ${this.completedIncidents}`);
      addText(`Promedio asignacion: ${this.formatHours(this.avgAssignmentHours)} | Promedio cierre: ${this.formatHours(this.avgResolutionHours)} | Cierres completos: ${this.documentedClosedIncidents} | Cierres incompletos: ${this.undocumentedClosedIncidents}`);
      addDivider();

      addText(`Detalle de reportes (${this.filteredIncidents.length})`, 12, 'bold');

      this.filteredIncidents.forEach((incident) => {
        const closeTime = this.formatHours(this.getHoursBetween(incident.fecha, incident.fechaCierre));
        const lines = [
          `#${incident.id} - ${incident.title || 'Sin titulo'}`,
          `Estado: ${this.getState(incident)} | Prioridad: ${incident.severity || 'Medium'} | Documentacion: ${this.getDocumentationStatus(incident)}`,
          `Categoria: ${incident.categoria || 'General'} | Cliente: ${incident.clienteNombre || 'Sin cliente'} | Tecnico: ${incident.tecnicoNombre || 'Sin asignar'}`,
          `Creado: ${this.formatDateForExport(incident.fecha)} | Asignado: ${this.formatDateForExport(incident.fechaAsignacion) || 'Sin dato'} | Inicio: ${this.formatDateForExport(incident.fechaInicio) || 'Sin dato'} | Cierre: ${this.formatDateForExport(incident.fechaCierre) || 'Sin dato'}`,
          `Tiempo cierre: ${closeTime}`,
          `GPS inicio: ${incident.latitudInicio ? `${incident.latitudInicio}, ${incident.longitudInicio}` : 'Sin dato'} | GPS cierre: ${incident.latitudCierre ? `${incident.latitudCierre}, ${incident.longitudCierre}` : 'Sin dato'}`,
          `Descripcion: ${incident.description || 'Sin descripcion'}`,
          `Observacion cliente: ${incident.comentarioCliente || 'Sin observacion.'}`,
          `Resolucion: ${incident.comentarios || 'Sin comentario registrado.'}`,
          `Evidencia inicial: ${incident.fotoUrl ? 'SI' : 'NO'} | Antes tecnico: ${incident.fotoAntesTecnicoUrl ? 'SI' : 'NO'} | Evidencia cierre: ${incident.fotoResolucionUrl ? 'SI' : 'NO'}`
        ];

        if (y > pageHeight - 48) {
          doc.addPage();
          y = 16;
        }

        doc.setFillColor('#f5f7f6');
        doc.roundedRect(margin - 2, y - 5, maxWidth + 4, 42, 2, 2, 'F');
        lines.forEach((line, index) => addText(line, index === 0 ? 10 : 8, index === 0 ? 'bold' : 'normal', index === 0 ? '#101828' : '#344054'));
        y += 2;
      });

      const fileName = `sosermin-reporte-${new Date().toISOString().slice(0, 10)}.pdf`;

      if (Capacitor.isNativePlatform()) {
        const dataUri = doc.output('datauristring');
        const base64 = dataUri.split(',')[1];
        const savedFile = await filesystemModule.Filesystem.writeFile({
          path: fileName,
          data: base64,
          directory: filesystemModule.Directory.Cache
        });

        await shareModule.Share.share({
          title: 'Reporte SOSERMIN',
          text: 'Reporte PDF de auditoria SOSERMIN',
          url: savedFile.uri,
          dialogTitle: 'Guardar o compartir reporte'
        });
      } else {
        doc.save(fileName);
      }

      this.incidentMessage = 'Reporte PDF generado correctamente.';
    } catch (err) {
      console.error('Error exporting PDF', err);
      this.incidentMessage = 'No se pudo generar el PDF.';
    }
  }

  getAverageHours(startField: string, endField: string) {
    const values = this.incidents
      .map((incident) => this.getHoursBetween(incident[startField], incident[endField]))
      .filter((value): value is number => value !== null);

    if (!values.length) {
      return 0;
    }

    return Math.round((values.reduce((total, value) => total + value, 0) / values.length) * 10) / 10;
  }

  getHoursBetween(start?: string, end?: string) {
    if (!start || !end) {
      return null;
    }

    const startTime = new Date(start).getTime();
    const endTime = new Date(end).getTime();

    if (!Number.isFinite(startTime) || !Number.isFinite(endTime) || endTime < startTime) {
      return null;
    }

    return (endTime - startTime) / 36e5;
  }

  formatHours(hours: number | null) {
    if (hours === null) {
      return 'Sin dato';
    }

    if (hours < 1) {
      return `${Math.round(hours * 60)} min`;
    }

    return `${hours.toFixed(1)} h`;
  }

  isClosedDocumented(incident: any) {
    return Boolean(incident.fechaCierre && incident.comentarios && incident.fotoResolucionUrl);
  }

  getDocumentationStatus(incident: any) {
    if (this.getState(incident) !== 'Finalizado') {
      return 'En curso';
    }

    return this.isClosedDocumented(incident) ? 'Completo' : 'Incompleto';
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

  getRoleBadgeColor(role: string): string {
    switch (this.normalizeRole(role)) {
      case 'ADMIN': return 'danger';
      case 'TECNICO': return 'tertiary';
      default: return 'success';
    }
  }

  getActiveBadgeColor(user: any): string {
    return user.activo === false ? 'medium' : 'success';
  }

  getActiveLabel(user: any): string {
    return user.activo === false ? 'Inactivo' : 'Activo';
  }

  getRoleLabel(role: string): string {
    switch (this.normalizeRole(role)) {
      case 'ADMIN': return 'Administrador';
      case 'TECNICO': return 'Tecnico';
      default: return 'Cliente';
    }
  }

  getState(incident: any) {
    return incident.estado || 'Pendiente';
  }

  logout() {
    localStorage.clear();
    this.router.navigate(['/login']);
  }

  private getEmptyUserForm(): UserForm {
    return {
      nombre: '',
      cedula: '',
      email: '',
      password: '',
      rol: 'CLIENTE',
      activo: true,
    };
  }

  private matchesDateFilter(incident: any) {
    const date = incident.fecha ? new Date(incident.fecha) : null;

    if (!date || Number.isNaN(date.getTime())) {
      return !this.dateFrom && !this.dateTo;
    }

    if (this.dateFrom) {
      const from = new Date(`${this.dateFrom}T00:00:00`);
      if (date < from) {
        return false;
      }
    }

    if (this.dateTo) {
      const to = new Date(`${this.dateTo}T23:59:59`);
      if (date > to) {
        return false;
      }
    }

    return true;
  }

  private formatDateForExport(value?: string) {
    if (!value) {
      return '';
    }

    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? '' : date.toLocaleString();
  }

  private scrollToUserForm() {
    setTimeout(() => {
      this.userFormPanel?.nativeElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }, 80);
  }

  private finishFilteredDelete(completed: number, failed: number, total: number) {
    if (completed + failed < total) {
      return;
    }

    this.incidentMessage = failed
      ? `Se eliminaron ${completed} auditoria(s), pero fallaron ${failed}.`
      : `Se eliminaron ${completed} auditoria(s) correctamente.`;
    this.loadIncidents();
  }

  private normalizeRole(role: string): UserRole {
    const normalized = String(role || 'CLIENTE')
      .trim()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .toUpperCase();

    if (normalized === 'ADMIN' || normalized === 'ADMINISTRADOR' || normalized === 'SUPERVISOR') {
      return 'ADMIN';
    }

    if (normalized === 'TECNICO' || normalized === 'PERSONAL DE CAMPO') {
      return 'TECNICO';
    }

    return 'CLIENTE';
  }
}
