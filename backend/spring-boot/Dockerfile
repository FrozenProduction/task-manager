# Stage 1: build — uses official Maven 3.9 image (includes mvn + Java 17)
FROM maven:3.9-eclipse-temurin-17 AS build
WORKDIR /build
COPY . .
RUN mvn -B clean package -DskipTests

# Stage 2: run (smaller JRE image)
FROM eclipse-temurin:17-jre
WORKDIR /app
COPY --from=build /build/target/task-manager-api-1.0.0.jar app.jar
EXPOSE 8080
CMD ["java", "-jar", "/app/app.jar"]