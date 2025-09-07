# Use Eclipse Temurin JDK 21 as base image
FROM eclipse-temurin:21-jdk

# Set working directory
WORKDIR /app

# Create a non-root user for security
RUN groupadd -g 1001 appgroup && useradd -u 1001 -g appgroup appuser

# Copy Gradle wrapper and build files
COPY backend/gradle/ gradle/
COPY backend/gradlew .
COPY backend/gradlew.bat .
COPY backend/build.gradle .
COPY backend/settings.gradle .

# Make gradlew executable
RUN chmod +x gradlew

# Copy source code
COPY backend/src/ src/

# Build the application
RUN ./gradlew build -x test

# Change ownership of the app directory to the app user
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port
EXPOSE 8080

# Run the application
CMD ["java", "-jar", "build/libs/TeamTrack-backend-0.0.1-SNAPSHOT.jar"]
