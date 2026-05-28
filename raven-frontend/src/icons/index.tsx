import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  strokeWidth?: number;
}

export const HomeIcon: React.FC<IconProps> = ({ size = 22, className = '', strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M3 9.5L12 3L21 9.5V20C21 20.55 20.55 21 20 21H15V16H9V21H4C3.45 21 3 20.55 3 20V9.5Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round"/>
  </svg>
);

export const WalletIcon: React.FC<IconProps> = ({ size = 22, className = '', strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="2" y="6" width="20" height="14" rx="2" stroke="currentColor" strokeWidth={strokeWidth}/>
    <path d="M2 10H22" stroke="currentColor" strokeWidth={strokeWidth}/>
    <circle cx="17" cy="15" r="1.5" fill="currentColor"/>
    <path d="M6 4L18 4" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"/>
  </svg>
);

export const PhoneIcon: React.FC<IconProps> = ({ size = 22, className = '', strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M6.6 10.8C7.8 13.2 9.8 15.2 12.2 16.4L14.2 14.4C14.47 14.13 14.87 14.05 15.2 14.2C16.27 14.57 17.43 14.77 18.6 14.77C19.15 14.77 19.6 15.22 19.6 15.77V18.6C19.6 19.15 19.15 19.6 18.6 19.6C10.27 19.6 3.6 12.93 3.6 4.6C3.6 4.05 4.05 3.6 4.6 3.6H7.4C7.95 3.6 8.4 4.05 8.4 4.6C8.4 5.77 8.6 6.93 8.97 8C9.1 8.33 9.02 8.7 8.77 8.97L6.6 10.8Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round"/>
  </svg>
);

export const UserIcon: React.FC<IconProps> = ({ size = 22, className = '', strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth={strokeWidth}/>
    <path d="M4 20C4 16.686 7.582 14 12 14C16.418 14 20 16.686 20 20" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"/>
  </svg>
);

export const ArrowLeftIcon: React.FC<IconProps> = ({ size = 20, className = '', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M19 12H5M5 12L12 19M5 12L12 5" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ArrowRightIcon: React.FC<IconProps> = ({ size = 16, className = '', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M5 12H19M19 12L12 5M19 12L12 19" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ClockIcon: React.FC<IconProps> = ({ size = 16, className = '', strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth={strokeWidth}/>
    <path d="M12 7V12L15 15" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const StarIcon: React.FC<IconProps & { filled?: boolean }> = ({ size = 14, className = '', strokeWidth = 1.6, filled = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L15.09 8.26L22 9.27L17 14.14L18.18 21.02L12 17.77L5.82 21.02L7 14.14L2 9.27L8.91 8.26L12 2Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round"/>
  </svg>
);

export const HeartIcon: React.FC<IconProps & { filled?: boolean }> = ({ size = 18, className = '', strokeWidth = 1.6, filled = false }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? 'currentColor' : 'none'} className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round"/>
  </svg>
);

export const FlagIcon: React.FC<IconProps> = ({ size = 18, className = '', strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round"/>
    <line x1="4" y1="22" x2="4" y2="15" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"/>
  </svg>
);

export const ThumbsUpIcon: React.FC<IconProps> = ({ size = 18, className = '', strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3H14z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round"/>
    <path d="M7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round"/>
  </svg>
);

export const CrownIcon: React.FC<IconProps> = ({ size = 18, className = '', strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M2 17L5 8L9.5 13L12 6L14.5 13L19 8L22 17H2Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round"/>
    <path d="M2 20H22" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"/>
  </svg>
);

export const CheckIcon: React.FC<IconProps> = ({ size = 20, className = '', strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17L4 12" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CheckCircleIcon: React.FC<IconProps> = ({ size = 40, className = '', strokeWidth = 1.5 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth={strokeWidth}/>
    <path d="M8 12L11 15L16 9" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const CopyIcon: React.FC<IconProps> = ({ size = 16, className = '', strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="9" y="9" width="13" height="13" rx="2" stroke="currentColor" strokeWidth={strokeWidth}/>
    <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" stroke="currentColor" strokeWidth={strokeWidth}/>
  </svg>
);

export const PlusIcon: React.FC<IconProps> = ({ size = 16, className = '', strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 5V19M5 12H19" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"/>
  </svg>
);

export const HistoryIcon: React.FC<IconProps> = ({ size = 18, className = '', strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M3 12C3 7.03 7.03 3 12 3C17 3 21 7.03 21 12C21 16.97 17 21 12 21" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"/>
    <path d="M3 12L6 9M3 12L6 15" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 7V12L15 14" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const ShuttleIcon: React.FC<IconProps> = ({ size = 20, className = '', strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="1" y="7" width="18" height="11" rx="2" stroke="currentColor" strokeWidth={strokeWidth}/>
    <path d="M19 11H22L23 15H19" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round"/>
    <circle cx="6" cy="18" r="2" stroke="currentColor" strokeWidth={strokeWidth}/>
    <circle cx="15" cy="18" r="2" stroke="currentColor" strokeWidth={strokeWidth}/>
    <path d="M1 11H19" stroke="currentColor" strokeWidth={strokeWidth}/>
    <path d="M6 7V11M11 7V11" stroke="currentColor" strokeWidth={strokeWidth}/>
  </svg>
);

export const KekeIcon: React.FC<IconProps> = ({ size = 20, className = '', strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M3 16V11C3 9.5 4 8 6 7L9 6H15L18 7C20 8 21 9.5 21 11V16" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round"/>
    <circle cx="7" cy="17" r="2" stroke="currentColor" strokeWidth={strokeWidth}/>
    <circle cx="17" cy="17" r="2" stroke="currentColor" strokeWidth={strokeWidth}/>
    <path d="M9 17H15" stroke="currentColor" strokeWidth={strokeWidth}/>
    <path d="M9 6V3M15 6V3" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"/>
  </svg>
);

export const MapPinIcon: React.FC<IconProps> = ({ size = 14, className = '', strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M21 10C21 17 12 23 12 23C12 23 3 17 3 10C3 5.03 7.03 1 12 1C16.97 1 21 5.03 21 10Z" stroke="currentColor" strokeWidth={strokeWidth}/>
    <circle cx="12" cy="10" r="3" stroke="currentColor" strokeWidth={strokeWidth}/>
  </svg>
);

export const SearchIcon: React.FC<IconProps> = ({ size = 18, className = '', strokeWidth = 1.8 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="8" stroke="currentColor" strokeWidth={strokeWidth}/>
    <path d="M21 21L16.65 16.65" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"/>
  </svg>
);

export const TicketIcon: React.FC<IconProps> = ({ size = 20, className = '', strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M15 5H3C2.45 5 2 5.45 2 6V10C3.1 10 4 10.9 4 12C4 13.1 3.1 14 2 14V18C2 18.55 2.45 19 3 19H15" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round"/>
    <path d="M15 5H21C21.55 5 22 5.45 22 6V10C20.9 10 20 10.9 20 12C20 13.1 20.9 14 22 14V18C22 18.55 21.55 19 21 19H15V5Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round"/>
    <line x1="15" y1="9" x2="15" y2="15" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeDasharray="2 2"/>
  </svg>
);

export const ShoppingBagIcon: React.FC<IconProps> = ({ size = 18, className = '', strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M6 2L3 6V20C3 21.1 3.9 22 5 22H19C20.1 22 21 21.1 21 20V6L18 2H6Z" stroke="currentColor" strokeWidth={strokeWidth} strokeLinejoin="round"/>
    <path d="M3 6H21" stroke="currentColor" strokeWidth={strokeWidth}/>
    <path d="M16 10C16 12.21 14.21 14 12 14C9.79 14 8 12.21 8 10" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"/>
  </svg>
);

export const ChevronDownIcon: React.FC<IconProps> = ({ size = 16, className = '', strokeWidth = 2 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M6 9L12 15L18 9" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const SignalIcon: React.FC<IconProps> = ({ size = 16, className = '', strokeWidth = 1.6 }) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M1 6C5.27 2.49 10.09 1 12 1C14 1 18.73 2.49 23 6" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"/>
    <path d="M5 10C7.5 7.83 9.67 7 12 7C14.33 7 16.5 7.83 19 10" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"/>
    <path d="M9 14C10 13.07 11 12.5 12 12.5C13 12.5 14 13.07 15 14" stroke="currentColor" strokeWidth={strokeWidth} strokeLinecap="round"/>
    <circle cx="12" cy="17" r="1.5" fill="currentColor"/>
  </svg>
);