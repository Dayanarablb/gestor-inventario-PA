package ec.espe.gestorinventario.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.Size;

import java.util.Set;

public record RegistroUsuarioDTO(
        @NotBlank(message = "El email no puede estar vacío")
        @Email(message = "Formato de correo inválido")
        String email,

        @NotBlank(message = "La contraseña no puede estar vacía")
        @Size(min = 6, message = "La contraseña debe tener mínimo 6 caracteres")
        String password,

        @NotBlank(message = "El nombre completo es requerido")
        String nombreCompleto,

        @Min(value = 0, message = "Los días de vacaciones no pueden ser negativos")
        Integer diasVacacionesDisponibles,

        @NotEmpty(message = "Debe asignar al menos un rol al usuario")
        Set<String> roles,

        String emailJefeDirecto
) {}

