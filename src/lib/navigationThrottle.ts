import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const THROTTLE_DELAY = 100;

export function useNavigationThrottle() {
  const location = useLocation();
  const lastNavigationTime = useRef<number>(0);
  const throttleTimer = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    const now = Date.now();
    const timeSinceLastNavigation = now - lastNavigationTime.current;

    if (timeSinceLastNavigation < THROTTLE_DELAY) {
      if (throttleTimer.current) {
        clearTimeout(throttleTimer.current);
      }

      throttleTimer.current = setTimeout(() => {
        lastNavigationTime.current = Date.now();
      }, THROTTLE_DELAY);
    } else {
      lastNavigationTime.current = now;
    }

    return () => {
      if (throttleTimer.current) {
        clearTimeout(throttleTimer.current);
      }
    };
  }, [location.pathname]);
}

let lastNavigationTimestamp = 0;
const NAVIGATION_COOLDOWN = 50;

export function throttleNavigation(callback: () => void) {
  const now = Date.now();

  if (now - lastNavigationTimestamp >= NAVIGATION_COOLDOWN) {
    lastNavigationTimestamp = now;
    callback();
  }
}
