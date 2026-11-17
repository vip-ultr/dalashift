'use client';

import * as SwitchPrimitive from '@radix-ui/react-switch';
import { forwardRef, type ComponentPropsWithoutRef, type ComponentRef } from 'react';

import { cn } from '../../lib/utilities/cn';

const focusRing =
  'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#0a4232] focus-visible:ring-offset-2 focus-visible:ring-offset-white';

export const Switch = forwardRef<
  ComponentRef<typeof SwitchPrimitive.Root>,
  ComponentPropsWithoutRef<typeof SwitchPrimitive.Root>
>(({ className, ...props }, ref) => (
  <SwitchPrimitive.Root
    ref={ref}
    className={cn(
      'peer inline-flex h-6 w-11 shrink-0 cursor-pointer items-center rounded-full bg-[#d1d5db] p-0.5',
      'transition-colors duration-150 motion-reduce:transition-none',
      'data-[state=checked]:bg-brand-primary',
      'disabled:cursor-not-allowed disabled:opacity-50',
      focusRing,
      className,
    )}
    {...props}
  >
    <SwitchPrimitive.Thumb
      className={cn(
        'pointer-events-none block size-5 rounded-full bg-white',
        'transition-transform duration-150 motion-reduce:transition-none',
        'data-[state=unchecked]:translate-x-0 data-[state=checked]:translate-x-5',
      )}
    />
  </SwitchPrimitive.Root>
));
Switch.displayName = 'Switch';
