'use client';

import { AdminCard } from './AdminCard';
import { cn } from '@/lib/utils';

export function AdminTable({ children, className }) {
  return (
    <AdminCard className={cn('p-0 overflow-hidden', className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          {children}
        </table>
      </div>
    </AdminCard>
  );
}

export function AdminTableHeader({ children }) {
  return (
    <thead className="bg-white/[0.02] border-b border-white/[0.08]">
      {children}
    </thead>
  );
}

export function AdminTableBody({ children }) {
  return <tbody className="divide-y divide-white/[0.05]">{children}</tbody>;
}

export function AdminTableRow({ children, className, onClick }) {
  return (
    <tr 
      className={cn(
        'transition-colors',
        onClick && 'cursor-pointer hover:bg-white/[0.02]',
        className
      )}
      onClick={onClick}
    >
      {children}
    </tr>
  );
}

export function AdminTableHead({ children, className }) {
  return (
    <th className={cn('px-6 py-4 text-left text-xs font-semibold text-white/60 uppercase tracking-wider', className)}>
      {children}
    </th>
  );
}

export function AdminTableCell({ children, className }) {
  return (
    <td className={cn('px-6 py-4 text-sm text-white', className)}>
      {children}
    </td>
  );
}
