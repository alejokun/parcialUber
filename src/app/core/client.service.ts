import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

export interface FareEstimate {
  distance_km: number;
  duration_min: number;
  estimated_fare: number;
  currency: string;
  fare_breakdown: {
    base_fare: number;
    price_per_km: number;
    price_per_minute: number;
    minimum_fare: number;
    surge_multiplier: number;
  };
}

export interface RideRequest {
  origin_name: string;
  origin_latitude: number;
  origin_longitude: number;
  destination_name: string;
  destination_latitude: number;
  destination_longitude: number;
}

@Injectable({ providedIn: 'root' })
export class ClientService {
  private readonly http = inject(HttpClient);
  private readonly apiUrl = `${environment.apiUrl}/client`;

  estimateFare(data: Pick<RideRequest, 'origin_latitude' | 'origin_longitude' | 'destination_latitude' | 'destination_longitude'>): Observable<{ success: boolean; estimate: FareEstimate }> {
    return this.http.post<{ success: boolean; estimate: FareEstimate }>(
      `${this.apiUrl}/estimate-fare`,
      data,
    );
  }

  createRideRequest(data: RideRequest): Observable<{ success: boolean; message: string; ride_request: { id: number; status: string; estimated_fare: number } }> {
    return this.http.post<{ success: boolean; message: string; ride_request: { id: number; status: string; estimated_fare: number } }>(
      `${this.apiUrl}/ride-requests`,
      data,
    );
  }
}
