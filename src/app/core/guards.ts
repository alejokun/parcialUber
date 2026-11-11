import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { Role } from './models';

export const roleGuard = (role: Role): CanActivateFn => () => {
  const auth = inject(AuthService);
  const router = inject(Router);
  const u = auth.user();
  if (!auth.isLoggedIn() || !u) return router.parseUrl('/login');
  return u.role === role ? true : router.parseUrl(auth.homeFor(u.role));
};

export const guestGuard: CanActivateFn = () => {
  const auth = inject(AuthService);
  const u = auth.user();
  return auth.isLoggedIn() && u ? inject(Router).parseUrl(auth.homeFor(u.role)) : true;
};
