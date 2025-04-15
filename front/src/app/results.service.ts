import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, shareReplay, tap } from 'rxjs';

export interface ResultInfo {
  x: number;
  y: number;
  r: number;
  isHit: boolean;
  scriptTime: string;
  startTime: string;
}

export interface UserStats {
  email: string;
  totalResults: string;
  hits: string;
  misses: string;
}

@Injectable({
  providedIn: 'root',
})
export class ResultsService {
  private readonly API_URL =
    'http://localhost:8080/shooter-1.0-SNAPSHOT/api/results';

  constructor(private http: HttpClient) {}

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('auth_token');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
    });
  }

  addResult(x: number, y: number, shapeRadius: number): Observable<ResultInfo> {
    console.log('!!', x.toString());
    return this.http
      .post<ResultInfo>(
        `${this.API_URL}/add-result`,
        {
          x: x,
          y: y,
          shapeRadius: shapeRadius,
        },
        {
          headers: this.getHeaders(),
        }
      )
      .pipe(
        shareReplay(1),
        tap({
          next: (result) => console.log('Result added successfully:', result),
          error: (err) => console.error('Failed to add result:', err),
        })
      );
  }

  getResults(): Observable<ResultInfo[]> {
    return this.http
      .get<ResultInfo[]>(`${this.API_URL}/get-results`, {
        headers: this.getHeaders(),
      })
      .pipe(
        shareReplay(1),
        tap({
          next: () => console.log('Results fetched successfully'),
          error: (err) => console.error('Failed to fetch results:', err),
        })
      );
  }

  clearResults(): Observable<string> {
    return this.http
      .delete<string>(`${this.API_URL}/clear-results`, {
        headers: this.getHeaders(),
      })
      .pipe(
        shareReplay(1),
        tap({
          next: (response) => console.log('Results cleared successfully'),
          error: (err) => console.error('Failed to clear results:', err),
        })
      );
  }

  getUserStats(): Observable<UserStats> {
    return this.http
      .get<UserStats>(`${this.API_URL}/user-stats`, {
        headers: this.getHeaders(),
      })
      .pipe(
        shareReplay(1),
        tap({
          next: (stats) => console.log('User stats fetched successfully'),
          error: (err) => console.error('Failed to fetch user stats:', err),
        })
      );
  }
}
