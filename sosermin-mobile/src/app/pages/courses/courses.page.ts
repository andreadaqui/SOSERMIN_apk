import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { arrowBackOutline, bookOutline, constructOutline, shieldCheckmarkOutline } from 'ionicons/icons';

@Component({
  selector: 'app-courses',
  templateUrl: './courses.page.html',
  styleUrls: ['./courses.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonContent, IonIcon]
})
export class CoursesPage {
  private router = inject(Router);

  courses = [
    {
      title: 'Induccion de seguridad minera',
      description: 'Normas base para ingreso a frente de trabajo, EPP y rutas seguras.',
      progress: 85,
      hours: '6 h',
      status: 'En curso',
      icon: 'shield-checkmark-outline'
    },
    {
      title: 'Respuesta ante incidentes',
      description: 'Procedimiento de reporte, contencion inicial y comunicacion operativa.',
      progress: 62,
      hours: '4 h',
      status: 'Prioritario',
      icon: 'construct-outline'
    },
    {
      title: 'Actualizacion normativa',
      description: 'Revision de obligaciones y criterios internos para supervision.',
      progress: 35,
      hours: '3 h',
      status: 'Pendiente',
      icon: 'book-outline'
    }
  ];

  constructor() {
    addIcons({ arrowBackOutline, bookOutline, constructOutline, shieldCheckmarkOutline });
  }

  volverAlHome() {
    this.router.navigate(['/home']);
  }
}
