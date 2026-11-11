import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ToastController } from '@ionic/angular';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class ApiService {
  private http = inject(HttpClient);
  private toastCtrl = inject(ToastController);
  private b = environment.apiUrl;

  // público
  activeFare() { return this.http.get<any>(`${this.b}/fares/active`); }

  // cliente
  estimate(body: any) { return this.http.post<any>(`${this.b}/client/estimate-fare`, body); }
  requestRide(body: any) { return this.http.post<any>(`${this.b}/client/ride-requests`, body); }
  clientActive() { return this.http.get<any>(`${this.b}/client/active`); }
  cancel(id: number, reason: string) { return this.http.post<any>(`${this.b}/client/cancel/${id}`, { reason }); }
  clientTrips() { return this.http.get<any>(`${this.b}/client/trips`); }
  rate(id: number, body: any) { return this.http.post<any>(`${this.b}/client/trips/${id}/rating`, body); }

  // conductor
  setAvailability(status: 'available' | 'unavailable') { return this.http.put<any>(`${this.b}/driver/availability`, { status }); }
  driverRequests() { return this.http.get<any>(`${this.b}/driver/ride-requests`); }
  accept(id: number) { return this.http.post<any>(`${this.b}/driver/ride-requests/${id}/accept`, {}); }
  arrive(id: number) { return this.http.post<any>(`${this.b}/driver/trips/${id}/arrive`, {}); }
  start(id: number) { return this.http.post<any>(`${this.b}/driver/trips/${id}/start`, {}); }
  complete(id: number, body: any) { return this.http.post<any>(`${this.b}/driver/trips/${id}/complete`, body); }
  sendLocation(body: any) { return this.http.post<any>(`${this.b}/driver/location`, body); }

  // admin
  dashboard() { return this.http.get<any>(`${this.b}/admin/dashboard`); }
  drivers(status?: string) { return this.http.get<any>(`${this.b}/admin/drivers`, { params: status ? { approval_status: status } : {} }); }
  approve(id: number, approval_status: string, admin_notes: string) { return this.http.patch<any>(`${this.b}/admin/drivers/${id}/approval`, { approval_status, admin_notes }); }
  fares() { return this.http.get<any>(`${this.b}/admin/fares`); }
  createFare(body: any) { return this.http.post<any>(`${this.b}/admin/fares`, body); }
  adminTrips(params: any = {}) { return this.http.get<any>(`${this.b}/admin/trips`, { params }); }
  reports() { return this.http.get<any>(`${this.b}/admin/reports`); }
  auditLogs() { return this.http.get<any>(`${this.b}/admin/audit-logs`); }

  async toast(message: string, color: 'success' | 'danger' | 'warning' = 'success') {
    const t = await this.toastCtrl.create({ message, duration: 2500, color, position: 'top' });
    await t.present();
  }

  errMsg(e: any): string {
    const err = e?.error;
    if (err?.errors) return Object.values(err.errors).flat().join(' ');
    return err?.message || (e?.status === 0 ? 'No se pudo conectar con el servidor' : 'Error inesperado');
  }
}
