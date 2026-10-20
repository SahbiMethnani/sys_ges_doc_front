import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, throwError, of } from 'rxjs';
import { catchError, map, tap, switchMap, finalize, shareReplay } from 'rxjs/operators';
import { environment } from '../../environments/environment';
import {
  LoginRequest,
  RegisterRequest,
  TokenResponse,
  User,
  RefreshRequest,
  ForgotPasswordRequest,
  ResetPasswordRequest,
  AuthMessageResponse,
} from './auth.models';

const ACCESS_KEY = 'rag_access_token';
const REFRESH_KEY = 'rag_refresh_token';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly api = environment.apiUrl;
  private readonly userSignal = signal<User | null>(null);
  private refreshInFlight: Observable<string> | null = null;

  readonly user = this.userSignal.asReadonly();
  readonly isAuthenticated = computed(() => !!this.userSignal());
  readonly isAdmin = computed(() => this.userSignal()?.role === 'admin');

  constructor(
    private http: HttpClient,
    private router: Router,
  ) {}

  get accessToken(): string | null {
    return localStorage.getItem(ACCESS_KEY);
  }

  get refreshToken(): string | null {
    return localStorage.getItem(REFRESH_KEY);
  }

  /** Restore session from stored tokens (call once at app start). */
  bootstrap(): Observable<User | null> {
    if (!this.accessToken && !this.refreshToken) {
      return of(null);
    }
    if (!this.accessToken && this.refreshToken) {
      return this.refreshAccessToken().pipe(
        switchMap(() => this.me()),
        tap((user) => this.userSignal.set(user)),
        catchError(() => {
          this.clearSession();
          return of(null);
        }),
      );
    }
    return this.me().pipe(
      tap((user) => this.userSignal.set(user)),
      catchError(() => {
        this.clearSession();
        return of(null);
      }),
    );
  }

  login(body: LoginRequest): Observable<User> {
    return this.http.post<TokenResponse>(`${this.api}/auth/login`, body).pipe(
      tap((tokens) => this.storeTokens(tokens)),
      switchMap(() => this.me()),
      tap((user) => this.userSignal.set(user)),
      catchError(this.handleError),
    );
  }

  register(body: RegisterRequest): Observable<User> {
    return this.http.post<User>(`${this.api}/auth/register`, body).pipe(catchError(this.handleError));
  }

  forgotPassword(body: ForgotPasswordRequest): Observable<AuthMessageResponse> {
    return this.http
      .post<AuthMessageResponse>(`${this.api}/auth/forgot-password`, body)
      .pipe(catchError(this.handleError));
  }

  resetPassword(body: ResetPasswordRequest): Observable<AuthMessageResponse> {
    return this.http
      .post<AuthMessageResponse>(`${this.api}/auth/reset-password`, body)
      .pipe(catchError(this.handleError));
  }

  me(): Observable<User> {
    return this.http.get<User>(`${this.api}/auth/me`).pipe(catchError(this.handleError));
  }

  logout(): void {
    const refresh = this.refreshToken;
    this.clearSession();
    if (refresh) {
      this.http
        .post(`${this.api}/auth/logout`, { refresh_token: refresh } satisfies RefreshRequest)
        .subscribe({ error: () => undefined });
    }
    void this.router.navigateByUrl('/login');
  }

  /** Clear local session without navigating (used by interceptor). */
  clearSession(): void {
    this.userSignal.set(null);
    localStorage.removeItem(ACCESS_KEY);
    localStorage.removeItem(REFRESH_KEY);
  }

  /** Refresh tokens; returns new access token. Deduplicates concurrent calls. */
  refreshAccessToken(): Observable<string> {
    if (this.refreshInFlight) {
      return this.refreshInFlight;
    }
    const refresh = this.refreshToken;
    if (!refresh) {
      return throwError(() => new Error('Session expirée.'));
    }
    this.refreshInFlight = this.http
      .post<TokenResponse>(`${this.api}/auth/refresh`, { refresh_token: refresh })
      .pipe(
        tap((tokens) => this.storeTokens(tokens)),
        map((tokens) => tokens.access_token),
        catchError((err) => {
          this.clearSession();
          return throwError(() => err);
        }),
        finalize(() => {
          this.refreshInFlight = null;
        }),
        shareReplay(1),
      );
    return this.refreshInFlight;
  }

  private storeTokens(tokens: TokenResponse): void {
    localStorage.setItem(ACCESS_KEY, tokens.access_token);
    localStorage.setItem(REFRESH_KEY, tokens.refresh_token);
  }

  private handleError(err: HttpErrorResponse) {
    const detail = err.error?.detail;
    const message =
      typeof detail === 'string'
        ? detail
        : Array.isArray(detail)
          ? detail.map((d: { msg?: string }) => d.msg).filter(Boolean).join(', ')
          : err.message || 'Erreur inconnue';
    return throwError(() => new Error(message));
  }
}
