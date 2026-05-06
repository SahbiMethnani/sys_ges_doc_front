// src/app/app.routes.ts
import { Routes } from '@angular/router';

export const routes: Routes = [
  { path: '', redirectTo: 'chat', pathMatch: 'full' },
  {
    path: 'chat',
    loadComponent: () => import('./chat/chat.component').then(m => m.ChatComponent),
  },
  {
    path: 'documents',
    loadComponent: () => import('./documents/documents.component').then(m => m.DocumentsComponent),
  },
];
