import React, { useEffect, useState, useRef } from 'react';
import { X } from 'lucide-react';

const Modal = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  maxWidth = 'max-w-lg',
}) => {
  const [viewportHeight, setViewportHeight] = useState(null);
  const [viewportTop, setViewportTop] = useState(0);
  const [isKeyboardOpen, setIsKeyboardOpen] = useState(false);
  const contentRef = useRef(null);

  // Handle virtual keyboard and mobile viewport resizing
  useEffect(() => {
    if (!isOpen) return;

    const handleViewportChange = () => {
      if (typeof window !== 'undefined' && window.visualViewport) {
        const vv = window.visualViewport;
        const windowH = window.innerHeight;
        // If visual viewport is significantly smaller than window.innerHeight, the soft keyboard is open
        const keyboardActive = (windowH - vv.height) > 80;
        
        setIsKeyboardOpen(keyboardActive);
        setViewportHeight(vv.height);
        setViewportTop(vv.offsetTop || 0);
      }
    };

    handleViewportChange();

    if (typeof window !== 'undefined' && window.visualViewport) {
      window.visualViewport.addEventListener('resize', handleViewportChange);
      window.visualViewport.addEventListener('scroll', handleViewportChange);
    }

    // Lock background body scroll
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      document.body.style.overflow = originalOverflow || 'unset';
      if (typeof window !== 'undefined' && window.visualViewport) {
        window.visualViewport.removeEventListener('resize', handleViewportChange);
        window.visualViewport.removeEventListener('scroll', handleViewportChange);
      }
    };
  }, [isOpen]);

  // When an input inside the modal receives focus on mobile, ensure it scrolls into view smoothly
  const handleFocusCapture = (e) => {
    if (e.target && typeof e.target.scrollIntoView === 'function') {
      setTimeout(() => {
        e.target.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
      }, 150);
    }
  };

  if (!isOpen) return null;

  // Dynamic styling for mobile virtual keyboard
  const containerStyle = isKeyboardOpen && viewportHeight
    ? {
        height: `${viewportHeight}px`,
        top: `${viewportTop}px`,
        bottom: 'auto',
      }
    : undefined;

  const dialogMaxHeightStyle = isKeyboardOpen && viewportHeight
    ? {
        maxHeight: `${Math.floor(viewportHeight - 12)}px`,
      }
    : undefined;

  return (
    <div
      className="fixed inset-0 z-50 overflow-y-auto overscroll-none"
      style={containerStyle}
    >
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs transition-opacity animate-in fade-in"
        onClick={onClose}
      />

      {/* Modal Dialog: mobile bottom sheet on small screens, center modal on desktop */}
      <div className="min-h-full flex items-end sm:items-center justify-center p-0 sm:p-4">
        <div
          className={`relative w-full ${maxWidth} bg-white rounded-t-3xl sm:rounded-2xl shadow-2xl transition-all transform animate-in slide-in-from-bottom-6 sm:zoom-in-95 duration-200 overflow-hidden max-h-[90dvh] sm:max-h-[90vh] flex flex-col`}
          style={dialogMaxHeightStyle}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Mobile Drag Indicator Handle */}
          <div className="w-12 h-1.5 bg-slate-200 rounded-full mx-auto mt-2.5 sm:hidden shrink-0" />

          {/* Header */}
          <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-100 shrink-0">
            <div className="min-w-0 pr-2">
              <h3 className="text-base sm:text-lg font-bold text-slate-900 leading-tight truncate">
                {title}
              </h3>
              {subtitle && (
                <p className="text-xs text-slate-500 mt-0.5 line-clamp-1">{subtitle}</p>
              )}
            </div>
            <button
              onClick={onClose}
              type="button"
              className="w-8 h-8 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-500 hover:text-slate-800 flex items-center justify-center transition-colors shrink-0"
              title="Close"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Content Body */}
          <div
            ref={contentRef}
            onFocusCapture={handleFocusCapture}
            className="p-5 overflow-y-auto flex-1 overscroll-contain pb-8 sm:pb-5 space-y-1"
          >
            {children}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Modal;
