# DOCUMENTO MAESTRO DE DEFENSA TÉCNICA
## PORTAL CORPORATIVO DE RR.HH. & ASISTENTE VIRTUAL CON INTELIGENCIA ARTIFICIAL (RAG)
**Asignatura:** Programación Avanzada  
**Estudiante:** Dayanara Lisseth Bautista Bravo  
**Institución:** Universidad de las Fuerzas Armadas ESPE  

---

# 1. RESUMEN EJECUTIVO DEL PROYECTO
El **Portal Corporativo de Recursos Humanos y Gestión del Talento Humano** es una solución web empresarial de arquitectura desacoplada (*Full Stack*) diseñada para digitalizar, automatizar y auditar el ciclo de vida de los trámites laborales (vacaciones, licencias médicas, reembolsos y certificados laborales).

Incorpora **Inteligencia Artificial Generativa** mediante modelos fundacionales (Google Gemini) orquestados con **LangChain4j**, implementando:
1. **Clasificación y tipificación inteligente** de texto libre mediante extracción de entidades estructuradas JSON.
2. **Asistente Virtual Corporativo (RAG - Retrieval-Augmented Generation)** con consulta transaccional en tiempo real a base de datos relacional (PostgreSQL) y fundamentación en el catálogo de políticas de la empresa.
3. **Seguridad Robusta**: Autenticación sin estado (*Stateless*) con JSON Web Tokens (JWT) y Spring Security 6.
4. **Trazabilidad y Auditoría de Negocio**: Registro inmutable de eventos operacionales mediante interceptores HTTP desacoplados.

---

# 2. ARQUITECTURA DE SOFTWARE Y STACK TECNOLÓGICO

```
+-------------------------------------------------------------------------+
|                        CAPA DE PRESENTACIÓN (CLIENTE)                   |
|   Angular 17 (Standalone Components, Signals reactivos, RxJS, Vercel)  |
+-------------------------------------------------------------------------+
                                    │  HTTPS / REST JSON (JWT Bearer)
                                    ▼
+-------------------------------------------------------------------------+
|                      CAPA DE CONTROLADORES & SEGURIDAD                  |
|   Spring Security 6 | JwtAuthenticationFilter | CORS Filter             |
|   AuthController | SolicitudController | IaController | PoliticaCtrl    |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                  INTERCEPTORES & FILTROS (TRANSVERSAL)                  |
|   AutorizacionRolInterceptor (@RequiereRol)                             |
|   AuditoriaInterceptor (Normalización IP & Mapeo de Negocio)           |
+-------------------------------------------------------------------------+
                                    │
                                    ▼
+-------------------------------------------------------------------------+
|                      CAPA DE NEGOCIO & SERVICIOS                        |
|   UsuarioService | SolicitudService | AuditoriaService | PoliticaService|
|   AprobadorService | EmailNotificadorService (IoC / Polimorfismo)       |
+-------------------------------------------------------------------------+
                     │                                    │
                     ▼                                    ▼
+-----------------------------------+   +---------------------------------+
|   CAPA DE IA (LANGCHAIN4J)        |   |    CAPA DE PERSISTENCIA (JPA)   |
|   HrAssistantService (RAG)        |   |    Spring Data JPA / Hibernate  |
|   HrClasificadorService (Entity)  |   |    PostgreSQL (Render Cloud DB) |
|   Google Gemini (OpenAI Protocol) |   |    Transacciones ACID           |
+-----------------------------------+   +---------------------------------+
```

### Tecnologías Empleadas:
* **Backend:** Java 17 LTS, Spring Boot 3.3 / 4.1, Spring Data JPA, Spring Security 6.
* **Inteligencia Artificial:** LangChain4j 1.22.0, Google Gemini (via OpenAI-compatible endpoint).
* **Frontend:** Angular 17 (Standalone Components, Signals reactivos, Control Flow `@if`/`@for`).
* **Base de Datos:** PostgreSQL en Render Cloud.
* **Infraestructura Cloud:** 
  - Frontend: Desplegado en **Vercel** (`https://gestor-inventario-pa-eight.vercel.app`).
  - Backend: Contenedor Docker en **Render** (`https://rrhh-backend-0kze.onrender.com`).

