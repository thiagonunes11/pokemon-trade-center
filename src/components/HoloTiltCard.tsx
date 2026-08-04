import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
import { CARD_BACK_IMAGE_URL } from "@/lib/cardImages";
import "./HoloTiltCard.css";

type HoloTiltCardProps = {
  src: string;
  alt: string;
  className?: string;
  enableTilt?: boolean;
  /** Intensidade do tilt (Aceternity ~25). Menor = mais giro. */
  tiltFactor?: number;
  /** Elevação da imagem no eixo Z ao interagir (px). */
  translateZ?: number;
  /** Inclinação via giroscópio no celular. */
  enableGyro?: boolean;
  gyroSensitivity?: number;
};

/** Distância mínima para decidir se o gesto é scroll ou tilt. */
const INTENT_PX = 12;
const MAX_TILT_DEG = 16;

const clamp = (v: number, min = 0, max = 100) =>
  Math.min(Math.max(v, min), max);

const clampTilt = (deg: number) =>
  Math.min(MAX_TILT_DEG, Math.max(-MAX_TILT_DEG, deg));

const adjust = (
  v: number,
  fMin: number,
  fMax: number,
  tMin: number,
  tMax: number,
) => tMin + ((tMax - tMin) * (v - fMin)) / (fMax - fMin);

