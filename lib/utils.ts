import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

/** shadcn/ui className 병합 유틸 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
