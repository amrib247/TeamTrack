package com.example.TeamTrack_backend.dto;

public class FileUploadResponse {
    private String filename;
    private String originalFilename;
    private long size;
    private String fileType;
    private String downloadUrl;
    
    public FileUploadResponse() {}
    
    public FileUploadResponse(String filename, String originalFilename, long size, String fileType, String downloadUrl) {
        this.filename = filename;
        this.originalFilename = originalFilename;
        this.size = size;
        this.fileType = fileType;
        this.downloadUrl = downloadUrl;
    }
    
    // Getters and Setters
    public String getFilename() {
        return filename;
    }
    
    public void setFilename(String filename) {
        this.filename = filename;
    }
    
    public String getOriginalFilename() {
        return originalFilename;
    }
    
    public void setOriginalFilename(String originalFilename) {
        this.originalFilename = originalFilename;
    }
    
    public long getSize() {
        return size;
    }
    
    public void setSize(long size) {
        this.size = size;
    }
    
    public String getFileType() {
        return fileType;
    }
    
    public void setFileType(String fileType) {
        this.fileType = fileType;
    }
    
    public String getDownloadUrl() {
        return downloadUrl;
    }
    
    public void setDownloadUrl(String downloadUrl) {
        this.downloadUrl = downloadUrl;
    }
}
