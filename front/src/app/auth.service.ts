import { Injectable, signal, WritableSignal } from '@angular/core';
import { UserCredentials } from './models';
import { HttpClient } from '@angular/common/http';
import { AuthResponse } from './interfaces';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private API_URL = 'http://localhost:44044/WebLab4Back-1.0-SNAPSHOT/api/auth';
  userCredentials: WritableSignal<UserCredentials | null> = signal(null);

  constructor(private http: HttpClient) {}

  signIn(login: string, password: string): Observable<AuthResponse> {
    const oResult: Observable<AuthResponse> = this.http.post<AuthResponse>(
      `${this.API_URL}/login`,
      {
        login,
        password,
      }
    );
    oResult.subscribe({
      next: (result) => this.userCredentials.set({ login: result.login }),
    });
    return oResult;
  }

  signUp(login: string, password: string): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.API_URL}/login`, {
      login,
      password,
    });
  }

  signOut() {
    this.userCredentials.set(null);
  }
}
