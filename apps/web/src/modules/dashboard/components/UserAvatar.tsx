import { cn } from '@/lib/utils';

interface UserAvatarProps {
  firstName?: string;
  lastName?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

function getInitials(firstName?: string, lastName?: string) {
  const first = firstName?.charAt(0) ?? '';
  const last = lastName?.charAt(0) ?? '';
  return (first + last).toUpperCase() || '?';
}

const sizeClasses = {
  sm: 'h-8 w-8 text-xs',
  md: 'h-10 w-10 text-sm',
  lg: 'h-12 w-12 text-base',
};

export function UserAvatar({ firstName, lastName, size = 'md', className }: UserAvatarProps) {
  return (
    <div
      className={cn(
        'flex shrink-0 items-center justify-center rounded-xl bg-primary-100 font-semibold text-primary-700 ring-2 ring-neutral-0',
        sizeClasses[size],
        className,
      )}
      aria-hidden
    >
      {getInitials(firstName, lastName)}
    </div>
  );
}
