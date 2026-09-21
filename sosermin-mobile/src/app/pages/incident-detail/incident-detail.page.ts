import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ActivatedRoute } from '@angular/router';
import { HttpClient, HttpClientModule } from '@angular/common/http';
import { ServerUrlService } from '../../services/server-url.service';

@Component({
  selector: 'app-incident-detail',
  templateUrl: './incident-detail.page.html',
  styleUrls: ['./incident-detail.page.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule, IonicModule, HttpClientModule]
})
export class IncidentDetailPage implements OnInit {
  incidentId: string | null = null;
  incident: any = null;

  constructor(
    private route: ActivatedRoute,
    private http: HttpClient,
    private serverUrl: ServerUrlService
  ) { }

  ngOnInit() {
    // Capturamos el :id de la URL
    this.incidentId = this.route.snapshot.paramMap.get('id');
    if (this.incidentId) {
      this.loadIncidentDetail(this.incidentId);
    }
  }

  loadIncidentDetail(id: string) {
    const token = localStorage.getItem('token') || '';
    const headers = { Authorization: `Bearer ${token}` };
    const backendUrl = `${this.serverUrl.getApiUrl()}/incidents/${id}`;

    this.http.get(backendUrl, { headers }).subscribe({
      next: (response) => {
        this.incident = response;
        console.log('Detalle cargado:', response);
      },
      error: (err) => {
        console.error('Error al obtener el detalle del incidente:', err);
      }
    });
  }
}
