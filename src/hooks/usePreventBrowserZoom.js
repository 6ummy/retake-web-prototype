import { useEffect } from 'react';

export default function usePreventBrowserZoom() {
  useEffect(() => {
    const prevent = (event) => {
      event.preventDefault();
    };
    const preventMultiTouch = (event) => {
      if (event.touches?.length > 1) event.preventDefault();
    };
    const preventWheelZoom = (event) => {
      if (event.ctrlKey || event.metaKey) event.preventDefault();
    };
    const preventKeyboardZoom = (event) => {
      if (
        (event.ctrlKey || event.metaKey)
        && ['+', '=', '-', '_', '0'].includes(event.key)
      ) {
        event.preventDefault();
      }
    };

    const options = { passive: false, capture: true };
    const targets = [
      window,
      document,
      document.documentElement,
      document.body,
      document.getElementById('root'),
    ].filter(Boolean);

    targets.forEach((target) => {
      target.addEventListener('gesturestart', prevent, options);
      target.addEventListener('gesturechange', prevent, options);
      target.addEventListener('gestureend', prevent, options);
      target.addEventListener('touchstart', preventMultiTouch, options);
      target.addEventListener('touchmove', preventMultiTouch, options);
    });
    window.addEventListener('wheel', preventWheelZoom, options);
    window.addEventListener('keydown', preventKeyboardZoom, options);

    return () => {
      targets.forEach((target) => {
        target.removeEventListener('gesturestart', prevent, options);
        target.removeEventListener('gesturechange', prevent, options);
        target.removeEventListener('gestureend', prevent, options);
        target.removeEventListener('touchstart', preventMultiTouch, options);
        target.removeEventListener('touchmove', preventMultiTouch, options);
      });
      window.removeEventListener('wheel', preventWheelZoom, options);
      window.removeEventListener('keydown', preventKeyboardZoom, options);
    };
  }, []);
}
