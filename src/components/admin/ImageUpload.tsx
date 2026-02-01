import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trash2, Upload, ImageIcon } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

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
      // Get file extension
      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'png';
      const uploadPath = `${pageKey}/banner.${fileExt}`;

      // Delete existing image if any
      if (currentImage) {
        try {
          const existingPath = currentImage.image_url.split('/banners/')[1]?.split('?')[0];
          if (existingPath) {
            await supabase.storage
              .from('banners')
              .remove([existingPath]);
          }
        } catch (error) {
          console.log('No existing image to delete:', error);
        }
      }

      setProgress(30);

      // Upload new image
      const { error: uploadError } = await supabase.storage
        .from('banners')
        .upload(uploadPath, file, {
          upsert: true,
          contentType: file.type,
          cacheControl: '3600',
        });

      if (uploadError) {
        console.error('Upload error details:', uploadError);
        throw uploadError;
      }

      setProgress(60);

      // Get public URL with cache busting
      const timestamp = Date.now();
      const { data: { publicUrl } } = supabase.storage
        .from('banners')
        .getPublicUrl(`${uploadPath}?t=${timestamp}`);

      // Delete old database entry for this page_key
      await supabase
        .from('banner_images')
        .delete()
        .eq('page_key', pageKey);

      setProgress(80);

      // Insert new database entry
      const { error: dbError } = await supabase
        .from('banner_images')
        .insert({ 
          page_key: pageKey,
          image_url: publicUrl 
        });

      if (dbError) throw dbError;

      toast({
        title: 'Sucesso!',
        description: 'Imagem atualizada com sucesso!',
      });

      setFile(null);
      setProgress(100);
      onImageUpdated();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao fazer upload da imagem.',
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
      // Delete from storage
      try {
        const existingPath = currentImage.image_url.split('/banners/')[1]?.split('?')[0];
        if (existingPath) {
          await supabase.storage
            .from('banners')
            .remove([existingPath]);
        }
      } catch (error) {
        console.log('Storage delete (may not exist):', error);
      }

      // Delete from database
      await supabase
        .from('banner_images')
        .delete()
        .eq('page_key', pageKey);

      toast({
        title: 'Imagem excluída',
        description: 'A imagem foi removida com sucesso.',
      });

      onImageUpdated();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao excluir a imagem.',
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
          <div className="relative rounded-lg overflow-hidden border">
            <img
              src={currentImage.image_url}
              alt="Banner atual"
              className="w-full h-auto max-h-64 object-contain bg-black/50"
            />
          </div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted-foreground">
              Enviado em: {new Date(currentImage.created_at).toLocaleDateString('pt-BR')}
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={handleDelete}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Excluir
            </Button>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-center h-32 rounded-lg border-2 border-dashed border-muted-foreground/30 bg-muted/20">
          <div className="text-center text-muted-foreground">
            <ImageIcon className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p className="text-sm">Nenhuma imagem enviada</p>
          </div>
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
        <label htmlFor={inputId}>
          <Button
            variant="outline"
            className="w-full"
            disabled={uploading}
            asChild
          >
            <span className="cursor-pointer">
              <Upload className="h-4 w-4 mr-2" />
              Selecionar imagem (JPG, PNG, WEBP, GIF)
            </span>
          </Button>
        </label>

        {file && (
          <div className="p-3 rounded-lg bg-muted/50 space-y-1">
            <p className="text-sm font-medium truncate">
              {file.name}
            </p>
            <p className="text-xs text-muted-foreground">
              {(file.size / (1024 * 1024)).toFixed(2)} MB
            </p>
          </div>
        )}

        {uploading && (
          <Progress value={progress} className="w-full" />
        )}

        <Button
          onClick={handleUpload}
          disabled={!file || uploading}
          className="w-full"
        >
          {uploading ? 'Enviando...' : 'Confirmar Upload'}
        </Button>
      </div>
    </div>
  );
};
