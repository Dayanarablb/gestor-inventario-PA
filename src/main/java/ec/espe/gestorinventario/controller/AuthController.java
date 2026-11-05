package ec.espe.gestorinventario.controller;

import ec.espe.gestorinventario.dto.request.LoginRequestDTO;
import ec.espe.gestorinventario.dto.request.RegistroUsuarioDTO;
import ec.espe.gestorinventario.dto.response.LoginResponseDTO;
import ec.espe.gestorinventario.dto.response.UsuarioResponseDTO;
import ec.espe.gestorinventario.entity.Rol;
import ec.espe.gestorinventario.entity.Usuario;
import ec.espe.gestorinventario.exception.AccesoDenegadoException;
import ec.espe.gestorinventario.repository.UsuarioRepository;
import ec.espe.gestorinventario.security.JwtService;
import ec.espe.gestorinventario.service.AuditoriaService;
import ec.espe.gestorinventario.service.UsuarioService;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.User;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.stream.Collectors;

@RestController
@RequestMapping("/api/auth")
public class AuthController {

    private final UsuarioRepository usuarioRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final UsuarioService usuarioService;
    private final AuditoriaService auditoriaService;

    public AuthController(UsuarioRepository usuarioRepository,
                          PasswordEncoder passwordEncoder,
                          JwtService jwtService,
                          UsuarioService usuarioService,
                          AuditoriaService auditoriaService) {
        this.usuarioRepository = usuarioRepository;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
        this.usuarioService = usuarioService;
        this.auditoriaService = auditoriaService;
    }

    @PostMapping("/login")
    public ResponseEntity<LoginResponseDTO> login(@Valid @RequestBody LoginRequestDTO request, HttpServletRequest httpRequest) {
        Usuario usuario = usuarioRepository.findByEmail(request.email())
                .orElse(null);

        if (usuario == null || !passwordEncoder.matches(request.password(), usuario.getPasswordHash())) {
            auditoriaService.registrarEvento(
                    request.email() != null ? request.email() : "Intento Fallido",
                    "POST",
                    "Intento fallido de inicio de sesión (credenciales incorrectas)",
                    httpRequest.getRemoteAddr(),
                    HttpStatus.UNAUTHORIZED.value(),
                    "FALLO: Credenciales inválidas"
            );
            throw new AccesoDenegadoException("Credenciales inválidas. Verifique su correo o contraseña.");
        }

        if (Boolean.FALSE.equals(usuario.getActivo())) {
            auditoriaService.registrarEvento(
                    usuario.getEmail(),
                    "POST",
                    "Intento de acceso de usuario inactivo",
                    httpRequest.getRemoteAddr(),
                    HttpStatus.FORBIDDEN.value(),
                    "FALLO: Usuario inactivo"
            );
            throw new AccesoDenegadoException("El usuario se encuentra inactivo en el sistema.");
        }

        var authorities = usuario.getRoles().stream()
                .map(r -> new SimpleGrantedAuthority(r.getNombre()))
                .collect(Collectors.toList());

        User userDetails = new User(usuario.getEmail(), usuario.getPasswordHash(), authorities);
        String token = jwtService.generarToken(userDetails);

        List<String> rolesStr = usuario.getRoles().stream().map(Rol::getNombre).toList();

        // Auditoría con el correo real autenticado
        auditoriaService.registrarEvento(
                usuario.getEmail(),
                "POST",
                "Inicio de sesión exitoso en portal corporativo",
                httpRequest.getRemoteAddr(),
                HttpStatus.OK.value(),
                "EXITO"
        );

        return ResponseEntity.ok(new LoginResponseDTO(
                token,
                usuario.getEmail(),
                usuario.getNombreCompleto(),
                usuario.getDiasVacacionesDisponibles(),
                rolesStr
        ));
    }

    @PostMapping("/register")
    public ResponseEntity<UsuarioResponseDTO> registrarUsuario(@Valid @RequestBody RegistroUsuarioDTO request) {
        UsuarioResponseDTO response = usuarioService.registrarUsuario(request);
        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }
}
