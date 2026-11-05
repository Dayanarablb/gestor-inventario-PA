package ec.espe.gestorinventario.config;

import ec.espe.gestorinventario.interceptor.AuditoriaInterceptor;
import ec.espe.gestorinventario.interceptor.AutorizacionRolInterceptor;
import org.springframework.context.annotation.Configuration;
import org.springframework.web.servlet.config.annotation.InterceptorRegistry;
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer;

@Configuration
public class WebMvcConfig implements WebMvcConfigurer {

    private final AutorizacionRolInterceptor autorizacionRolInterceptor;
    private final AuditoriaInterceptor auditoriaInterceptor;

    public WebMvcConfig(AutorizacionRolInterceptor autorizacionRolInterceptor, AuditoriaInterceptor auditoriaInterceptor) {
        this.autorizacionRolInterceptor = autorizacionRolInterceptor;
        this.auditoriaInterceptor = auditoriaInterceptor;
    }

    @Override
    public void addInterceptors(InterceptorRegistry registry) {
        // Interceptor de control de accesos basado en @RequiereRol
        registry.addInterceptor(autorizacionRolInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/auth/**", "/api/info/**", "/api/politicas/**");

        // Interceptor de auditoría para operaciones sensibles
        registry.addInterceptor(auditoriaInterceptor)
                .addPathPatterns("/api/**")
                .excludePathPatterns("/api/info/**");
    }
}
