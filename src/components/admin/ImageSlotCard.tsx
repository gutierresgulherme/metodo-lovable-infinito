import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ImageIcon, ExternalLink } from 'lucide-react';
import { ImageUpload } from './ImageUpload';

interface ImageSlot {
  page_key: string;
  title: string;
  description: string;
  route: string;
}

interface ImageData {
  id: string;
  image_url: string;
  created_at: string;
  page_key: string;
}

interface ImageSlotCardProps {
  slot: ImageSlot;
  image: ImageData | null;
  onImageUpdated: () => void;
}

export const ImageSlotCard = ({ slot, image, onImageUpdated }: ImageSlotCardProps) => {
  return (
    <Card className="overflow-hidden bg-transparent border-0 text-gray-200">
      <CardHeader className="pb-3 border-b border-white/5">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-pink-500/10 flex items-center justify-center border border-pink-500/20">
              <ImageIcon className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <CardTitle className="text-lg text-gray-200 font-orbitron tracking-wide">{slot.title}</CardTitle>
              <p className="text-sm text-gray-500 font-mono mt-1">{slot.description}</p>
            </div>
          </div>
          <a
            href={slot.route}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-gray-500 hover:text-pink-400 flex items-center gap-1 font-mono transition-colors"
          >
            VER PÁGINA
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </CardHeader>
      <CardContent className="pt-4">
        <ImageUpload
          pageKey={slot.page_key}
          currentImage={image ? { image_url: image.image_url, created_at: image.created_at } : null}
          onImageUpdated={onImageUpdated}
        />
      </CardContent>
    </Card>
  );
};
