// app/components/SoundButton.tsx
'use client'; // Add this directive for client-side hooks

import React from 'react';
import useSound from 'use-sound';

// Define props interface for type safety
interface SoundButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

const SoundButton: React.FC<SoundButtonProps> = ({ children, onClick, className, disabled = false, ...props }) => {
  const [playClick] = useSound('/audio/Click.wav');
  const [playHover] = useSound('/audio/Hover.wav', { volume: 0.5, interrupt: true }); // interrupt: true stops previous hover sound

  const handleClick = (e: React.MouseEvent<HTMLButtonElement>) => {
    if (!disabled) {
      playClick();
      if (onClick) {
        onClick(e); // Call original onClick if it exists
      }
    }
  };

  const handleMouseEnter = () => {
    if (!disabled) {
      playHover();
    }
  };

  return (
    <button
      className={className}
      onClick={handleClick}
      onMouseEnter={handleMouseEnter}
      disabled={disabled}
      {...props} // Pass down any other props (like type="submit")
    >
      {children}
    </button>
  );
};

export default SoundButton;