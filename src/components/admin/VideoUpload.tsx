import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Trash2, Upload } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface VideoUploadProps {
  currentVideo: {
    video_url: string;
    created_at: string;
  } | null;
  onVideoUpdated: () => void;
}

export const VideoUpload = ({ currentVideo, onVideoUpdated }: VideoUploadProps) => {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const validateFile = (file: File): boolean => {
    const validTypes = ['video/mp4', 'video/quicktime', 'video/x-matroska'];
    const maxSize = 1024 * 1024 * 1024; // 1GB

    if (!validTypes.includes(file.type)) {
      toast({
        title: 'Formato inválido',
        description: 'Envie apenas MP4, MOV ou MKV.',
        variant: 'destructive',
      });
      return false;
    }

    if (file.size > maxSize) {
      toast({
        title: 'Arquivo muito grande',
        description: 'Reduza o tamanho e tente novamente.',
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
      // Delete existing video if any
      if (currentVideo) {
        await supabase.storage
          .from('videos')
          .remove(['vsl/vsl.mp4']);
      }

      // Upload new video
      const { error: uploadError } = await supabase.storage
        .from('videos')
        .upload('vsl/vsl.mp4', file, {
          upsert: true,
          contentType: 'video/mp4',
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl('vsl/vsl.mp4');

      // Delete old database entry
      if (currentVideo) {
        await supabase
          .from('vsl_video')
          .delete()
          .not('id', 'is', null);
      }

      // Insert new database entry
      const { error: dbError } = await supabase
        .from('vsl_video')
        .insert({ video_url: publicUrl });

      if (dbError) throw dbError;

      toast({
        title: 'Sucesso!',
        description: 'Vídeo atualizado com sucesso!',
      });

      setFile(null);
      setProgress(100);
      onVideoUpdated();
    } catch (error) {
      console.error('Upload error:', error);
      toast({
        title: 'Erro',
        description: 'Falha ao fazer upload do vídeo.',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
    }
  };

  const handleDelete = async () => {
    if (!currentVideo) return;

    if (!confirm('Deseja excluir o vídeo atual?')) return;

    try {
      await supabase.storage
        .from('videos')
        .remove(['vsl/vsl.mp4']);

      await supabase
        .from('vsl_video')
        .delete()
        .not('id', 'is', null);

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

  return (
    <div className="space-y-8">
      {/* Current Video Section */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Vídeo Atual</h2>
        {currentVideo ? (
          <div className="space-y-4">
            <video
              src={currentVideo.video_url}
              controls
              className="w-full max-w-2xl rounded-lg"
            />
            <div className="flex items-center justify-between">
              <div className="text-sm text-muted-foreground">
                <p>Enviado em: {new Date(currentVideo.created_at).toLocaleDateString('pt-BR')}</p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                onClick={handleDelete}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Excluir
              </Button>
            </div>
          </div>
        ) : (
          <p className="text-muted-foreground">Nenhum vídeo enviado ainda.</p>
        )}
      </div>

      {/* Upload Section */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-xl font-semibold mb-4">Enviar Novo Vídeo</h2>
        <div className="space-y-4">
          <div>
            <input
              type="file"
              accept="video/mp4,video/quicktime,video/x-matroska"
              onChange={handleFileSelect}
              className="hidden"
              id="video-upload"
              disabled={uploading}
            />
            <label htmlFor="video-upload">
              <Button
                variant="outline"
                className="w-full"
                disabled={uploading}
                asChild
              >
                <span className="cursor-pointer">
                  <Upload className="h-4 w-4 mr-2" />
                  Selecionar arquivo (MP4, MOV ou MKV)
                </span>
              </Button>
            </label>
          </div>

          {file && (
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Arquivo selecionado: {file.name}
              </p>
              <p className="text-sm text-muted-foreground">
                Tamanho: {(file.size / (1024 * 1024)).toFixed(2)} MB
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
            Confirmar Upload
          </Button>
        </div>
      </div>
    </div>
  );
};
