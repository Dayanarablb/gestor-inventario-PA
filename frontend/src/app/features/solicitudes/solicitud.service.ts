import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Solicitud, CrearSolicitudRequest, DecisionSolicitudRequest, AuditoriaLog, PoliticaEmpresa } from '../../core/models/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SolicitudService {
  private readonly baseUrl = `${environment.apiUrl}/solicitudes`;
  private readonly apiBase = environment.apiUrl;

  constructor(private http: HttpClient) {}

  crearSolicitud(payload: CrearSolicitudRequest): Observable<Solicitud> {
    return this.http.post<Solicitud>(this.baseUrl, payload);
  }

  obtenerMisSolicitudes(): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(`${this.baseUrl}/mis-solicitudes`);
  }

  obtenerPendientesAprobacion(): Observable<Solicitud[]> {
    return this.http.get<Solicitud[]>(`${this.baseUrl}/pendientes-aprobacion`);
  }

  tomarDecision(solicitudId: number, decision: DecisionSolicitudRequest): Observable<Solicitud> {
    return this.http.patch<Solicitud>(`${this.baseUrl}/${solicitudId}/decision`, decision);
  }

  obtenerLogsAuditoria(): Observable<AuditoriaLog[]> {
    return this.http.get<AuditoriaLog[]>(`${this.apiBase}/auditoria/logs`);
  }

  obtenerPoliticas(): Observable<PoliticaEmpresa[]> {
    return this.http.get<PoliticaEmpresa[]>(`${this.apiBase}/politicas`);
  }
}
