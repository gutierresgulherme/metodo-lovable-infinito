import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trash2, Upload, Play, Monitor } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VideoSlot {
  page_key: string;
  title: string;
  description: string;
  route: string;
}

interface VideoData {
  id: string;
  video_url: string;
  created_at: string;
  page_key: string;
}

interface VideoSlotCardProps {
  slot: VideoSlot;
  video: VideoData | null;
  onVideoUpdated: () => void;
}

export const VideoSlotCard = ({ slot, video, onVideoUpdated }: VideoSlotCardProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-matroska', 'video/x-msvideo', 'video/mpeg'];
    const validExtensions = ['.mp4', '.mov', '.mkv', '.avi', '.mpeg', '.mpg'];
    const maxSize = 200 * 1024 * 1024;

    const hasValidType = validTypes.includes(file.type);
    const hasValidExtension = validExtensions.some(ext => file.name.toLowerCase().endsWith(ext));

    if (!hasValidType && !hasValidExtension) {
      toast({
        title: 'Formato inválido',
        description: 'Envie apenas MP4, MOV, MKV, AVI ou MPEG.',
        variant: 'destructive',
      });
      return false;
    }

    if (file.size > maxSize) {
      toast({
        title: 'Arquivo muito grande',
        description: `O arquivo tem ${(file.size / (1024 * 1024)).toFixed(2)}MB. Máximo permitido: 200MB.`,
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
    setProgress(10);

    try {
      const uploadPath = `vsl/${slot.page_key}.mp4`;

      // Delete existing file if any (Best effort)
      try {
        await supabase.storage.from('videos').remove([uploadPath]);
      } catch (error) {
        console.log('No existing video to delete or delete failed:', error);
      }

      setProgress(30);

      // Upload new video
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload(uploadPath, file, {
          upsert: true,
          contentType: 'video/mp4'
        });

      if (uploadError) {
        console.error("Storage Video Upload Error:", uploadError);
        throw new Error(uploadError.message);
      }

      setProgress(70);

      // Get public URL - Clean version without auth token in URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(uploadPath);

      // Add cache buster to URL for instant update
      const finalUrl = `${publicUrl}?t=${Date.now()}`;

      // Delete old database entry for this page_key
      const { error: deleteError } = await supabase
        .from('vsl_video')
        .delete()
        .eq('page_key', slot.page_key);

      if (deleteError) {
        console.error("DB Video Delete Error:", deleteError);
        throw new Error("DB_DELETE_ERROR: " + deleteError.message);
      }

      // Insert new database entry
      const { error: insertError } = await supabase
        .from('vsl_video')
        .insert({ video_url: finalUrl, page_key: slot.page_key });

      if (insertError) {
        console.error("DB Video Insert Error:", insertError);
        throw new Error("DB_INSERT_ERROR: " + insertError.message);
      }

      setProgress(100);

      toast({
        title: 'Sucesso!',
        description: `Vídeo da ${slot.title} atualizado!`,
      });

      setFile(null);
      onVideoUpdated();
    } catch (error: any) {
      console.error('Erro detalhado no Upload:', error);

      let errorMsg = error.message || 'Falha ao fazer upload do vídeo.';

      if (errorMsg.includes('JWS') || errorMsg.includes('JWT')) {
        errorMsg = "Erro de Sessão (JWS). Por favor, saia do painel (Logout) e entre novamente para limpar seu acesso.";
      }

      toast({
        title: 'Erro no Upload',
        description: errorMsg,
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!video) return;
    if (!confirm(`Deseja excluir o vídeo da ${slot.title}?`)) return;

    try {
      await supabase.storage
        .from('videos')
        .remove([`vsl/${slot.page_key}.mp4`]);

      await supabase
        .from('vsl_video')
        .delete()
        .eq('page_key', slot.page_key);

      toast({
        title: 'Vídeo excluído',
        description: 'O vídeo foi removido com sucesso.',
      });

      onVideoUpdated();
    } catch (error) {
      console.error('Delete error:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao excluir o vídeo.',
        variant: 'destructive',
      });
    }
  };

  const inputId = `video-upload-${slot.page_key}`;

  return (
    <div className="bg-transparent rounded-xl border-0 overflow-hidden text-gray-200">
      {/* Header */}
      <div className="bg-gradient-to-r from-primary/10 to-primary/5 p-4 border-b border-border/50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Monitor className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold text-foreground">{slot.title}</h3>
            <p className="text-xs text-muted-foreground">{slot.description}</p>
          </div>
        </div>
        <div className="mt-2">
          <span className="text-xs bg-muted px-2 py-1 rounded-md font-mono">{slot.route}</span>
        </div>
      </div>

      {/* Video Preview or Placeholder */}
      <div className="p-4">
        {video ? (
          <div className="space-y-3">
            <div className="relative aspect-video rounded-lg overflow-hidden bg-black">
              <video
                src={video.video_url}
                controls
                className="w-full h-full object-contain"
              />
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <span>Enviado: {new Date(video.created_at).toLocaleDateString('pt-BR')}</span>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
                className="h-7"
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Excluir
              </Button>
            </div>
          </div>
        ) : (
          <div className="aspect-video rounded-lg bg-muted/50 border-2 border-dashed border-border flex flex-col items-center justify-center gap-2">
            <Play className="w-10 h-10 text-muted-foreground/50" />
            <p className="text-sm text-muted-foreground">Nenhum vídeo enviado</p>
          </div>
        )}
      </div>

      {/* Upload Section */}
      <div className="p-4 pt-0 space-y-3">
        <input
          type="file"
          accept="video/mp4,video/quicktime,video/x-matroska,video/x-msvideo,video/mpeg,.mp4,.mov,.mkv,.avi,.mpeg,.mpg"
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
              {video ? 'Substituir vídeo' : 'Selecionar vídeo'}
            </span>
          </Button>
        </label>

        {file && (
          <div className="text-xs text-muted-foreground bg-muted/50 p-2 rounded-lg">
            <p className="truncate font-medium">{file.name}</p>
            <p>{(file.size / (1024 * 1024)).toFixed(2)} MB</p>
          </div>
        )}

        {uploading && <Progress value={progress} className="h-2" />}

        {file && (
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full"
          >
            {uploading ? 'Enviando...' : 'Confirmar Upload'}
          </Button>
        )}
      </div>
    </div>
  );
};
