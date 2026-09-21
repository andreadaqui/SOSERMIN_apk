import { bootstrapApplication } from '@angular/platform-browser';
import { RouteReuseStrategy, provideRouter, withPreloading, PreloadAllModules } from '@angular/router';
import { IonicRouteStrategy, provideIonicAngular } from '@ionic/angular/standalone';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { addIcons } from 'ionicons';
import { 
  logOutOutline, 
  addCircleOutline, 
  syncOutline, 
  personOutline, 
  lockClosedOutline, 
  documentTextOutline, 
  arrowBackOutline 
} from 'ionicons/icons'; // Importa los iconos que uses en tu app

import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { authInterceptor } from './app/interceptors/auth.interceptor';

// Registramos los iconos globalmente para evitar el error de URL inválida que congela la app
addIcons({
  'log-out-outline': logOutOutline,
  'add-circle-outline': addCircleOutline,
  'sync-outline': syncOutline,
  'person-outline': personOutline,
  'lock-closed-outline': lockClosedOutline,
  'document-text-outline': documentTextOutline,
  'arrow-back-outline': arrowBackOutline,
});

bootstrapApplication(AppComponent, {
  providers: [
    { provide: RouteReuseStrategy, useClass: IonicRouteStrategy },
    provideIonicAngular(),
    provideRouter(routes, withPreloading(PreloadAllModules)),
    provideHttpClient(withInterceptors([authInterceptor])),
  ],
});