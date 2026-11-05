import { Component, ElementRef, ViewChild, inject, signal, afterNextRender } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from './core/auth/auth.service';
import { SolicitudService } from './features/solicitudes/solicitud.service';
import { IaAssistantService } from './features/asistente-ia/ia-assistant.service';
import { Solicitud, ClasificacionResponse, AuditoriaLog, PoliticaEmpresa } from './core/models/models';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="app-layout">
      <!-- Barra Superior Minimalista / Grayscale -->
      <header class="header">
        <div class="brand">
          <div class="brand-icon">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <rect width="20" height="14" x="2" y="7" rx="2" ry="2"/>
              <path d="M16 21V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/>
            </svg>
          </div>
          <div>
            <h1>Portal Corporativo RR.HH.</h1>
            <p class="subtitle">Gestión de Talento Humano & Asistencia con Inteligencia Artificial</p>
          </div>
        </div>

        @if (auth.isAuthenticated()) {
          <div class="user-info">
            <span class="user-chip">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              {{ auth.currentUser()?.nombreCompleto }}
            </span>
            <span class="vacation-badge">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
              {{ auth.currentUser()?.diasVacacionesDisponibles }} días disp.
            </span>
            <span class="role-badge">
              {{ auth.currentUser()?.roles?.join(', ') }}
            </span>
            <button class="btn-logout" (click)="cerrarSesion()">
              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" y1="12" x2="9" y2="12"/></svg>
              Salir
            </button>
          </div>
        }
      </header>

      <!-- Contenedor Principal -->
      <main class="content">
        @if (!auth.isAuthenticated()) {
          <!-- Panel de Inicio de Sesión -->
          <div class="login-card">
            <h2>Acceso Institucional</h2>
            <p class="login-desc">Ingresa tus credenciales corporativas autorizadas:</p>

            <form (ngSubmit)="iniciarSesion()">
              <label>Correo Electrónico:</label>
              <input type="email" [(ngModel)]="loginEmail" name="email" required placeholder="ejemplo@empresa.com" />

              <label>Contraseña:</label>
              <input type="password" [(ngModel)]="loginPass" name="password" required placeholder="••••••••" />

              <button type="submit" class="btn-primary" [disabled]="loadingAuth()">
                {{ loadingAuth() ? 'Verificando credenciales...' : 'Iniciar Sesión' }}
              </button>
            </form>
          </div>
        } @else {
          <!-- Dashboard Principal de Dos Columnas -->
          <div class="dashboard-grid">
            
            <!-- Columna Izquierda: Trámites y Módulos -->
            <div class="card module-card">
              <div class="tab-header">
                <button [class.active]="tabActiva === 'mis-solicitudes'" (click)="tabActiva = 'mis-solicitudes'">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/></svg>
                  Mis Solicitudes
                </button>
                <button [class.active]="tabActiva === 'nueva'" (click)="tabActiva = 'nueva'">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                  Radicar Trámite
                </button>
                @if (auth.hasRole('ROLE_JEFE') || auth.hasRole('ROLE_ADMIN_RRHH')) {
                  <button [class.active]="tabActiva === 'aprobaciones'" (click)="cambiarTabAprobaciones()">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>
                    Bandeja Aprobador
                    @if (pendientes().length > 0) {
                      <span class="counter-badge">{{ pendientes().length }}</span>
                    }
                  </button>
                }
                @if (auth.hasRole('ROLE_ADMIN_RRHH')) {
                  <button [class.active]="tabActiva === 'auditoria'" (click)="cambiarTabAuditoria()">
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                    Auditoría Logs
                  </button>
                }
                <button [class.active]="tabActiva === 'politicas'" (click)="cambiarTabPoliticas()">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/></svg>
                  Políticas RR.HH.
                </button>
              </div>

              <!-- Pestaña 1: Mis Solicitudes -->
              @if (tabActiva === 'mis-solicitudes') {
                <div class="tab-content">
                  <div class="flex-between">
                    <div>
                      <h3>Mis Trámites Registrados</h3>
                      <p class="tab-subtitle">Historial de solicitudes tramitadas bajo tu perfil de usuario.</p>
                    </div>
                    <button class="btn-refresh" (click)="cargarMisSolicitudes()">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                      Actualizar
                    </button>
                  </div>

                  @if (misSolicitudes().length === 0) {
                    <div class="empty-state">
                      <div class="empty-icon-svg">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>
                      </div>
                      <p>No tienes solicitudes radicadas en este momento.</p>
                      <button class="btn-sm" (click)="tabActiva = 'nueva'">Radicar nueva solicitud</button>
                    </div>
                  } @else {
                    <div class="table-responsive">
                      <table class="data-table">
                        <thead>
                          <tr>
                            <th>Identificador</th>
                            <th>Trámite</th>
                            <th>Días</th>
                            <th>Fecha Inicio</th>
                            <th>Estado</th>
                            <th>Aprobador / Observación</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (s of misSolicitudes(); track s.id) {
                            <tr>
                              <td><span class="mono-id">#{{ s.id }}</span></td>
                              <td><span class="type-name">{{ s.tipoSolicitudNombre }}</span></td>
                              <td>{{ s.diasSolicitados }}</td>
                              <td>{{ s.fechaInicio }}</td>
                              <td>
                                <span class="status-pill status-{{ s.estado }}">{{ s.estado }}</span>
                              </td>
                              <td>
                                <div class="cell-obs">
                                  @if (s.aprobadorNombre) {
                                    <span class="aprobador-tag">{{ s.aprobadorNombre }}</span>
                                  }
                                  <span>{{ s.observacionAprobador || s.motivo }}</span>
                                </div>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  }
                </div>
              }

              <!-- Pestaña 2: Nueva Solicitud -->
              @if (tabActiva === 'nueva') {
                <div class="tab-content">
                  <h3>Radicar Trámite Institucional</h3>
                  <p class="tab-subtitle">El requerimiento será enrutado de manera automática según la jerarquía corporativa.</p>

                  <form (ngSubmit)="enviarSolicitud()" class="form-grid">
                    <div class="form-group">
                      <label>Tipo de Requerimiento:</label>
                      <select [(ngModel)]="nuevoTipo" name="nuevoTipo">
                        <option value="VACACIONES">Vacaciones Anuales</option>
                        <option value="PERMISO_MEDICO">Permiso Médico o Cita</option>
                        <option value="REEMBOLSO">Reembolso de Gastos Operativos</option>
                        <option value="CERTIFICADO_LABORAL">Certificado Laboral y de Ingresos</option>
                      </select>
                    </div>

                    <div class="form-row">
                      <div class="form-group">
                        <label>Días Solicitados:</label>
                        <input type="number" [(ngModel)]="nuevosDias" name="nuevosDias" min="1" max="30" required />
                      </div>
                      <div class="form-group">
                        <label>Fecha de Inicio:</label>
                        <input type="date" [(ngModel)]="nuevaFechaInicio" name="nuevaFechaInicio" required />
                      </div>
                    </div>

                    <div class="form-group">
                      <label>Motivo y Sustento del Trámite:</label>
                      <textarea [(ngModel)]="nuevoMotivo" name="nuevoMotivo" rows="3" required placeholder="Describe brevemente el motivo de tu solicitud..."></textarea>
                    </div>

                    <button type="submit" class="btn-primary" [disabled]="loadingSubmitting()">
                      {{ loadingSubmitting() ? 'Procesando registro...' : 'Enviar Solicitud Oficial' }}
                    </button>
                  </form>
                </div>
              }

              <!-- Pestaña 3: Bandeja Aprobador (Jefe / Admin) -->
              @if (tabActiva === 'aprobaciones') {
                <div class="tab-content">
                  <div class="flex-between">
                    <div>
                      <h3>Bandeja de Aprobación de Trámites</h3>
                      <p class="tab-subtitle">Solicitudes pendientes de revisión de los miembros a tu cargo.</p>
                    </div>
                    <button class="btn-refresh" (click)="cargarPendientes()">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                      Actualizar
                    </button>
                  </div>

                  @if (pendientes().length === 0) {
                    <div class="empty-state">
                      <div class="empty-icon-svg">
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="#94a3b8" stroke-width="1.5"><polyline points="20 6 9 17 4 12"/></svg>
                      </div>
                      <p>No tienes solicitudes pendientes de resolución en tu bandeja.</p>
                    </div>
                  } @else {
                    <div class="approval-cards-list">
                      @for (item of pendientes(); track item.id) {
                        <div class="approval-card">
                          <div class="approval-card-info">
                            <div class="approval-header">
                              <span class="mono-id">#{{ item.id }}</span>
                              <span class="type-name">{{ item.tipoSolicitudNombre }}</span>
                            </div>
                            <p class="emp-name">
                              <strong>Colaborador:</strong> {{ item.empleadoNombre }} ({{ item.empleadoEmail }})
                            </p>
                            <p class="emp-details">
                              <span><strong>Fecha inicio:</strong> {{ item.fechaInicio }}</span>
                              <span><strong>Duración:</strong> {{ item.diasSolicitados }} días</span>
                            </p>
                            <div class="emp-motivo">
                              "{{ item.motivo }}"
                            </div>
                          </div>
                          <div class="approval-actions">
                            <button class="btn-approve" (click)="abrirModalDecision(item, true)">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                              Aprobar
                            </button>
                            <button class="btn-reject" (click)="abrirModalDecision(item, false)">
                              <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                              Rechazar
                            </button>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              }

              <!-- Pestaña 4: Auditoría del Sistema (Admin) -->
              @if (tabActiva === 'auditoria') {
                <div class="tab-content">
                  <div class="flex-between">
                    <div>
                      <h3>Auditoría de Seguridad y Trazabilidad</h3>
                      <p class="tab-subtitle">Eventos del sistema capturados de manera inmutable en PostgreSQL.</p>
                    </div>
                    <button class="btn-refresh" (click)="cargarAuditoria()">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                      Actualizar
                    </button>
                  </div>

                  @if (logsAuditoria().length === 0) {
                    <p class="empty-state">No se registran eventos de auditoría actualmente.</p>
                  } @else {
                    <div class="table-responsive">
                      <table class="data-table audit-table">
                        <thead>
                          <tr>
                            <th>Registro</th>
                            <th>Usuario Responsable</th>
                            <th>Acción Corporativa / Evento</th>
                            <th>Origen IP</th>
                            <th>Estado HTTP</th>
                          </tr>
                        </thead>
                        <tbody>
                          @for (log of logsAuditoria(); track log.id) {
                            <tr>
                              <td><span class="mono-id">{{ log.timestamp | slice:0:19 }}</span></td>
                              <td><strong>{{ log.usuarioEmail }}</strong></td>
                              <td><span class="uri-code">{{ log.uriAccedida }}</span></td>
                              <td><span class="ip-badge">{{ formatearIp(log.ipOrigen) }}</span></td>
                              <td>
                                <span class="http-status" [class.status-ok]="log.codigoEstadoHttp < 400" [class.status-err]="log.codigoEstadoHttp >= 400">
                                  {{ log.codigoEstadoHttp }}
                                </span>
                              </td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  }
                </div>
              }

              <!-- Pestaña 5: Políticas de RR.HH. -->
              @if (tabActiva === 'politicas') {
                <div class="tab-content">
                  <div class="flex-between">
                    <div>
                      <h3>Base de Políticas Corporativas</h3>
                      <p class="tab-subtitle">Normativa interna activa en la base de datos que alimenta al Asistente IA.</p>
                    </div>
                    <button class="btn-refresh" (click)="cargarPoliticas()">
                      <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                      Actualizar
                    </button>
                  </div>

                  <div class="policies-grid">
                    @for (p of politicasList(); track p.id) {
                      <div class="policy-card">
                        <div class="policy-cat">{{ p.categoria }}</div>
                        <h4>{{ p.titulo }}</h4>
                        <p>{{ p.contenido }}</p>
                      </div>
                    }
                  </div>
                </div>
              }
            </div>

            <!-- Columna Derecha: Asistente IA -->
            <div class="card ai-card">
              <div class="ai-header">
                <div>
                  <div class="ai-title-row">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><path d="M12 2a2 2 0 0 1 2 2v2a2 2 0 0 1-2 2 2 2 0 0 1-2-2V4a2 2 0 0 1 2-2z"/><rect width="18" height="12" x="3" y="8" rx="2"/><circle cx="9" cy="14" r="1"/><circle cx="15" cy="14" r="1"/></svg>
                    <h3>Asistente Virtual RR.HH.</h3>
                  </div>
                  <span class="ai-badge">LangChain4j & Gemini</span>
                </div>
                <div class="ai-roles-hint">
                  Acceso institucional multirol
                </div>
              </div>

              <!-- Clasificador de Texto Libre -->
              <div class="ai-box">
                <h4>Clasificador Inteligente de Texto Libre</h4>
                <p class="hint">Escribe una necesidad en lenguaje cotidiano para tipificarla automáticamente:</p>
                <div class="input-row">
                  <input type="text" [(ngModel)]="textoLibre" placeholder="Ej: Me enfermé con gripe y el médico me dio reposo..." />
                  <button class="btn-sm" (click)="clasificarTexto()" [disabled]="loadingAi()">
                    {{ loadingAi() ? 'Analizando...' : 'Clasificar' }}
                  </button>
                </div>

                @if (clasificacion()) {
                  <div class="clasificacion-resultado">
                    <p><strong>Tipo detectado:</strong> <span class="highlight">{{ clasificacion()?.tipoSolicitud }}</span></p>
                    <p><strong>Nivel de urgencia:</strong> <span class="urgency-{{ clasificacion()?.nivelUrgencia }}">{{ clasificacion()?.nivelUrgencia }}</span> &bull; <strong>Destinatario:</strong> {{ clasificacion()?.responsableAsignado }}</p>
                    <p><strong>Resumen:</strong> {{ clasificacion()?.justificacionBreve }}</p>
                  </div>
                }
              </div>

              <!-- Chatbot de Políticas y Consulta de Saldo -->
              <div class="chat-container">
                <h4>Consulta de Políticas y Saldo Personal</h4>
                <div class="chat-history" #chatHistoryContainer>
                  @for (msg of chatMessages(); track msg) {
                    <div [class]="msg.sender === 'user' ? 'msg-user' : 'msg-ia'">
                      <span class="msg-author">{{ msg.sender === 'user' ? 'Tú' : 'Asistente RR.HH.' }}</span>
                      <p>{{ msg.text }}</p>
                    </div>
                  }
                  @if (loadingChat()) {
                    <div class="msg-ia typing">
                      <span class="msg-author">Asistente RR.HH.</span>
                      <p><em>Consultando base de conocimiento y generando respuesta...</em></p>
                    </div>
                  }
                </div>

                <div class="chat-input-row">
                  <input
                    type="text"
                    [(ngModel)]="chatInput"
                    (keyup.enter)="enviarChat()"
                    placeholder="Escribe tu consulta sobre vacaciones, permisos o plazos..."
                  />
                  <button (click)="enviarChat()" [disabled]="loadingChat()" class="btn-chat-send">
                    {{ loadingChat() ? '...' : 'Enviar' }}
                  </button>
                </div>
              </div>
            </div>

          </div>
        }
      </main>

      <!-- MODAL EMERGENTE PERSONALIZADO (ALERTA / NOTIFICACIÓN) -->
      @if (modalVisible()) {
        <div class="modal-backdrop">
          <div class="modal-box modal-{{ modalType() }}">
            <div class="modal-icon-svg">
              @if (modalType() === 'success') {
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              } @else if (modalType() === 'error') {
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/></svg>
              } @else {
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#2563eb" stroke-width="2"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              }
            </div>
            <h3>{{ modalTitle() }}</h3>
            <p>{{ modalMessage() }}</p>
            <div class="modal-footer">
              <button class="btn-primary" (click)="cerrarModal()">Aceptar</button>
            </div>
          </div>
        </div>
      }

      <!-- MODAL DE DECISIÓN (APROBACIÓN / RECHAZO) -->
      @if (modalDecisionVisible()) {
        <div class="modal-backdrop">
          <div class="modal-box decision-modal">
            <h3>{{ decisionEsAprobacion() ? 'Aprobar Solicitud' : 'Rechazar Solicitud' }}</h3>
            <p>Trámite <strong>#{{ solicitudSeleccionada()?.id }}</strong> &bull; <strong>{{ solicitudSeleccionada()?.empleadoNombre }}</strong> ({{ solicitudSeleccionada()?.tipoSolicitudNombre }} - {{ solicitudSeleccionada()?.diasSolicitados }} días).</p>
            
            <div class="form-group modal-input-group">
              <label>Justificación de la decisión:</label>
              <textarea [(ngModel)]="observacionDecision" rows="3" placeholder="Ingresa una justificación o comentario para el colaborador..."></textarea>
            </div>

            <div class="modal-actions-row">
              <button class="btn-cancel" (click)="cerrarModalDecision()">Cancelar</button>
              <button [class]="decisionEsAprobacion() ? 'btn-approve' : 'btn-reject'" (click)="ejecutarDecision()">
                {{ decisionEsAprobacion() ? 'Confirmar Aprobación' : 'Confirmar Rechazo' }}
              </button>
            </div>
          </div>
        </div>
      }

    </div>
  `,
  styles: [`
    .app-layout { font-family: 'Inter', -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: #1e293b; background: #f8fafc; min-height: 100vh; }
    
    /* Encabezado en Escala de Grises Elegante */
    .header { background: #0f172a; color: #f8fafc; padding: 0.9rem 2rem; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid #1e293b; }
    .brand { display: flex; align-items: center; gap: 0.8rem; }
    .brand-icon { background: #1e293b; color: #94a3b8; padding: 0.45rem; border-radius: 8px; display: flex; align-items: center; justify-content: center; border: 1px solid #334155; }
    .header h1 { margin: 0; font-size: 1.15rem; font-weight: 600; letter-spacing: -0.01em; color: #ffffff; }
    .subtitle { margin: 0; font-size: 0.78rem; color: #94a3b8; }
    
    .user-info { display: flex; gap: 0.55rem; align-items: center; font-size: 0.82rem; }
    .user-chip { background: #1e293b; color: #cbd5e1; padding: 0.35rem 0.75rem; border-radius: 6px; font-weight: 500; display: flex; align-items: center; gap: 0.4rem; border: 1px solid #334155; }
    .vacation-badge { background: #047857; color: #ffffff; padding: 0.35rem 0.75rem; border-radius: 6px; font-weight: 600; display: flex; align-items: center; gap: 0.35rem; }
    .role-badge { background: #334155; color: #e2e8f0; padding: 0.35rem 0.7rem; border-radius: 6px; font-size: 0.72rem; font-weight: 600; text-transform: uppercase; letter-spacing: 0.03em; }
    .btn-logout { background: #334155; color: #f8fafc; border: 1px solid #475569; padding: 0.35rem 0.8rem; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 0.8rem; display: flex; align-items: center; gap: 0.35rem; transition: all 0.15s ease; }
    .btn-logout:hover { background: #dc2626; border-color: #dc2626; }

    .content { max-width: 1400px; margin: 1.5rem auto; padding: 0 1rem; }
    
    /* Tarjeta de Acceso */
    .login-card { background: #ffffff; max-width: 440px; margin: 3rem auto; padding: 2rem; border-radius: 10px; border: 1px solid #e2e8f0; box-shadow: 0 4px 12px rgba(0,0,0,0.03); }
    .login-card h2 { margin-top: 0; font-size: 1.25rem; font-weight: 600; color: #0f172a; }
    .login-desc { color: #64748b; font-size: 0.85rem; margin-bottom: 1.2rem; }
    .login-card label { display: block; margin-top: 0.9rem; font-weight: 500; font-size: 0.82rem; color: #475569; }
    .login-card input { width: 100%; padding: 0.6rem 0.75rem; margin-top: 0.25rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.9rem; color: #0f172a; font-family: inherit; }
    .login-card input:focus { outline: none; border-color: #0f172a; box-shadow: 0 0 0 1px #0f172a; }
    
    .btn-primary { width: 100%; background: #0f172a; color: #ffffff; border: none; padding: 0.7rem; border-radius: 6px; margin-top: 1.3rem; cursor: pointer; font-weight: 500; font-size: 0.9rem; transition: background 0.15s; font-family: inherit; }
    .btn-primary:hover { background: #1e293b; }
    .btn-primary:disabled { opacity: 0.6; cursor: not-allowed; }

    .quick-logins { margin-top: 1.8rem; border-top: 1px solid #f1f5f9; padding-top: 1.2rem; }
    .quick-logins p { font-size: 0.8rem; color: #64748b; margin-bottom: 0.6rem; font-weight: 500; }
    .quick-btn-group { display: flex; flex-direction: column; gap: 0.45rem; }
    .quick-btn-group button { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.65rem 0.85rem; text-align: left; cursor: pointer; transition: all 0.15s; display: flex; flex-direction: column; }
    .quick-btn-group button:hover { background: #f1f5f9; border-color: #cbd5e1; }
    .quick-btn-group button strong { color: #0f172a; font-size: 0.86rem; }
    .quick-btn-group button span { font-size: 0.75rem; color: #64748b; margin-top: 0.15rem; }

    /* Dashboard Layout */
    .dashboard-grid { display: grid; grid-template-columns: 1.2fr 0.8fr; gap: 1.25rem; }
    .card { background: #ffffff; padding: 1.4rem; border-radius: 10px; border: 1px solid #e2e8f0; box-shadow: 0 1px 3px rgba(0,0,0,0.02); }
    
    /* Pestañas */
    .tab-header { display: flex; gap: 0.3rem; border-bottom: 1px solid #e2e8f0; margin-bottom: 1.25rem; overflow-x: auto; }
    .tab-header button { background: none; border: none; padding: 0.6rem 0.95rem; cursor: pointer; font-weight: 500; color: #64748b; font-size: 0.84rem; border-bottom: 2px solid transparent; transition: all 0.15s; white-space: nowrap; display: flex; align-items: center; gap: 0.4rem; font-family: inherit; }
    .tab-header button.active { color: #0f172a; border-bottom-color: #0f172a; font-weight: 600; }
    .counter-badge { background: #0f172a; color: #ffffff; font-size: 0.7rem; padding: 0.1rem 0.4rem; border-radius: 9999px; font-weight: 600; }

    .tab-content h3 { margin: 0; font-size: 1.1rem; font-weight: 600; color: #0f172a; }
    .tab-subtitle { margin: 0.2rem 0 1rem 0; font-size: 0.8rem; color: #64748b; }
    .flex-between { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem; }
    .btn-refresh { background: #f8fafc; border: 1px solid #cbd5e1; padding: 0.35rem 0.75rem; border-radius: 6px; cursor: pointer; font-size: 0.78rem; font-weight: 500; color: #334155; display: flex; align-items: center; gap: 0.35rem; transition: background 0.15s; font-family: inherit; }
    .btn-refresh:hover { background: #f1f5f9; }

    /* Tablas Limpias */
    .table-responsive { overflow-x: auto; }
    .data-table { width: 100%; border-collapse: collapse; font-size: 0.83rem; }
    .data-table th { background: #f8fafc; color: #475569; font-weight: 600; padding: 0.65rem 0.6rem; border-bottom: 1px solid #e2e8f0; text-align: left; font-size: 0.78rem; text-transform: uppercase; letter-spacing: 0.02em; }
    .data-table td { padding: 0.65rem 0.6rem; border-bottom: 1px solid #f1f5f9; vertical-align: middle; color: #334155; }
    
    .mono-id { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.78rem; color: #475569; background: #f1f5f9; padding: 0.15rem 0.35rem; border-radius: 4px; }
    .type-name { font-weight: 500; color: #0f172a; }
    .cell-obs { font-size: 0.79rem; color: #64748b; display: flex; flex-direction: column; gap: 0.15rem; }
    .aprobador-tag { font-weight: 600; color: #334155; }

    .status-pill { padding: 0.2rem 0.55rem; border-radius: 9999px; font-size: 0.7rem; font-weight: 600; letter-spacing: 0.02em; }
    .status-PENDIENTE { background: #fef3c7; color: #92400e; }
    .status-APROBADA_JEFE { background: #dcfce7; color: #166534; }
    .status-RECHAZADA { background: #fee2e2; color: #991b1b; }

    /* Formularios */
    .form-grid { display: flex; flex-direction: column; gap: 0.85rem; }
    .form-row { display: grid; grid-template-columns: 1fr 1fr; gap: 0.9rem; }
    .form-group label { display: block; font-weight: 500; font-size: 0.82rem; color: #334155; margin-bottom: 0.25rem; }
    .form-group input, .form-group select, .form-group textarea { width: 100%; padding: 0.55rem 0.7rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.86rem; color: #0f172a; font-family: inherit; }
    .form-group input:focus, .form-group select:focus, .form-group textarea:focus { outline: none; border-color: #0f172a; }

    /* Tarjetas de Aprobación */
    .approval-cards-list { display: flex; flex-direction: column; gap: 0.75rem; }
    .approval-card { border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.95rem; display: flex; justify-content: space-between; align-items: center; background: #ffffff; }
    .approval-header { display: flex; gap: 0.45rem; align-items: center; margin-bottom: 0.25rem; }
    .emp-name { margin: 0.15rem 0; font-size: 0.84rem; color: #334155; }
    .emp-details { margin: 0.15rem 0; font-size: 0.8rem; color: #64748b; display: flex; gap: 0.8rem; }
    .emp-motivo { margin-top: 0.35rem; font-size: 0.82rem; color: #334155; background: #f8fafc; padding: 0.35rem 0.55rem; border-radius: 4px; border-left: 2px solid #94a3b8; }
    
    .approval-actions { display: flex; gap: 0.45rem; }
    .btn-approve { background: #0f172a; color: #ffffff; border: none; padding: 0.45rem 0.85rem; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 0.8rem; display: flex; align-items: center; gap: 0.3rem; transition: background 0.15s; font-family: inherit; }
    .btn-approve:hover { background: #15803d; }
    .btn-reject { background: #f8fafc; color: #475569; border: 1px solid #cbd5e1; padding: 0.45rem 0.85rem; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 0.8rem; display: flex; align-items: center; gap: 0.3rem; transition: all 0.15s; font-family: inherit; }
    .btn-reject:hover { background: #dc2626; color: #ffffff; border-color: #dc2626; }

    /* Auditoría y Políticas */
    .ip-badge { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.76rem; background: #f1f5f9; padding: 0.15rem 0.4rem; border-radius: 4px; color: #475569; }
    .method-badge { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.72rem; padding: 0.15rem 0.35rem; border-radius: 4px; background: #f1f5f9; color: #334155; font-weight: 600; }
    .uri-code { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-size: 0.78rem; color: #475569; }
    .http-status { font-family: ui-monospace, SFMono-Regular, Menlo, monospace; font-weight: 600; font-size: 0.75rem; padding: 0.1rem 0.35rem; border-radius: 4px; }
    .status-ok { background: #dcfce7; color: #166534; }
    .status-err { background: #fee2e2; color: #991b1b; }

    .policies-grid { display: flex; flex-direction: column; gap: 0.7rem; }
    .policy-card { background: #f8fafc; border: 1px solid #e2e8f0; border-radius: 6px; padding: 0.85rem; }
    .policy-cat { font-size: 0.7rem; font-weight: 600; text-transform: uppercase; color: #64748b; letter-spacing: 0.03em; margin-bottom: 0.15rem; }
    .policy-card h4 { margin: 0 0 0.35rem 0; color: #0f172a; font-size: 0.95rem; font-weight: 600; }
    .policy-card p { margin: 0; font-size: 0.82rem; color: #475569; line-height: 1.45; }

    .empty-state { text-align: center; padding: 2.5rem 1rem; color: #64748b; }
    .empty-icon-svg { margin-bottom: 0.5rem; }

    /* Asistente IA */
    .ai-card { background: #ffffff; }
    .ai-header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1.1rem; border-bottom: 1px solid #f1f5f9; padding-bottom: 0.75rem; }
    .ai-title-row { display: flex; align-items: center; gap: 0.45rem; }
    .ai-header h3 { margin: 0; font-size: 1.05rem; font-weight: 600; color: #0f172a; }
    .ai-badge { font-size: 0.7rem; background: #f1f5f9; padding: 0.15rem 0.45rem; border-radius: 4px; color: #475569; font-weight: 500; }
    .ai-roles-hint { font-size: 0.75rem; color: #64748b; }

    .ai-box { background: #f8fafc; border: 1px solid #e2e8f0; padding: 0.85rem; border-radius: 8px; margin-bottom: 1.1rem; }
    .ai-box h4 { margin: 0 0 0.25rem 0; font-size: 0.88rem; font-weight: 600; color: #0f172a; }
    .hint { font-size: 0.78rem; color: #64748b; margin: 0 0 0.55rem 0; }
    .input-row { display: flex; gap: 0.45rem; }
    .input-row input { flex: 1; padding: 0.5rem 0.65rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.84rem; font-family: inherit; }
    .btn-sm { background: #0f172a; color: #ffffff; border: none; padding: 0.4rem 0.8rem; border-radius: 6px; cursor: pointer; font-size: 0.78rem; font-weight: 500; font-family: inherit; }
    .btn-sm:hover { background: #1e293b; }
    
    .clasificacion-resultado { margin-top: 0.7rem; background: #ffffff; padding: 0.65rem; border-radius: 6px; font-size: 0.82rem; border: 1px solid #e2e8f0; border-left: 3px solid #0f172a; }
    .clasificacion-resultado p { margin: 0.25rem 0; color: #334155; }
    .highlight { background: #f1f5f9; padding: 0.1rem 0.35rem; border-radius: 4px; font-weight: 600; color: #0f172a; }
    .urgency-ALTA { color: #dc2626; font-weight: 600; }
    .urgency-MEDIA { color: #d97706; font-weight: 600; }
    .urgency-BAJA { color: #16a34a; font-weight: 600; }

    /* Chatbot */
    .chat-container { border: 1px solid #e2e8f0; border-radius: 8px; padding: 0.85rem; background: #ffffff; }
    .chat-container h4 { margin: 0 0 0.55rem 0; font-size: 0.88rem; font-weight: 600; color: #0f172a; }
    .chat-history { height: 260px; overflow-y: auto; background: #f8fafc; padding: 0.75rem; border-radius: 6px; margin-bottom: 0.75rem; border: 1px solid #f1f5f9; }
    
    .msg-user { margin-bottom: 0.65rem; text-align: right; }
    .msg-user p { display: inline-block; background: #0f172a; color: #ffffff; padding: 0.5rem 0.75rem; border-radius: 8px; margin: 0.15rem 0; font-size: 0.82rem; max-width: 85%; text-align: left; }
    .msg-ia { margin-bottom: 0.65rem; text-align: left; }
    .msg-ia p { display: inline-block; background: #ffffff; color: #1e293b; border: 1px solid #e2e8f0; padding: 0.5rem 0.75rem; border-radius: 8px; margin: 0.15rem 0; font-size: 0.82rem; max-width: 90%; white-space: pre-wrap; line-height: 1.45; }
    .msg-author { display: block; font-size: 0.7rem; color: #64748b; font-weight: 500; margin-bottom: 0.1rem; }
    
    .chat-input-row { display: flex; gap: 0.6rem; }
    .chat-input-row input { flex: 1; padding: 0.55rem 0.7rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.84rem; font-family: inherit; }
    .btn-chat-send { background: #0f172a; color: #ffffff; border: none; padding: 0.55rem 1.15rem; border-radius: 6px; cursor: pointer; font-weight: 500; font-size: 0.84rem; font-family: inherit; margin-left: 0.5rem; transition: background 0.15s; }
    .btn-chat-send:hover { background: #1e293b; }

    /* Modales */
    .modal-backdrop { position: fixed; top: 0; left: 0; width: 100vw; height: 100vh; background: rgba(15, 23, 42, 0.45); backdrop-filter: blur(2px); display: flex; justify-content: center; align-items: center; z-index: 9999; animation: fadeIn 0.15s ease-out; }
    .modal-box { background: #ffffff; border-radius: 10px; padding: 1.6rem; max-width: 440px; width: 90%; box-shadow: 0 10px 25px rgba(0,0,0,0.1); text-align: center; border: 1px solid #e2e8f0; animation: scaleUp 0.15s ease-out; }
    .modal-icon-svg { margin-bottom: 0.5rem; }
    .modal-box h3 { margin: 0 0 0.45rem 0; font-size: 1.15rem; font-weight: 600; color: #0f172a; }
    .modal-box p { color: #475569; font-size: 0.85rem; line-height: 1.45; margin-bottom: 1.25rem; }
    .decision-modal { text-align: left; max-width: 480px; }
    .modal-input-group { margin: 0.85rem 0; }
    .modal-input-group label { display: block; font-weight: 500; font-size: 0.82rem; margin-bottom: 0.35rem; color: #334155; }
    .modal-input-group textarea { width: 100%; padding: 0.55rem 0.7rem; border: 1px solid #cbd5e1; border-radius: 6px; font-size: 0.85rem; font-family: inherit; }
    .modal-actions-row { display: flex; justify-content: flex-end; gap: 0.5rem; margin-top: 1.1rem; }
    .btn-cancel { background: #f8fafc; color: #475569; border: 1px solid #cbd5e1; padding: 0.45rem 0.85rem; border-radius: 6px; cursor: pointer; font-weight: 500; font-family: inherit; font-size: 0.82rem; }

    @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
    @keyframes scaleUp { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
  `]
})
export class AppComponent {
  auth = inject(AuthService);
  solicitudService = inject(SolicitudService);
  iaService = inject(IaAssistantService);

  loginEmail = '';
  loginPass = '';
  loadingAuth = signal(false);

  tabActiva = 'mis-solicitudes';
  misSolicitudes = signal<Solicitud[]>([]);
  pendientes = signal<Solicitud[]>([]);
  logsAuditoria = signal<AuditoriaLog[]>([]);
  politicasList = signal<PoliticaEmpresa[]>([]);

  nuevoTipo = 'VACACIONES';
  nuevosDias = 3;
  nuevaFechaInicio = new Date().toISOString().substring(0, 10);
  nuevoMotivo = '';
  loadingSubmitting = signal(false);

  textoLibre = '';
  clasificacion = signal<ClasificacionResponse | null>(null);
  loadingAi = signal(false);

  chatInput = '';
  chatMessages = signal<{ sender: 'user' | 'ia'; text: string }[]>([
    { sender: 'ia', text: '¡Hola! Soy tu Asistente de RR.HH. Corporativo. Pregúntame sobre vacaciones, permisos médicos o reembolsos.' }
  ]);
  loadingChat = signal(false);

  // Estados de Ventanas Emergentes (Modales en pantalla, NO del navegador)
  modalVisible = signal(false);
  modalTitle = signal('');
  modalMessage = signal('');
  modalType = signal<'success' | 'error' | 'info'>('info');

  modalDecisionVisible = signal(false);
  solicitudSeleccionada = signal<Solicitud | null>(null);
  decisionEsAprobacion = signal(true);
  observacionDecision = signal('');



  iniciarSesion() {
    this.loadingAuth.set(true);
    this.auth.login({ email: this.loginEmail, password: this.loginPass }).subscribe({
      next: () => {
        this.loadingAuth.set(false);
        this.reiniciarEstadoSesion();
        this.cargarMisSolicitudes();
        if (this.auth.hasRole('ROLE_JEFE') || this.auth.hasRole('ROLE_ADMIN_RRHH')) {
          this.cargarPendientes();
        }
      },
      error: () => {
        this.loadingAuth.set(false);
        this.mostrarModal('Error de Acceso', 'Credenciales inválidas. Por favor verifica tu correo y contraseña.', 'error');
      }
    });
  }

  cerrarSesion() {
    this.auth.logout();
    this.reiniciarEstadoSesion();
  }

  private reiniciarEstadoSesion() {
    this.tabActiva = 'mis-solicitudes';
    this.chatInput = '';
    this.chatMessages.set([
      { sender: 'ia', text: '¡Hola! Soy tu Asistente de RR.HH. Corporativo. Pregúntame sobre vacaciones, permisos médicos o reembolsos.' }
    ]);
    this.textoLibre = '';
    this.clasificacion.set(null);
    this.nuevoMotivo = '';
    this.nuevosDias = 3;
    this.misSolicitudes.set([]);
    this.pendientes.set([]);
    this.logsAuditoria.set([]);
    this.politicasList.set([]);
  }

  // Cargas reactivas de datos
  cargarMisSolicitudes() {
    this.solicitudService.obtenerMisSolicitudes().subscribe(data => this.misSolicitudes.set(data));
  }

  cargarPendientes() {
    this.solicitudService.obtenerPendientesAprobacion().subscribe(data => this.pendientes.set(data));
  }

  cargarAuditoria() {
    this.solicitudService.obtenerLogsAuditoria().subscribe({
      next: data => this.logsAuditoria.set(data),
      error: () => this.mostrarModal('Permiso Denegado', 'Solo el Administrador de RR.HH. tiene acceso a los logs de auditoría.', 'error')
    });
  }

  cargarPoliticas() {
    this.solicitudService.obtenerPoliticas().subscribe(data => this.politicasList.set(data));
  }

  cambiarTabAprobaciones() {
    this.tabActiva = 'aprobaciones';
    this.cargarPendientes();
  }

  cambiarTabAuditoria() {
    this.tabActiva = 'auditoria';
    this.cargarAuditoria();
  }

  cambiarTabPoliticas() {
    this.tabActiva = 'politicas';
    this.cargarPoliticas();
  }

  // Radicación con actualización en vivo
  enviarSolicitud() {
    if (!this.nuevoMotivo.trim()) {
      this.mostrarModal('Campo Requerido', 'Por favor ingresa un motivo para radicar la solicitud.', 'error');
      return;
    }

    this.loadingSubmitting.set(true);
    this.solicitudService.crearSolicitud({
      codigoTipoSolicitud: this.nuevoTipo,
      fechaInicio: this.nuevaFechaInicio,
      diasSolicitados: this.nuevosDias,
      motivo: this.nuevoMotivo
    }).subscribe({
      next: (res) => {
        this.loadingSubmitting.set(false);
        this.nuevoMotivo = '';
        this.tabActiva = 'mis-solicitudes';
        this.cargarMisSolicitudes();
        this.mostrarModal(
          '¡Solicitud Radicada!',
          `Tu trámite #${res.id} de ${res.tipoSolicitudNombre} (${res.diasSolicitados} días) ha sido registrado y notificado a tu aprobador.`,
          'success'
        );
      },
      error: (err) => {
        this.loadingSubmitting.set(false);
        const msg = err.error?.message || 'No se pudo registrar la solicitud.';
        this.mostrarModal('No se pudo procesar', msg, 'error');
      }
    });
  }

  // Modales de Aprobación/Rechazo
  abrirModalDecision(solicitud: Solicitud, esAprobacion: boolean) {
    this.solicitudSeleccionada.set(solicitud);
    this.decisionEsAprobacion.set(esAprobacion);
    this.observacionDecision.set(esAprobacion ? 'Aprobado conforme a las políticas de la empresa.' : 'Rechazado debido a carga operativa de la semana.');
    this.modalDecisionVisible.set(true);
  }

  cerrarModalDecision() {
    this.modalDecisionVisible.set(false);
    this.solicitudSeleccionada.set(null);
  }

  ejecutarDecision() {
    const solicitud = this.solicitudSeleccionada();
    if (!solicitud) return;

    const aprobada = this.decisionEsAprobacion();
    const observacion = this.observacionDecision().trim() || (aprobada ? 'Aprobado' : 'Rechazado');

    this.solicitudService.tomarDecision(solicitud.id, { aprobada, observacion }).subscribe({
      next: () => {
        this.cerrarModalDecision();
        this.cargarPendientes();
        this.cargarMisSolicitudes();

        // Si aprobó vacaciones y el usuario actual fue el afectado, reflejarlo de inmediato
        if (aprobada && solicitud.tipoSolicitudCodigo === 'VACACIONES') {
          const user = this.auth.currentUser();
          if (user && user.email === solicitud.empleadoEmail) {
            this.auth.updateVacationDays(user.diasVacacionesDisponibles - solicitud.diasSolicitados);
          }
        }

        this.mostrarModal(
          'Decisión Guardada',
          `La solicitud #${solicitud.id} ha sido ${aprobada ? 'APROBADA' : 'RECHAZADA'} exitosamente.`,
          'success'
        );
      },
      error: (err) => {
        this.mostrarModal('Error al procesar', err.error?.message || 'No se pudo guardar la decisión.', 'error');
      }
    });
  }

  // Gestión de Modales de Alerta
  mostrarModal(titulo: string, mensaje: string, tipo: 'success' | 'error' | 'info' = 'info') {
    this.modalTitle.set(titulo);
    this.modalMessage.set(mensaje);
    this.modalType.set(tipo);
    this.modalVisible.set(true);
  }

  cerrarModal() {
    this.modalVisible.set(false);
  }

  // IA - Clasificador
  clasificarTexto() {
    if (!this.textoLibre.trim()) return;
    this.loadingAi.set(true);
    this.iaService.clasificar(this.textoLibre).subscribe({
      next: res => {
        this.clasificacion.set(res);
        this.loadingAi.set(false);
      },
      error: () => this.loadingAi.set(false)
    });
  }

  @ViewChild('chatHistoryContainer') chatHistoryContainer?: ElementRef<HTMLDivElement>;

  formatearIp(ip: string): string {
    if (!ip) return '127.0.0.1';
    if (ip === '0:0:0:0:0:0:0:1' || ip === '::1' || ip.toLowerCase() === 'localhost') {
      return '127.0.0.1';
    }
    return ip;
  }

  private hacerScrollChat() {
    setTimeout(() => {
      if (this.chatHistoryContainer?.nativeElement) {
        const el = this.chatHistoryContainer.nativeElement;
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }
    }, 50);
  }

  // IA - Chat
  enviarChat() {
    if (!this.chatInput.trim()) return;
    const msg = this.chatInput;
    this.chatInput = '';
    this.chatMessages.update(msgs => [...msgs, { sender: 'user', text: msg }]);
    this.hacerScrollChat();
    this.loadingChat.set(true);

    this.iaService.chat(msg).subscribe({
      next: res => {
        this.chatMessages.update(msgs => [...msgs, { sender: 'ia', text: res.respuesta }]);
        this.loadingChat.set(false);
        this.hacerScrollChat();
      },
      error: () => {
        this.chatMessages.update(msgs => [
          ...msgs,
          { sender: 'ia', text: '⚠️ Error de comunicación con el motor de IA. Verifica tu API Key o conexión.' }
        ]);
        this.loadingChat.set(false);
        this.hacerScrollChat();
      }
    });
  }
}
