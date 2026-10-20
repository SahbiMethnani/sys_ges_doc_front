import { Routes } from '@angular/router';
import { authGuard, adminGuard, guestGuard } from './auth/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'chat', pathMatch: 'full' },
  {
    path: 'login',
    canActivate: [guestGuard],
    loadComponent: () => import('./auth/login/login.component').then((m) => m.LoginComponent),
  },
  {
    path: 'register',
    canActivate: [guestGuard],
    loadComponent: () =>
      import('./auth/register/register.component').then((m) => m.RegisterComponent),
  },
  {
    path: 'forgot-password',
    loadComponent: () =>
      import('./auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
    data: { mode: 'request' },
  },
  {
    path: 'reset-password',
    loadComponent: () =>
      import('./auth/forgot-password/forgot-password.component').then(
        (m) => m.ForgotPasswordComponent,
      ),
    data: { mode: 'reset' },
  },
  {
    path: 'chat',
    canActivate: [authGuard],
    loadComponent: () => import('./chat/chat.component').then((m) => m.ChatComponent),
  },
  {
    path: 'documents',
    canActivate: [adminGuard],
    loadComponent: () =>
      import('./documents/documents.component').then((m) => m.DocumentsComponent),
  },
  { path: '**', redirectTo: 'chat' },
];
