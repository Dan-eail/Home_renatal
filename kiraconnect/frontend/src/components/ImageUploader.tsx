import { useState, useRef, DragEvent } from 'react';
import { Upload, X, Loader, Image } from 'lucide-react';
import { uploadAPI } from '@/api/upload';

interface ImageUploaderProps {
  onUpload: (urls: string[]) => void;
  existingUrls?: string[];
  maxImages?: number;
}

export default function ImageUploader({ onUpload, existingUrls = [], maxImages = 5 }: ImageUploaderProps) {
  const [previews, setPreviews] = useState<string[]>(existingUrls);
  const [uploading, setUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const remaining = maxImages - previews.length;
    if (remaining <= 0) return;

    const selected = Array.from(files).slice(0, remaining);
    // Show local previews immediately
    const localPreviews = selected.map(f => URL.createObjectURL(f));
    setPreviews(prev => [...prev, ...localPreviews]);

    setUploading(true);
    setProgress(0);
    try {
      const urls = await uploadAPI.uploadPropertyImages(selected);
      // Replace local blob URLs with Cloudinary URLs
      setPreviews(prev => {
        const updated = [...prev];
        const startIdx = updated.length - localPreviews.length;
        urls.forEach((url, i) => { updated[startIdx + i] = url; });
        return updated;
      });
      onUpload(urls);
      setProgress(100);
    } catch {
      // Remove failed local previews
      setPreviews(prev => prev.slice(0, prev.length - localPreviews.length));
      alert('Upload failed. Please try again.');
    } finally {
      setUploading(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  const removeImage = (index: number) => {
    const updated = previews.filter((_, i) => i !== index);
    setPreviews(updated);
    onUpload(updated.filter(u => u.startsWith('http')));
  };

  const handleDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFiles(e.dataTransfer.files);
  };

  return (
    <div className="space-y-3">
      {/* Drop zone */}
      {previews.length < maxImages && (
        <div
          onClick={() => fileInputRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
          onDragLeave={() => setIsDragging(false)}
          className={`border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition ${
            isDragging ? 'border-blue-500 bg-blue-50' : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
          }`}
        >
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-3">
              <Loader size={32} className="animate-spin text-blue-500" />
              <p className="text-sm text-gray-500">Processing images...</p>
              {progress > 0 && (
                <div className="w-32 h-1.5 bg-gray-200 rounded-full overflow-hidden">
                  <div className="h-full bg-blue-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2">
              <div className="w-12 h-12 bg-blue-50 rounded-xl flex items-center justify-center">
                <Upload size={24} className="text-blue-500" />
              </div>
              <p className="font-medium text-gray-700">Drop images here or <span className="text-blue-600">browse</span></p>
              <p className="text-xs text-gray-400">PNG, JPG up to 5MB each · {maxImages - previews.length} remaining</p>
            </div>
          )}
        </div>
      )}

      {/* Preview grid */}
      {previews.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {previews.map((url, i) => (
            <div key={i} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100">
              {url.startsWith('blob:') ? (
                <div className="w-full h-full flex items-center justify-center">
                  <Image size={24} className="text-gray-300 animate-pulse" />
                </div>
              ) : (
                <img src={url} alt={`Preview ${i + 1}`} className="w-full h-full object-cover" />
              )}
              <button
                type="button"
                onClick={() => removeImage(i)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition shadow-md"
              >
                <X size={12} />
              </button>
              {i === 0 && (
                <span className="absolute bottom-1 left-1 bg-blue-600 text-white text-xs px-1.5 py-0.5 rounded font-medium">
                  Main
                </span>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
