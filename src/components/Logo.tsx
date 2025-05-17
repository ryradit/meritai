import Link from 'next/link';

const Logo = () => {
  return (
    <Link href="/" className="flex items-center space-x-2.5 group outline-none focus-visible:ring-2 focus-visible:ring-ring rounded-sm p-1 -m-1">
      <svg 
        width="36" 
        height="36" 
        viewBox="0 0 100 100" 
        xmlns="http://www.w3.org/2000/svg" 
        className="group-hover:opacity-90 transition-opacity duration-200"
      >
        <defs>
          <linearGradient id="logoGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            {/* Use CSS variables that change with the theme */}
            <stop offset="0%" style={{ stopColor: 'hsl(var(--primary))' }} />
            <stop offset="100%" style={{ stopColor: 'hsl(var(--accent))' }} />
          </linearGradient>
        </defs>
        {/* Main shape with gradient fill - ensure fill uses the gradient */}
        <path d="M10 85 L50 15 L90 85 L75 85 L50 45 L25 85 Z" fill="url(#logoGradient)" strokeWidth="0" />
        {/* Subtle inner stroke using a contrasting color for better visibility on dark/light themes */}
        <path d="M10 85 L50 15 L90 85" fill="none" stroke="hsl(var(--background))" strokeOpacity="0.2" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
      <span 
        className="text-3xl font-extrabold tracking-tight bg-clip-text text-transparent 
                   bg-gradient-to-r from-primary to-accent 
                   group-hover:opacity-90 transition-opacity duration-200"
      >
        Merit AI
      </span>
    </Link>
  );
};

export default Logo;
