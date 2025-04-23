import { Check } from 'lucide-react';
import { cn } from '../lib/utils';

export const avatars = [
  {
    id: 'earth',
    url: 'https://images.unsplash.com/photo-1614730321146-b6fa6a46bcb4?w=128&h=128&fit=crop',
    alt: 'Planet Earth'
  },
  {
    id: 'mars',
    url: 'https://images.unsplash.com/photo-1614728894747-a83421e2b9c9?w=128&h=128&fit=crop',
    alt: 'Planet Mars'
  },
  {
    id: 'jupiter',
    url: 'https://images.unsplash.com/photo-1630839437035-dac17da580d0?w=128&h=128&fit=crop',
    alt: 'Planet Jupiter'
  }
];

interface AvatarSelectionProps {
  selected: string;
  onSelect: (avatarId: string) => void;
}

export function AvatarSelection({ selected, onSelect }: AvatarSelectionProps) {
  return (
    <div className="grid grid-cols-3 gap-4">
      {avatars.map((avatar) => (
        <button
          key={avatar.id}
          onClick={() => onSelect(avatar.id)}
          className="relative aspect-square group focus:outline-none"
        >
          <div 
            className={cn(
              "relative w-full pb-[100%] overflow-hidden rounded-full transition-transform duration-200",
              selected === avatar.id 
                ? "ring-2 ring-tomato ring-offset-2 transform scale-105" 
                : "hover:scale-105"
            )}
          >
            <div className="absolute inset-0 overflow-hidden rounded-full bg-gray-100">
              <img
                src={avatar.url}
                alt={avatar.alt}
                className="absolute w-full h-full object-cover"
              />
              {selected === avatar.id && (
                <div className="absolute inset-0 bg-tomato/20 flex items-center justify-center">
                  <Check className="w-6 h-6 text-white drop-shadow" />
                </div>
              )}
            </div>
          </div>
        </button>
      ))}
    </div>
  );
}