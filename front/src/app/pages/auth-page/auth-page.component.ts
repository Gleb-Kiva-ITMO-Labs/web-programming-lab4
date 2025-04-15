import { Component } from '@angular/core';
import { MovingShapesComponent } from '../../components/moving-shapes/moving-shapes.component';
import { AuthService } from '../../auth.service';
import {
  FormBuilder,
  FormControl,
  FormGroup,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgIf } from '@angular/common';
import { Router } from '@angular/router';
import { HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { mustMatchValidator } from '../../validators';
import { MatTooltipModule } from '@angular/material/tooltip';

enum AuthStage {
  LOGIN,
  NO_USER,
  VERIFY_CODE,
  PASSWORD_RESET,
}

@Component({
  selector: 'app-auth-page',
  imports: [
    MovingShapesComponent,
    FormsModule,
    ReactiveFormsModule,
    NgIf,
    MatTooltipModule,
  ],
  templateUrl: './auth-page.component.html',
  styleUrl: './auth-page.component.css',
})
export class AuthPageComponent {
  protected readonly AuthStage = AuthStage;
  protected currentStage: AuthStage = AuthStage.LOGIN;
  protected authFormControl: FormGroup;
  protected codeFormControl: FormGroup;
  protected resetFormControl: FormGroup;
  protected errorMessage: string | null = null;
  protected isLoading = false;
  protected shapesAnimationSpeed: number = 1;

  constructor(
    protected authService: AuthService,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.authFormControl = this.fb.group({
      email: new FormControl('', [
        Validators.required,
        Validators.email,
        Validators.minLength(4),
        Validators.maxLength(36),
      ]),
      password: new FormControl('', [
        Validators.required,
        Validators.minLength(8),
        Validators.maxLength(36),
      ]),
    });
    this.codeFormControl = this.fb.group({
      verificationCode: new FormControl('', [
        Validators.required,
        Validators.pattern('^[0-9]{6}$'),
      ]),
    });
    this.resetFormControl = this.fb.group({
      verificationCode: new FormControl('', [
        Validators.required,
        Validators.pattern('^[0-9]{6}$'),
      ]),
    });
  }

  get email() {
    return this.authFormControl.get('email');
  }

  get password() {
    return this.authFormControl.get('password');
  }

  get verificationCode() {
    return this.codeFormControl.get('verificationCode');
  }

  get resetVerificationCode() {
    return this.resetFormControl.get('verificationCode');
  }

  handleAuthRequest(
    action: () => Observable<any>,
    onSuccess?: () => void,
    onError?: (error: HttpErrorResponse) => void
  ) {
    if (this.authFormControl.invalid || this.isLoading) return;

    this.isLoading = true;
    this.errorMessage = null;

    action().subscribe({
      next: () => {
        this.isLoading = false;
        onSuccess?.();
      },
      error: (error: HttpErrorResponse) => {
        this.isLoading = false;
        onError ? onError(error) : (this.errorMessage = error.error);
      },
    });
  }

  signIn($event?: MouseEvent) {
    $event && $event.preventDefault();

    const { email, password } = this.authFormControl.value;
    this.handleAuthRequest(
      () => this.authService.signIn(email, password),
      () => this.router.navigate(['/shooting']),
      (error) => {
        if (error.error === 'User not found') {
          this.currentStage = AuthStage.NO_USER;
        } else {
          this.errorMessage = error.error;
        }
      }
    );
  }

  requestVerificationCode($event?: MouseEvent) {
    $event && $event.preventDefault();

    const { email } = this.authFormControl.value;
    this.handleAuthRequest(
      () => this.authService.requestVerificationCode(email),
      () => (this.currentStage = AuthStage.VERIFY_CODE)
    );
  }

  signUp($event?: MouseEvent) {
    $event && $event.preventDefault();

    if (this.codeFormControl.invalid) return;
    const { email, password } = this.authFormControl.value;
    const { verificationCode } = this.codeFormControl.value;
    this.handleAuthRequest(
      () => this.authService.signUp(email, password, verificationCode),
      () => this.signIn()
    );
  }

  requestPasswordChange($event?: MouseEvent) {
    $event && $event.preventDefault();

    const { email } = this.authFormControl.value;
    this.handleAuthRequest(
      () => this.authService.requestVerificationCode(email),
      () => (this.currentStage = AuthStage.PASSWORD_RESET)
    );
  }

  confirmPasswordChange($event?: MouseEvent) {
    $event && $event.preventDefault();

    if (this.resetFormControl.invalid) return;
    const { email, password } = this.authFormControl.value;
    const { verificationCode } = this.resetFormControl.value;
    this.handleAuthRequest(
      () =>
        this.authService.confirmPasswordChange(
          email,
          password,
          verificationCode
        ),
      () => this.signIn()
    );
  }

  changeShapesAnimationSpeed(isHovered: boolean) {
    this.shapesAnimationSpeed = isHovered ? 8 : 1;
  }
}
