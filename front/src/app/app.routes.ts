import { Routes } from '@angular/router';
import { AuthPageComponent } from './pages/auth-page/auth-page.component';
import { ShootingPageComponent } from './pages/shooting-page/shooting-page.component';
import { authGuard, noAuthGuard } from './auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'auth',
    pathMatch: 'full',
  },
  {
    path: 'auth',
    component: AuthPageComponent,
    canActivate: [noAuthGuard],
  },
  {
    path: 'shooting',
    component: ShootingPageComponent,
    canActivate: [authGuard],
  },
  {
    path: '**',
    redirectTo: 'shooting',
  },
];
