import { AfterViewInit, Component, ElementRef, OnDestroy, ViewChild, effect, input, output } from '@angular/core';
import * as L from 'leaflet';
import { NEIVA_CENTER } from './places';

export interface LatLng { lat: number; lng: number; }

const pin = (color: string, label: string) =>
  L.divIcon({
    className: '',
    html: `<div style="background:${color};color:#fff;width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;border:2px solid #fff;box-shadow:0 2px 6px #0006"><b style="transform:rotate(45deg);font-size:13px">${label}</b></div>`,
    iconSize: [30, 30], iconAnchor: [15, 30],
  });
const carIcon = L.divIcon({ className: '', html: '<div style="font-size:28px;filter:drop-shadow(0 2px 3px #0008)">🚗</div>', iconSize: [30, 30], iconAnchor: [15, 15] });

@Component({
  selector: 'app-map',
  template: `<div #el class="map"></div>`,
  styles: [`:host{display:block;position:absolute;inset:0} .map{width:100%;height:100%;z-index:0}`],
})
export class MapComponent implements AfterViewInit, OnDestroy {
  @ViewChild('el') el!: ElementRef<HTMLDivElement>;
  origin = input<LatLng | null>(null);
  destination = input<LatLng | null>(null);
  driver = input<LatLng | null>(null);
  pick = output<LatLng>();

  private map!: L.Map;
  private layer = L.layerGroup();
  private ro?: ResizeObserver;
  private t: any;
  private off?: () => void;

  ngAfterViewInit() {
    this.map = L.map(this.el.nativeElement, { zoomControl: false, scrollWheelZoom: true, minZoom: 12, zoomSnap: 0.5, wheelPxPerZoomLevel: 90 })
      .setView([NEIVA_CENTER.lat, NEIVA_CENTER.lng], 13);
    L.control.zoom({ position: 'topright' }).addTo(this.map);
    // Mosaicos de OpenStreetMap (requiere internet). Para modo sin conexión ver MAPA_OFFLINE en el README.
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      minZoom: 12, maxZoom: 19, attribution: '© OpenStreetMap contributors',
    }).addTo(this.map);
    this.map.setMaxBounds([[2.78, -75.36], [3.0, -75.22]]);
    this.layer.addTo(this.map);
    this.map.on('click', (e: L.LeafletMouseEvent) => this.pick.emit({ lat: e.latlng.lat, lng: e.latlng.lng }));
    const fix = () => { clearTimeout(this.t); this.t = setTimeout(() => this.map?.invalidateSize({ pan: false }), 80); };
    this.ro = new ResizeObserver(fix);
    this.ro.observe(this.el.nativeElement);
    window.addEventListener('resize', fix);
    this.off = () => window.removeEventListener('resize', fix);
    setTimeout(fix, 300); // tras la animación de entrada de la página
    this.draw(true);
  }

  constructor() { effect(() => { this.origin(); this.destination(); this.driver(); this.draw(); }); }
  ngOnDestroy() { this.off?.(); clearTimeout(this.t); this.ro?.disconnect(); this.map?.remove(); }

  private draw(first = false) {
    if (!this.map) return;
    this.layer.clearLayers();
    const o = this.origin(), d = this.destination(), c = this.driver();
    const pts: L.LatLngExpression[] = [];
    if (o) { L.marker([o.lat, o.lng], { icon: pin('#000', 'A') }).addTo(this.layer); pts.push([o.lat, o.lng]); }
    if (d) { L.marker([d.lat, d.lng], { icon: pin('#276ef1', 'B') }).addTo(this.layer); pts.push([d.lat, d.lng]); }
    if (o && d) L.polyline([[o.lat, o.lng], [d.lat, d.lng]], { color: '#000', weight: 4, dashArray: '8 8' }).addTo(this.layer);
    if (c) { L.marker([c.lat, c.lng], { icon: carIcon }).addTo(this.layer); pts.push([c.lat, c.lng]); }
    if (pts.length > 1) this.map.fitBounds(L.latLngBounds(pts), { padding: [40, 40] });
    else if (pts.length === 1 && !first) this.map.setView(pts[0], 15);
  }
}
