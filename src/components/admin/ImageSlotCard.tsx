import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
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
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-pink-500/20 to-orange-500/20 flex items-center justify-center">
              <ImageIcon className="w-5 h-5 text-pink-500" />
            </div>
            <div>
              <CardTitle className="text-lg">{slot.title}</CardTitle>
              <CardDescription>{slot.description}</CardDescription>
            </div>
          </div>
          <a
            href={slot.route}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1"
          >
            Ver página
            <ExternalLink className="w-3 h-3" />
          </a>
        </div>
      </CardHeader>
      <CardContent>
        <ImageUpload
          pageKey={slot.page_key}
          currentImage={image ? { image_url: image.image_url, created_at: image.created_at } : null}
          onImageUpdated={onImageUpdated}
        />
      </CardContent>
    </Card>
  );
};
