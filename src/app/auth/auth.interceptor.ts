import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, switchMap, throwError } from 'rxjs';
import { AuthService } from './auth.service';

const SKIP_AUTH = ['/auth/login', '/auth/register', '/auth/refresh', '/auth/logout'];

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const url = req.url;
  const skip = SKIP_AUTH.some((path) => url.includes(path));

  const token = auth.accessToken;
  const authReq =
    !skip && token
      ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } })
      : req;

  return next(authReq).pipe(
    catchError((err: unknown) => {
      if (!(err instanceof HttpErrorResponse) || err.status !== 401 || skip) {
        return throwError(() => err);
      }
      return auth.refreshAccessToken().pipe(
        switchMap((access) =>
          next(
            req.clone({
              setHeaders: { Authorization: `Bearer ${access}` },
            }),
          ),
        ),
        catchError((refreshErr) => {
          auth.clearSession();
          void router.navigateByUrl('/login');
          return throwError(() => refreshErr);
        }),
      );
    }),
  );
};