---

# 3. SEGURIDAD Y CONTROL DE ACCESOS (SPRING SECURITY 6 + JWT)

### 3.1. Arquitectura Stateless (Sin Estado)
No se utilizan sesiones HTTP en el servidor (`SessionCreationPolicy.STATELESS`). Cada petición viaja con una cabecera HTTP:
`Authorization: Bearer <token_jwt>`

### 3.2. Configuración de Seguridad (`SecurityConfig.java`)
```java
@Configuration
@EnableWebSecurity
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
            .cors(Customizer.withDefaults())
            .csrf(csrf -> csrf.disable())
            .sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/api/info/**", "/actuator/**", "/error", "/api/politicas/**").permitAll()
                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }
}
```

### 3.3. Filtro de Autenticación JWT (`JwtAuthenticationFilter.java`)
Intercepta cada petición entrante, extrae el token, valida su firma criptográfica (HMAC-SHA512) y fecha de expiración, e inyecta al usuario con sus roles en el `SecurityContextHolder`.

---

# 4. CAPA TRANSVERSAL: INTERCEPTORES Y AUDITORÍA DE NEGOCIO

Uno de los mayores diferenciadores del proyecto es la **auditoría orientada al dominio de negocio** en lugar de logs técnicos crudos.

### 4.1. Interceptor de Autorización por Anotación (`AutorizacionRolInterceptor.java`)
Permite seguridad declarativa granular mediante la anotación personalizada `@RequiereRol`:
```java
@Target({ElementType.METHOD, ElementType.TYPE})
@Retention(RetentionPolicy.RUNTIME)
public @interface RequiereRol {
    String[] value();
}
```

Si un colaborador con rol `ROLE_EMPLEADO` intenta acceder a un endpoint restringido para `ROLE_ADMIN_RRHH` o `ROLE_JEFE`, el interceptor captura la petición antes de que llegue al controlador y genera un error `403 Forbidden`.

### 4.2. Auditoría Funcional e Inteligente (`AuditoriaInterceptor.java`)
Traduce las rutas técnicas a eventos de negocio legibles y normaliza IPs locales (`0:0:0:0:0:0:0:1` a `127.0.0.1`):

```java
@Component
public class AuditoriaInterceptor implements HandlerInterceptor {

    private final AuditoriaService auditoriaService;

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        String uri = request.getRequestURI();
        if (!uri.startsWith("/api/") || uri.startsWith("/api/auditoria/logs") || uri.equals("/api/auth/login")) {
            return;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String usuario = (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal()))
                ? auth.getName() : "ANONIMO";

        String accionNegocio = interpretarAccionDeNegocio(request.getMethod(), uri, usuario);
        String estadoResultado = ex != null ? "FALLO: " + ex.getMessage() : (response.getStatus() < 400 ? "EXITO" : "ERROR_HTTP_" + response.getStatus());

        auditoriaService.registrarEvento(usuario, request.getMethod(), accionNegocio, request.getRemoteAddr(), response.getStatus(), estadoResultado);
    }
}
```

### Tabla de Traducción de Auditoría:
* `POST /api/auth/register` $\rightarrow$ *"Creación y registro de nuevo usuario corporativo"*
* `POST /api/auth/login` $\rightarrow$ *"Inicio de sesión exitoso en portal corporativo"*
* `POST /api/ia/chat` $\rightarrow$ *"Consulta de saldo de vacaciones e información interna vía Asistente IA"*
* `POST /api/ia/clasificar` $\rightarrow$ *"Clasificación automática de trámite con modelo de Inteligencia Artificial"*
* `POST /api/solicitudes` $\rightarrow$ *"Radicación de nueva solicitud de trámite (vacaciones, permiso, reembolso)"*
* `PATCH /api/solicitudes/{id}/decision` $\rightarrow$ *"Resolución y decisión de solicitud #{id} por Jefe Directo/Aprobador"*

---

# 5. INTEGRACIÓN DE INTELIGENCIA ARTIFICIAL (LANGCHAIN4J + GOOGLE GEMINI)

### 5.1. Módulo 1: Clasificador Inteligente de Texto Libre (`HrClasificadorService.java`)
Convierte una redacción informal en lenguaje cotidiano en una entidad estructurada lista para el sistema:

