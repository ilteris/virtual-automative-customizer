import React, { useState, useCallback } from 'react';
import { urlToFile } from '../utils/fileUtils';
import { UploadIcon } from './icons';

interface ImageUploaderProps {
  onFileUpload: (files: File[]) => void;
  title: string;
  multiple?: boolean;
  className?: string;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({ onFileUpload, title, multiple = false, className = '' }) => {
  const [isDragging, setIsDragging] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      onFileUpload(Array.from(e.target.files));
    }
  };

  const handleDrop = useCallback(async (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);

    const files: File[] = [];
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      // Fix: Replaced spreading Array.from with a for loop for robustly handling FileList.
      for (let i = 0; i < e.dataTransfer.files.length; i++) {
        const file = e.dataTransfer.files.item(i);
        if (file) {
          files.push(file);
        }
      }
    } else {
      // Check for images dragged from other websites
      const url = e.dataTransfer.getData('text/uri-list') || e.dataTransfer.getData('text/plain');
      if (url) {
        try {
          const file = await urlToFile(url, 'dropped-image');
          files.push(file);
        } catch (error) {
          console.error("Failed to fetch dropped image:", error);
          alert("Could not load image from the provided URL.");
        }
      }
    }
    
    if (files.length > 0) {
      if (!multiple && files.length > 1) {
        onFileUpload([files[0]]);
      } else {
        onFileUpload(files);
      }
    }
  }, [onFileUpload, multiple]);

  const handleDragEvents = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setIsDragging(true);
    } else if (e.type === 'dragleave') {
      setIsDragging(false);
    }
  };
  
  const baseClasses = 'relative block w-full border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors duration-300';
  const stateClasses = isDragging 
    ? 'border-blue-500 bg-blue-900/30' 
    : 'border-gray-600 hover:border-gray-500 bg-gray-800/50 hover:bg-gray-700/50';

  return (
    <div
      onDrop={handleDrop}
      onDragEnter={handleDragEvents}
      onDragOver={handleDragEvents}
      onDragLeave={handleDragEvents}
      className={`${baseClasses} ${stateClasses} ${className}`}
    >
      <input
        type="file"
        multiple={multiple}
        onChange={handleFileChange}
        accept="image/*"
        className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
      />
      <div className="flex flex-col items-center justify-center text-gray-400">
        <UploadIcon className="w-10 h-10 mb-3" />
        <p className="font-semibold">{title}</p>
        <p className="text-sm">PNG, JPG, WEBP</p>
      </div>
    </div>
  );
};

export default ImageUploader;