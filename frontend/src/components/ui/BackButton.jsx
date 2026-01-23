import React from 'react';
import { ArrowLeft } from 'lucide-react';
import { useSmartNavigation } from '@/hooks/useSmartNavigation';

/**
 * Reusable Back Button for context-aware navigation
 * Props:
 *   fallbackPath: string (where to go if no history)
 *   label: string (button text)
 *   variant: string (button style)
 *   size: string (button size)
 */
export default function BackButton({ fallbackPath = '/', label = 'Back', variant = 'ghost', size = 'sm', ...props }) {
  const { goBack } = useSmartNavigation();
  return (
    <button
      type="button"
      className={`inline-flex items-center gap-2 btn btn-${variant} btn-${size}`}
      onClick={() => goBack(fallbackPath)}
      {...props}
    >
      <ArrowLeft className="w-4 h-4" />
      {label}
    </button>
  );
}
