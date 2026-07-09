import Modal from '@/components/ui/Modal';
import VideoPlayer from '@/components/VideoPlayer';

interface VideoPreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  url: string;
  title: string;
}

export default function VideoPreviewModal({ isOpen, onClose, url, title }: VideoPreviewModalProps) {
  return (
    <Modal isOpen={isOpen} onClose={onClose} title={`Preview — ${title}`} size="lg">
      <div className="overflow-hidden rounded-lg bg-black border border-border">
        {isOpen && url ? (
          <VideoPlayer url={url} />
        ) : (
          <div className="aspect-video flex items-center justify-center">
            <p className="text-muted text-sm font-mono">No video URL linked to this title.</p>
          </div>
        )}
      </div>
    </Modal>
  );
}
