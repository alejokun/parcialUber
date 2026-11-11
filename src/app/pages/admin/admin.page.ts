import { Component, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonSegment, IonSegmentButton, IonLabel, IonCard, IonCardContent,
  IonCardHeader, IonCardTitle, IonItem, IonList, IonBadge, IonInput, IonToggle,
} from '@ionic/angular';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';

@Component({
  selector: 'app-admin',
  imports: [
    FormsModule, DecimalPipe, DatePipe, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonSegment, IonSegmentButton, IonLabel,
    IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonList, IonBadge, IonInput, IonToggle,
  ],
  template: `
    <ion-header>
      <ion-toolbar color="dark">
        <ion-title>Admin</ion-title>
        <ion-buttons slot="end"><ion-button (click)="auth.logout()">Salir</ion-button></ion-buttons>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [(ngModel)]="tab" (ionChange)="load()" scrollable>
          <ion-segment-button value="dash"><ion-label>Panel</ion-label></ion-segment-button>
          <ion-segment-button value="drivers"><ion-label>Conductores</ion-label></ion-segment-button>
          <ion-segment-button value="fares"><ion-label>Tarifas</ion-label></ion-segment-button>
          <ion-segment-button value="trips"><ion-label>Viajes</ion-label></ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      @switch (tab) {
        @case ('dash') {
          @if (stats(); as s) {
            <div class="grid">
              @for (k of kpis; track k[0]) {
                <ion-card><ion-card-content><small>{{ k[1] }}</small><div class="n">{{ s[k[0]] | number }}</div></ion-card-content></ion-card>
              }
            </div>
          }
        }
        @case ('drivers') {
          @for (d of drivers(); track d.id) {
            <ion-card>
              <ion-card-header><ion-card-title>{{ d.user?.name }} <ion-badge [color]="d.approval_status === 'approved' ? 'success' : d.approval_status === 'pending' ? 'warning' : 'danger'">{{ d.approval_status }}</ion-badge></ion-card-title></ion-card-header>
              <ion-card-content>
                <p>{{ d.user?.email }} · Licencia {{ d.license_number }}</p>
                @for (v of d.vehicles; track v.plate) { <p>{{ v.brand }} {{ v.model }} {{ v.year }} · {{ v.plate }}</p> }
                <ion-button size="small" color="success" (click)="approve(d, 'approved')">Aprobar</ion-button>
                <ion-button size="small" color="warning" (click)="approve(d, 'suspended')">Suspender</ion-button>
                <ion-button size="small" color="danger" (click)="approve(d, 'rejected')">Rechazar</ion-button>
              </ion-card-content>
            </ion-card>
          }
        }
        @case ('fares') {
          <ion-list>
            @for (f of fares(); track f.id) {
              <ion-item>
                <ion-label><h2>{{ f.name }} @if (f.active) { <ion-badge color="success">activa</ion-badge> }</h2>
                <p>Base {{ f.base_fare }} · km {{ f.price_per_km }} · min {{ f.price_per_minute }} · mín {{ f.minimum_fare }} · x{{ f.surge_multiplier }}</p></ion-label>
              </ion-item>
            }
          </ion-list>
          <ion-card>
            <ion-card-header><ion-card-title>Nueva tarifa</ion-card-title></ion-card-header>
            <ion-card-content>
              <ion-item><ion-input label="Nombre" labelPlacement="floating" [(ngModel)]="nf.name" /></ion-item>
              <ion-item><ion-input label="Tarifa base" labelPlacement="floating" type="number" [(ngModel)]="nf.base_fare" /></ion-item>
              <ion-item><ion-input label="Precio por km" labelPlacement="floating" type="number" [(ngModel)]="nf.price_per_km" /></ion-item>
              <ion-item><ion-input label="Precio por minuto" labelPlacement="floating" type="number" [(ngModel)]="nf.price_per_minute" /></ion-item>
              <ion-item><ion-input label="Tarifa mínima" labelPlacement="floating" type="number" [(ngModel)]="nf.minimum_fare" /></ion-item>
              <ion-item><ion-input label="Multiplicador" labelPlacement="floating" type="number" step="0.1" [(ngModel)]="nf.surge_multiplier" /></ion-item>
              <ion-item><ion-toggle [(ngModel)]="nf.active">Activa</ion-toggle></ion-item>
              <ion-button expand="block" color="dark" (click)="createFare()">Crear</ion-button>
            </ion-card-content>
          </ion-card>
        }
        @case ('trips') {
          <ion-list>
            @for (t of trips(); track t.id) {
              <ion-item>
                <ion-label><h2>Viaje #{{ t.id }} <ion-badge color="dark">{{ t.status }}</ion-badge></h2>
                <p>{{ t.created_at | date:'short' }} · {{ (t.final_fare ?? t.estimated_fare) | number }} COP</p></ion-label>
              </ion-item>
            } @empty { <p class="ion-text-center">Sin viajes.</p> }
          </ion-list>
        }
      }
    </ion-content>
  `,
  styles: [`.grid{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:4px} ion-card small{color:var(--ion-color-medium);font-weight:600;text-transform:uppercase;font-size:.7rem;letter-spacing:.04em} .n{font-size:2rem;font-weight:800;letter-spacing:-.03em;margin-top:4px} ion-item{margin-bottom:8px}`],
})
export class AdminPage implements OnInit {
  api = inject(ApiService);
  auth = inject(AuthService);
  tab: 'dash' | 'drivers' | 'fares' | 'trips' = 'dash';
  stats = signal<any>(null);
  drivers = signal<any[]>([]);
  fares = signal<any[]>([]);
  trips = signal<any[]>([]);
  kpis: [string, string][] = [
    ['total_clients', 'Clientes'], ['total_drivers', 'Conductores'], ['pending_drivers', 'Pendientes'], ['approved_drivers', 'Aprobados'],
    ['active_trips', 'Viajes activos'], ['completed_trips', 'Completados'], ['cancelled_trips', 'Cancelados'], ['pending_requests', 'Solicitudes'], ['total_revenue', 'Ingresos COP'],
  ];
  nf: any = { name: '', base_fare: 3800, price_per_km: 1250, price_per_minute: 250, minimum_fare: 6500, surge_multiplier: 1, active: false };

