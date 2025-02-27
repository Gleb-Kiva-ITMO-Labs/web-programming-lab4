import { Routes } from '@angular/router';
import { AuthPageComponent } from './pages/auth-page/auth-page.component';
import { ShootingPageComponent } from './pages/shooting-page/shooting-page.component';
import { authGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: 'auth',
    component: AuthPageComponent,
  },
  {
    path: 'shooting',
    component: ShootingPageComponent,
    canActivate: [authGuard],
  },
];
