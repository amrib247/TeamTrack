package com.example.TeamTrack_backend.controllers;

import java.io.IOException;

import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;
import org.springframework.web.multipart.MultipartFile;

import com.example.TeamTrack_backend.dto.FileUploadResponse;
import com.example.TeamTrack_backend.services.FileUploadService;

@RestController
@RequestMapping("/files")
@CrossOrigin(origins = {"http://localhost:5173", "http://localhost:3000"})
public class FileController {
    
    @Autowired
    private FileUploadService fileUploadService;
    
    @PostMapping("/upload")
    public ResponseEntity<FileUploadResponse> uploadFile(@RequestParam("file") MultipartFile file) {
        try {
            FileUploadResponse response = fileUploadService.uploadFile(file);
            return ResponseEntity.ok(response);
        } catch (IOException e) {
            System.err.println("❌ FileController: File upload failed: " + e.getMessage());
            return ResponseEntity.badRequest().build();
        }
    }
    
    @GetMapping("/{filename}")
    public ResponseEntity<ByteArrayResource> downloadFile(@PathVariable String filename) {
        try {
            byte[] fileData = fileUploadService.getFile(filename);
            ByteArrayResource resource = new ByteArrayResource(fileData);
            
            HttpHeaders headers = new HttpHeaders();
            headers.add(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + filename + "\"");
            headers.add(HttpHeaders.CACHE_CONTROL, "no-cache, no-store, must-revalidate");
            headers.add(HttpHeaders.PRAGMA, "no-cache");
            headers.add(HttpHeaders.EXPIRES, "0");
            
            return ResponseEntity.ok()
                .headers(headers)
                .contentLength(fileData.length)
                .contentType(MediaType.APPLICATION_OCTET_STREAM)
                .body(resource);
        } catch (IOException e) {
            System.err.println("❌ FileController: File download failed: " + e.getMessage());
            return ResponseEntity.notFound().build();
        }
    }
    
    @DeleteMapping("/{filename}")
    public ResponseEntity<Void> deleteFile(@PathVariable String filename) {
        try {
            boolean deleted = fileUploadService.deleteFile(filename);
            if (deleted) {
                return ResponseEntity.ok().build();
            } else {
                return ResponseEntity.notFound().build();
            }
        } catch (Exception e) {
            System.err.println("❌ FileController: File deletion failed: " + e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
