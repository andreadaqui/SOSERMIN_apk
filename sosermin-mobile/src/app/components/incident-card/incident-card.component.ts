import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonicModule } from '@ionic/angular';

@Component({
  selector: 'app-incident-card',
  templateUrl: './incident-card.component.html',
  styleUrls: ['./incident-card.component.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule]
})
export class IncidentCardComponent {
  @Input() data: any = null;
  @Input() loading: boolean = false;
  @Input() error: string | null = null;

  @Output() onRetry = new EventEmitter<void>();
  @Output() onSelect = new EventEmitter<string>();
}