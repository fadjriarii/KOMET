import * as React from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva } from 'class-variance-authority';
import { cn } from '@/lib/utils';

/**
 * Varian tombol sesuai DESIGN.md bagian "Buttons & Interactive Triggers":
 * Primary (cyan institusi), Secondary (royal blue), Outline (filter), Ghost (ikon).
 */
const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-control text-label-md font-label-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-primary text-on-primary shadow-sm hover:bg-primary-container active:bg-[#0369A1]',
        secondary: 'bg-secondary text-on-secondary hover:bg-[#1E3A8A]',
        outline: 'border border-[#CBD5E1] bg-white text-[#334155] hover:bg-canvas',
        ghost: 'text-on-surface-variant hover:bg-[#E2E8F0] hover:text-on-surface',
      },
      size: {
        default: 'h-10 px-4',
        sm: 'h-8 px-3 text-xs',
        icon: 'h-7 w-7 rounded-md',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
);

/**
 * Komponen Button dasar bergaya shadcn-ui.
 * Mendukung `asChild` agar dapat membungkus elemen lain (mis. Link router).
 */
const Button = React.forwardRef(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
