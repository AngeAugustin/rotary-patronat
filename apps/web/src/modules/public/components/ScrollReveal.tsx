import { motion, type HTMLMotionProps } from 'framer-motion';
import { fadeInUp, viewportOnce } from '@/design-system/motion';
import { cn } from '@/lib/utils';

interface ScrollRevealProps extends HTMLMotionProps<'div'> {
  delay?: number;
}

export function ScrollReveal({
  children,
  className,
  delay = 0,
  ...props
}: ScrollRevealProps) {
  return (
    <motion.div
      className={cn(className)}
      initial="hidden"
      whileInView="visible"
      viewport={viewportOnce}
      variants={fadeInUp}
      transition={{ delay }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
