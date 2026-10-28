import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';
import { environment } from '../../environments/environment';

export type UserRole = 'admin' | 'client' | 'driver';

export interface AuthUser {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  status: string;
}

export interface AuthResponse {
  success: boolean;
  message?: string;
  access_token: string;
  token_type: string;
  expires_in: number;
  user: AuthUser;
}

export interface LoginRequest {
  login: string;
  password: string;
}

export interface RegisterRequest {
  name: string;
  email: string;
  phone: string;
  password: string;
  role: 'client' | 'driver';
  license_number?: string;
  plate?: string;
  brand?: string;
  model?: string;
  year?: number;
  capacity?: number;
  color?: string;
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/auth`;

  login(credentials: LoginRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/login`, credentials).pipe(
      tap((response) => this.saveSession(response)),
    );
  }

  register(data: RegisterRequest): Observable<AuthResponse> {
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, data).pipe(
      tap((response) => this.saveSession(response)),
    );
  }

  logout(): Observable<{ success: boolean; message: string }> {
    return this.http.post<{ success: boolean; message: string }>(
      `${this.apiUrl}/logout`,
      {},
    ).pipe(
      tap(() => this.clearSession()),
    );
  }

  clearSession(): void {
    localStorage.removeItem('uber_access_token');
    localStorage.removeItem('uber_user');
  }

  getToken(): string | null {
    return localStorage.getItem('uber_access_token');
  }

  getUser(): AuthUser | null {
    const storedUser = localStorage.getItem('uber_user');
    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser) as AuthUser;
    } catch {
      this.clearSession();
      return null;
    }
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  private saveSession(response: AuthResponse): void {
    localStorage.setItem('uber_access_token', response.access_token);
    localStorage.setItem('uber_user', JSON.stringify(response.user));
  }
}
