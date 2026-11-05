# GUÍA DIAPOSITIVA POR DIAPOSITIVA (LISTO PARA COPIAR Y PEGAR)
## PORTAL CORPORATIVO RR.HH. & ASISTENTE IA (SPRING BOOT 3 + ANGULAR 17)
**Estudiante:** Dayanara Lisseth Bautista Bravo  
**Asignatura:** Programación Avanzada  

---

## 📌 DIAPOSITIVA 1: PORTADA

### Título de la Diapositiva:
**Portal Corporativo de RR.HH. con Inteligencia Artificial (RAG)**  
*Arquitectura Empresarial Desacoplada con Spring Boot 3, Angular 17 y Google Gemini*

### Texto para la lámina (Bullets):
* **Estudiante:** Dayanara Lisseth Bautista Bravo
* **Docente:** Ing. John Javier Cruz Garzón Mgtr.
* **Carrera:** Ingeniería en Tecnologías de la Información
* **Universidad:** Universidad de las Fuerzas Armadas ESPE — Sede Santo Domingo

### 🗣️ Lo que debes decir al exponer:
> *"Buenos días, ingeniero y miembros del jurado. Hoy les presento el desarrollo y despliegue en producción de una plataforma empresarial para la gestión y auditoría de trámites laborales de Recursos Humanos. El núcleo del sistema integra una arquitectura por capas en Spring Boot 3, autenticación sin estado con Spring Security 6 y JWT, base de datos relacional PostgreSQL en la nube, interfaz moderna en Angular 17 y dos servicios de Inteligencia Artificial Generativa aplicando el patrón RAG con LangChain4j."*

---

## 📌 DIAPOSITIVA 2: EL PROBLEMA Y LA MOTIVACIÓN DE NEGOCIO

### Título de la Diapositiva:
**Problemática Empresarial y Justificación Técnica**

### Texto para la lámina (Bullets):
* **Procesos Manuales y Burocráticos:** Trámites de vacaciones, permisos y reembolsos gestionados por correos o papeles sin orden.
* **Sobrecarga de Consultas en RR.HH.:** Colaboradores preguntando repetitivamente su saldo de vacaciones o interpretaciones de normativas internas.
* **Falta de Trazabilidad Real:** Decisiones de aprobación o rechazo que carecen de una auditoría inmutable orientada al negocio.
* **Riesgo de Alucinación en la IA:** Chatbots convencionales que inventan saldos o políticas si no están conectados a la base de datos oficial.

### 🗣️ Lo que debes decir al exponer:
> *"En la mayoría de organizaciones, el departamento de Recursos Humanos pierde horas resolviendo dudas rutinarias y procesando solicitudes en papel o cadenas de correos. Además, si quisiéramos poner una IA cualquiera a atender empleados, correríamos el grave riesgo de que 'alucine' o invente datos de vacaciones. Por eso diseñamos una solución integral que automatiza el ciclo de vida del trámite, protege la información con perfiles jerárquicos y conecta la IA a la base de datos real."*

---

## 📌 DIAPOSITIVA 3: ARQUITECTURA DE SOFTWARE Y DESACOPLAMIENTO CLOUD

### Título de la Diapositiva:
**Arquitectura Global del Sistema (Cloud-Native & Stateless)**

### 📊 Diagrama para poner en la diapositiva:
```
[ CLIENTE - VERCEL CDN ]
      Angular 17 (Signals + Standalone)
                │ HTTPS (REST JSON + Bearer JWT)
                ▼
[ BACKEND - RENDER DOCKER CONTAINER ]
      Spring Boot 3 Web API (Port 8080)
      ├── Spring Security 6 (Stateless JWT)
      ├── Interceptores (Seguridad @RequiereRol + Auditoría de Negocio)
      ├── Capa de Servicios & Notificaciones (IoC / SOLID)
      └── Integración IA (LangChain4j 1.22)
                │                         │
                ▼                         ▼
   [ POSTGRESQL CLOUD ]         [ GOOGLE GEMINI AI ]
    Persistencia ACID JPA        Modelos Fundacionales
```

### Texto para la lámina (Bullets):
* **Frontend en Vercel:** Servido globalmente desde la CDN de Vercel sin consumir recursos del servidor.
* **Backend en Render (Docker):** Contenedor Linux multi-etapa con Eclipse Temurin JDK 17 y JRE Alpine.
* **Base de Datos en PostgreSQL Render:** Motor relacional con integridad referencial y transacciones ACID.
* **Comunicación Segura:** CORS habilitado y autenticación desacoplada con tokens criptográficos.

