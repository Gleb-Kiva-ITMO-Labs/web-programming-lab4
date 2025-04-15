import { Injectable, signal, WritableSignal } from '@angular/core';
import { UserCredentials } from './models';
import { HttpClient } from '@angular/common/http';
import { AuthResponse } from './interfaces';
import { Observable, shareReplay, tap } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL =
    'http://localhost:8080/shooter-1.0-SNAPSHOT/api/auth';
  userCredentials: WritableSignal<UserCredentials | null> = signal(null);

  constructor(private http: HttpClient) {
    const storedEmail = localStorage.getItem('email');
    const storedToken = localStorage.getItem('auth_token');
    if (storedEmail && storedToken) {
      this.userCredentials.set(new UserCredentials(storedEmail));
    } else {
      this.signOut();
    }
  }

  signIn(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/signin`, {
        email,
        password,
      })
      .pipe(
        shareReplay(1),
        tap({
          next: (result) => this.handleSignInSuccess(result),
          error: (err) => console.error('Sign in failed:', err),
        })
      );
  }

  private handleSignInSuccess(result: AuthResponse): void {
    this.userCredentials.set(new UserCredentials(result.email));
    localStorage.setItem('auth_token', result.token);
    localStorage.setItem('email', result.email);
  }

  isSignedIn(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  requestVerificationCode(email: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/request-2fa`, {
        email,
      })
      .pipe(
        shareReplay(1),
        tap({
          error: (err) =>
            console.error("Verification code can't be received:", err),
        })
      );
  }

  signUp(
    email: string,
    password: string,
    verificationCode: string
  ): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/signup`, {
        email: email,
        password: password,
        verificationCode: verificationCode,
      })
      .pipe(
        shareReplay(1),
        tap({
          error: (err) => console.error('Sign up failed:', err),
        })
      );
  }

  requestPasswordReset(email: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/request-password-reset`, {
        email,
      })
      .pipe(
        shareReplay(1),
        tap({
          error: (err) => console.error('Password reset request failed:', err),
        })
      );
  }

  confirmPasswordChange(
    email: string,
    password: string,
    verificationCode: string
  ): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/reset-password`, {
        email,
        password,
        verificationCode,
      })
      .pipe(
        shareReplay(1),
        tap({
          next: (result) => this.handleSignInSuccess(result),
          error: (err) => console.error('Password reset failed:', err),
        })
      );
  }

  signOut() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('email');
    this.userCredentials.set(null);
  }
}
