import { Routes } from '@angular/router';
import { guestGuard, roleGuard } from './core/guards';

export const routes: Routes = [
  { path: 'login', canActivate: [guestGuard], loadComponent: () => import('./pages/login/login.page').then((m) => m.LoginPage) },
  { path: 'register', canActivate: [guestGuard], loadComponent: () => import('./pages/register/register.page').then((m) => m.RegisterPage) },
  { path: 'client', canActivate: [roleGuard('client')], loadComponent: () => import('./pages/client/client.page').then((m) => m.ClientPage) },
  { path: 'driver', canActivate: [roleGuard('driver')], loadComponent: () => import('./pages/driver/driver.page').then((m) => m.DriverPage) },
  { path: 'admin', canActivate: [roleGuard('admin')], loadComponent: () => import('./pages/admin/admin.page').then((m) => m.AdminPage) },
  { path: '', redirectTo: 'login', pathMatch: 'full' },
  { path: '**', redirectTo: 'login' },
];
