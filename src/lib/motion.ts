import type { Transition } from "motion/react";

/** Spring padrão para pills de tab / layout (Motion 6/10). */
export const tabSpring: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 32,
  mass: 0.8,
};

/** Entrada/saída de overlay (dialog, drawer). */
export const overlayTransition: Transition = {
  duration: 0.18,
  ease: [0.22, 1, 0.36, 1],
};

/** Painel de dialog. */
export const dialogPanelTransition: Transition = {
  type: "spring",
  stiffness: 420,
  damping: 34,
  mass: 0.85,
};

/** Barra de progresso. */
export const progressTransition: Transition = {
  type: "spring",
  stiffness: 120,
  damping: 24,
  mass: 0.9,
};
