import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  username = '';
  password = '';
  displayName = '';
  email = '';
  error = '';
  success = '';
  loading = false;

  constructor(
    private auth: AuthService,
    private router: Router,
  ) {}

  submit(): void {
    this.error = '';
    this.success = '';
    if (!this.username.trim() || !this.password) {
      this.error = 'Identifiant et mot de passe requis.';
      return;
    }
    if (this.password.length < 4) {
      this.error = 'Le mot de passe doit contenir au moins 4 caractères.';
      return;
    }

    this.loading = true;
    const body = {
      username: this.username.trim(),
      password: this.password,
      ...(this.displayName.trim() ? { display_name: this.displayName.trim() } : {}),
      ...(this.email.trim() ? { email: this.email.trim() } : {}),
    };

    this.auth.register(body).subscribe({
      next: () => {
        this.loading = false;
        this.success = 'Compte créé. Vous pouvez vous connecter.';
        setTimeout(() => void this.router.navigateByUrl('/login'), 1200);
      },
      error: (err: Error) => {
        this.loading = false;
        this.error = err.message || 'Inscription impossible.';
      },
    });
  }
}
