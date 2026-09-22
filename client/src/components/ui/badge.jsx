import * as React from 'react';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Chip/badge status semantik sesuai DESIGN.md bagian "Status & Evaluation Chips":
 * pill penuh, uppercase label-sm, latar bertinta dengan teks saturasi tinggi.
 */
const badgeVariants = cva(
  'inline-flex items-center gap-1.5 rounded-full border px-2.5 py-0.5 font-label-sm text-label-sm uppercase transition-colors',
  {
    variants: {
      variant: {
        default: 'border-transparent bg-primary text-on-primary',
        neutral: 'border-[#E2E8F0] bg-surface-container-low text-on-surface-variant',
        success: 'border-[#A7F3D0] bg-[#ECFDF5] text-[#065F46]',
        warning: 'border-[#FDE68A] bg-[#FFFBEB] text-[#92400E]',
        danger: 'border-[#FECACA] bg-[#FEF2F2] text-[#991B1B]',
        info: 'border-[#BFDBFE] bg-[#EFF6FF] text-[#1E40AF]',
      },
    },
    defaultVariants: {
      variant: 'default',
    },
  },
);

/**
 * Titik indikator warna untuk badge status (dot + teks uppercase).
 */
function BadgeDot({ className }) {
  return <span className={cn('h-1.5 w-1.5 rounded-full', className)} aria-hidden="true" />;
}

const Badge = React.forwardRef(({ className, variant, ...props }, ref) => (
  <div ref={ref} className={cn(badgeVariants({ variant }), className)} {...props} />
));
Badge.displayName = 'Badge';

export { Badge, BadgeDot, badgeVariants };
