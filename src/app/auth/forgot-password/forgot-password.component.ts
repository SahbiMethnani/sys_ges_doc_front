import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './forgot-password.component.html',
  styleUrl: './forgot-password.component.scss',
})
export class ForgotPasswordComponent implements OnInit {
  mode: 'request' | 'reset' = 'request';
  username = '';
  token = '';
  password = '';
  confirmPassword = '';
  message = '';
  error = '';
  loading = false;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private auth: AuthService,
  ) {}

  ngOnInit(): void {
    this.mode = this.route.snapshot.data['mode'] === 'reset' ? 'reset' : 'request';
    this.token = this.route.snapshot.queryParamMap.get('token') ?? '';
    if (this.token) {
      void this.router.navigate([], {
        relativeTo: this.route,
        queryParams: { token: null },
        queryParamsHandling: 'merge',
        replaceUrl: true,
      });
    }
  }

  requestReset(): void {
    this.message = '';
    this.error = '';
    if (!this.username.trim()) {
      this.error = 'Saisissez votre identifiant.';
      return;
    }

    this.loading = true;
    this.auth.forgotPassword({ username: this.username.trim() }).subscribe({
      next: (result) => {
        this.message = result.message;
        this.loading = false;
      },
      error: (err: Error) => {
        this.error = err.message;
        this.loading = false;
      },
    });
  }

  submitNewPassword(): void {
    this.message = '';
    this.error = '';
    if (!this.token) {
      this.error = 'Le lien de réinitialisation est absent ou incomplet.';
      return;
    }
    if (this.password.length < 8 || this.password.length > 128) {
      this.error = 'Le mot de passe doit contenir entre 8 et 128 caractères.';
      return;
    }
    if (this.password !== this.confirmPassword) {
      this.error = 'Les deux mots de passe ne correspondent pas.';
      return;
    }

    this.loading = true;
    this.auth.resetPassword({ token: this.token, new_password: this.password }).subscribe({
      next: (result) => {
        this.message = result.message;
        this.loading = false;
        this.token = '';
      },
      error: (err: Error) => {
        this.error = err.message;
        this.loading = false;
      },
    });
  }
}