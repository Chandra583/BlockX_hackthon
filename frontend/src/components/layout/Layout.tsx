import React from 'react';
import { Header } from './Header';
import AppLayout from './AppLayout';

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <AppLayout>
        {children}
      </AppLayout>
    </div>
  );
};