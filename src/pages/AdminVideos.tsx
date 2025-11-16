import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VideoUpload } from '@/components/admin/VideoUpload';

const AdminVideos = () => {
  const [currentVideo, setCurrentVideo] = useState<any>(null);

  useEffect(() => {
    fetchCurrentVideo();
  }, []);

  const fetchCurrentVideo = async () => {
    const { data } = await supabase
      .from('vsl_video')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    setCurrentVideo(data);
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-5xl">
        <h1 className="text-3xl font-bold mb-8">Gerenciar Vídeo da VSL</h1>
        <VideoUpload 
          currentVideo={currentVideo}
          onVideoUpdated={fetchCurrentVideo}
        />
      </div>
    </div>
  );
};

export default AdminVideos;