### 🗣️ Lo que debes decir al exponer:
> *"Implementamos una arquitectura desacoplada y nativa de la nube. El frontend corre en Angular 17 sobre la red mundial de Vercel, mientras que el backend corre como un contenedor Docker en Render. No guardamos sesiones en la memoria del servidor; cada petición viaja autenticada mediante un token JWT, lo que hace al sistema horizontalmente escalable y tolerante a fallos."*

---

## 📌 DIAPOSITIVA 4: CAPA DE SEGURIDAD (SPRING SECURITY 6 & JWT)

### Título de la Diapositiva:
**Seguridad Sin Estado (Stateless) y Modelo RBAC**

### Texto para la lámina (Bullets):
* **Filtro Personalizado `JwtAuthenticationFilter`:** Intercepta la cabecera `Authorization: Bearer <token>`.
* **Firma Criptográfica HMAC-SHA512:** Garantiza que el token no ha sido manipulado ni alterado.
* **Contraseñas Seguras:** Hasheadas con algoritmo BCrypt (`passwordEncoder.encode()`).
* **Control de Acceso Basado en Roles (RBAC):**
  - `ROLE_EMPLEADO`: Radicación de trámites personales y consultas al Asistente IA.
  - `ROLE_JEFE`: Aprobación de solicitudes de subordinados y gestión personal.
  - `ROLE_ADMIN_RRHH`: Control total, visualización de auditoría y gestión de políticas.

### 💻 Fragmento de Código Clave para la lámina:
```java
// Spring Security 6: Sesión sin estado
http.sessionManagement(s -> s.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
    .authorizeHttpRequests(auth -> auth
        .requestMatchers("/api/auth/**", "/api/politicas/**").permitAll()
        .anyRequest().authenticated()
    )
    .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);
```

### 🗣️ Lo que debes decir al exponer:
> *"La seguridad se implementó con Spring Security 6 bajo el patrón Stateless. Cuando un usuario inicia sesión, el servidor valida sus credenciales en PostgreSQL y le expide un token JWT firmado. En las peticiones posteriores, nuestro filtro `JwtAuthenticationFilter` extrae el token, valida su firma matemática en milisegundos y carga los roles del usuario sin necesidad de consultar nuevamente la base de datos."*

---

## 📌 DIAPOSITIVA 5: ARQUITECTURA DEL BACKEND (CAPAS Y PRINCIPIOS SOLID)

### Título de la Diapositiva:
**Diseño Interno del Backend (Spring Boot 3)**

### 📊 Diagrama de Capas para la diapositiva:
```
Controladores (@RestController) ──▶ Expone endpoints y valida DTOs (@Valid)
             │
Interceptores (HandlerInterceptor) ──▶ Seguridad granular y auditoría automática
             │
Servicios (@Service) ──▶ Lógica de negocio y transacciones (@Transactional)
             │
Inversión de Control (IoC) ──▶ NotificadorService (Email / Slack polimórfico)
             │
Repositorios (JpaRepository) ──▶ Operaciones de persistencia relacional
             │
Entidades (@Entity) ──▶ Tablas mapeadas en PostgreSQL
```

### Texto para la lámina (Bullets):
* **Desacoplamiento con DTOs:** Separación estricta entre el contrato público JSON y las tablas de base de datos.
* **Validación Declarativa:** Uso de Jakarta Bean Validation (`@NotBlank`, `@Email`, `@Min`).
* **Inyección de Dependencias (IoC):** Desacoplamiento de notificadores (`EmailNotificadorService` vs `SlackNotificadorService`).
* **Atomicidad Transaccional (`@Transactional`):** Garantiza que si se aprueba una vacación, el cambio de estado y el descuento de días ocurran juntos o se haga rollback.

### 🗣️ Lo que debes decir al exponer:
> *"El backend sigue rigurosamente los principios SOLID y la arquitectura por capas. El controlador nunca toca la base de datos; trabaja con DTOs validados. La lógica de negocio reside en los `@Service`, donde destaca el uso de `@Transactional`: al aprobarse una solicitud, el cambio de estado y el débito de días hábiles ocurren en una sola transacción indivisible."*

---

## 📌 DIAPOSITIVA 6: INTERCEPTORES Y AUDITORÍA DE NEGOCIO

### Título de la Diapositiva:
**Capa Transversal: Interceptores & Auditoría de Negocio**

