'use client';

import { useEffect, useState } from 'react';

export function ScrollProgressBar() {
  const [scrollProgress, setScrollProgress] = useState(0);

  useEffect(() => {
    const handleScroll = () => {
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const scrollTop = window.scrollY;
      const trackLength = documentHeight - windowHeight;
      const progress = (scrollTop / trackLength) * 100;
      setScrollProgress(Math.min(progress, 100));
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll(); // Initial call

    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <div 
      className="fixed top-0 left-0 right-0 h-1 z-50 transition-opacity duration-300"
      style={{ opacity: scrollProgress > 0 ? 1 : 0 }}
    >
      <div 
        className="h-full transition-all duration-150 ease-out"
        style={{ 
          width: `${scrollProgress}%`,
          background: 'linear-gradient(90deg, var(--theme-accent), rgba(var(--theme-accent-rgb), 0.6))',
          boxShadow: '0 0 10px rgba(var(--theme-accent-rgb), 0.5)'
        }}
      />
    </div>
  );
}
