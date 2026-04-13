'use client';

import { AuthProvider, useAuth } from '@/components/providers/AuthProvider';
import { Navbar } from '@/components/shared/Navbar';

export default function RootClientLayout({ children }) {
  return (
    <AuthProvider>
      <NavbarWrapper />
      <main className="pt-16">{children}</main>
    </AuthProvider>
  );
}

function NavbarWrapper() {
  const { user, loading } = useAuth();
  return <Navbar user={user} loading={loading} />;
}
