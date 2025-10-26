import React from 'react';
import { Header } from './Header';
import AppLayout from './AppLayout';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <Header />
      <AppLayout>
        {children}
      </AppLayout>
    </div>
  );
};