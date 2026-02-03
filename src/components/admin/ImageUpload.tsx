import { useState } from 'react';
import { supabase, supabasePublic } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trash2, Upload, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils';

interface ImageUploadProps {
  pageKey: string;
  currentImage: {
    image_url: string;
    created_at: string;
  } | null;
  onImageUpdated: () => void;
}

export const ImageUpload = ({ pageKey, currentImage, onImageUpdated }: ImageUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    const validExtensions = ['.jpg', '.jpeg', '.png', '.webp', '.gif'];
    const maxSize = 10 * 1024 * 1024; // 10MB

    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!hasValidType && !hasValidExtension) {
      toast({
        title: 'Formato inválido',
        description: 'Envie apenas JPG, PNG, WEBP ou GIF.',
        variant: 'destructive',
      });
      return false;
    }

    if (file.size > maxSize) {
      toast({
        title: 'Arquivo muito grande',
        description: `O arquivo tem ${(file.size / (1024 * 1024)).toFixed(2)}MB. Máximo permitido: 10MB.`,
        variant: 'destructive',
      });
      return false;
    }

    return true;
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile && validateFile(selectedFile)) {
      setFile(selectedFile);
    }
  };

  const handleUpload = async () => {
    if (!file) return;

    setUploading(true);
    setProgress(0);

    try {
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const timestamp = Date.now();
      const uploadPath = `${pageKey}/banner_${timestamp}.${fileExt}`;
      const NEW_BUCKET = 'site_uploads';

      // 1. Upload new file to NEW bucket
      setProgress(20);
      let { error: uploadError } = await supabase.storage
        .from(NEW_BUCKET)
        .upload(uploadPath, file, {
          upsert: true,
          contentType: file.type,
          cacheControl: '3600',
        });

      // FALLBACK SE ERRO DE TOKEN
      if (uploadError && (uploadError.message.includes('JWS') || uploadError.message.includes('JWT'))) {
        console.warn("⚠️ [IMAGE] Token error, using public client...");
        const result = await supabasePublic.storage
          .from(NEW_BUCKET)
          .upload(uploadPath, file, {
            upsert: true,
            contentType: file.type,
            cacheControl: '3600',
          });
        uploadError = result.error;
      }

      if (uploadError) {
        console.error("Storage Upload Error Details:", uploadError);
        throw new Error("STORAGE_UPLOAD_ERROR: " + uploadError.message);
      }

      // 2. Get Public URL
      setProgress(50);
      const { data: { publicUrl } } = supabase.storage
        .from(NEW_BUCKET)
        .getPublicUrl(uploadPath);

      // 3. Remove old image (Detect bucket dynamically)
      if (currentImage) {
        try {
          // Url format: .../storage/v1/object/public/[BUCKET_NAME]/[PATH]
          const urlParts = currentImage.image_url.split('/storage/v1/object/public/');
          if (urlParts.length > 1) {
            const fullPath = urlParts[1];
            const bucketName = fullPath.split('/')[0];
            const filePath = fullPath.substring(bucketName.length + 1).split('?')[0]; // Remove bucket name and query params

            if (bucketName && filePath) {
              await supabase.storage.from(bucketName).remove([filePath]);
            }
          }
        } catch (e) {
          console.warn('Failed to cleanup old storage file (non-critical):', e);
        }
      }

      // 4. Update Database
      setProgress(70);
      const { error: deleteError } = await supabase
        .from('banner_images')
        .delete()
        .eq('page_key', pageKey);

      if (deleteError) {
        console.error("DB Delete Error Details:", deleteError);
        throw new Error("DB_DELETE_ERROR: " + deleteError.message);
      }

      setProgress(90);
      let { error: insertError } = await supabase
        .from('banner_images')
        .insert({
          page_key: pageKey,
          image_url: publicUrl
        });

      if (insertError) {
        console.warn("⚠️ [IMAGE] DB Insert failed, trying public client...");
        const result = await supabasePublic
          .from('banner_images')
          .insert({
            page_key: pageKey,
            image_url: publicUrl
          });
        insertError = result.error;
      }

      if (insertError) {
        console.error("DB Insert Error Details:", insertError);
        throw new Error("DB_INSERT_ERROR: " + insertError.message);
      }

      toast({
        title: 'Sucesso!',
        description: 'Imagem atualizada com sucesso!',
      });

      setFile(null);
      setProgress(100);
      onImageUpdated();
    } catch (error: any) {
      console.error('Upload flow error:', error);
      toast({
        title: 'Erro no Upload',
        description: error.message || 'Falha ao atualizar a imagem.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentImage) return;

    if (!confirm('Deseja excluir a imagem atual?')) return;

    try {
      // 1. Remove from Storage (Dynamic Bucket)
      try {
        const urlParts = currentImage.image_url.split('/storage/v1/object/public/');
        if (urlParts.length > 1) {
          const fullPath = urlParts[1];
          const bucketName = fullPath.split('/')[0];
          const filePath = fullPath.substring(bucketName.length + 1).split('?')[0];

          if (bucketName && filePath) {
            const { error: storageError } = await supabase.storage
              .from(bucketName)
              .remove([filePath]);
            if (storageError) console.warn('Storage removal warning:', storageError);
          }
        }
      } catch (error) {
        console.warn('Storage parse/removal error:', error);
      }

      // 2. Remove from DB
      const { error: dbError } = await supabase
        .from('banner_images')
        .delete()
        .eq('page_key', pageKey);

      if (dbError) throw dbError;

      toast({
        title: 'Imagem excluída',
        description: 'A imagem foi removida com sucesso.',
      });

      onImageUpdated();
    } catch (error: any) {
      console.error('Delete error:', error);
      toast({
        title: 'Erro ao excluir',
        description: error.message || 'Falha ao remover a imagem.',
        variant: 'destructive',
      });
    }
  };

  const inputId = `image-upload-${pageKey}`;

  return (
    <div className="space-y-4">
      {/* Current Image */}
      {currentImage ? (
        <div className="space-y-3">
          <div className="relative rounded-lg overflow-hidden border border-white/10 bg-black/40">
            <img
              src={currentImage.image_url}
              alt="Banner atual"
              className="w-full h-auto max-h-64 object-contain"
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-gray-500 font-mono">
              ENVIADO EM: {new Date(currentImage.created_at).toLocaleDateString('pt-BR')}
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
              className="h-7 text-xs font-mono"
            >
              <Trash2 className="h-3 w-3 mr-1" />
              REMOVER
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center h-32 rounded-lg border-2 border-dashed border-white/10 bg-white/5 hover:bg-white/10 transition-colors">
          <ImageIcon className="w-8 h-8 text-gray-500 mb-2 opacity-50" />
          <p className="text-sm text-gray-400 font-mono">NENHUMA IMAGEM ENCONTRADA</p>
        </div>
      )}

      {/* Upload Section */}
      <div className="space-y-3">
        <input
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif"
          onChange={handleFileSelect}
          className="hidden"
          id={inputId}
          disabled={uploading}
        />

        {!file ? (
          <label htmlFor={inputId} className="w-full block">
            <div className={cn(
              "flex items-center justify-center gap-2 w-full h-10 rounded-md border border-white/10 bg-[#0f0f16] text-sm font-medium text-gray-300 hover:bg-white/5 hover:text-white cursor-pointer transition-colors font-orbitron",
              uploading && "opacity-50 cursor-not-allowed"
            )}>
              <Upload className="h-4 w-4" />
              SELECIONAR IMAGEM
            </div>
          </label>
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between p-3 rounded-lg bg-white/5 border border-white/10">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded bg-pink-500/20 flex items-center justify-center text-pink-400">
                  <ImageIcon className="w-4 h-4" />
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-medium text-gray-200 truncate font-mono">{file.name}</p>
                  <p className="text-xs text-gray-500 font-mono">{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
                </div>
              </div>
              <Button variant="ghost" size="icon" onClick={() => setFile(null)} className="h-6 w-6 hover:bg-red-500/20 hover:text-red-400">
                <Trash2 className="w-3 h-3" />
              </Button>
            </div>

            {uploading && (
              <div className="space-y-1">
                <div className="h-1 w-full bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-pink-500 transition-all duration-300" style={{ width: `${progress}%` }} />
                </div>
                <p className="text-xs text-gray-500 text-center font-mono animate-pulse">ENVIANDO PARA NUVEM...</p>
              </div>
            )}

            <div className="flex gap-2">
              <Button
                variant="ghost"
                onClick={() => setFile(null)}
                disabled={uploading}
                className="flex-1 font-mono text-xs hover:bg-white/5"
              >
                CANCELAR
              </Button>
              <Button
                onClick={handleUpload}
                disabled={uploading}
                className="flex-[2] bg-pink-600 hover:bg-pink-700 font-orbitron text-xs tracking-wider"
              >
                {uploading ? 'ENVIANDO...' : 'CONFIRMAR UPLOAD'}
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
