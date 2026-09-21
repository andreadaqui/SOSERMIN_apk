import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBackOutline, checkboxOutline, timeOutline, locationOutline } from 'ionicons/icons';

@Component({
  selector: 'app-attendance',
  templateUrl: './attendance.page.html',
  styleUrls: ['./attendance.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon]
})
export class AttendancePage implements OnInit {
  private router = inject(Router);

  asistenciaRegistrada = signal<boolean>(false);
  fechaActual = new Date().toLocaleDateString();
  turnoSeleccionado = 'Manana (07:00 - 15:00)';

  constructor() {
    addIcons({ arrowBackOutline, checkboxOutline, timeOutline, locationOutline });
  }

  ngOnInit() {}

  registrarAsistencia() {
    this.asistenciaRegistrada.set(true);
  }

  volverAlHome() {
    this.router.navigate(['/home']);
  }
}
