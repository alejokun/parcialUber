export type Role = 'admin' | 'client' | 'driver';

export interface User {
  id: number;
  name: string;
  email: string;
  phone?: string;
  role: Role;
  status: string;
}

export interface Fare {
  id?: number;
  name: string;
  base_fare: number;
  price_per_km: number;
  price_per_minute: number;
  minimum_fare: number;
  surge_multiplier: number;
  active: boolean;
}

export interface Place {
  name: string;
  lat: number;
  lng: number;
}

export interface Estimate {
  distance_km: number;
  duration_min: number;
  estimated_fare: number;
  currency: string;
}
