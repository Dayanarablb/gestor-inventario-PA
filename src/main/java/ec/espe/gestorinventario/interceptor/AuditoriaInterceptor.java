package ec.espe.gestorinventario.interceptor;

import ec.espe.gestorinventario.service.AuditoriaService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.servlet.HandlerInterceptor;

@Component
public class AuditoriaInterceptor implements HandlerInterceptor {

    private final AuditoriaService auditoriaService;

    public AuditoriaInterceptor(AuditoriaService auditoriaService) {
        this.auditoriaService = auditoriaService;
    }

    @Override
    public void afterCompletion(HttpServletRequest request, HttpServletResponse response, Object handler, Exception ex) {
        String uri = request.getRequestURI();
        if (!uri.startsWith("/api/")) {
            return;
        }

        // Ignoramos consultas GET a la lista de logs de auditoría para no generar bucles de auto-auditoría
        if (uri.startsWith("/api/auditoria/logs")) {
            return;
        }

        // El login se audita directamente en AuthController con el correo real autenticado
        if (uri.equals("/api/auth/login")) {
            return;
        }

        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        String usuario = (auth != null && auth.isAuthenticated() && !"anonymousUser".equals(auth.getPrincipal()))
                ? auth.getName() : "ANONIMO";

        String accionNegocio = interpretarAccionDeNegocio(request.getMethod(), uri, usuario);
        String estadoResultado = ex != null ? "FALLO: " + ex.getMessage() : (response.getStatus() < 400 ? "EXITO" : "ERROR_HTTP_" + response.getStatus());

        auditoriaService.registrarEvento(
                usuario,
                request.getMethod(),
                accionNegocio,
                request.getRemoteAddr(),
                response.getStatus(),
                estadoResultado
        );
    }

    /**
     * Mapea métodos HTTP y rutas técnicas a descripciones funcionales de negocio legibles para auditoría.
     */
    private String interpretarAccionDeNegocio(String metodo, String uri, String usuario) {
        // 1. Autenticación y Registro de Usuarios
        if (uri.equals("/api/auth/register") && "POST".equalsIgnoreCase(metodo)) {
            return "Creación y registro de nuevo usuario corporativo";
        }

        // 2. Inteligencia Artificial (Chat y Clasificador)
        if (uri.startsWith("/api/ia/chat")) {
            return "Consulta de saldo de vacaciones e información interna vía Asistente IA";
        }
        if (uri.startsWith("/api/ia/clasificar")) {
            return "Clasificación automática de trámite con modelo de Inteligencia Artificial";
        }

        // 3. Trámites y Solicitudes
        if (uri.matches("^/api/solicitudes/\\d+/decision$") && "PATCH".equalsIgnoreCase(metodo)) {
            String id = uri.replaceAll("\\D+", "");
            return "Resolución y decisión de solicitud #" + id + " por Jefe Directo/Aprobador";
        }
        if (uri.equals("/api/solicitudes") && "POST".equalsIgnoreCase(metodo)) {
            return "Radicación de nueva solicitud de trámite (vacaciones, permiso, reembolso)";
        }
        if (uri.equals("/api/solicitudes/mis-solicitudes") && "GET".equalsIgnoreCase(metodo)) {
            return "Consulta de historial de solicitudes personales de colaborador";
        }
        if (uri.equals("/api/solicitudes/pendientes-aprobacion") && "GET".equalsIgnoreCase(metodo)) {
            return "Revisión de bandeja de solicitudes pendientes de aprobación";
        }

        // 4. Políticas Empresariales
        if (uri.startsWith("/api/politicas")) {
            if ("POST".equalsIgnoreCase(metodo)) {
                return "Creación de nueva política corporativa interna";
            }
            if ("PUT".equalsIgnoreCase(metodo)) {
                return "Modificación de política interna existente";
            }
            if ("DELETE".equalsIgnoreCase(metodo)) {
                return "Eliminación de política corporativa interna";
            }
            if ("GET".equalsIgnoreCase(metodo)) {
                return "Consulta de catálogo de políticas corporativas vigentes";
            }
        }

        // Fallback descriptivo estructurado
        return String.format("Operación sobre recurso funcional %s", uri);
    }
}
