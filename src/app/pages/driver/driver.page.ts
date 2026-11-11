import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons,
  IonToggle, IonItem, IonInput, IonBadge,
} from '@ionic/angular';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { MapComponent, LatLng } from '../../core/map.component';

const KEY = 'driver_active_trip';

@Component({
  selector: 'app-driver',
  imports: [
    FormsModule, MapComponent, DecimalPipe, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons,
    IonToggle, IonItem, IonInput, IonBadge,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>Conductor</ion-title>
        <ion-buttons slot="end">
          <ion-toggle [checked]="online()" (ionChange)="toggle($event)" [disabled]="!!trip()" style="margin-right:8px">{{ online() ? 'En línea' : 'Offline' }}</ion-toggle>
          <ion-button (click)="auth.logout()">Salir</ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="map-page">
      <div class="map-fill">
        @if (trip(); as t) {
          <app-map [origin]="pt(t.req.origin_latitude, t.req.origin_longitude)" [destination]="pt(t.req.destination_latitude, t.req.destination_longitude)" [driver]="me()" />
        } @else {
          <app-map [driver]="me()" [origin]="sel() ? pt(sel().origin_latitude, sel().origin_longitude) : null" [destination]="sel() ? pt(sel().destination_latitude, sel().destination_longitude) : null" />
        }
      </div>

      <div class="sheet">
        @if (approval(); as a) {
          <h2>Cuenta {{ a }}</h2>
          <p class="tip">Un administrador debe aprobar tu cuenta antes de que puedas conectarte y recibir viajes.</p>
        } @else if (trip(); as t) {
          <h2>Viaje #{{ t.trip.id }} <ion-badge color="dark">{{ t.trip.status }}</ion-badge></h2>
          <div class="row"><span class="dot a"></span>{{ t.req.origin_name }}</div>
          <div class="row"><span class="dot b"></span>{{ t.req.destination_name }}</div>
          <div class="row">👤 {{ t.req.client?.name }} · {{ t.req.client?.phone }}<b style="margin-left:auto">{{ t.trip.estimated_fare | number }} COP</b></div>
          @switch (t.trip.status) {
            @case ('assigned') { <ion-button expand="block" color="dark" (click)="step('arrive')">Llegué al punto de recogida</ion-button> }
            @case ('driver_arrived') { <ion-button expand="block" color="dark" (click)="step('start')">Iniciar viaje</ion-button> }
            @case ('in_progress') {
              <ion-item><ion-input label="Distancia real (km)" labelPlacement="floating" type="number" [(ngModel)]="km" /></ion-item>
              <ion-item><ion-input label="Duración real (min)" labelPlacement="floating" type="number" [(ngModel)]="min" /></ion-item>
              <ion-button expand="block" color="success" (click)="finish()">Finalizar viaje</ion-button>
            }
          }
        } @else if (online()) {
          <h2>Solicitudes cercanas</h2>
          @for (r of requests(); track r.id) {
            <div class="row" (click)="sel.set(r)" [style.background]="sel()?.id === r.id ? '#f2f2f2' : ''" style="cursor:pointer">
              <div style="flex:1"><b>{{ r.origin_name }}</b> → {{ r.destination_name }}<br><small>{{ r.estimated_distance_km }} km · {{ r.estimated_fare | number }} COP · {{ r.client?.name }}</small></div>
              <ion-button size="small" color="dark" (click)="accept(r); $event.stopPropagation()">Aceptar</ion-button>
            </div>
          } @empty { <p class="tip">Sin solicitudes por ahora…</p> }
        } @else {
          <h2>Estás desconectado</h2>
          <p class="tip">Activa «En línea» arriba para recibir solicitudes.</p>
        }
      </div>
    </ion-content>
  `,
  styles: [`ion-item{margin-bottom:8px}`],
})
export class DriverPage implements OnInit, OnDestroy {
  api = inject(ApiService);
  auth = inject(AuthService);
  online = signal(false);
  approval = signal<string | null>(null);
  me = signal<LatLng | null>(null);
  sel = signal<any>(null);
  requests = signal<any[]>([]);
  trip = signal<{ trip: any; req: any } | null>(JSON.parse(localStorage.getItem(KEY) || 'null'));
  km: number | null = null; min: number | null = null;
  private poll: any; private gps: any;

  ngOnInit() {
    this.poll = setInterval(() => this.online() && !this.trip() && this.loadRequests(), 5000);
    this.gps = setInterval(() => this.online() && this.pushLocation(), 10000);
    if (this.trip()) this.online.set(true);
  }
  ngOnDestroy() { clearInterval(this.poll); clearInterval(this.gps); }

  toggle(ev: any) {
    const on = ev.detail.checked as boolean;
    if (on === this.online()) return;
    this.api.setAvailability(on ? 'available' : 'unavailable').subscribe({
      next: () => { this.approval.set(null); this.online.set(on); if (on) { this.loadRequests(); this.pushLocation(); } },
      error: (e) => {
        if (e.error?.approval_status) this.approval.set(e.error.approval_status);
        this.api.toast(this.api.errMsg(e), 'danger');
        setTimeout(() => (ev.target.checked = this.online()));
      },
    });
  }

  pt(lat?: number, lng?: number): LatLng | null { return lat == null || lng == null ? null : { lat: +lat, lng: +lng }; }

  loadRequests() { this.api.driverRequests().subscribe({ next: (r) => this.requests.set(r.requests ?? []), error: () => {} }); }

  accept(req: any) {
    this.api.accept(req.id).subscribe({
      next: (r) => { this.setTrip({ trip: r.trip, req }); this.km = req.estimated_distance_km; this.min = req.estimated_duration_min ?? 5; this.api.toast(r.message); },
      error: (e) => { this.api.toast(this.api.errMsg(e), e.status === 409 ? 'warning' : 'danger'); this.loadRequests(); },
    });
  }

  step(action: 'arrive' | 'start') {
    const t = this.trip()!;
    this.api[action](t.trip.id).subscribe({
      next: (r) => { this.setTrip({ ...t, trip: { ...t.trip, ...r.trip } }); this.api.toast(r.message); },
      error: (e) => this.api.toast(this.api.errMsg(e), 'danger'),
    });
  }

  finish() {
    const t = this.trip()!;
    this.api.complete(t.trip.id, { actual_distance_km: +this.km!, actual_duration_min: +this.min! }).subscribe({
      next: (r) => { this.api.toast(`${r.message} Total: ${r.trip.final_fare} COP`); this.setTrip(null); this.loadRequests(); },
      error: (e) => this.api.toast(this.api.errMsg(e), 'danger'),
    });
  }

  private setTrip(v: { trip: any; req: any } | null) {
    this.trip.set(v);
    v ? localStorage.setItem(KEY, JSON.stringify(v)) : localStorage.removeItem(KEY);
  }

  private pushLocation() {
    const send = (latitude: number, longitude: number, heading?: number | null, speed?: number | null) => {
      this.me.set({ lat: latitude, lng: longitude });
      this.api.sendLocation({ latitude, longitude, heading: heading ?? 0, speed: speed ?? 0, trip_id: this.trip()?.trip.id }).subscribe({ error: () => {} });
    };
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (p) => send(p.coords.latitude, p.coords.longitude, p.coords.heading, p.coords.speed),
        () => send(2.9273, -75.2819),
        { timeout: 5000 },
      );
    } else send(2.9273, -75.2819);
  }
}
