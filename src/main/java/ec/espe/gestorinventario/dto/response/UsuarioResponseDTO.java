package ec.espe.gestorinventario.dto.response;

import ec.espe.gestorinventario.entity.Rol;
import ec.espe.gestorinventario.entity.Usuario;

import java.util.Set;
import java.util.stream.Collectors;

public record UsuarioResponseDTO(
        Long id,
        String email,
        String nombreCompleto,
        Integer diasVacacionesDisponibles,
        Boolean activo,
        String emailJefeDirecto,
        Set<String> roles
) {
    public static UsuarioResponseDTO fromEntity(Usuario u) {
        return new UsuarioResponseDTO(
                u.getId(),
                u.getEmail(),
                u.getNombreCompleto(),
                u.getDiasVacacionesDisponibles(),
                u.getActivo(),
                u.getJefeDirecto() != null ? u.getJefeDirecto().getEmail() : null,
                u.getRoles().stream().map(Rol::getNombre).collect(Collectors.toSet())
        );
    }
}