  ngOnInit() { this.load(); }

  load() {
    const fail = (e: any) => this.api.toast(this.api.errMsg(e), 'danger');
    switch (this.tab) {
      case 'dash': this.api.dashboard().subscribe({ next: (r) => this.stats.set(r.stats), error: fail }); break;
      case 'drivers': this.api.drivers().subscribe({ next: (r) => this.drivers.set(r.drivers ?? []), error: fail }); break;
      case 'fares': this.api.fares().subscribe({ next: (r) => this.fares.set(r.fares?.data ?? r.fares ?? []), error: fail }); break;
      case 'trips': this.api.adminTrips().subscribe({ next: (r) => this.trips.set(r.trips?.data ?? r.trips ?? []), error: fail }); break;
    }
  }

  approve(d: any, status: string) {
    this.api.approve(d.id, status, `Actualizado desde la app (${status})`).subscribe({
      next: (r) => { this.api.toast(r.message); this.load(); },
      error: (e) => this.api.toast(this.api.errMsg(e), 'danger'),
    });
  }

  createFare() {
    const f = this.nf;
    const body = { ...f, base_fare: +f.base_fare, price_per_km: +f.price_per_km, price_per_minute: +f.price_per_minute, minimum_fare: +f.minimum_fare, surge_multiplier: +f.surge_multiplier };
    this.api.createFare(body).subscribe({
      next: (r) => { this.api.toast(r.message); this.load(); },
      error: (e) => this.api.toast(this.api.errMsg(e), 'danger'),
    });
  }
}
