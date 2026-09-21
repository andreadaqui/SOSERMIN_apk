import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBackOutline, barChartOutline, statsChartOutline, shieldCheckmarkOutline } from 'ionicons/icons';

@Component({
  selector: 'app-reports',
  templateUrl: './reports.page.html',
  styleUrls: ['./reports.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon]
})
export class ReportsPage implements OnInit {
  private router = inject(Router);

  risks = [
    { name: 'Operativo', value: 42, level: 'medium' },
    { name: 'Equipos', value: 28, level: 'low' },
    { name: 'Seguridad critica', value: 16, level: 'high' }
  ];

  timeline = [
    { title: 'Reporte mensual generado', detail: 'Indicadores actualizados para supervision.' },
    { title: 'Incidencia cerrada', detail: 'Validacion completada por responsable de guardia.' },
    { title: 'Asistencia consolidada', detail: 'Registro diario listo para revision.' }
  ];

  constructor() {
    addIcons({ arrowBackOutline, barChartOutline, statsChartOutline, shieldCheckmarkOutline });
  }

  ngOnInit() {}

  volverAlHome() {
    this.router.navigate(['/home']);
  }
}
