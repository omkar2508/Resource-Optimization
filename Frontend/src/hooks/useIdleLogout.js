import { useEffect, useRef } from "react";

// 30 minutes in milliseconds (30 * 60 * 1000)
const IDLE_TIME = 30 * 60 * 1000;

export default function useIdleLogout(onLogout) {
  const timerRef = useRef(null);
  const onLogoutRef = useRef(onLogout);

  // Keep the latest onLogout callback
  useEffect(() => {
    onLogoutRef.current = onLogout;
  }, [onLogout]);

  const resetTimer = () => {
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      onLogoutRef.current();
    }, IDLE_TIME);
  };

  useEffect(() => {
    const events = [
      "mousemove",
      "mousedown",
      "keydown",
      "scroll",
      "touchstart",
      "click",
      "keypress",
    ];

    events.forEach(event =>
      window.addEventListener(event, resetTimer, { passive: true })
    );

    resetTimer(); // start timer

    return () => {
      events.forEach(event =>
        window.removeEventListener(event, resetTimer)
      );
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, []);
}
