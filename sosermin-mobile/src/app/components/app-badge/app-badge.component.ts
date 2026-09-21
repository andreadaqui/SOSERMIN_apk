import { Component, Input } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-badge',
  templateUrl: './app-badge.component.html',
  styleUrls: ['./app-badge.component.scss'],
  standalone: true,
  imports: [IonicModule, CommonModule]
})
export class AppBadgeComponent {
  @Input() text: string = '';
  @Input() color: 'success' | 'warning' | 'danger' = 'success';
}