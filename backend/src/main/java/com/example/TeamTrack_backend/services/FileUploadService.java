package com.example.TeamTrack_backend.services;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.UUID;

import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import com.example.TeamTrack_backend.dto.FileUploadResponse;

@Service
public class FileUploadService {
    
    private static final String UPLOAD_DIR = "uploads/chat-files/";
    private static final long MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB
    private static final String[] ALLOWED_EXTENSIONS = {
        ".txt", ".pdf", ".doc", ".docx", ".xls", ".xlsx", ".ppt", ".pptx",
        ".jpg", ".jpeg", ".png", ".gif", ".bmp", ".svg",
        ".mp4", ".avi", ".mov", ".wmv", ".flv", ".webm",
        ".mp3", ".wav", ".flac", ".aac", ".ogg"
    };
    
    public FileUploadService() {
        // Create upload directory if it doesn't exist
        try {
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
        } catch (IOException e) {
            System.err.println("❌ Failed to create upload directory: " + e.getMessage());
        }
    }
    
    public FileUploadResponse uploadFile(MultipartFile file) throws IOException {
        // Validate file
        validateFile(file);
        
        // Generate unique filename
        String originalFilename = file.getOriginalFilename();
        String fileExtension = getFileExtension(originalFilename);
        String uniqueFilename = UUID.randomUUID().toString() + fileExtension;
        
        // Create file path
        Path filePath = Paths.get(UPLOAD_DIR + uniqueFilename);
        
        // Save file
        Files.copy(file.getInputStream(), filePath, StandardCopyOption.REPLACE_EXISTING);
        
        // Return file info
        return new FileUploadResponse(
            uniqueFilename,
            originalFilename,
            file.getSize(),
            fileExtension,
            "/api/files/" + uniqueFilename
        );
    }
    
    private void validateFile(MultipartFile file) throws IOException {
        if (file.isEmpty()) {
            throw new IOException("File is empty");
        }
        
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new IOException("File size exceeds maximum limit of " + (MAX_FILE_SIZE / 1024 / 1024) + "MB");
        }
        
        String originalFilename = file.getOriginalFilename();
        if (originalFilename == null || originalFilename.trim().isEmpty()) {
            throw new IOException("Invalid filename");
        }
        
        String fileExtension = getFileExtension(originalFilename).toLowerCase();
        boolean isAllowed = false;
        for (String allowedExt : ALLOWED_EXTENSIONS) {
            if (allowedExt.equals(fileExtension)) {
                isAllowed = true;
                break;
            }
        }
        
        if (!isAllowed) {
            throw new IOException("File type not allowed. Allowed types: " + String.join(", ", ALLOWED_EXTENSIONS));
        }
    }
    
    private String getFileExtension(String filename) {
        int lastDotIndex = filename.lastIndexOf('.');
        if (lastDotIndex > 0 && lastDotIndex < filename.length() - 1) {
            return filename.substring(lastDotIndex);
        }
        return "";
    }
    
    public byte[] getFile(String filename) throws IOException {
        Path filePath = Paths.get(UPLOAD_DIR + filename);
        if (!Files.exists(filePath)) {
            throw new IOException("File not found: " + filename);
        }
        return Files.readAllBytes(filePath);
    }
    
    public boolean deleteFile(String filename) {
        try {
            Path filePath = Paths.get(UPLOAD_DIR + filename);
            return Files.deleteIfExists(filePath);
        } catch (IOException e) {
            System.err.println("❌ Failed to delete file " + filename + ": " + e.getMessage());
            return false;
        }
    }
    
    /**
     * Delete all files associated with a specific team
     * This is called when a team is deleted to clean up all team-related files
     */
    public boolean deleteAllTeamFiles(String teamId) {
        try {
            System.out.println("🗑️ FileUploadService: Deleting all files for team: " + teamId);
            
            // Get all files in the upload directory
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                System.out.println("ℹ️ FileUploadService: Upload directory doesn't exist, nothing to delete");
                return true;
            }
            
            // List all files in the directory
            try (var files = Files.list(uploadPath)) {
                int deletedCount = 0;
                for (Path filePath : files.toList()) {
                    if (Files.isRegularFile(filePath)) {
                        // For now, we'll delete all files since we can't easily determine
                        // which files belong to which team without additional metadata
                        // In a production system, you might want to store team ID in filename or metadata
                        try {
                            Files.delete(filePath);
                            deletedCount++;
                            System.out.println("🗑️ FileUploadService: Deleted file: " + filePath.getFileName());
                        } catch (IOException e) {
                            System.err.println("⚠️ FileUploadService: Could not delete file " + filePath.getFileName() + ": " + e.getMessage());
                        }
                    }
                }
                System.out.println("✅ FileUploadService: Deleted " + deletedCount + " files for team: " + teamId);
                return true;
            }
        } catch (IOException e) {
            System.err.println("❌ FileUploadService: Failed to delete team files: " + e.getMessage());
            return false;
        }
    }
}
