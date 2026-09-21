import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonContent, IonButton } from '@ionic/angular/standalone';
import { Router } from '@angular/router';

@Component({
  selector: 'app-welcome',
  templateUrl: './welcome.page.html',
  styleUrls: ['./welcome.page.scss'],
  standalone: true,
  imports: [CommonModule, IonContent, IonButton]
})
export class WelcomePage {
  private router = inject(Router);

  irAlLogin() {
    this.router.navigate(['/login']);
  }
}