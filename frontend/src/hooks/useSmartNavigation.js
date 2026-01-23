import { useNavigate, useLocation } from 'react-router-dom';

/**
 * Custom navigation hook for context-aware navigation and back.
 * Usage:
 *   const { navigateTo, goBack } = useSmartNavigation();
 */
export function useSmartNavigation() {
  const navigate = useNavigate();
  const location = useLocation();

  // Navigate to a path, storing current location as 'from'
  function navigateTo(path, options = {}) {
    // Merge previous state (if any) with new state
    const prevState = location.state || {};
    navigate(path, {
      ...options,
      state: {
        ...prevState,
        ...options.state,
        from: location,
      },
    });
  }

  // Go back to previous location or fallback
  function goBack(fallbackPath = '/') {
    if (location.state && location.state.from) {
      // Pass back any custom state (like activeTab) when going back
      const { activeTab } = location.state;
      navigate(
        location.state.from.pathname + (location.state.from.search || ''),
        {
          replace: true,
          state: activeTab ? { activeTab } : undefined,
        }
      );
    } else {
      navigate(fallbackPath, { replace: true });
    }
  }

  return { navigateTo, goBack };
}
