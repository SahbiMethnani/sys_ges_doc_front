import { Component, effect } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive } from '@angular/router';
import { CommonModule } from '@angular/common';
import { RagService, StatusResponse } from './shared/services/rag.service';
import { AuthService } from './auth/auth.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule],
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  status: StatusResponse | null = null;
  isLightTheme = false;

  constructor(
    private rag: RagService,
    public auth: AuthService,
  ) {
    this.isLightTheme = localStorage.getItem('docrag-theme') === 'light';
    this.applyTheme();

    effect(() => {
      if (this.auth.isAuthenticated()) {
        this.loadStatus();
      } else {
        this.status = null;
      }
    });
  }

  logout(): void {
    this.auth.logout();
  }

  toggleTheme(): void {
    this.isLightTheme = !this.isLightTheme;
    localStorage.setItem('docrag-theme', this.isLightTheme ? 'light' : 'dark');
    this.applyTheme();
  }

  displayName(): string {
    const u = this.auth.user();
    return u?.display_name || u?.username || '';
  }

  private loadStatus(): void {
    this.rag.getStatus().subscribe({
      next: (s) => (this.status = s),
      error: () => (this.status = null),
    });
  }

  private applyTheme(): void {
    document.documentElement.dataset['theme'] = this.isLightTheme ? 'light' : 'dark';
  }
}
