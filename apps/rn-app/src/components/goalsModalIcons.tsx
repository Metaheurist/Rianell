import React from 'react';
import Svg, { Circle, Line, Path } from 'react-native-svg';

const STROKE = 1.75;

export function TargetBullseyeIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Circle cx="12" cy="12" r="9" stroke={color} strokeWidth={STROKE} fill="none" />
      <Circle cx="12" cy="12" r="5" stroke={color} strokeWidth={STROKE} fill="none" />
      <Circle cx="12" cy="12" r="1.5" fill={color} />
      <Line x1="12" y1="2" x2="12" y2="3" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Line x1="12" y1="21" x2="12" y2="22" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Line x1="2" y1="12" x2="3" y2="12" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
      <Line x1="21" y1="12" x2="22" y2="12" stroke={color} strokeWidth={STROKE} strokeLinecap="round" />
    </Svg>
  );
}

export function MedalIcon({ color, size = 16 }: { color: string; size?: number }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24" accessibilityElementsHidden>
      <Path
        d="M9 2 7 7"
        stroke={color}
        strokeWidth={STROKE}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M15 2 17 7"
        stroke={color}
        strokeWidth={STROKE}
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <Path
        d="M7 7h10"
        stroke={color}
        strokeWidth={STROKE}
        fill="none"
        strokeLinecap="round"
      />
      <Circle cx="12" cy="15" r="6" stroke={color} strokeWidth={STROKE} fill="none" />
      <Path
        d="M12 12.2 12.9 14.1 15 14.3 13.5 15.7 13.9 17.8 12 16.8 10.1 17.8 10.5 15.7 9 14.3 11.1 14.1Z"
        fill={color}
      />
    </Svg>
  );
}
