import { Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { IonContent, IonInput, IonButton, IonSegment, IonSegmentButton, IonLabel, IonItem, IonSpinner } from '@ionic/angular';
import { AuthService } from '../../core/auth.service';
import { ApiService } from '../../core/api.service';

@Component({
  selector: 'app-register',
  imports: [FormsModule, RouterLink, IonContent, IonInput, IonButton, IonSegment, IonSegmentButton, IonLabel, IonItem, IonSpinner],
  template: `
    <ion-content class="ion-padding">
      <div class="wrap">
        <h2>Crear cuenta</h2>
        <ion-segment [(ngModel)]="role">
          <ion-segment-button value="client"><ion-label>Cliente</ion-label></ion-segment-button>
          <ion-segment-button value="driver"><ion-label>Conductor</ion-label></ion-segment-button>
        </ion-segment>
        <ion-item><ion-input label="Nombre" labelPlacement="floating" [(ngModel)]="f.name" /></ion-item>
        <ion-item><ion-input label="Correo" labelPlacement="floating" type="email" [(ngModel)]="f.email" /></ion-item>
        <ion-item><ion-input label="Teléfono" labelPlacement="floating" type="tel" [(ngModel)]="f.phone" /></ion-item>
        <ion-item><ion-input label="Contraseña" labelPlacement="floating" type="password" [(ngModel)]="f.password" /></ion-item>
        @if (role === 'driver') {
          <ion-item><ion-input label="N° licencia" labelPlacement="floating" [(ngModel)]="f.license_number" /></ion-item>
          <ion-item><ion-input label="Placa" labelPlacement="floating" [(ngModel)]="f.plate" /></ion-item>
          <ion-item><ion-input label="Marca" labelPlacement="floating" [(ngModel)]="f.brand" /></ion-item>
          <ion-item><ion-input label="Modelo" labelPlacement="floating" [(ngModel)]="f.model" /></ion-item>
          <ion-item><ion-input label="Año" labelPlacement="floating" type="number" [(ngModel)]="f.year" /></ion-item>
          <ion-item><ion-input label="Capacidad" labelPlacement="floating" type="number" [(ngModel)]="f.capacity" /></ion-item>
          <ion-item><ion-input label="Color" labelPlacement="floating" [(ngModel)]="f.color" /></ion-item>
        }
        <ion-button expand="block" color="dark" (click)="submit()" [disabled]="loading()">
          @if (loading()) { <ion-spinner name="dots" /> } @else { Registrarme }
        </ion-button>
        <ion-button expand="block" fill="clear" color="dark" routerLink="/login">Ya tengo cuenta</ion-button>
      </div>
    </ion-content>
  `,
  styles: [`
    .wrap { max-width: 420px; margin: 2vh auto 24px; }
    h2 { font-size: 1.7rem; font-weight: 800; margin: 8px 0 18px; }
    ion-item, ion-segment { margin-bottom: 12px; }
    ion-button { margin-top: 8px; }
  `],
})
export class RegisterPage {
  private auth = inject(AuthService);
  private api = inject(ApiService);
  private router = inject(Router);
  role: 'client' | 'driver' = 'client';
  loading = signal(false);
  f: any = { name: '', email: '', phone: '', password: '', license_number: '', plate: '', brand: '', model: '', year: 2024, capacity: 4, color: '' };

  submit() {
    const base = { name: this.f.name, email: this.f.email, phone: this.f.phone, password: this.f.password, role: this.role };
    const body = this.role === 'driver'
      ? { ...base, license_number: this.f.license_number, plate: this.f.plate, brand: this.f.brand, model: this.f.model, year: +this.f.year, capacity: +this.f.capacity, color: this.f.color }
      : base;
    this.loading.set(true);
    this.auth.register(body).subscribe({
      next: (r) => { this.loading.set(false); this.router.navigateByUrl(this.auth.homeFor(r.user.role)); },
      error: (e) => { this.loading.set(false); this.api.toast(this.api.errMsg(e), 'danger'); },
    });
  }
}
