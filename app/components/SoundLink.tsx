// app/components/SoundLink.tsx
'use client'; // Add this directive for client-side hooks

import React from 'react';
import Link, { LinkProps } from 'next/link'; // Import LinkProps
import useSound from 'use-sound';

// Define props interface combining LinkProps and custom ones
interface SoundLinkProps extends LinkProps {
  children: React.ReactNode;
  className?: string; // className might not be in LinkProps by default
}

const SoundLink: React.FC<SoundLinkProps> = ({ children, href, className, onClick, ...props }) => {
  const [playClick] = useSound('/audio/Click.wav');
  const [playHover] = useSound('/audio/Hover.wav', { volume: 0.5, interrupt: true });

  const handleClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    playClick();
    if (onClick) {
      onClick(e); // Call original onClick if it exists
    }
    // Navigation will proceed via the Link's default behavior
  };

  const handleMouseEnter = () => {
    playHover();
  };

  return (
    <Link
      href={href}
      className={className}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
       // onMouseLeave={stopHover} // Optional
      {...props} // Pass down any other props
    >
      {children}
    </Link>
  );
};

export default SoundLink;