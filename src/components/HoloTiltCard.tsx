import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type PointerEvent as ReactPointerEvent,
} from "react";
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

const clamp = (v: number, min = 0, max = 100) =>
  Math.min(Math.max(v, min), max);

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

/**
 * Carta 3D: tilt Aceternity + metal holográfico Profile Card.
 * Mouse (hover/arrasto), giroscópio no mobile. Toque não captura o scroll.
 */
export function HoloTiltCard({
  src,
  alt,
  className = "",
  enableTilt = true,
  tiltFactor = 22,
  translateZ = 40,
  enableGyro = true,
  gyroSensitivity = 1.15,
}: HoloTiltCardProps) {
  const sceneRef = useRef<HTMLDivElement>(null);
  const tiltRef = useRef<HTMLDivElement>(null);
  const imageLayerRef = useRef<HTMLDivElement>(null);
  const pointerIdRef = useRef<number | null>(null);
  const touchingRef = useRef(false);
  const [active, setActive] = useState(false);
  const [gyroOn, setGyroOn] = useState(false);

  const reduced = prefersReducedMotion();
  const canTilt = enableTilt && !reduced;

  const applyPointer = useCallback(
    (px: number, py: number, width: number, height: number) => {
      const scene = sceneRef.current;
      const tilt = tiltRef.current;
      const layer = imageLayerRef.current;
      if (!scene || !tilt) return;

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
      // Glare Hover: faixa metálica acompanha o ponteiro
      scene.style.setProperty("--glare-pos-x", `${percentX}%`);
      scene.style.setProperty("--glare-pos-y", `${percentY}%`);

      if (canTilt) {
        const rotateY = (px - width / 2) / tiltFactor;
        const rotateX = (py - height / 2) / tiltFactor;
        tilt.style.transform = `rotateY(${rotateY}deg) rotateX(${rotateX}deg)`;
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
    if (tilt) tilt.style.transform = "rotateY(0deg) rotateX(0deg)";
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
      /* permissão negada — toque ainda funciona */
    }
  }, [enableGyro, reduced]);

  const handlePointerDown = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!canTilt) return;

      const isTouch = e.pointerType === "touch" || e.pointerType === "pen";
      // Toque: não captura o ponteiro — senão o scroll da página trava.
      // O efeito 3D no mobile fica a cargo do giroscópio após permissão.
      if (isTouch) {
        void requestGyroPermission();
        return;
      }

      touchingRef.current = true;
      pointerIdRef.current = e.pointerId;
      setActive(true);
      e.currentTarget.setPointerCapture(e.pointerId);

      const { left, top, width, height } =
        e.currentTarget.getBoundingClientRect();
      applyPointer(e.clientX - left, e.clientY - top, width, height);
    },
    [canTilt, applyPointer, requestGyroPermission],
  );

  const handlePointerMove = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!canTilt) return;
      // Arrastar com o dedo não inclina — libera o scroll; mouse continua.
      if (e.pointerType === "touch" || e.pointerType === "pen") return;

      const { left, top, width, height } =
        e.currentTarget.getBoundingClientRect();
      setActive(true);
      applyPointer(e.clientX - left, e.clientY - top, width, height);
    },
    [canTilt, applyPointer],
  );

  const handlePointerUp = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (pointerIdRef.current === e.pointerId) {
        try {
          e.currentTarget.releasePointerCapture(e.pointerId);
        } catch {
          /* já liberado */
        }
        pointerIdRef.current = null;
      }
      touchingRef.current = false;

      // Com giro ativo, mantém o metal “ligado”; senão reseta
      if (!gyroOn) {
        setActive(false);
        resetTilt();
      }
    },
    [gyroOn, resetTilt],
  );

  const handlePointerEnter = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (!canTilt || e.pointerType !== "mouse") return;
      setActive(true);
      const { left, top, width, height } =
        e.currentTarget.getBoundingClientRect();
      applyPointer(e.clientX - left, e.clientY - top, width, height);
    },
    [canTilt, applyPointer],
  );

  const handlePointerLeave = useCallback(
    (e: ReactPointerEvent<HTMLDivElement>) => {
      if (e.pointerType !== "mouse") return;
      if (pointerIdRef.current != null) return;
      setActive(false);
      resetTilt();
    },
    [resetTilt],
  );

  useEffect(() => {
    if (!gyroOn || !canTilt || !enableGyro) return;

    const onOrient = (event: DeviceOrientationEvent) => {
      if (touchingRef.current) return;
      const tilt = tiltRef.current;
      if (!tilt || event.beta == null || event.gamma == null) return;

      const { width, height } = tilt.getBoundingClientRect();
      const centerX = width / 2;
      const centerY = height / 2;
      // beta: frente/trás (−180..180), gamma: esquerda/direita (−90..90)
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
      applyPointer(px, py, width, height);
    };

    window.addEventListener("deviceorientation", onOrient);
    return () => window.removeEventListener("deviceorientation", onOrient);
  }, [gyroOn, canTilt, enableGyro, gyroSensitivity, applyPointer]);

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
              src={src}
              alt={alt}
              className="tcg-3d-image"
              draggable={false}
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
