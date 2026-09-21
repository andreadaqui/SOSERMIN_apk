import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonIcon } from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import { barChartOutline, bookOutline, checkboxOutline, chevronForwardOutline, logOutOutline, warningOutline } from 'ionicons/icons';

@Component({
  selector: 'app-home',
  templateUrl: './home.page.html',
  styleUrls: ['./home.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonIcon]
})
export class HomePage implements OnInit {
  private router = inject(Router);
  nombreUsuario: string = 'Usuario';

  constructor() {
    addIcons({ barChartOutline, bookOutline, checkboxOutline, chevronForwardOutline, logOutOutline, warningOutline });
  }

  ngOnInit() {
    const rol = localStorage.getItem('rol');
    this.nombreUsuario = rol ? rol : 'Usuario';
  }

  irAIncidencias() {
    this.router.navigate(['/incidents/new']);
  }

  irACursos() {
    this.router.navigate(['/courses']);
  }

  irAAsistencia() {
    this.router.navigate(['/attendance']);
  }

  irAReportes() {
    this.router.navigate(['/reports']);
  }

  irAInformacion() {
    // Para la prueba, simplemente lo enviamos a cursos o una alerta
    this.router.navigate(['/courses']);
  }

  logout() {
    console.log('LOGOUT EJECUTADO CORRECTAMENTE');
    localStorage.clear();
    sessionStorage.clear();
    this.router.navigateByUrl('/login', { replaceUrl: true });
  }
}
