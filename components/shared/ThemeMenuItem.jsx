'use client';

import { Palette } from 'lucide-react';
import { DropdownMenuItem } from '@/components/ui/dropdown-menu';

export function ThemeMenuItem({ onOpen }) {
  return (
    <DropdownMenuItem
      onSelect={() => onOpen?.()}
      className="cursor-pointer flex items-center gap-3 px-2.5 py-2 mx-0.5 rounded-lg text-white/75 hover:text-white focus:text-white hover:bg-white/[0.05] focus:bg-white/[0.05] transition-colors"
    >
      <span
        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{
          background: 'rgba(34, 197, 94, 0.12)',
          border: '1px solid rgba(34, 197, 94, 0.2)',
        }}
      >
        <Palette className="w-3.5 h-3.5 text-emerald-400" />
      </span>
      <span className="text-[13px] font-medium">Theme</span>
    </DropdownMenuItem>
  );
}
