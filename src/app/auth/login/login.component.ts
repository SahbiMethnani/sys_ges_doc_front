import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss',
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  loading = false;

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  submit(): void {
    this.error = '';
    if (!this.username.trim() || !this.password) {
      this.error = 'Identifiant et mot de passe requis.';
      return;
    }
    this.loading = true;
    this.auth.login({ username: this.username.trim(), password: this.password }).subscribe({
      next: () => {
        this.loading = false;
        void this.router.navigateByUrl('/chat');
      },
      error: (err: Error) => {
        this.loading = false;
        this.error = err.message || 'Connexion impossible.';
      },
    });
  }
}
