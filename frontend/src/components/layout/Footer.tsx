import React from 'react';

interface FooterProps {
  className?: string;
}

export const Footer: React.FC<FooterProps> = ({ className = '' }) => {
  const year = new Date().getFullYear();
  return (
    <footer className={`mt-auto border-t border-gray-200 bg-white ${className}`}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 text-sm text-gray-600 flex items-center justify-between">
        <span>
          © {year} VERIDRIVE. All rights reserved.
        </span>
        <div className="space-x-4">
          <a href="/privacy" className="hover:text-gray-900">Privacy</a>
          <a href="/terms" className="hover:text-gray-900">Terms</a>
          <a href="/status" className="hover:text-gray-900">Status</a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;



