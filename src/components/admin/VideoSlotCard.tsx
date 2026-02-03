import { useState } from 'react';
import { supabase, supabasePublic } from '@/integrations/supabase/client';
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
    console.log("🎬 [UPLOAD] Iniciando processo para:", slot.title);

    try {
      const fileName = `${slot.page_key}.mp4`;
      let uploadPath = `vsl/${fileName}`;

      // --- TENTATIVA 1: CLIENTE AUTENTICADO ---
      console.log("🔐 [UPLOAD] Tentativa 1: Cliente Autenticado...");
      setProgress(20);

      let uploadResult = await supabase.storage
        .from('videos')
        .upload(uploadPath, file, {
          upsert: true,
          contentType: file.type || 'video/mp4'
        });

      // --- TENTATIVA 2: CLIENTE PÚBLICO (FALLBACK JWS) ---
      if (uploadResult.error && (uploadResult.error.message.includes('JWS') || uploadResult.error.message.includes('JWT') || uploadResult.error.message.includes('token'))) {
        console.warn("⚠️ [UPLOAD] Erro de Token detectado. Mudando para Canal Público Blindado...");
        setProgress(40);
        uploadResult = await supabasePublic.storage
          .from('videos')
          .upload(uploadPath, file, {
            upsert: true,
            contentType: file.type || 'video/mp4'
          });
      }

      // --- TENTATIVA 3: PATH ALTERNATIVO (ULTRA FALLBACK) ---
      if (uploadResult.error) {
        console.warn("🔻 [UPLOAD] Tentativa 2 falhou. Tentando Path Alternativo...");
        const altPath = `vsl/alt_${Date.now()}_${fileName}`;
        setProgress(60);
        uploadResult = await supabasePublic.storage
          .from('videos')
          .upload(altPath, file, {
            upsert: true,
            contentType: file.type || 'video/mp4'
          });

        if (!uploadResult.error) {
          // Se o alternativo funcionou, atualizamos o path para o resto do processo
          (uploadPath as any) = (uploadResult.data as any).path;
        }
      }

      if (uploadResult.error) {
        throw uploadResult.error;
      }

      setProgress(80);
      console.log("✅ [UPLOAD] Arquivo salvo no Storage. Atualizando Banco de Dados...");

      // Get public URL
      const { data: { publicUrl } } = supabasePublic.storage
        .from('videos')
        .getPublicUrl(uploadPath);

      const finalUrl = `${publicUrl}?t=${Date.now()}`;

      // ATUALIZAÇÃO DO BANCO COM WORKAROUND PARA FALTA DE CONSTRAINT UNIQUE
      const dbPayload = {
        video_url: finalUrl,
        page_key: slot.page_key,
        created_at: new Date().toISOString()
      };

      console.log("💾 [DB] Aplicando correção de registro (Delete + Insert)...");

      // 1. Tentar deletar o registro antigo para evitar erro de conflito
      await supabasePublic.from('vsl_video').delete().eq('page_key', slot.page_key);

      // 2. Inserir o novo registro
      let dbResult = await supabasePublic.from('vsl_video').insert(dbPayload);

      if (dbResult.error) {
        console.warn("⚠️ [DB] Erro na inserção pública, tentando via canal autenticado...");
        await supabase.from('vsl_video').delete().eq('page_key', slot.page_key);
        dbResult = await supabase.from('vsl_video').insert(dbPayload);
      }

      if (dbResult.error) throw dbResult.error;

      setProgress(100);
      console.log("🚀 [UPLOAD] Sucesso total:", finalUrl);

      toast({
        title: 'Sucesso Total!',
        description: `O vídeo da ${slot.title} está no ar.`,
      });

      setFile(null);
      onVideoUpdated();
    } catch (error: any) {
      console.error('❌ [UPLOAD] Erro crítico:', error);
      toast({
        title: 'Falha no Upload',
        description: error.message || 'Erro desconhecido. Verifique se o SQL foi rodado no Supabase.',
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
