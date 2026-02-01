import { useEffect, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { VideoSlotCard } from '@/components/admin/VideoSlotCard';
import { ImageSlotCard } from '@/components/admin/ImageSlotCard';
import { Video, ImageIcon } from 'lucide-react';

// Define all video slots in the project
const VIDEO_SLOTS = [
  {
    page_key: 'home_vsl',
    title: 'VSL Principal',
    description: 'Vídeo de vendas da página inicial',
    route: '/',
  },
  {
    page_key: 'thankyou_upsell',
    title: 'Upsell - Página de Obrigado',
    description: 'VSL do Club Copy & Scale',
    route: '/thankyou',
  },
];

// Define all image slots in the project
const IMAGE_SLOTS = [
  {
    page_key: 'thankyou_banner',
    title: 'Banner Club Copy & Scale',
    description: 'Imagem do banner na página de obrigado',
    route: '/thankyou',
  },
];

interface VideoData {
  id: string;
  video_url: string;
  created_at: string;
  page_key: string;
}

interface ImageData {
  id: string;
  image_url: string;
  created_at: string;
  page_key: string;
}

const AdminVideos = () => {
  const [videos, setVideos] = useState<VideoData[]>([]);
  const [images, setImages] = useState<ImageData[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    
    const [videosResult, imagesResult] = await Promise.all([
      supabase
        .from('vsl_video')
        .select('*')
        .order('created_at', { ascending: false }),
      supabase
        .from('banner_images')
        .select('*')
        .order('created_at', { ascending: false })
    ]);

    setVideos((videosResult.data as VideoData[]) || []);
    setImages((imagesResult.data as ImageData[]) || []);
    setLoading(false);
  };

  const getVideoForSlot = (pageKey: string) => {
    return videos.find(v => v.page_key === pageKey) || null;
  };

  const getImageForSlot = (pageKey: string) => {
    return images.find(i => i.page_key === pageKey) || null;
  };

  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-6xl">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
            <Video className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h1 className="text-3xl font-bold">Gerenciar Mídias</h1>
            <p className="text-muted-foreground">Faça upload dos vídeos e imagens para cada seção do projeto</p>
          </div>
        </div>

        {loading ? (
          <div className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {[1, 2].map(i => (
                <div key={i} className="h-96 bg-muted/50 rounded-xl animate-pulse" />
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-10">
            {/* Video Slots */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <Video className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Vídeos</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {VIDEO_SLOTS.map(slot => (
                  <VideoSlotCard
                    key={slot.page_key}
                    slot={slot}
                    video={getVideoForSlot(slot.page_key)}
                    onVideoUpdated={fetchData}
                  />
                ))}
              </div>
            </section>

            {/* Image Slots */}
            <section>
              <div className="flex items-center gap-2 mb-4">
                <ImageIcon className="w-5 h-5 text-pink-500" />
                <h2 className="text-xl font-semibold">Imagens / Banners</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {IMAGE_SLOTS.map(slot => (
                  <ImageSlotCard
                    key={slot.page_key}
                    slot={slot}
                    image={getImageForSlot(slot.page_key)}
                    onImageUpdated={fetchData}
                  />
                ))}
              </div>
            </section>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminVideos;
