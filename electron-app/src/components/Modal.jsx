import { X } from 'lucide-react';

export const Modal = ({ title, description, isOpen, onClose, children, footer, className = '' }) => {
  if (!isOpen) return null;

  // Extract max-w class from className or use default
  const maxWidthClass = className.includes('max-w-') ? '' : 'max-w-xl';
  const customClasses = className || '';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
        aria-label="Close modal"
      />
      <div className={`relative w-full ${maxWidthClass} ${customClasses} mx-4 bg-gray-950 border border-gray-800 rounded-2xl shadow-2xl p-6 space-y-4 max-h-[90vh] overflow-hidden flex flex-col`}>
        <div className="flex items-start justify-between gap-4">
          <div>
            <h3 className="text-xl font-semibold text-white">{title}</h3>
            {description && <p className="text-sm text-gray-400 mt-1">{description}</p>}
          </div>
          <button
            type="button"
            className="p-2 rounded-full bg-gray-900 text-gray-400 hover:text-white transition-colors"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="space-y-4 flex-1 overflow-y-auto pr-2">{children}</div>
        {footer && <div className="pt-2 border-t border-gray-800">{footer}</div>}
      </div>
    </div>
  );
};