function prefersReducedMotion(): boolean {
  return (
    typeof window !== "undefined" &&
    window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

type Bounds = { left: number; top: number; width: number; height: number };

/**
 * Carta 3D: tilt + metal holográfico.
 * Bounds medidos no scene (estático) — não no nó que rotaciona.
 * Toque: decide scroll vs tilt; só captura o ponteiro no modo tilt.
 */
export function HoloTiltCard({
  src,
  alt,
  className = "",
  enableTilt = true,
  tiltFactor = 16,
  translateZ = 36,
  enableGyro = true,
  gyroSensitivity = 1.15,
}: HoloTiltCardProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const imageLayerRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null);
  const touchingRef = useRef(false);
  const touchOriginRef = useRef<{ x: number; y: number } | null>(null);
  /** null = aguardando intenção; true = tilt travado; false = scroll. */
  const tiltLockedRef = useRef<boolean | null>(null);
  const boundsRef = useRef<Bounds | null>(null);
  const [active, setActive] = useState(false);
  const [gyroOn, setGyroOn] = useState(false);
  const [displaySrc, setDisplaySrc] = useState(src);

  useEffect(() => {
    setDisplaySrc(src);
  }, [src]);

  const reduced = prefersReducedMotion();
  const canTilt = enableTilt && !reduced;

  const readSceneBounds = useCallback((): Bounds | null => {
    const scene = sceneRef.current;
    if (!scene) return null;
    const { left, top, width, height } = scene.getBoundingClientRect();
    if (width <= 0 || height <= 0) return null;
    return { left, top, width, height };
  }, []);

  const applyPointer = useCallback(
    (clientX: number, clientY: number, bounds: Bounds) => {
      const scene = sceneRef.current;
      const tilt = tiltRef.current;
      const layer = imageLayerRef.current;
      if (!scene || !tilt) return;

      const px = clientX - bounds.left;
      const py = clientY - bounds.top;
      const { width, height } = bounds;

      const percentX = clamp((100 / width) * px);
      const percentY = clamp((100 / height) * py);
      const centerX = percentX - 50;
      const centerY = percentY - 50;

      scene.style.setProperty("--pointer-x", `${percentX}%`);
      scene.style.setProperty("--pointer-y", `${percentY}%`);
      scene.style.setProperty(
        "--background-x",
        `${adjust(percentX, 0, 100, 35, 65)}%`,
      );
      scene.style.setProperty(
        "--background-y",
        `${adjust(percentY, 0, 100, 35, 65)}%`,
      );
      scene.style.setProperty(
        "--pointer-from-center",
        `${clamp(Math.hypot(centerX, centerY) / 50, 0, 1)}`,
      );
      scene.style.setProperty("--pointer-from-top", `${percentY / 100}`);
      scene.style.setProperty("--pointer-from-left", `${percentX / 100}`);
      scene.style.setProperty("--glare-pos-x", `${percentX}%`);
      scene.style.setProperty("--glare-pos-y", `${percentY}%`);

      if (canTilt) {
        const rotateY = clampTilt((px - width / 2) / tiltFactor);
        // Invertido no X: dedo sobe → carta inclina “para trás” (mais natural).
        const rotateX = clampTilt(-(py - height / 2) / tiltFactor);
        tilt.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg)`;
        if (layer) {
          layer.style.transform = `translateZ(${translateZ}px)`;
        }
      }
    },
    [canTilt, tiltFactor, translateZ],
  );

  const resetTilt = useCallback(() => {
    const tilt = tiltRef.current;
    const layer = imageLayerRef.current;
    const scene = sceneRef.current;
    if (tilt) tilt.style.transform = "rotateX(0deg) rotateY(0deg)";
    if (layer) layer.style.transform = "translateZ(0px)";
    if (scene) {
      scene.style.setProperty("--pointer-x", "50%");
      scene.style.setProperty("--pointer-y", "50%");
      scene.style.setProperty("--background-x", "50%");
      scene.style.setProperty("--background-y", "50%");
      scene.style.setProperty("--pointer-from-center", "0");
      scene.style.setProperty("--pointer-from-top", "0.5");
      scene.style.setProperty("--pointer-from-left", "0.5");
      scene.style.setProperty("--glare-pos-x", "0%");
      scene.style.setProperty("--glare-pos-y", "0%");
    }
  }, []);

  const endInteraction = useCallback(
    (target: HTMLDivElement, pointerId: number | null) => {
      if (pointerId != null) {
        try {
          target.releasePointerCapture(pointerId);
        } catch {
          /* sem capture */
        }
      }
      pointerIdRef.current = null;
      touchingRef.current = false;
      touchOriginRef.current = null;
      tiltLockedRef.current = null;
      boundsRef.current = null;

      if (!gyroOn) {
        setActive(false);
        resetTilt();
      }
    },
    [gyroOn, resetTilt],
  );

  const requestGyroPermission = useCallback(async () => {
    if (!enableGyro || reduced) return;
    try {
      const DOE = window.DeviceOrientationEvent as
        | (typeof DeviceOrientationEvent & {
            requestPermission?: () => Promise<PermissionState>;
          })
        | undefined;
      if (DOE && typeof DOE.requestPermission === "function") {
        const state = await DOE.requestPermission();
        if (state === "granted") setGyroOn(true);
      } else if (window.DeviceOrientationEvent) {
        setGyroOn(true);
      }
    } catch {
      /* permissão negada */
    }
  }, [enableGyro, reduced]);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!canTilt) return;

      const bounds = readSceneBounds();
      if (!bounds) return;

      const isTouch = e.pointerType === "touch" || e.pointerType === "pen";
      touchingRef.current = true;
      pointerIdRef.current = e.pointerId;
      boundsRef.current = bounds;
      setActive(true);
      applyPointer(e.clientX, e.clientY, bounds);

      if (isTouch) {
        touchOriginRef.current = { x: e.clientX, y: e.clientY };
        tiltLockedRef.current = null;
        void requestGyroPermission();
        return;
      }

      touchOriginRef.current = null;
      tiltLockedRef.current = true;
      e.currentTarget.setPointerCapture(e.pointerId);
    },
    [canTilt, readSceneBounds, applyPointer, requestGyroPermission],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!canTilt) return;
      if (pointerIdRef.current != null && pointerIdRef.current !== e.pointerId) {
        return;
      }

      const isTouch = e.pointerType === "touch" || e.pointerType === "pen";
      const bounds = boundsRef.current ?? readSceneBounds();
      if (!bounds) return;
      boundsRef.current = bounds;

      if (isTouch) {
        if (tiltLockedRef.current === false) return;

        if (tiltLockedRef.current === null) {
          const origin = touchOriginRef.current;
          if (!origin) return;
          const dx = e.clientX - origin.x;
          const dy = e.clientY - origin.y;
          const dist = Math.hypot(dx, dy);
          if (dist < INTENT_PX) {
            applyPointer(e.clientX, e.clientY, bounds);
            return;
          }
          // Scroll vertical dominante → libera a página.
          if (Math.abs(dy) > Math.abs(dx) * 1.25) {
            tiltLockedRef.current = false;
            touchingRef.current = false;
            pointerIdRef.current = null;
            touchOriginRef.current = null;
            boundsRef.current = null;
            if (!gyroOn) {
              setActive(false);
              resetTilt();
            }
            return;
          }
          // Tilt: captura o ponteiro e impede pan.
          tiltLockedRef.current = true;
          try {
            e.currentTarget.setPointerCapture(e.pointerId);
          } catch {
            /* ignore */
          }
        }

        applyPointer(e.clientX, e.clientY, bounds);
        return;
      }

      applyPointer(e.clientX, e.clientY, bounds);
    },
    [canTilt, readSceneBounds, applyPointer, gyroOn, resetTilt],
  );

  const handlePointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      endInteraction(e.currentTarget, e.pointerId);
    },
    [endInteraction],
  );

  const handlePointerEnter = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!canTilt || e.pointerType !== "mouse") return;
      const bounds = readSceneBounds();
      if (!bounds) return;
      boundsRef.current = bounds;
      setActive(true);
      applyPointer(e.clientX, e.clientY, bounds);
    },
    [canTilt, readSceneBounds, applyPointer],
  );

  const handlePointerLeave = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== "mouse") return;
      if (pointerIdRef.current != null) return;
      setActive(false);
      boundsRef.current = null;
      resetTilt();
    },
    [resetTilt],
  );

  useEffect(() => {
    if (!gyroOn || !canTilt || !enableGyro) return;

    const onOrient = (event: DeviceOrientationEvent) => {
      if (touchingRef.current) return;
      const bounds = readSceneBounds();
      if (!bounds || event.beta == null || event.gamma == null) return;

      const { width, height, left, top } = bounds;
      const centerX = width / 2;
      const centerY = height / 2;
      const px = clamp(
        centerX + event.gamma * gyroSensitivity * 4,
        0,
        width,
      );
      const py = clamp(
        centerY + (event.beta - 45) * gyroSensitivity * 3,
        0,
        height,
      );
      setActive(true);
      applyPointer(left + px, top + py, bounds);
    };

    window.addEventListener("deviceorientation", onOrient);
    return () => window.removeEventListener("deviceorientation", onOrient);
  }, [
    gyroOn,
    canTilt,
    enableGyro,
    gyroSensitivity,
    applyPointer,
    readSceneBounds,
  ]);

  useEffect(() => {
    if (!canTilt) resetTilt();
  }, [canTilt, resetTilt]);

  return (
    <div
      ref={sceneRef}
      className={`tcg-3d-scene${active ? " is-active" : ""} ${className}`.trim()}
    >
      <div className="tcg-3d-behind" aria-hidden />
      <div
        ref={tiltRef}
        className="tcg-3d-tilt"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onPointerEnter={handlePointerEnter}
        onPointerLeave={handlePointerLeave}
      >
        <div className="tcg-3d-body">
          <div ref={imageLayerRef} className="tcg-3d-layer">
            <img
              src={displaySrc}
              alt={alt}
              className="tcg-3d-image"
              draggable={false}
              onError={() => {
                if (displaySrc !== CARD_BACK_IMAGE_URL) {
                  setDisplaySrc(CARD_BACK_IMAGE_URL);
                }
              }}
            />
          </div>
          <div className="tcg-3d-metal" aria-hidden />
          <div className="tcg-3d-glare" aria-hidden />
          <div className="tcg-3d-glare-sweep" aria-hidden />
        </div>
      </div>
    </div>
  );
}
