import React, { useState, useRef } from 'react';
import { 
  Upload, 
  File, 
  X, 
  CheckCircle, 
  AlertCircle, 
  Loader2,
  ExternalLink,
  FileText,
  Image,
  Video,
  Archive
} from 'lucide-react';
import { BlockchainService } from '../../services/blockchain';

interface ArweaveUploadProps {
  vehicleId?: string;
  onSuccess?: (result: any) => void;
  onCancel?: () => void;
  className?: string;
}

interface UploadedFile {
  file: File;
  preview?: string;
  type: 'image' | 'document' | 'video' | 'other';
}

export const ArweaveUpload: React.FC<ArweaveUploadProps> = ({
  vehicleId,
  onSuccess,
  onCancel,
  className = ''
}) => {
  const [files, setFiles] = useState<UploadedFile[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uploadResults, setUploadResults] = useState<any[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [dragActive, setDragActive] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // File type detection
  const getFileType = (file: File): 'image' | 'document' | 'video' | 'other' => {
    if (file.type.startsWith('image/')) return 'image';
    if (file.type.startsWith('video/')) return 'video';
    if (file.type.includes('pdf') || file.type.includes('document') || file.type.includes('text')) {
      return 'document';
    }
    return 'other';
  };

  // File type icon
  const getFileIcon = (type: string) => {
    switch (type) {
      case 'image': return <Image className="w-5 h-5" />;
      case 'video': return <Video className="w-5 h-5" />;
      case 'document': return <FileText className="w-5 h-5" />;
      default: return <Archive className="w-5 h-5" />;
    }
  };

  // Handle file selection
  const handleFiles = (fileList: FileList) => {
    const newFiles: UploadedFile[] = [];
    
    Array.from(fileList).forEach(file => {
      const fileType = getFileType(file);
      const uploadedFile: UploadedFile = {
        file,
        type: fileType
      };

      // Create preview for images
      if (fileType === 'image') {
        const reader = new FileReader();
        reader.onload = (e) => {
          uploadedFile.preview = e.target?.result as string;
          setFiles(prev => [...prev]);
        };
        reader.readAsDataURL(file);
      }

      newFiles.push(uploadedFile);
    });

    setFiles(prev => [...prev, ...newFiles]);
    setError(null);
  };

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true);
    } else if (e.type === 'dragleave') {
      setDragActive(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFiles(e.dataTransfer.files);
    }
  };

  // Handle file input change
  const handleFileInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      handleFiles(e.target.files);
    }
  };

  // Remove file
  const removeFile = (index: number) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
  };

  // Upload files to Arweave
  const uploadFiles = async () => {
    if (files.length === 0) {
      setError('Please select at least one file to upload');
      return;
    }

    setUploading(true);
    setError(null);
    const results: any[] = [];

    try {
      for (const uploadedFile of files) {
        const metadata = {
          vehicleId: vehicleId || undefined,
          originalName: uploadedFile.file.name,
          fileType: uploadedFile.type,
          uploadedAt: new Date().toISOString(),
          uploadedBy: 'owner' // This should come from user context
        };

        try {
          const result = await BlockchainService.uploadToArweave(uploadedFile.file, metadata);
          results.push({
            file: uploadedFile.file,
            success: true,
            result: result.data
          });
        } catch (error: any) {
          results.push({
            file: uploadedFile.file,
            success: false,
            error: BlockchainService.formatBlockchainError(error)
          });
        }
      }

      setUploadResults(results);
      
      // Check if all uploads were successful
      const allSuccessful = results.every(r => r.success);
      if (allSuccessful) {
        onSuccess?.(results);
      }

    } catch (error: any) {
      setError(BlockchainService.formatBlockchainError(error));
    } finally {
      setUploading(false);
    }
  };

  // Format file size
  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`bg-white rounded-lg shadow-sm border border-gray-200 ${className}`}>
      <div className="p-6 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">Upload to Arweave</h2>
            <p className="text-sm text-gray-600 mt-1">
              Store documents permanently on the Arweave network
            </p>
          </div>
          {onCancel && (
            <button
              onClick={onCancel}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <X className="w-6 h-6" />
            </button>
          )}
        </div>
      </div>

      <div className="p-6">
        {/* Upload Area */}
        {uploadResults.length === 0 && (
          <div
            className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
              dragActive 
                ? 'border-blue-400 bg-blue-50' 
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            <Upload className="w-12 h-12 text-gray-400 mx-auto mb-4" />
            <p className="text-lg font-medium text-gray-900 mb-2">
              Drop files here or click to browse
            </p>
            <p className="text-sm text-gray-600 mb-4">
              Supports images, documents, videos, and other file types
            </p>
            <button
              onClick={() => fileInputRef.current?.click()}
              className="btn-primary"
            >
              Select Files
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              onChange={handleFileInput}
              className="hidden"
              accept="*/*"
            />
          </div>
        )}

        {/* File List */}
        {files.length > 0 && uploadResults.length === 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Selected Files</h3>
            <div className="space-y-3">
              {files.map((uploadedFile, index) => (
                <div key={index} className="flex items-center p-4 border border-gray-200 rounded-lg">
                  <div className="flex-shrink-0 mr-4">
                    {uploadedFile.preview ? (
                      <img 
                        src={uploadedFile.preview} 
                        alt="Preview" 
                        className="w-12 h-12 object-cover rounded"
                      />
                    ) : (
                      <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center">
                        {getFileIcon(uploadedFile.type)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {uploadedFile.file.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      {formatFileSize(uploadedFile.file.size)} • {uploadedFile.type}
                    </p>
                  </div>
                  <button
                    onClick={() => removeFile(index)}
                    className="ml-4 text-red-500 hover:text-red-700 transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upload Results */}
        {uploadResults.length > 0 && (
          <div className="space-y-4">
            <h3 className="text-lg font-medium text-gray-900">Upload Results</h3>
            <div className="space-y-3">
              {uploadResults.map((result, index) => (
                <div key={index} className="flex items-center p-4 border border-gray-200 rounded-lg">
                  <div className="flex-shrink-0 mr-4">
                    {result.success ? (
                      <CheckCircle className="w-6 h-6 text-green-500" />
                    ) : (
                      <AlertCircle className="w-6 h-6 text-red-500" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {result.file.name}
                    </p>
                    {result.success ? (
                      <div className="flex items-center space-x-2 mt-1">
                        <p className="text-sm text-green-600">
                          Uploaded successfully
                        </p>
                        <a
                          href={BlockchainService.getArweaveExplorerUrl(result.result.arweaveId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 transition-colors"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </a>
                      </div>
                    ) : (
                      <p className="text-sm text-red-600 mt-1">
                        {result.error}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mt-4 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="flex items-center">
              <AlertCircle className="w-5 h-5 text-red-500 mr-2" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex justify-end space-x-3 mt-6">
          {onCancel && (
            <button
              onClick={onCancel}
              className="btn-secondary"
              disabled={uploading}
            >
              Cancel
            </button>
          )}
          
          {files.length > 0 && uploadResults.length === 0 && (
            <button
              onClick={uploadFiles}
              disabled={uploading}
              className="btn-primary flex items-center"
            >
              {uploading ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  Upload to Arweave
                </>
              )}
            </button>
          )}

          {uploadResults.length > 0 && (
            <button
              onClick={() => {
                setFiles([]);
                setUploadResults([]);
                setError(null);
              }}
              className="btn-primary"
            >
              Upload More Files
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default ArweaveUpload;

