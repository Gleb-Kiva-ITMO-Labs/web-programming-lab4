import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';
import { inject } from '@angular/core';

export const authGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (authService.isSignedIn()) {
    return true;
  } else {
    router.navigate(['/auth']);
    return false;
  }
};

export const noAuthGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  if (!authService.isSignedIn()) {
    return true;
  } else {
    router.navigate(['/shooting']);
    return false;
  }
};
