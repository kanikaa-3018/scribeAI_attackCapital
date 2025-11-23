import React from 'react';

interface IconProps {
  size?: number;
  className?: string;
  color?: string;
}

export const MicrophoneIcon = ({ size = 24, className = '', color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="9" y="3" width="6" height="11" rx="3" stroke={color} strokeWidth="2" fill="none"/>
    <path d="M5 10v2a7 7 0 0 0 14 0v-2" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <line x1="12" y1="19" x2="12" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <line x1="8" y1="21" x2="16" y2="21" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const SparkleIcon = ({ size = 24, className = '', color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2L13.5 8.5L20 10L13.5 11.5L12 18L10.5 11.5L4 10L10.5 8.5L12 2Z" fill={color}/>
    <path d="M19 3L19.5 5.5L22 6L19.5 6.5L19 9L18.5 6.5L16 6L18.5 5.5L19 3Z" fill={color}/>
    <path d="M19 15L19.5 17.5L22 18L19.5 18.5L19 21L18.5 18.5L16 18L18.5 17.5L19 15Z" fill={color}/>
  </svg>
);

export const RocketIcon = ({ size = 24, className = '', color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C12 2 7 4 7 10v5c0 1.5-1 2-2 3 1 1 4 1 7 1s6 0 7-1c-1-1-2-1.5-2-3v-5c0-6-5-8-5-8Z" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    <path d="M12 19v3M9 22h6M12 11a1 1 0 1 0 0-2 1 1 0 0 0 0 2Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const DocumentIcon = ({ size = 24, className = '', color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8l-6-6Z" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    <path d="M14 2v6h6M16 13H8M16 17H8M10 9H8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const LockIcon = ({ size = 24, className = '', color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="5" y="11" width="14" height="10" rx="2" stroke={color} strokeWidth="2"/>
    <path d="M7 11V7a5 5 0 0 1 10 0v4" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="16" r="1.5" fill={color}/>
  </svg>
);

export const TrashIcon = ({ size = 24, className = '', color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M3 6h18M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <line x1="10" y1="11" x2="10" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <line x1="14" y1="11" x2="14" y2="17" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const PlayIcon = ({ size = 24, className = '', color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M8 5v14l11-7L8 5Z" fill={color} stroke={color} strokeWidth="2" strokeLinejoin="round"/>
  </svg>
);

export const PauseIcon = ({ size = 24, className = '', color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="4" width="4" height="16" rx="1" fill={color}/>
    <rect x="14" y="4" width="4" height="16" rx="1" fill={color}/>
  </svg>
);

export const StopIcon = ({ size = 24, className = '', color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="6" width="12" height="12" rx="2" fill={color}/>
  </svg>
);

export const RobotIcon = ({ size = 24, className = '', color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <rect x="6" y="10" width="12" height="10" rx="2" stroke={color} strokeWidth="2"/>
    <circle cx="9" cy="14" r="1" fill={color}/>
    <circle cx="15" cy="14" r="1" fill={color}/>
    <path d="M9 17h6M12 4v6" stroke={color} strokeWidth="2" strokeLinecap="round"/>
    <circle cx="12" cy="3" r="1" fill={color}/>
    <path d="M6 13H4M18 13h2" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const SaveIcon = ({ size = 24, className = '', color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2Z" stroke={color} strokeWidth="2" strokeLinejoin="round"/>
    <path d="M17 21v-8H7v8M7 3v5h8" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const SearchIcon = ({ size = 24, className = '', color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="11" cy="11" r="8" stroke={color} strokeWidth="2"/>
    <path d="m21 21-4.35-4.35" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const ChartIcon = ({ size = 24, className = '', color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M3 3v18h18" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M7 16v-6M12 16V8M17 16v-4" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const BoltIcon = ({ size = 24, className = '', color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M13 2L3 14h8l-1 8 10-12h-8l1-8Z" fill={color} stroke={color} strokeWidth="2" strokeLinejoin="round"/>
  </svg>
);

export const PaletteIcon = ({ size = 24, className = '', color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M12 2C6.5 2 2 6.5 2 12s4.5 10 10 10c.9 0 2-.5 2-2 0-.5-.2-.9-.5-1.3-.2-.4-.4-.7-.4-1.2 0-.8.7-1.5 1.5-1.5H17c2.8 0 5-2.2 5-5 0-4.9-4.5-9-10-9Z" stroke={color} strokeWidth="2"/>
    <circle cx="7" cy="12" r="1.5" fill={color}/>
    <circle cx="12" cy="8" r="1.5" fill={color}/>
    <circle cx="17" cy="12" r="1.5" fill={color}/>
  </svg>
);

export const UserIcon = ({ size = 24, className = '', color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="8" r="5" stroke={color} strokeWidth="2"/>
    <path d="M3 21c0-4.4 4-8 9-8s9 3.6 9 8" stroke={color} strokeWidth="2" strokeLinecap="round"/>
  </svg>
);

export const DownloadIcon = ({ size = 24, className = '', color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4M7 10l5 5 5-5M12 15V3" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const GlobeIcon = ({ size = 24, className = '', color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
    <path d="M2 12h20M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10Z" stroke={color} strokeWidth="2"/>
  </svg>
);

export const DocumentWriteIcon = ({ size = 24, className = '', color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5Z" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const WarningIcon = ({ size = 24, className = '', color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M12 9v4" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="12" cy="17" r="1" fill={color}/>
  </svg>
);

export const CheckIcon = ({ size = 24, className = '', color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M20 6L9 17l-5-5" stroke={color} strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const HourglassIcon = ({ size = 24, className = '', color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M6 2h12M6 22h12" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 2v6a4 4 0 0 0 4 4 4 4 0 0 0 4-4V2" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M8 22v-6a4 4 0 0 0 4-4 4 4 0 0 0 4 4v6" stroke={color} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const TagIcon = ({ size = 24, className = '', color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M20.59 13.41L12 4.83a2 2 0 0 0-2.83 0L3.41 11.59a2 2 0 0 0 0 2.83l8.59 8.59a2 2 0 0 0 2.83 0l6.76-6.76a2 2 0 0 0 0-2.83z" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
    <circle cx="7.5" cy="7.5" r="1.2" fill={color}/>
  </svg>
);

export const InfoIcon = ({ size = 24, className = '', color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <circle cx="12" cy="12" r="10" stroke={color} strokeWidth="2"/>
    <path d="M12 8h.01M11 12h2v4h-2z" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);

export const VolumeIcon = ({ size = 24, className = '', color = 'currentColor' }: IconProps) => (
  <svg width={size} height={size} viewBox="0 0 24 24" fill="none" className={className} xmlns="http://www.w3.org/2000/svg">
    <path d="M11 5L6 9H2v6h4l5 4V5z" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M19 9a5 5 0 0 1 0 6" stroke={color} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>
);
