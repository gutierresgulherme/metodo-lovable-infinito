import { useState } from 'react';
import { supabase, supabasePublic } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Trash2, Upload, Play, Monitor, Youtube, Link2, Check } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { isYouTubeUrl, extractYouTubeId } from '@/components/YouTubePlayer';

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
  const [youtubeUrl, setYoutubeUrl] = useState('');
  const [savingYoutube, setSavingYoutube] = useState(false);
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
      // Use timestamp to create unique filename, preventing overwrite of the original "demo" file
      const fileName = `${slot.page_key}_${Date.now()}.mp4`;
      const uploadPath = `vsl/${fileName}`;

      // --- UPLOAD AUTENTICADO ---
      // Usamos o cliente autenticado (supabase) para garantir que temos permissão de escrita
      console.log("🔒 [UPLOAD] Usando Cliente Autenticado...");
      setProgress(30);

      const { data, error: uploadError } = await supabase.storage
        .from('videos')
        .upload(uploadPath, file, {
          upsert: false, // Don't need upsert if filename is unique
          contentType: file.type || 'video/mp4',
          cacheControl: '3600'
        });

      if (uploadError) {
        console.error("❌ [STORAGE] Erro no upload:", uploadError);
        throw new Error(`Erro no Storage: ${uploadError.message}`);
      }

      setProgress(80);
      console.log("✅ [UPLOAD] Arquivo salvo no Storage. Atualizando Banco de Dados...");

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('videos')
        .getPublicUrl(uploadPath);

      // Cache busting
      const finalUrl = `${publicUrl}?t=${Date.now()}`;

      const dbPayload = {
        video_url: finalUrl,
        page_key: slot.page_key,
        created_at: new Date().toISOString()
      };

      console.log("💾 [DB] Atualizando registro...");

      // 1. Delete antigo (prevenção de conflito)
      await supabase.from('vsl_video').delete().eq('page_key', slot.page_key);

      // 2. Insert novo
      const { error: dbError } = await supabase.from('vsl_video').insert(dbPayload);

      if (dbError) {
        console.error("❌ [DB] Erro no banco:", dbError);
        throw new Error(`Erro no Banco: ${dbError.message}`);
      }

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
        description: error.message || 'Erro desconhecido ao fazer upload.',
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
      // Extract path from URL to delete the correct file
      try {
        const url = new URL(video.video_url);
        // Format: .../storage/v1/object/public/videos/vsl/filename.mp4
        // We need: vsl/filename.mp4
        // Logic: Split by '/videos/' (the bucket name in URL path)
        const pathParts = url.pathname.split('/videos/');
        if (pathParts.length > 1) {
          const filePath = pathParts[1];
          await supabase.storage
            .from('videos')
            .remove([filePath]);
        }
      } catch (e) {
        console.warn("Could not parse URL for deletion, trying fallback");
        // Fallback to old behavior if parsing fails
        await supabase.storage
          .from('videos')
          .remove([`vsl/${slot.page_key}.mp4`]);
      }

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

  // Save YouTube URL directly to database
  const handleSaveYouTube = async () => {
    if (!youtubeUrl.trim()) {
      toast({
        title: 'URL inválida',
        description: 'Cole um link válido do YouTube.',
        variant: 'destructive',
      });
      return;
    }

    const videoId = extractYouTubeId(youtubeUrl);
    if (!videoId) {
      toast({
        title: 'Link do YouTube inválido',
        description: 'Não consegui extrair o ID do vídeo. Verifique o link.',
        variant: 'destructive',
      });
      return;
    }

    setSavingYoutube(true);

    try {
      const normalizedUrl = `https://youtu.be/${videoId}`;
      console.log("🎬 [YOUTUBE] Salvando URL:", normalizedUrl, "para", slot.page_key);

      // 1. Delete old record
      await supabase.from('vsl_video').delete().eq('page_key', slot.page_key);

      // 2. Insert new with YouTube URL
      const { error: dbError } = await supabase.from('vsl_video').insert({
        video_url: normalizedUrl,
        page_key: slot.page_key,
        created_at: new Date().toISOString()
      });

      if (dbError) throw new Error(dbError.message);

      toast({
        title: '✅ Vídeo do YouTube salvo!',
        description: `O vídeo foi vinculado à ${slot.title} com sucesso.`,
      });

      setYoutubeUrl('');
      onVideoUpdated();
    } catch (error: any) {
      console.error('❌ [YOUTUBE] Erro:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.message || 'Falha ao vincular o vídeo do YouTube.',
        variant: 'destructive',
      });
    } finally {
      setSavingYoutube(false);
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
              {isYouTubeUrl(video.video_url) ? (
                /* Preview do YouTube no Admin */
                <iframe
                  src={`https://www.youtube.com/embed/${extractYouTubeId(video.video_url)}?modestbranding=1&rel=0`}
                  className="w-full h-full"
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                  title="YouTube Preview"
                />
              ) : (
                <video
                  src={video.video_url}
                  controls
                  className="w-full h-full object-contain"
                />
              )}
            </div>
            <div className="flex items-center justify-between text-xs text-muted-foreground">
              <div className="flex items-center gap-2">
                {isYouTubeUrl(video.video_url) && (
                  <span className="bg-red-500/20 text-red-400 px-2 py-0.5 rounded-full text-[10px] font-bold flex items-center gap-1">
                    <Youtube className="w-3 h-3" /> YouTube
                  </span>
                )}
                <span>Enviado: {new Date(video.created_at).toLocaleDateString('pt-BR')}</span>
              </div>
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

      {/* YouTube Link Section */}
      <div className="p-4 pt-0 space-y-3">
        <div className="relative">
          <div className="absolute inset-0 bg-gradient-to-r from-red-500/5 to-transparent rounded-lg" />
          <div className="relative border border-red-500/20 rounded-lg p-3 space-y-2">
            <div className="flex items-center gap-2 text-xs font-bold text-red-400 uppercase tracking-wider">
              <Youtube className="w-4 h-4" />
              Vincular Vídeo do YouTube
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Cole o link do YouTube aqui..."
                value={youtubeUrl}
                onChange={(e) => setYoutubeUrl(e.target.value)}
                className="text-xs h-9 bg-background/50"
                disabled={savingYoutube}
              />
              <Button
                onClick={handleSaveYouTube}
                disabled={savingYoutube || !youtubeUrl.trim()}
                size="sm"
                className="h-9 bg-red-600 hover:bg-red-700 text-white px-4"
              >
                {savingYoutube ? '...' : <><Check className="w-3 h-3 mr-1" /> Salvar</>}
              </Button>
            </div>
            <p className="text-[10px] text-muted-foreground">
              Aceita: youtu.be/xxx, youtube.com/watch?v=xxx
            </p>
          </div>
        </div>
      </div>

      {/* File Upload Section (Separador) */}
      <div className="px-4">
        <div className="flex items-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest">
          <div className="flex-1 h-px bg-border" />
          <span>ou envie um arquivo</span>
          <div className="flex-1 h-px bg-border" />
        </div>
      </div>

      {/* Upload Section */}
      <div className="p-4 pt-2 space-y-3">
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
