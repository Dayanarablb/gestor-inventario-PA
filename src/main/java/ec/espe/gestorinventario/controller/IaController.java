package ec.espe.gestorinventario.controller;

import com.fasterxml.jackson.databind.ObjectMapper;
import ec.espe.gestorinventario.ai.service.HrAssistantService;
import ec.espe.gestorinventario.ai.service.HrClasificadorService;
import ec.espe.gestorinventario.dto.request.ChatRequestDTO;
import ec.espe.gestorinventario.dto.request.TextoLibreDTO;
import ec.espe.gestorinventario.dto.response.ChatResponseDTO;
import ec.espe.gestorinventario.dto.response.ClasificacionResponseDTO;
import ec.espe.gestorinventario.entity.PoliticaEmpresa;
import ec.espe.gestorinventario.entity.Usuario;
import ec.espe.gestorinventario.repository.PoliticaEmpresaRepository;
import ec.espe.gestorinventario.repository.UsuarioRepository;
import jakarta.validation.Valid;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Optional;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/ia")
public class IaController {

    private static final Logger log = LoggerFactory.getLogger(IaController.class);

    private final HrAssistantService hrAssistantService;
    private final HrClasificadorService hrClasificadorService;
    private final UsuarioRepository usuarioRepository;
    private final PoliticaEmpresaRepository politicaRepository;
    private final ObjectMapper objectMapper = new ObjectMapper();

    public IaController(HrAssistantService hrAssistantService,
                        HrClasificadorService hrClasificadorService,
                        UsuarioRepository usuarioRepository,
                        PoliticaEmpresaRepository politicaRepository) {
        this.hrAssistantService = hrAssistantService;
        this.hrClasificadorService = hrClasificadorService;
        this.usuarioRepository = usuarioRepository;
        this.politicaRepository = politicaRepository;
    }

    @PostMapping("/chat")
    public ResponseEntity<ChatResponseDTO> chat(@Valid @RequestBody ChatRequestDTO request, Authentication auth) {
        String usuarioActual = (auth != null && auth.isAuthenticated()) ? auth.getName() : "empleado@empresa.com";
        log.info("Consulta a asistente IA por usuario: {}", usuarioActual);

        // 1. Obtener datos del colaborador directamente desde la BD (PostgreSQL)
        Optional<Usuario> usuarioOpt = usuarioRepository.findByEmail(usuarioActual);
        String datosColaborador;
        if (usuarioOpt.isPresent()) {
            Usuario u = usuarioOpt.get();
            datosColaborador = String.format("- Nombre: %s\n- Correo: %s\n- Saldo disponible de vacaciones: %d días hábiles\n- Rol principal: %s",
                    u.getNombreCompleto(),
                    u.getEmail(),
                    u.getDiasVacacionesDisponibles(),
                    u.getRoles().stream().map(r -> r.getNombre()).findFirst().orElse("EMPLEADO"));
        } else {
            datosColaborador = "Colaborador no encontrado en el padrón corporativo para el correo: " + usuarioActual;
        }

        // 2. Obtener políticas activas desde la BD
        List<PoliticaEmpresa> politicas = politicaRepository.findByActivoTrue();
        String contextoPoliticas = politicas.stream()
                .map(p -> String.format("### %s (%s):\n%s", p.getTitulo(), p.getCategoria(), p.getContenido()))
                .collect(Collectors.joining("\n\n"));
        if (contextoPoliticas.isBlank()) {
            contextoPoliticas = "No hay políticas adicionales registradas.";
        }

        try {
            // Se envía a Gemini con el contexto inyectado de forma segura y compatible con el endpoint OpenAI
            String respuesta = hrAssistantService.chat(datosColaborador, contextoPoliticas, request.mensaje());
            return ResponseEntity.ok(new ChatResponseDTO(respuesta, true));
        } catch (Exception e) {
            log.error("Error al comunicarse con el motor de IA: {}", e.getMessage(), e);
            String errorMsg = "⚠️ No se pudo procesar la consulta con el motor de IA: " + e.getMessage();
            return ResponseEntity.ok(new ChatResponseDTO(errorMsg, false));
        }
    }

    @PostMapping("/clasificar")
    public ResponseEntity<ClasificacionResponseDTO> clasificar(@Valid @RequestBody TextoLibreDTO request) {
        try {
            String jsonRaw = hrClasificadorService.clasificar(request.texto());
            log.info("Respuesta cruda de Gemini Clasificador: {}", jsonRaw);

            String jsonLimpio = jsonRaw.trim();
            if (jsonLimpio.startsWith("```json")) {
                jsonLimpio = jsonLimpio.substring(7);
            }
            if (jsonLimpio.startsWith("```")) {
                jsonLimpio = jsonLimpio.substring(3);
            }
            if (jsonLimpio.endsWith("```")) {
                jsonLimpio = jsonLimpio.substring(0, jsonLimpio.length() - 3);
            }
            jsonLimpio = jsonLimpio.trim();

            ClasificacionResponseDTO response = objectMapper.readValue(jsonLimpio, ClasificacionResponseDTO.class);
            return ResponseEntity.ok(response);
        } catch (Exception e) {
            log.error("Error clasificando texto con IA: {}", e.getMessage(), e);
            return ResponseEntity.internalServerError().build();
        }
    }
}
