import { useState, useCallback } from "react";
import { Upload, X, Image as ImageIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface ImageUploaderProps {
  bucket: string;
  folder?: string;
  onUpload: (url: string) => void;
  defaultValue?: string;
  maxSizeMB?: number;
}

export const ImageUploader = ({
  bucket,
  folder = "",
  onUpload,
  defaultValue,
  maxSizeMB = 5,
}: ImageUploaderProps) => {
  const [uploading, setUploading] = useState(false);
  const [preview, setPreview] = useState<string | null>(defaultValue || null);
  const [dragActive, setDragActive] = useState(false);

  const uploadFile = async (file: File) => {
    try {
      setUploading(true);

      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }

      // Validate file size
      const maxSize = maxSizeMB * 1024 * 1024;
      if (file.size > maxSize) {
        toast.error(`File size must be less than ${maxSizeMB}MB`);
        return;
      }

      // Create unique filename
      const fileExt = file.name.split(".").pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = folder ? `${folder}/${fileName}` : fileName;

      // Upload to Supabase Storage
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(filePath, file);

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);

      setPreview(publicUrl);
      onUpload(publicUrl);
      toast.success("Image uploaded successfully");
    } catch (error) {
      console.error("Upload error:", error);
      toast.error("Failed to upload image");
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);

    const file = e.dataTransfer.files?.[0];
    if (file) uploadFile(file);
  }, []);

  const handleDrag = useCallback((e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) uploadFile(file);
  };

  const removeImage = () => {
    setPreview(null);
    onUpload("");
  };

  return (
    <div className="space-y-4">
      {preview ? (
        <div className="relative group">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-64 object-cover rounded-lg border"
          />
          <Button
            type="button"
            size="icon"
            variant="destructive"
            className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={removeImage}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      ) : (
        <div
          onDragEnter={handleDrag}
          onDragLeave={handleDrag}
          onDragOver={handleDrag}
          onDrop={handleDrop}
          className={`
            border-2 border-dashed rounded-lg p-8 text-center cursor-pointer
            transition-colors
            ${dragActive ? "border-primary bg-primary/5" : "border-border"}
            ${uploading ? "opacity-50 pointer-events-none" : ""}
          `}
        >
          <input
            type="file"
            accept="image/*"
            onChange={handleChange}
            disabled={uploading}
            className="hidden"
            id="image-upload"
          />
          <label htmlFor="image-upload" className="cursor-pointer">
            <div className="flex flex-col items-center gap-4">
              {uploading ? (
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              ) : (
                <>
                  <ImageIcon className="h-12 w-12 text-muted-foreground" />
                  <div className="space-y-2">
                    <p className="text-sm font-medium">
                      Drop image here or click to browse
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Max size: {maxSizeMB}MB
                    </p>
                  </div>
                </>
              )}
            </div>
          </label>
        </div>
      )}
    </div>
  );
};
