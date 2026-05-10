import type { Variants } from 'framer-motion';

/**
 * Shared animation variants used across IDM League components.
 * Import from here instead of defining locally to avoid duplication.
 */

/** Stagger container — children animate in sequence */
export const staggerContainer: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.05 } },
};

/** Stagger container with slightly faster stagger for dense lists */
export const staggerContainerFast: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.04 } },
};

/** Stagger container with slower stagger for hero sections */
export const staggerContainerSlow: Variants = {
  hidden: { opacity: 0 },
  show: { opacity: 1, transition: { staggerChildren: 0.06 } },
};

/** Fade-up item — slides up and fades in */
export const fadeUpItem: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

/** Fade-up item with longer duration for match views */
export const fadeUpItemSlow: Variants = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

/** Fade-up item with subtle y offset (dashboard style) */
export const fadeUpItemSubtle: Variants = {
  hidden: { opacity: 0, y: 6 },
  show: { opacity: 1, y: 0, transition: { duration: 0.25 } },
};

/**
 * Convenience aliases matching the naming convention used across the project.
 * These keep backward compatibility when refactoring.
 */
export const container = staggerContainer;
export const item = fadeUpItem;
