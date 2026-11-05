# Guía de Despliegue en Producción — Portal RR.HH. & Asistente IA

Este documento describe la arquitectura de despliegue para el **Frontend (Angular 17 en Vercel)** y el **Backend (Spring Boot 3 + PostgreSQL)**.

---

## 1. Configuración del Frontend en Vercel (Angular 17)

### Parámetros en el Dashboard de Vercel:
1. Conecta tu repositorio de GitHub: `https://github.com/Dayanarablb/gestor-inventario-PA.git`
2. En **Root Directory**, selecciona la carpeta: `frontend`
3. En **Framework Preset**, selecciona: `Angular`
4. **Build & Output Settings**:
   - **Build Command**: `npm run build` o `ng build`
   - **Output Directory**: `dist/rrhh-frontend/browser` *(Nota: En Angular 17 con Application Builder, los archivos estáticos se generan dentro de la subcarpeta `browser`)*.
   - **Install Command**: `npm install`
5. **Ruteo SPA (Single Page Application)**:
   El archivo `frontend/vercel.json` ya se encuentra configurado en el proyecto:
   ```json
   {
     "rewrites": [{ "source": "/(.*)", "destination": "/index.html" }]
   }
   ```
6. Haz clic en **Deploy**.

---

## 2. Configuración del Backend (Spring Boot 3 + Docker)

> **Nota de Arquitectura sobre Vercel y Java:**  
> Vercel está optimizado para entornos serverless (Node.js, Edge Functions, Python y Go). Para desplegar servicios de backend continuos en Java / Spring Boot con base de datos PostgreSQL y WebSockets/Tomcat, se utiliza el archivo generado `Dockerfile.vercel` en una plataforma de contenedores en la nube gratuita o de bajo costo (como **Railway**, **Render**, **Koyeb** o **Fly.io**), las cuales admiten Dockerfile nativo sin restricciones.

### Variables de Entorno Requeridas para el Backend:
Configura estas variables en tu plataforma de despliegue de contenedores (o base de datos administrada como Supabase, Neon o Railway PostgreSQL):

| Variable de Entorno | Ejemplo / Descripción |
| :--- | :--- |
| `SPRING_DATASOURCE_URL` | `jdbc:postgresql://ep-xyz.region.aws.neon.tech:5432/rrhh_db?sslmode=require` |
| `SPRING_DATASOURCE_USERNAME` | Tu usuario de PostgreSQL (ej: `postgres` o `admin`) |
| `SPRING_DATASOURCE_PASSWORD` | Tu contraseña segura de PostgreSQL |
| `JWT_SECRET` | Clave secreta hexadecimal de 256 bits |
| `PORT` | `8080` |
| `GEMINI_API_KEY` | Tu API Key para LangChain4j de Google AI Studio |

---

## 3. Conexión Frontend - Backend (CORS)

El backend ya tiene configurado `SecurityConfig.java` con:
- `setAllowedOriginPatterns(List.of("*"))`
- Soporte para credenciales (`allowCredentials: true`) y cabeceras de autorización (`Authorization`).

Esto permite que tu dominio de frontend en Vercel (ej: `https://tu-proyecto.vercel.app`) consuma la API del backend sin bloqueos de origen cruzado (CORS).
