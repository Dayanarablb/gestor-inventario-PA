package ec.espe.gestorinventario.service;

import ec.espe.gestorinventario.entity.AuditoriaLog;
import ec.espe.gestorinventario.repository.AuditoriaLogRepository;
import jakarta.servlet.http.HttpServletRequest;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;

@Service
public class AuditoriaService {

    private static final Logger log = LoggerFactory.getLogger(AuditoriaService.class);
    private final AuditoriaLogRepository auditoriaLogRepository;

    public AuditoriaService(AuditoriaLogRepository auditoriaLogRepository) {
        this.auditoriaLogRepository = auditoriaLogRepository;
    }

    public void registrarEvento(String usuarioEmail, String metodoHttp, String accionNegocio,
                                String ipOrigen, int statusCode, String metadata) {
        // Normalizar IP local para visualización limpia
        String ipNormalizada = normalizarIp(ipOrigen);

        AuditoriaLog entry = new AuditoriaLog(
                usuarioEmail,
                metodoHttp,
                accionNegocio,
                ipNormalizada,
                statusCode,
                LocalDateTime.now(),
                metadata
        );

        try {
            auditoriaLogRepository.save(entry);
        } catch (Exception ex) {
            log.error("Error al persistir log de auditoría: {}", ex.getMessage());
        }
    }

    public static String normalizarIp(String ip) {
        if (ip == null || ip.isBlank()) {
            return "127.0.0.1";
        }
        if ("0:0:0:0:0:0:0:1".equals(ip) || "::1".equals(ip) || "localhost".equalsIgnoreCase(ip)) {
            return "127.0.0.1";
        }
        return ip;
    }
}