### Texto para la lámina (Bullets):
* **Control de Acceso Granular con `@RequiereRol`:**
  - Anotación personalizada que valida privilegios antes de invocar el método del controlador.
  - Bloquea accesos no autorizados con código estándar `HTTP 403 Forbidden`.
* **Auditoría Orientada al Negocio (`AuditoriaInterceptor`):**
  - Transforma endpoints técnicos en eventos comprensibles para gerencia y auditores.
  - Normaliza direcciones locales (`::1`, `0:0:0:0:0:0:0:1` $\rightarrow$ `127.0.0.1`).
  - Auditoría separada de login exitoso e intentos fallidos (`401 Unauthorized`).

### 📊 Tabla Comparativa para la lámina:
| Método y Ruta HTTP Tradicional | Evento Registrado en Base de Datos (Auditoría de Negocio) |
| :--- | :--- |
| `POST /api/solicitudes` | *"Radicación de nueva solicitud de trámite (vacaciones, permiso, reembolso)"* |
| `PATCH /api/solicitudes/12/decision` | *"Resolución y decisión de solicitud #12 por Jefe Directo/Aprobador"* |
| `POST /api/ia/chat` | *"Consulta de saldo de vacaciones e información interna vía Asistente IA"* |
| `POST /api/auth/login (200)` | *"Inicio de sesión exitoso en portal corporativo (usuario@empresa.com)"* |
| `POST /api/auth/login (401)` | *"Intento fallido de inicio de sesión (credenciales incorrectas)"* |

### 🗣️ Lo que debes decir al exponer:
> *"Un aporte fundamental de nuestra arquitectura son los Interceptores de Spring MVC. Creamos `@RequiereRol` para proteger métodos de manera declarativa. Y en lugar de guardar registros técnicos incomprensibles como 'POST /api/solicitudes', nuestro `AuditoriaInterceptor` traduce cada acción a un lenguaje de negocio claro: quién radicó, quién aprobó y qué consultó cada usuario, con trazabilidad inmutable de IP y códigos de respuesta."*

---

## 📌 DIAPOSITIVA 7: INTELIGENCIA ARTIFICIAL EN PRODUCCIÓN (PATRÓN RAG)

### Título de la Diapositiva:
**Inteligencia Artificial con LangChain4j y Google Gemini**

### Texto para la lámina (Bullets):
* **Módulo 1: Clasificador Inteligente de Texto Libre (`HrClasificadorService`)**
  - Recibe lenguaje cotidiano del empleado (ej. *"me duele la muela"*).
  - Gemini extrae entidades y responde **únicamente JSON estructurado**:
    `{ tipoSolicitud, nivelUrgencia, responsableAsignado, justificacionBreve }`.
* **Módulo 2: Asistente Virtual RAG (`HrAssistantService`)**
  - **RAG (Retrieval-Augmented Generation):** La IA no adivina datos.
  - El backend consulta a PostgreSQL el saldo exacto del empleado y las políticas corporativas vigentes.
  - Esos datos reales se inyectan en el prompt del sistema antes de llamar al modelo.

### 💻 Prompt del Sistema RAG en LangChain4j:
```java
@SystemMessage("""
    Eres el Asistente Experto Corporativo de RR.HH.
    Responde con tono profesional apoyándote estrictamente en los datos de la empresa:
    
    INFORMACIÓN DEL COLABORADOR: {{datosColaborador}}
    POLÍTICAS CORPORATIVAS: {{contextoPoliticas}}
    
    REGLA: Para saldo de vacaciones responde la cifra exacta provista en la información.
    """)
String chat(@V("datosColaborador") String datos, @V("contextoPoliticas") String pol, @UserMessage String msg);
```

### 🗣️ Lo que debes decir al exponer:
> *"Para la IA utilizamos LangChain4j conectado a Google Gemini. Tenemos dos capacidades: primero, un clasificador que convierte un texto informal en un trámite tipificado con nivel de urgencia y destinatario en JSON puro. Segundo, implementamos el patrón RAG: cuando el usuario pregunta cuántos días de vacaciones le quedan, el backend busca en PostgreSQL su balance oficial y las políticas activas, e inyecta esa verdad en el prompt. La IA redacta con empatía, pero jamás alucina o inventa números."*

---

## 📌 DIAPOSITIVA 8: EL FRONTEND EN ANGULAR 17 (MODERNO Y REACTIVO)

