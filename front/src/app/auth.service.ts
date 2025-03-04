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
    const storedLogin = localStorage.getItem('login');
    const storedToken = localStorage.getItem('auth_token');
    if (storedLogin && storedToken) {
      this.userCredentials.set(new UserCredentials(storedLogin));
    } else {
      this.signOut();
    }
  }

  signIn(login: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/login`, {
        login,
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
    this.userCredentials.set(new UserCredentials(result.login));
    localStorage.setItem('auth_token', result.token);
    localStorage.setItem('login', result.login);
  }

  isSignedIn(): boolean {
    return !!localStorage.getItem('auth_token');
  }

  signUp(login: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/register`, {
        login: login,
        password: password,
      })
      .pipe(
        shareReplay(1),
        tap({
          error: (err) => console.error('Sign up failed:', err),
        })
      );
  }

  signOut() {
    localStorage.removeItem('auth_token');
    localStorage.removeItem('login');
    this.userCredentials.set(null);
  }
}
