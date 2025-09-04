# Use Eclipse Temurin JDK 21 (not Alpine) for better compatibility
FROM eclipse-temurin:21-jdk

# Set working directory
WORKDIR /app

# Copy Gradle wrapper and build files from backend directory
COPY backend/gradle/ gradle/
COPY backend/gradlew backend/gradlew.bat backend/build.gradle backend/settings.gradle ./

# Make gradlew executable
RUN chmod +x gradlew

# Copy source code from backend directory
COPY backend/src/ src/

# Build the application
RUN ./gradlew build -x test --no-daemon

# Create a non-root user
RUN addgroup -g 1001 -S appgroup && \
    adduser -S appuser -u 1001 -G appgroup

# Change ownership of the app directory
RUN chown -R appuser:appgroup /app

# Switch to non-root user
USER appuser

# Expose port 8080
EXPOSE 8080

# Run the application
CMD ["java", "-jar", "build/libs/TeamTrack-backend-0.0.1-SNAPSHOT.jar"]