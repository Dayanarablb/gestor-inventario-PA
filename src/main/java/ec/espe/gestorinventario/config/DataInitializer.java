package ec.espe.gestorinventario.config;

import ec.espe.gestorinventario.entity.PoliticaEmpresa;
import ec.espe.gestorinventario.entity.Rol;
import ec.espe.gestorinventario.entity.TipoSolicitud;
import ec.espe.gestorinventario.entity.Usuario;
import ec.espe.gestorinventario.repository.PoliticaEmpresaRepository;
import ec.espe.gestorinventario.repository.RolRepository;
import ec.espe.gestorinventario.repository.TipoSolicitudRepository;
import ec.espe.gestorinventario.repository.UsuarioRepository;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.boot.CommandLineRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Set;

@Configuration
public class DataInitializer {

    private static final Logger log = LoggerFactory.getLogger(DataInitializer.class);

    @Bean
    public CommandLineRunner initDatabase(
            RolRepository rolRepository,
            UsuarioRepository usuarioRepository,
            TipoSolicitudRepository tipoSolicitudRepository,
            PoliticaEmpresaRepository politicaRepository,
            PasswordEncoder passwordEncoder) {
        return args -> {
            // 1. Roles
            Rol rolEmpleado = rolRepository.findByNombre("ROLE_EMPLEADO")
                    .orElseGet(() -> rolRepository.save(new Rol("ROLE_EMPLEADO", "Colaborador regular")));
            Rol rolJefe = rolRepository.findByNombre("ROLE_JEFE")
                    .orElseGet(() -> rolRepository.save(new Rol("ROLE_JEFE", "Líder de área / Aprobador")));
            Rol rolAdmin = rolRepository.findByNombre("ROLE_ADMIN_RRHH")
                    .orElseGet(() -> rolRepository.save(new Rol("ROLE_ADMIN_RRHH", "Administrador de RR.HH.")));

            // 2. Tipos de Solicitud
            if (tipoSolicitudRepository.findByCodigo("VACACIONES").isEmpty()) {
                tipoSolicitudRepository.save(new TipoSolicitud("VACACIONES", "Vacaciones Anuales", true, 30));
            }
            if (tipoSolicitudRepository.findByCodigo("PERMISO_MEDICO").isEmpty()) {
                tipoSolicitudRepository.save(new TipoSolicitud("PERMISO_MEDICO", "Permiso Médico o Cita", true, 3));
            }
            if (tipoSolicitudRepository.findByCodigo("REEMBOLSO").isEmpty()) {
                tipoSolicitudRepository.save(new TipoSolicitud("REEMBOLSO", "Reembolso de Gastos Operativos", true, 1));
            }
            if (tipoSolicitudRepository.findByCodigo("CERTIFICADO_LABORAL").isEmpty()) {
                tipoSolicitudRepository.save(new TipoSolicitud("CERTIFICADO_LABORAL", "Certificado Laboral y de Ingresos", false, 1));
            }

            // 3. Usuarios de prueba
            Usuario jefe = usuarioRepository.findByEmail("jefe@empresa.com").orElse(null);
            if (jefe == null) {
                jefe = new Usuario();
                jefe.setEmail("jefe@empresa.com");
                jefe.setNombreCompleto("Carlos Mendoza (Jefe de Ingeniería)");
                jefe.setPasswordHash(passwordEncoder.encode("123456"));
                jefe.setDiasVacacionesDisponibles(20);
                jefe.setRoles(Set.of(rolJefe));
                jefe = usuarioRepository.save(jefe);
            }

            if (usuarioRepository.findByEmail("admin@empresa.com").isEmpty()) {
                Usuario admin = new Usuario();
                admin.setEmail("admin@empresa.com");
                admin.setNombreCompleto("Laura Gómez (Directora RR.HH.)");
                admin.setPasswordHash(passwordEncoder.encode("123456"));
                admin.setDiasVacacionesDisponibles(25);
                admin.setRoles(Set.of(rolAdmin));
                usuarioRepository.save(admin);
            }

            if (usuarioRepository.findByEmail("empleado@empresa.com").isEmpty()) {
                Usuario emp = new Usuario();
                emp.setEmail("empleado@empresa.com");
                emp.setNombreCompleto("Juan Pérez (Desarrollador Senior)");
                emp.setPasswordHash(passwordEncoder.encode("123456"));
                emp.setDiasVacacionesDisponibles(14);
                emp.setJefeDirecto(jefe);
                emp.setRoles(Set.of(rolEmpleado));
                usuarioRepository.save(emp);
            }

            // 4. Políticas Corporativas para RAG
            // Renombrar o reemplazar si existe la política antigua de pruebas
            politicaRepository.findAll().forEach(p -> {
                if (p.getTitulo() != null && p.getTitulo().toLowerCase().contains("prueba persistencia")) {
                    p.setTitulo("Política de Protección de Datos Personales");
                    p.setCategoria("SEGURIDAD");
                    p.setContenido("Garantiza el correcto tratamiento, confidencialidad y custodia de la información personal de colaboradores y clientes de conformidad con la normativa de protección de datos.");
                    politicaRepository.save(p);
                }
            });

            if (politicaRepository.count() == 0) {
                politicaRepository.save(new PoliticaEmpresa(
                        "Política de Vacaciones Anuales",
                        "VACACIONES",
                        "Los colaboradores tienen derecho a 15 días laborables anuales tras cumplir su primer año. " +
                        "Las solicitudes deben radicarse en el sistema con al menos 15 días de anticipación y requieren la aprobación del jefe directo. " +
                        "No se permite acumular más de 2 periodos consecutivos."
                ));
                politicaRepository.save(new PoliticaEmpresa(
                        "Política de Permisos Médicos y Calamidad",
                        "PERMISOS",
                        "Los permisos médicos por citas o reposo deben respaldarse con certificado del seguro social o médico autorizado " +
                        "dentro de las 48 horas posteriores al retorno. Para emergencias o calamidad doméstica se otorgan hasta 3 días hábiles remunerados."
                ));
                politicaRepository.save(new PoliticaEmpresa(
                        "Política de Reembolso de Gastos",
                        "REEMBOLSOS",
                        "Los gastos de viajes, capacitaciones autorizadas o insumos deben legalizarse con factura tributaria válida a nombre de la empresa. " +
                        "El plazo máximo de entrega es el día 25 de cada mes y son liquidados en la nómina inmediata."
                ));
            }

            log.info(">>> [DATA INITIALIZER] Datos semilla cargados con éxito (Roles, Usuarios, Tipos de Solicitud y Políticas RR.HH.).");
        };
    }
}
