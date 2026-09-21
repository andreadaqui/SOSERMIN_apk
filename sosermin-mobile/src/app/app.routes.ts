import { Routes } from '@angular/router';
import { authGuard } from './guards/auth-guard';

export const routes: Routes = [
    {
      path: '',
      redirectTo: 'login',
      pathMatch: 'full'
    },
    {
      path: 'welcome',
      loadComponent: () => import('./pages/welcome/welcome.page').then(m => m.WelcomePage)
    },
    {
      path: 'login',
      loadComponent: () => import('./pages/login/login.page').then(m => m.LoginPage)
    },
  {
    path: 'register',
    loadComponent: () => import('./pages/register/register.page').then(m => m.RegisterPage)
  },
  {
    path: 'home',
    loadComponent: () => import('./pages/home/home.page').then(m => m.HomePage),
    canActivate: [authGuard]
  },
  {
    path: 'incidents/new',
    loadComponent: () => import('./pages/incident-create/incident-create.page').then(m => m.IncidentCreatePage),
    canActivate: [authGuard]
  },
  {
    path: 'courses',
    loadComponent: () => import('./pages/courses/courses.page').then(m => m.CoursesPage),
    canActivate: [authGuard]
  },
  {
    path: 'attendance',
    loadComponent: () => import('./pages/attendance/attendance.page').then(m => m.AttendancePage),
    canActivate: [authGuard]
  },
  {
    path: 'reports',
    loadComponent: () => import('./pages/reports/reports.page').then(m => m.ReportsPage),
    canActivate: [authGuard]
  },
  {
    path: 'home-client',
    loadComponent: () => import('./pages/home-client/home-client.component').then(m => m.HomeClientComponent),
    canActivate: [authGuard]
  },
  {
    path: 'tech-dashboard',
    loadComponent: () => import('./pages/tech-dashboard/tech-dashboard.component').then(m => m.TechDashboardComponent),
    canActivate: [authGuard]
  },
  {
    path: 'admin-dashboard',
    loadComponent: () => import('./pages/admin-dashboard/admin-dashboard.component').then(m => m.AdminDashboardComponent),
    canActivate: [authGuard]
  }
];