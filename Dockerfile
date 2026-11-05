# Etapa 1: Build con Maven y Eclipse Temurin JDK 17
FROM maven:3.9.6-eclipse-temurin-17 AS build
WORKDIR /app

# Copiar archivos de dependencias para aprovechar caché
COPY pom.xml .
RUN mvn dependency:go-offline -B

# Copiar código fuente y compilar JAR empaquetado
COPY src ./src
RUN mvn clean package -DskipTests

# Etapa 2: Imagen ligera de ejecución con JRE 17
FROM eclipse-temurin:17-jre-alpine
WORKDIR /app

# Copiar el binario generado en la etapa anterior
COPY --from=build /app/target/*.jar app.jar

# Variables de entorno por defecto
ENV PORT=8080
EXPOSE 8080

# Comando de arranque optimizado para contenedores
ENTRYPOINT ["java", "-XX:+UseContainerSupport", "-Dserver.port=${PORT}", "-jar", "app.jar"]