```java
public interface HrClasificadorService {

    @SystemMessage("""
        Eres un clasificador experto de solicitudes de Recursos Humanos.
        Analiza el texto libre que envía un empleado y responde ÚNICAMENTE un objeto JSON válido con los siguientes campos:
        {
          "tipoSolicitud": "VACACIONES" | "PERMISO_MEDICO" | "REEMBOLSO" | "CERTIFICADO_LABORAL" | "OTRO",
          "nivelUrgencia": "BAJA" | "MEDIA" | "ALTA",
          "responsableAsignado": "JEFE_DIRECTO" | "ADMIN_RRHH",
          "justificacionBreve": "Resumen conciso en una línea del motivo expresado por el empleado"
        }
        No incluyas explicaciones adicionales, ni bloques markdown, solo el JSON puro.
        """)
    String clasificar(@UserMessage String textoSolicitud);
}
```

### 5.2. Módulo 2: Asistente Virtual RAG con Datos Reales de PostgreSQL (`HrAssistantService.java`)
A diferencia de un chatbot genérico que alucina información, este asistente implementa **RAG (Retrieval-Augmented Generation)**:
1. En cada petición, `IaController` consulta la base de datos PostgreSQL:
   - Días reales de vacaciones disponibles del colaborador logueado.
   - Catálogo vigente de políticas corporativas.
2. Inyecta estos datos de forma segura en las variables del prompt del sistema:

```java
public interface HrAssistantService {

    @SystemMessage("""
        Eres el Asistente Experto Corporativo de Recursos Humanos y Gestión del Talento de la empresa.
        Tu misión es responder con tono profesional, empático y conciso, utilizando estrictamente
        la información real provista desde la base de datos de la compañía:

        INFORMACIÓN DEL COLABORADOR AUTENTICADO:
        {{datosColaborador}}

        POLÍTICAS INTERNAS DE LA EMPRESA:
        {{contextoPoliticas}}

        REGLAS FUNDAMENTALES:
        1. Cuando el usuario pregunte por sus vacaciones, saldo de días o balance de descanso,
           responde con la cifra exacta provista en "INFORMACIÓN DEL COLABORADOR AUTENTICADO".
        2. Para dudas sobre permisos de salud, certificados o reembolsos, básate en las "POLÍTICAS INTERNAS".
        """)
    String chat(
            @V("datosColaborador") String datosColaborador,
            @V("contextoPoliticas") String contextoPoliticas,
            @UserMessage String mensaje
    );
}
```

---

# 6. CAPA DE DOMINIO Y PERSISTENCIA (SPRING DATA JPA + POSTGRESQL)

### 6.1. Entidades Principales:
* **Usuario:** ID, email (único), passwordHash (BCrypt), nombreCompleto, diasVacacionesDisponibles, activo, jefeDirecto (`@ManyToOne`), roles (`@ManyToMany`).
* **Solicitud:** ID, empleado, tipoSolicitud, fechaInicio, fechaFin, diasSolicitados, motivo, montoReembolso, estado (`PENDIENTE`, `APROBADA_JEFE`, `RECHAZADA`), aprobadorActual, observacionAprobador.
* **PoliticaEmpresa:** ID, titulo, categoria, contenido, activo.
* **AuditoriaLog:** ID, usuarioEmail, metodoHttp, uriAccedida (Acción de Negocio), ipOrigen, codigoEstadoHttp, timestamp, metadata.

### 6.2. Regla de Negocio Transaccional en Vacaciones (`SolicitudService.java`):
Cuando un Jefe Directo aprueba una solicitud de vacaciones, el sistema descuenta de forma atómica en la misma transacción (`@Transactional`) los días del balance del colaborador:

```java
if (Boolean.TRUE.equals(decision.aprobada())) {
    solicitud.setEstado(Solicitud.EstadoSolicitud.APROBADA_JEFE);

    if ("VACACIONES".equalsIgnoreCase(solicitud.getTipoSolicitud().getCodigo())) {
        Usuario emp = solicitud.getEmpleado();
        emp.setDiasVacacionesDisponibles(emp.getDiasVacacionesDisponibles() - solicitud.getDiasSolicitados());
        usuarioRepository.save(emp);
    }
}
```