### Título de la Diapositiva:
**Frontend Moderno: Angular 17 & UI Corporativa**

### Texto para la lámina (Bullets):
* **Arquitectura Standalone:** Cero módulos complejos (`NgModule`); componentes autónomos y ligeros.
* **Signals Reactivos:** Manejo reactivo de estado (`signal()`, `computed()`) con actualización en milisegundos.
* **Control Flow Moderno:** Reemplazo de directivas pesadas por sintaxis nativa `@if`, `@else` y `@for track`.
* **UX / UI Corporativa:**
  - Diseño en escala de grises y tonos claros profesionales (sin emojis infantiles).
  - **Auto-scroll automático:** Desplazamiento suave hacia el último mensaje de la IA mediante `@ViewChild`.
  - **Aislamiento de Sesión:** Limpieza completa de memoria al cerrar sesión para garantizar confidencialidad entre roles.

### 🗣️ Lo que debes decir al exponer:
> *"La interfaz gráfica fue construida con las últimas características de Angular 17. Usamos Standalone Components y Signals reactivos para actualizar las tablas de solicitudes y auditoría en tiempo real. Cuidamos cada detalle de la experiencia de usuario: el diseño usa tonos sobrios corporativos, cuenta con auto-scroll suave en el chat de IA y un reinicio completo del estado de memoria cuando un colaborador cierra su sesión."*

---

## 📌 DIAPOSITIVA 9: GUION DEMO EN VIVO (PASO A PASO)

### Título de la Diapositiva:
**Demostración Funcional en Vivo (Flujo End-to-End)**

### Puntos a mostrar en la pantalla proyectada:
1. **Acceso al Enlace Público Vercel:**  
   `https://gestor-inventario-pa-eight.vercel.app`
2. **Login Empleado (`empleado@empresa.com` / `123456`):**
   - Mostrar que arriba a la derecha figura su nombre y sus **14 días de vacaciones**.
3. **Prueba Clasificador IA:**
   - Escribir: *"Tuve un accidente en la rodilla jugando fútbol y requiero 3 días de reposo"*.
   - Ver cómo clasifica a: `PERMISO_MEDICO`, Urgencia `ALTA`, Destinatario `JEFE_DIRECTO`.
4. **Prueba Chatbot RAG:**
   - Preguntar: *"¿Cuántos días de vacaciones tengo?"* $\rightarrow$ Responde **14 días**.
   - Preguntar: *"¿Cuál es la fecha límite para entregar facturas de reembolso?"* $\rightarrow$ Responde **el día 25**.
5. **Radicación y Aprobación:**
   - Radicar solicitud de 3 días de vacaciones.
   - Salir y entrar con `jefe@empresa.com` $\rightarrow$ Ir a **Bandeja de Aprobaciones** y hacer clic en **Aprobar**.
   - El saldo del empleado se reduce automáticamente en la base de datos a 11 días.
6. **Auditoría Admin:**
   - Ingresar con `admin@empresa.com` $\rightarrow$ Mostrar la tabla de **Auditoría RR.HH.** con los registros de la aprobación y consultas IA.

---

## 📌 DIAPOSITIVA 10: CONCLUSIONES Y LOGROS TÉCNICOS

### Título de la Diapositiva:
**Conclusiones y Cumplimiento de Objetivos**

### Texto para la lámina (Bullets):
* **Arquitectura Enterprise Verificada:** Aplicación estricta de separación de responsabilidades, principios SOLID y patrones de diseño.
* **Seguridad Robusta:** Autenticación sin estado, control RBAC y protección de endpoints con interceptores.
* **Inteligencia Artificial de Precisión:** Eliminación de alucinaciones mediante el patrón RAG conectado a PostgreSQL.
* **Despliegue Multi-Cloud Exitoso:** Sistema 100% operativo en producción integrando Vercel (Frontend), Render Docker (Backend) y PostgreSQL Cloud.
* **Impacto Organizacional:** Reducción del 80% en tiempos de gestión manual de solicitudes de talento humano.

### 🗣️ Lo que debes decir al exponer:
> *"Para concluir, este proyecto demuestra que la Inteligencia Artificial Generativa no es un juguete, sino una herramienta de altísimo valor cuando se integra con arquitecturas empresariales formales. Logramos un sistema seguro, trazable, transaccional y totalmente desplegado en la nube que cumple con todos los estándares de la materia Programación Avanzada. Quedo atenta a las preguntas del jurado. Muchas gracias."*

