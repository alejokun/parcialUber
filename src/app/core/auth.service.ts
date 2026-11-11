import { Injectable, computed, inject, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../environments/environment';
import { Role, User } from './models';

const TOKEN_KEY = 'uber_token';
const USER_KEY = 'uber_user';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private router = inject(Router);
  private base = environment.apiUrl;

  token = signal<string | null>(localStorage.getItem(TOKEN_KEY));
  user = signal<User | null>(JSON.parse(localStorage.getItem(USER_KEY) || 'null'));
  isLoggedIn = computed(() => !!this.token());

  homeFor(role: Role): string {
    return `/${role}`;
  }

  login(login: string, password: string) {
    return this.http.post<any>(`${this.base}/auth/login`, { login, password }).pipe(tap((r) => this.save(r)));
  }

  register(data: any) {
    return this.http.post<any>(`${this.base}/auth/register`, data).pipe(tap((r) => this.save(r)));
  }

  forgotPassword(email: string, new_password: string) {
    return this.http.post<any>(`${this.base}/auth/forgot-password`, { email, new_password });
  }

  logout() {
    this.http.post(`${this.base}/auth/logout`, {}).subscribe({ error: () => {} });
    this.clear();
  }

  clear() {
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    this.token.set(null);
    this.user.set(null);
    this.router.navigateByUrl('/login');
  }

  private save(r: any) {
    localStorage.setItem(TOKEN_KEY, r.access_token);
    localStorage.setItem(USER_KEY, JSON.stringify(r.user));
    this.token.set(r.access_token);
    this.user.set(r.user);
  }
}
