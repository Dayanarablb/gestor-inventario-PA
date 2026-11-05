import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { ChatResponse, ClasificacionResponse } from '../../core/models/models';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class IaAssistantService {
  private readonly baseUrl = `${environment.apiUrl}/ia`;

  constructor(private http: HttpClient) {}

  chat(mensaje: string): Observable<ChatResponse> {
    return this.http.post<ChatResponse>(`${this.baseUrl}/chat`, { mensaje });
  }

  clasificar(texto: string): Observable<ClasificacionResponse> {
    return this.http.post<ClasificacionResponse>(`${this.baseUrl}/clasificar`, { texto });
  }
}
