import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonInput, IonButton, IonSpinner, IonItem } from '@ionic/angular';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-login',
  imports: [FormsModule, RouterLink, IonContent, IonInput, IonButton, IonSpinner, IonItem],
  template: `
    <ion-content class="ion-padding">
      <div class="wrap">
        <h1 class="brand">Uber</h1>
        <div class="card">
        @if (!forgot()) {
          <h2>Inicia sesión</h2>
          <ion-item><ion-input label="Correo o teléfono" labelPlacement="floating" [(ngModel)]="login" /></ion-item>
          <ion-item><ion-input label="Contraseña" labelPlacement="floating" type="password" [(ngModel)]="password" (keyup.enter)="submit()" /></ion-item>
          <ion-button expand="block" color="dark" (click)="submit()" [disabled]="loading()">
            @if (loading()) { <ion-spinner name="dots" /> } @else { Entrar }
          </ion-button>
          <ion-button expand="block" fill="clear" color="dark" (click)="forgot.set(true)">¿Olvidaste tu contraseña?</ion-button>
          <ion-button expand="block" fill="outline" color="dark" routerLink="/register">Crear cuenta</ion-button>
          <p class="hint">Demo: cliente&#64;uber.com / cliente123</p>
        } @else {
          <h2>Restablecer contraseña</h2>
          <ion-item><ion-input label="Correo" labelPlacement="floating" type="email" [(ngModel)]="email" /></ion-item>
          <ion-item><ion-input label="Nueva contraseña" labelPlacement="floating" type="password" [(ngModel)]="newPassword" /></ion-item>
          <ion-button expand="block" color="dark" (click)="reset()" [disabled]="loading()">Restablecer</ion-button>
          <ion-button expand="block" fill="clear" color="dark" (click)="forgot.set(false)">Volver</ion-button>
        }
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    ion-content { --background: linear-gradient(180deg, #000 0, #000 34%, #fff 34%); }
    .wrap { max-width: 420px; margin: 6vh auto 0; }
    .brand { font-size: 3.4rem; font-weight: 800; letter-spacing: -3px; margin: 0 0 28px; color: #fff; }
    .card { background: #fff; border-radius: 20px; padding: 22px 18px 14px; box-shadow: 0 8px 32px rgba(0,0,0,.18); }
    h2 { margin: 0 0 16px; font-size: 1.4rem; font-weight: 800; }
    ion-item { margin-bottom: 12px; }
    ion-button { margin-top: 8px; }
    .hint { text-align: center; color: var(--ion-color-medium); font-size: .8rem; margin: 14px 0 4px; }
  `],
})
export class LoginPage {
  private auth = inject(AuthService);
  private api = inject(ApiService);
  private router = inject(Router);
  login = ''; password = ''; email = ''; newPassword = '';
  loading = signal(false);
  forgot = signal(false);

  submit() {
    if (!this.login || !this.password) return;
    this.loading.set(true);
    this.auth.login(this.login, this.password).subscribe({
      next: (r) => { this.loading.set(false); this.router.navigateByUrl(this.auth.homeFor(r.user.role)); },
      error: (e) => { this.loading.set(false); this.api.toast(this.api.errMsg(e), 'danger'); },
    });
  }

  reset() {
    this.loading.set(true);
    this.auth.forgotPassword(this.email, this.newPassword).subscribe({
      next: (r) => { this.loading.set(false); this.api.toast(r.message); this.forgot.set(false); },
      error: (e) => { this.loading.set(false); this.api.toast(this.api.errMsg(e), 'danger'); },
    });
  }
}
