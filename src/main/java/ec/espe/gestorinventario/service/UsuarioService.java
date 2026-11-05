package ec.espe.gestorinventario.service;

import ec.espe.gestorinventario.dto.request.RegistroUsuarioDTO;
import ec.espe.gestorinventario.dto.response.UsuarioResponseDTO;
import ec.espe.gestorinventario.entity.Rol;
import ec.espe.gestorinventario.entity.Usuario;
import ec.espe.gestorinventario.exception.ConflictoException;
import ec.espe.gestorinventario.exception.RecursoNotFoundException;
import ec.espe.gestorinventario.repository.RolRepository;
import ec.espe.gestorinventario.repository.UsuarioRepository;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.HashSet;
import java.util.Set;

@Service
public class UsuarioService {

    private final UsuarioRepository usuarioRepository;
    private final RolRepository rolRepository;
    private final PasswordEncoder passwordEncoder;

    public UsuarioService(UsuarioRepository usuarioRepository, RolRepository rolRepository, PasswordEncoder passwordEncoder) {
        this.usuarioRepository = usuarioRepository;
        this.rolRepository = rolRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional
    public UsuarioResponseDTO registrarUsuario(RegistroUsuarioDTO dto) {
        if (usuarioRepository.findByEmail(dto.email()).isPresent()) {
            throw new ConflictoException("Ya existe un usuario registrado con el correo: " + dto.email());
        }

        Usuario usuario = new Usuario();
        usuario.setEmail(dto.email().trim().toLowerCase());
        usuario.setPasswordHash(passwordEncoder.encode(dto.password()));
        usuario.setNombreCompleto(dto.nombreCompleto().trim());
        usuario.setDiasVacacionesDisponibles(dto.diasVacacionesDisponibles() != null ? dto.diasVacacionesDisponibles() : 15);
        usuario.setActivo(true);

        // Asignación de Roles
        Set<Rol> roles = new HashSet<>();
        for (String rolNombre : dto.roles()) {
            String formattedRol = rolNombre.toUpperCase().startsWith("ROLE_") ? rolNombre.toUpperCase() : "ROLE_" + rolNombre.toUpperCase();
            Rol rol = rolRepository.findByNombre(formattedRol)
                    .orElseGet(() -> rolRepository.save(new Rol(formattedRol, "Rol creado dinámicamente")));
            roles.add(rol);
        }
        usuario.setRoles(roles);

        // Asignación de Jefe Directo si aplica
        if (dto.emailJefeDirecto() != null && !dto.emailJefeDirecto().isBlank()) {
            Usuario jefe = usuarioRepository.findByEmail(dto.emailJefeDirecto().trim().toLowerCase())
                    .orElseThrow(() -> new RecursoNotFoundException("No se encontró el jefe directo especificado: " + dto.emailJefeDirecto()));
            usuario.setJefeDirecto(jefe);
        }

        Usuario guardado = usuarioRepository.save(usuario);
        return UsuarioResponseDTO.fromEntity(guardado);
    }
}