---

# 7. CAPA FRONTEND (ANGULAR 17 MODERNO)

### 7.1. Características Técnicas:
* **Standalone Components:** Eliminación de `NgModule` monolíticos.
* **Signals Reactivos:** `signal<Solicitud[]>([])`, `computed()` para autenticación inmediata sin suscripciones manuales complejas.
* **Control Flow Nativo:** Uso de `@if`, `@else` y `@for (...; track ...)` para máximo rendimiento en renderizado.
* **Auto-Scroll Suave en Chat:**
  ```typescript
  @ViewChild('chatHistoryContainer') chatHistoryContainer?: ElementRef<HTMLDivElement>;

  private hacerScrollChat() {
    setTimeout(() => {
      if (this.chatHistoryContainer?.nativeElement) {
        const el = this.chatHistoryContainer.nativeElement;
        el.scrollTo({ top: el.scrollHeight, behavior: 'smooth' });
      }
    }, 50);
  }
  ```
* **Aislamiento de Sesión:** Función `reiniciarEstadoSesion()` que limpia el chat de IA, variables de formulario y listas al cambiar de usuario o cerrar sesión.

---

# 8. GUÍA RÁPIDA DE ESTRUCTURA PARA DIAPOSITIVAS

### Diapositiva 1: Portada
* **Título:** Portal Corporativo RR.HH. & Asistente Virtual con IA
* **Subtítulo:** Arquitectura Empresarial con Spring Boot 3, Angular 17 y Google Gemini
* **Autora:** Dayanara Lisseth Bautista Bravo

### Diapositiva 2: El Problema de Negocio
* Procesos manuales y desorganizados en la solicitud de permisos y vacaciones.
* Carga operativa en RR.HH. resolviendo dudas repetitivas sobre políticas internas.
* Falta de trazabilidad y auditoría en las decisiones de jefatura.

### Diapositiva 3: La Solución Propuesta
* Plataforma web responsiva y segura.
* Clasificador IA que interpreta lenguaje natural y tipifica trámites.
* Asistente virtual RAG que responde dudas con datos reales de la BD PostgreSQL.
* Flujo de aprobación jerárquico (Empleado $\rightarrow$ Jefe Directo $\rightarrow$ Admin RR.HH.).

### Diapositiva 4: Arquitectura del Sistema
* Diagrama de capas: Frontend (Vercel) $\leftrightarrow$ REST API (Render Docker) $\leftrightarrow$ Base de Datos (PostgreSQL Cloud).
* Patrón RAG con LangChain4j y Google Gemini.

### Diapositiva 5: Seguridad y Control de Acceso
* Spring Security 6 sin estado (Stateless).
* Tokens JWT (HMAC-SHA512).
* RBAC (*Role-Based Access Control*) con interceptores `@RequiereRol`.

### Diapositiva 6: Auditoría de Negocio
* Interceptor HTTP que registra acciones operacionales comprensibles (no solo URLs crudas).
* Normalización automática de IPs locales.
* Auditoría específica de login exitoso e intentos fallidos.

### Diapositiva 7: Demostración en Vivo (Demo Script)
1. **Login:** Ingreso con `empleado@empresa.com`.
2. **Clasificador IA:** Escribir un texto informal médico; mostrar el JSON resultante con urgencia y destinatario.
3. **Chatbot IA:** Preguntar *"¿cuántos días de vacaciones tengo?"* (mostrar concordancia con los 14 días reales).
4. **Radicación:** Enviar solicitud de vacaciones.
5. **Aprobación:** Salir e ingresar con `jefe@empresa.com`; aprobar la solicitud.
6. **Auditoría:** Ingresar con `admin@empresa.com`; mostrar el registro inmutable de la aprobación y consultas IA.

### Diapositiva 8: Conclusiones y Logros
* Cumplimiento integral de arquitectura por capas, principios SOLID y desacoplamiento.
* Integración exitosa de IA Generativa conectada a base de datos relacional.
* Despliegue en producción con alta disponibilidad (Vercel + Render + PostgreSQL).

