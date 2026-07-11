import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2, Upload, Link, X, Image as ImageIcon } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface ImageUploadProps {
  value: string;
  onChange: (url: string) => void;
  label?: string;
}

export function ImageUpload({ value, onChange, label = "Product Image" }: ImageUploadProps) {
  const [mode, setMode] = useState<"url" | "upload">("url");
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  const handleFileUpload = async (file: File) => {
    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("image", file);
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
        credentials: "include",
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Upload failed");
      }
      const data = await res.json();
      onChange(data.url);
      toast({ title: "Image uploaded successfully" });
    } catch (err: any) {
      toast({ title: "Upload failed", description: err.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith("image/")) handleFileUpload(file);
  };

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label className="text-xs font-semibold">{label}</Label>
        <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
          <button
            type="button"
            onClick={() => setMode("url")}
            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-md font-medium transition-colors ${mode === "url" ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Link className="h-2.5 w-2.5" /> URL
          </button>
          <button
            type="button"
            onClick={() => setMode("upload")}
            className={`flex items-center gap-1 text-[10px] px-2 py-1 rounded-md font-medium transition-colors ${mode === "upload" ? "bg-white shadow-sm text-gray-800" : "text-gray-500 hover:text-gray-700"}`}
          >
            <Upload className="h-2.5 w-2.5" /> Upload
          </button>
        </div>
      </div>

      {mode === "url" ? (
        <Input
          value={value}
          onChange={e => onChange(e.target.value)}
          placeholder="https://example.com/image.jpg"
          className="text-xs"
        />
      ) : (
        <div
          className="border-2 border-dashed border-gray-200 rounded-xl p-4 text-center cursor-pointer hover:border-primary/50 hover:bg-orange-50/30 transition-colors"
          onClick={() => fileRef.current?.click()}
          onDrop={handleDrop}
          onDragOver={e => e.preventDefault()}
        >
          <input
            ref={fileRef}
            type="file"
            accept="image/*"
            className="hidden"
            onChange={e => { const f = e.target.files?.[0]; if (f) handleFileUpload(f); }}
          />
          {uploading ? (
            <div className="flex flex-col items-center gap-2 py-2">
              <Loader2 className="h-6 w-6 animate-spin text-primary" />
              <span className="text-xs text-gray-500">Uploading...</span>
            </div>
          ) : (
            <div className="flex flex-col items-center gap-2 py-2">
              <Upload className="h-6 w-6 text-gray-400" />
              <div>
                <p className="text-xs font-medium text-gray-600">Click to upload or drag & drop</p>
                <p className="text-[10px] text-gray-400 mt-0.5">PNG, JPG, WEBP up to 10MB</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Preview */}
      {value && (
        <div className="relative w-full h-36 rounded-xl overflow-hidden border bg-gray-50">
          <img src={value} alt="Preview" className="w-full h-full object-cover" onError={() => {}} />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute top-2 right-2 h-6 w-6 rounded-full bg-black/50 text-white flex items-center justify-center hover:bg-black/70 transition-colors"
          >
            <X className="h-3 w-3" />
          </button>
        </div>
      )}
      {!value && (
        <div className="w-full h-20 rounded-xl border-2 border-dashed border-gray-100 flex items-center justify-center">
          <ImageIcon className="h-8 w-8 text-gray-200" />
        </div>
      )}
    </div>
  );
}
