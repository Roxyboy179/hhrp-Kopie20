'use client';

import { Palette } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

export function ThemeMenuItem({ onOpen }) {
  return (
    <DropdownMenuItem
      onSelect={() => {
        // Lass das Dropdown schließen, dann öffne das Popup auf Navbar-Ebene
        onOpen?.();
      }}
      className="cursor-pointer flex items-center gap-2 text-white/70 hover:text-white hover:bg-white/[0.06] focus:bg-white/[0.06] focus:text-white"
    >
      <Palette className="w-4 h-4" />
      <span>Thema</span>
    </DropdownMenuItem>
  );
}
