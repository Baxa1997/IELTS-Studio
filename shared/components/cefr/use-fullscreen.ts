import { useCallback, useEffect, useState } from "react";

// ---- Fullscreen ------------------------------------------------------------

// True OS fullscreen (browser Fullscreen API) for the exam surface — fullscreens
// the runner's own root so it fills the screen with no browser chrome, like the
// real test. Tracks state via fullscreenchange; webkit-prefixed fallback for Safari.
export function useFullscreen(ref: React.RefObject<HTMLElement | null>) {
  const [isFull, setIsFull] = useState(false);
  useEffect(() => {
    const d = document as Document & { webkitFullscreenElement?: Element };
    const onChange = () => setIsFull(!!(document.fullscreenElement || d.webkitFullscreenElement));
    document.addEventListener("fullscreenchange", onChange);
    document.addEventListener("webkitfullscreenchange", onChange);
    return () => {
      document.removeEventListener("fullscreenchange", onChange);
      document.removeEventListener("webkitfullscreenchange", onChange);
    };
  }, []);
  const toggle = useCallback(() => {
    const el = ref.current as
      | (HTMLElement & { webkitRequestFullscreen?: () => Promise<void> })
      | null;
    const d = document as Document & {
      webkitFullscreenElement?: Element;
      webkitExitFullscreen?: () => Promise<void>;
    };
    const active = document.fullscreenElement || d.webkitFullscreenElement;
    if (!active)
      void (el?.requestFullscreen?.() ?? el?.webkitRequestFullscreen?.())?.catch?.(() => {});
    else void (document.exitFullscreen?.() ?? d.webkitExitFullscreen?.())?.catch?.(() => {});
  }, [ref]);
  return { isFull, toggle };
}
