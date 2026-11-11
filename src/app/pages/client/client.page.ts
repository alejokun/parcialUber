import { Component, OnDestroy, OnInit, inject, signal } from '@angular/core';
import { DecimalPipe, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonSegment, IonSegmentButton, IonLabel,
  IonSelect, IonSelectOption, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonList, IonBadge, IonInput, IonTextarea, IonToggle,
} from '@ionic/angular';
import { ApiService } from '../../core/api.service';
import { AuthService } from '../../core/auth.service';
import { PLACES } from '../../core/places';
import { MapComponent, LatLng } from '../../core/map.component';

const STATUS: Record<string, string> = {
  requested: 'Buscando conductor…', assigned: 'Conductor asignado', driver_arrived: 'Tu conductor llegó',
  in_progress: 'Viaje en curso', completed: 'Completado', cancelled: 'Cancelado',
};

@Component({
  selector: 'app-client',
  imports: [
    FormsModule, MapComponent, DecimalPipe, DatePipe, IonHeader, IonToolbar, IonTitle, IonContent, IonButton, IonButtons, IonSegment, IonSegmentButton, IonLabel,
    IonSelect, IonSelectOption, IonCard, IonCardContent, IonCardHeader, IonCardTitle, IonItem, IonList, IonBadge, IonInput, IonTextarea, IonToggle,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-title>{{ tab === 'ride' ? 'Uber' : 'Mis viajes' }}</ion-title>
        <ion-buttons slot="start">
          <ion-button (click)="tab = tab === 'ride' ? 'history' : 'ride'; onTab()">{{ tab === 'ride' ? '🕘 Historial' : '🗺️ Mapa' }}</ion-button>
        </ion-buttons>
        <ion-buttons slot="end"><ion-button (click)="auth.logout()">Salir</ion-button></ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content [class.map-page]="tab === 'ride'">
      @if (tab === 'ride') {
        @if (active(); as a) {
          <div class="map-fill"><app-map [origin]="pt(a.data.origin_latitude, a.data.origin_longitude)" [destination]="pt(a.data.destination_latitude, a.data.destination_longitude)" [driver]="pt(a.data.driver?.latest_location?.latitude, a.data.driver?.latest_location?.longitude)" /></div>
          <div class="sheet">
            <h2>{{ statusText(a.data.status) }}</h2>
            @if (a.data.status === 'requested') { <p class="tip">Estamos buscando un conductor cercano. Verás aquí su ubicación y la del vehículo en cuanto acepte.</p> }
            @if (a.data.status === 'assigned' && !a.data.driver?.latest_location) { <p class="tip">Tu conductor viene en camino…</p> }
            @if (a.data.origin_name) {
              <div class="row"><span class="dot a"></span>{{ a.data.origin_name }}</div>
              <div class="row"><span class="dot b"></span>{{ a.data.destination_name }}</div>
            }
            <div class="row"><b>Tarifa estimada</b><span style="margin-left:auto">{{ a.data.estimated_fare | number }} COP</span></div>
            @if (a.data.driver) {
              <div class="row">👤 <span>{{ a.data.driver.user?.name }} · {{ a.data.driver.rating_average }} ★<br><small>{{ a.data.driver.user?.phone }}</small></span></div>
            }
            @if (a.data.vehicle; as v) {
              <div class="row">🚗 <span>{{ v.brand }} {{ v.model }} · {{ v.color }}</span><ion-badge color="dark" style="margin-left:auto">{{ v.plate }}</ion-badge></div>
            }
            @if (['requested','assigned','driver_arrived'].includes(a.data.status)) {
              <ion-button expand="block" color="danger" (click)="cancel(a)" style="margin-top:12px">Cancelar viaje</ion-button>
            }
          </div>
        } @else {
          <div class="map-fill"><app-map [origin]="origin()" [destination]="dest()" (pick)="onPick($event)" /></div>
          <div class="sheet">
            <h2>¿A dónde vamos?</h2>
            <ion-segment [(ngModel)]="mode">
              <ion-segment-button value="o"><ion-label>📍 Origen</ion-label></ion-segment-button>
              <ion-segment-button value="d"><ion-label>🏁 Destino</ion-label></ion-segment-button>
            </ion-segment>
            <p class="tip">Toca el mapa o elige un lugar para fijar el {{ mode === 'o' ? 'origen' : 'destino' }}.</p>
            <div class="chips">
              @for (p of places; track $index) { <button class="chip" (click)="quick($index)">{{ p.name }}</button> }
            </div>
            <div class="row"><span class="dot a"></span>{{ origin()?.name ?? 'Origen sin definir' }}</div>
            <div class="row"><span class="dot b"></span>{{ dest()?.name ?? 'Destino sin definir' }}</div>
            <ion-button expand="block" fill="clear" color="dark" (click)="useMyLocation()">📍 Usar mi ubicación como origen</ion-button>
            @if (estimate(); as e) {
              <p class="price">{{ e.estimated_fare | number }} {{ e.currency }}<small>{{ e.distance_km }} km · {{ e.duration_min }} min</small></p>
            }
            <ion-button expand="block" color="dark" size="large" (click)="request()" [disabled]="!estimate()">
              {{ !origin() || !dest() ? 'Elige origen y destino' : 'Pedir viaje' }}
            </ion-button>
          </div>
        }
      } @else {
        <div class="ion-padding">
          <ion-list lines="full">
            @for (t of trips(); track t.id) {
              <ion-item>
                <ion-label>
                  <h2>{{ t.driver?.user?.name ?? 'Sin conductor' }} · {{ t.vehicle?.plate }}</h2>
                  <p>{{ (t.completed_at ?? t.created_at) | date:'medium' }} · {{ statusText(t.status) }}</p>
                </ion-label>
                <ion-badge slot="end" color="dark">{{ (t.final_fare ?? t.estimated_fare) | number }}</ion-badge>
                @if (t.status === 'completed') { <ion-button slot="end" size="small" (click)="rating = { trip: t, score: 5, comment: '', has_incident: false }">Calificar</ion-button> }
              </ion-item>
            } @empty { <p class="ion-text-center">Aún no tienes viajes.</p> }
          </ion-list>
          @if (rating) {
            <ion-card>
              <ion-card-header><ion-card-title>Calificar viaje #{{ rating.trip.id }}</ion-card-title></ion-card-header>
              <ion-card-content>
                <ion-select label="Puntaje" [(ngModel)]="rating.score" interface="popover">
                  @for (s of [5,4,3,2,1]; track s) { <ion-select-option [value]="s">{{ s }} ★</ion-select-option> }
                </ion-select>
                <ion-textarea label="Comentario" labelPlacement="floating" [(ngModel)]="rating.comment" />
                <ion-toggle [(ngModel)]="rating.has_incident">Reportar incidente</ion-toggle>
                <ion-button expand="block" color="dark" (click)="sendRating()">Enviar</ion-button>
                <ion-button expand="block" fill="clear" (click)="rating = null">Cerrar</ion-button>
              </ion-card-content>
            </ion-card>
          }
        </div>
      }
    </ion-content>
  `,
  styles: [`ion-select { margin-bottom: 12px }`],
})
export class ClientPage implements OnInit, OnDestroy {
  api = inject(ApiService);
  auth = inject(AuthService);
  places = PLACES;
  tab: 'ride' | 'history' = 'ride';
  mode: 'o' | 'd' = 'o';
  reason = 'Cambio de planes';
  origin = signal<(LatLng & { name: string }) | null>(null);
  dest = signal<(LatLng & { name: string }) | null>(null);
  estimate = signal<any>(null);
  active = signal<any>(null);
  trips = signal<any[]>([]);
  rating: any = null;
  private timer: any;

  ngOnInit() {
    this.loadActive();
    this.timer = setInterval(() => this.tab === 'ride' && this.loadActive(), 5000);
  }
  ngOnDestroy() { clearInterval(this.timer); }

  statusText(s: string) { return STATUS[s] ?? s; }

  private changed() {
    this.estimate.set(null);
    if (this.origin() && this.dest()) this.doEstimate();
  }

  pt(lat?: number, lng?: number): LatLng | null {
    return lat == null || lng == null ? null : { lat: +lat, lng: +lng };
  }

  async onPick(p: LatLng) {
    const name = await this.reverse(p);
    if (this.mode === 'o') { this.origin.set({ ...p, name }); this.mode = 'd'; } else this.dest.set({ ...p, name });
    this.changed();
  }

  quick(i: number) {
    const p = this.places[i];
    const v = { lat: p.lat, lng: p.lng, name: p.name };
    if (this.mode === 'o') { this.origin.set(v); this.mode = 'd'; } else this.dest.set(v);
    this.changed();
  }

  useMyLocation() {
    navigator.geolocation?.getCurrentPosition(
      async (pos) => {
        const p = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        this.origin.set({ ...p, name: await this.reverse(p) });
        this.changed();
      },
      () => this.api.toast('No se pudo obtener tu ubicación', 'warning'),
    );
  }

  private async reverse(p: LatLng): Promise<string> {
    // 1) lugar conocido cercano (<250 m), funciona sin internet
    const near = this.places.find((x) => Math.hypot((x.lat - p.lat) * 111000, (x.lng - p.lng) * 110000) < 250);
    if (near) return near.name;
    const fallback = `Punto en el mapa (${p.lat.toFixed(4)}, ${p.lng.toFixed(4)})`;
    // 2) nombre de la calle por internet si hay, con timeout corto
    try {
      const r = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${p.lat}&lon=${p.lng}`, { signal: AbortSignal.timeout(2500) });
      const j = await r.json();
      return (j.display_name as string)?.split(',').slice(0, 3).join(',') || fallback;
    } catch { return fallback; }
  }

  loadActive() {
    const prev = this.active();
    this.api.clientActive().subscribe({
      next: (r) => {
        this.active.set(r.has_active ? r : null);
        if (prev && !r.has_active) { this.api.toast('Tu viaje terminó. Revisa el historial para calificar.'); this.estimate.set(null); }
      },
      error: () => {},
    });
  }

  onTab() { if (this.tab === 'history') this.loadTrips(); }
  loadTrips() { this.api.clientTrips().subscribe((r) => this.trips.set(r.trips?.data ?? r.trips ?? [])); }

  doEstimate() {
    const o = this.origin(), d = this.dest();
    if (!o || !d) return;
    this.api.estimate({ origin_latitude: o.lat, origin_longitude: o.lng, destination_latitude: d.lat, destination_longitude: d.lng })
      .subscribe({ next: (r) => this.estimate.set(r.estimate), error: (e) => this.api.toast(this.api.errMsg(e), 'danger') });
  }

  request() {
    const o = this.origin()!, d = this.dest()!;
    this.api.requestRide({
      origin_name: o.name, origin_latitude: o.lat, origin_longitude: o.lng,
      destination_name: d.name, destination_latitude: d.lat, destination_longitude: d.lng,
    }).subscribe({
      next: (r) => { this.api.toast(r.message); this.loadActive(); },
      error: (e) => { this.api.toast(this.api.errMsg(e), 'danger'); this.loadActive(); },
    });
  }

  cancel(a: any) {
    // para solicitudes el id es de la solicitud; para viajes la API usa el id del registro activo
    this.api.cancel(a.data.id, this.reason || 'Cancelado por el usuario').subscribe({
      next: (r) => { this.api.toast(r.message); this.active.set(null); this.estimate.set(null); },
      error: (e) => this.api.toast(this.api.errMsg(e), 'danger'),
    });
  }

  sendRating() {
    const { trip, score, comment, has_incident } = this.rating;
    this.api.rate(trip.id, { score, comment, has_incident }).subscribe({
      next: (r) => { this.api.toast(r.message); this.rating = null; },
      error: (e) => this.api.toast(this.api.errMsg(e), 'danger'),
    });
  }
}
