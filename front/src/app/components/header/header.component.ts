import { Component } from '@angular/core';
import { AuthService } from '../../auth.service';
import { Router } from '@angular/router';

@Component({
  selector: 'app-header',
  imports: [],
  templateUrl: './header.component.html',
  styleUrl: './header.component.css',
})
export class HeaderComponent {
  constructor(protected authService: AuthService, private router: Router) {}

  signOut() {
    this.authService.signOut();
    this.router.navigateByUrl('auth');
  }
}
