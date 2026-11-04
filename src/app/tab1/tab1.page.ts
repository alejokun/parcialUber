import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, inject } from '@angular/core';
import { CurrencyPipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonButton,
  IonCard,
  IonCardContent,
  IonContent,
  IonIcon,
  IonInput,
  IonItem,
  IonLabel,
  IonSpinner,
  IonText,
} from '@ionic/angular';
import { addIcons } from 'ionicons';
import { arrowForward, car, locate, pin, search } from 'ionicons/icons';
import * as L from 'leaflet';
import { ClientService } from '../core/client.service';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  imports: [
    FormsModule,
    CurrencyPipe,
    IonButton,
    IonCard,
    IonCardContent,
    IonContent,
    IonIcon,
    IonInput,
    IonItem,
    IonLabel,
    IonSpinner,
    IonText,
  ],
})
export class Tab1Page implements AfterViewInit, OnDestroy {
  private readonly clientService = inject(ClientService);
  private map?: L.Map;
  private readonly originCoordinates: L.LatLngTuple = [4.6766, -74.0483];
  private readonly destinationCoordinates: L.LatLngTuple = [4.6664, -74.0536];

  @ViewChild('realMap') private mapElement?: ElementRef<HTMLDivElement>;

  origin = 'Parque de la 93';
  destination = 'Centro Comercial Andino';
  estimate?: {
    distance_km: number;
    duration_min: number;
    estimated_fare: number;
  };
  errorMessage = '';
  successMessage = '';
  isLoading = false;
  isRequesting = false;

  constructor() {
    addIcons({ arrowForward, car, locate, pin, search });
  }

  ngAfterViewInit(): void {
    this.initializeMap();
  }

  ngOnDestroy(): void {
    this.map?.remove();
  }

  centerMap(): void {
    this.map?.fitBounds(
      L.latLngBounds([this.originCoordinates, this.destinationCoordinates]),
      { padding: [40, 40] },
    );
  }

  estimateRide(): void {
    this.errorMessage = '';
    this.successMessage = '';
    this.isLoading = true;
    this.clientService.estimateFare(this.coordinates).subscribe({
      next: (response) => {
        this.estimate = response.estimate;
        this.isLoading = false;
      },
      error: () => {
        this.errorMessage = 'No se pudo calcular la tarifa. Verifica la conexión con el servidor.';
        this.isLoading = false;
      },
    });
  }

  requestRide(): void {
    if (!this.estimate) {
      this.estimateRide();
      return;
    }

    this.errorMessage = '';
    this.successMessage = '';
    this.isRequesting = true;
    this.clientService.createRideRequest({
      ...this.coordinates,
      origin_name: this.origin,
      destination_name: this.destination,
    }).subscribe({
      next: (response) => {
        this.successMessage = response.message;
        this.isRequesting = false;
      },
      error: (error: { error?: { message?: string } }) => {
        this.errorMessage = error.error?.message
          ?? 'No se pudo crear la solicitud. Puede que ya tengas un viaje activo.';
        this.isRequesting = false;
      },
    });
  }

  private get coordinates() {
    return {
      origin_latitude: this.originCoordinates[0],
      origin_longitude: this.originCoordinates[1],
      destination_latitude: this.destinationCoordinates[0],
      destination_longitude: this.destinationCoordinates[1],
    };
  }

  private initializeMap(): void {
    if (!this.mapElement) {
      return;
    }

    this.map = L.map(this.mapElement.nativeElement, {
      zoomControl: false,
      attributionControl: true,
    });

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors',
    }).addTo(this.map);

    const originIcon = L.divIcon({
      className: 'custom-map-marker',
      html: '<span class="origin-marker"><span></span></span>',
      iconSize: [24, 24],
      iconAnchor: [12, 12],
    });
    const destinationIcon = L.divIcon({
      className: 'custom-map-marker',
      html: '<span class="destination-marker">●</span>',
      iconSize: [28, 28],
      iconAnchor: [14, 14],
    });

    L.marker(this.originCoordinates, { icon: originIcon })
      .addTo(this.map)
      .bindTooltip('Tu ubicación', { direction: 'top', offset: [0, -10] });
    L.marker(this.destinationCoordinates, { icon: destinationIcon })
      .addTo(this.map)
      .bindTooltip('Destino', { direction: 'top', offset: [0, -12] });

    L.polyline([this.originCoordinates, this.destinationCoordinates], {
      color: '#172126',
      dashArray: '8 8',
      weight: 4,
    }).addTo(this.map);

    setTimeout(() => {
      this.map?.invalidateSize();
      this.centerMap();
    });
  }
}
