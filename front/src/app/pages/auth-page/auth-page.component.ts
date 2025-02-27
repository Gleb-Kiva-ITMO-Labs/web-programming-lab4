import { Component } from '@angular/core';
import { MovingShapesComponent } from '../../components/moving-shapes/moving-shapes.component';
import { AuthService } from '../../auth.service';
import {
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';

@Component({
  selector: 'app-auth-page',
  imports: [MovingShapesComponent, FormsModule, ReactiveFormsModule, NgIf],
  templateUrl: './auth-page.component.html',
  styleUrl: './auth-page.component.css',
})
export class AuthPageComponent {
  protected noSuchUser: boolean = false;
  protected authFormControl: FormGroup = new FormGroup({
    login: new FormControl('', [
      Validators.required,
      Validators.minLength(4),
      Validators.maxLength(36),
    ]),
    password: new FormControl('', [
      Validators.required,
      Validators.minLength(8),
      Validators.maxLength(36),
    ]),
  });
  protected shapesAnimationSpeed: number = 1;

  constructor(protected authService: AuthService, private router: Router) {}

  get login() {
    return this.authFormControl.get('login');
  }

  get password() {
    return this.authFormControl.get('password');
  }

  signIn($event?: MouseEvent) {
    $event && $event.preventDefault();
    if (this.authFormControl.valid) {
      this.authService
        .signIn(this.login!.value, this.password!.value)
        .subscribe({
          next: (response) => this.router.navigate(['/']),
          error: (error: HttpErrorResponse) => {
            this.noSuchUser = true;
            console.log(error); // TODO check if seriouss, if not set noSuchUser
          },
        });
    }
  }

  signUp($event?: MouseEvent) {
    $event && $event.preventDefault();
    if (this.authFormControl.valid) {
      this.authService
        .signUp(this.login!.value, this.password!.value)
        .subscribe({
          next: (response) => this.signIn(),
          error: (error: HttpErrorResponse) => {
            console.log(error); // smthn serious
          },
        });
    } else {
      this.noSuchUser = false;
    }
  }

  changeShapesAnimationSpeed(isHovered: boolean) {
    this.shapesAnimationSpeed = isHovered ? 8 : 1;
  }
}
