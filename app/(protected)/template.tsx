"use client";

import { MotionConfig, motion } from "motion/react";

// Re-mounts on every navigation, giving each page a soft entrance.
export default function ProtectedTemplate({ children }: { children: React.ReactNode }) {
  return (
    <MotionConfig reducedMotion="user">
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
    </MotionConfig>
  );
}
