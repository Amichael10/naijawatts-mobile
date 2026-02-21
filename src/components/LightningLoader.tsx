import { useEffect, useState } from 'react';

const BOLT_PATH = "M 52 0 L 20 75 L 48 75 L 28 140 L 95 55 L 62 55 L 80 0 Z";

interface LightningLoaderProps {
  onComplete: () => void;
  text?: string;
}

export default function LightningLoader({ onComplete, text = 'Calculating' }: LightningLoaderProps) {
  const [dots, setDots] = useState('.');
  const [fadeOut, setFadeOut] = useState(false);

  useEffect(() => {
    const dotInterval = setInterval(() => {
      setDots(prev => prev.length >= 3 ? '.' : prev + '.');
    }, 400);

    const fadeTimer = setTimeout(() => setFadeOut(true), 3000);
    const doneTimer = setTimeout(onComplete, 3300);

    return () => {
      clearInterval(dotInterval);
      clearTimeout(fadeTimer);
      clearTimeout(doneTimer);
    };
  }, [onComplete]);

  return (
    <div
      className="fixed inset-0 z-50 flex flex-col items-center justify-center"
      style={{
        backgroundColor: '#111111',
        opacity: fadeOut ? 0 : 1,
        transition: 'opacity 0.3s ease',
      }}
    >
      <svg
        width="120"
        height="180"
        viewBox="0 0 120 140"
        xmlns="http://www.w3.org/2000/svg"
        style={{ filter: 'drop-shadow(0 0 8px #C8F135)' }}
      >
        <defs>
          {/* Bolt shape clip */}
          <clipPath id="bolt-clip">
            <path d={BOLT_PATH} />
          </clipPath>

          {/* Rising liquid clip with wave */}
          <clipPath id="liquid-clip">
            <path id="liquid-wave">
              <animate
                attributeName="d"
                dur="3s"
                fill="freeze"
                values={`
                  M -10 150 Q 20 150 40 150 Q 60 150 80 150 Q 100 150 130 150 L 130 200 L -10 200 Z;
                  M -10 0 Q 20 -6 40 0 Q 60 6 80 0 Q 100 -6 130 0 L 130 200 L -10 200 Z
                `}
              />
              {/* Horizontal wave motion */}
              <animate
                attributeName="d"
                dur="0.8s"
                begin="0s"
                repeatCount="indefinite"
                values={`
                  M -10 0 Q 20 -6 40 0 Q 60 6 80 0 Q 100 -6 130 0 L 130 200 L -10 200 Z;
                  M -10 0 Q 20 6 40 0 Q 60 -6 80 0 Q 100 6 130 0 L 130 200 L -10 200 Z;
                  M -10 0 Q 20 -6 40 0 Q 60 6 80 0 Q 100 -6 130 0 L 130 200 L -10 200 Z
                `}
                additive="sum"
              />
            </path>
          </clipPath>
        </defs>

        {/* Filled liquid inside bolt */}
        <g clipPath="url(#bolt-clip)">
          <rect
            x="0" y="0" width="120" height="200"
            fill="#C8F135"
            fillOpacity="0.9"
            clipPath="url(#liquid-clip)"
          />
          {/* Bubbles */}
          <circle cx="45" cy="120" r="3" fill="white" fillOpacity="0.6">
            <animate attributeName="cy" from="120" to="20" dur="2s" begin="0.5s" fill="freeze" />
            <animate attributeName="opacity" from="0.6" to="0" dur="2s" begin="0.5s" fill="freeze" />
          </circle>
          <circle cx="65" cy="110" r="2" fill="white" fillOpacity="0.6">
            <animate attributeName="cy" from="110" to="15" dur="2.2s" begin="1s" fill="freeze" />
            <animate attributeName="opacity" from="0.6" to="0" dur="2.2s" begin="1s" fill="freeze" />
          </circle>
          <circle cx="55" cy="100" r="4" fill="white" fillOpacity="0.6">
            <animate attributeName="cy" from="100" to="10" dur="1.8s" begin="1.5s" fill="freeze" />
            <animate attributeName="opacity" from="0.6" to="0" dur="1.8s" begin="1.5s" fill="freeze" />
          </circle>
        </g>

        {/* Bolt outline with glow */}
        <path
          d={BOLT_PATH}
          fill="none"
          stroke="#C8F135"
          strokeWidth="3"
          strokeLinejoin="round"
        >
          <animate
            attributeName="filter"
            dur="3s"
            values="drop-shadow(0 0 4px #C8F135);drop-shadow(0 0 16px #C8F135)"
            fill="freeze"
          />
        </path>
      </svg>

      {/* Text */}
      <p
        className="mt-6 font-display font-medium"
        style={{
          color: '#C8F135',
          fontSize: '16px',
          animation: 'fade-in 0.3s ease-out 0.5s both',
        }}
      >
        {text}{dots}
      </p>
    </div>
  );
}
