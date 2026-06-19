import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import Svg, { Circle, Line, Polygon, Text as SvgText } from 'react-native-svg';

export type RadarPoint = { label: string; value: number };

type Props = {
  points: RadarPoint[];
  color?: string;
  size?: number;
  textColor?: string;
  a11yLabel?: string;
};

/** Plan 09 C3 — RN spider/radar balance chart (PWA Apex radar parity). */
export function BalanceRadarChart({
  points,
  color = '#4caf50',
  size = 260,
  textColor = '#e0f2f1',
  a11yLabel = 'Balance radar chart',
}: Props) {
  const geometry = useMemo(() => {
    if (points.length < 3) return null;
    const cx = size / 2;
    const cy = size / 2;
    const maxR = size * 0.34;
    const count = points.length;
    const angleAt = (i: number) => -Math.PI / 2 + (i * 2 * Math.PI) / count;
    const at = (i: number, radius: number) => {
      const a = angleAt(i);
      return { x: cx + radius * Math.cos(a), y: cy + radius * Math.sin(a) };
    };
    const rings = [0.25, 0.5, 0.75, 1].map((frac) =>
      Array.from({ length: count }, (_, i) => at(i, maxR * frac))
    );
    const axes = Array.from({ length: count }, (_, i) => ({ from: { x: cx, y: cy }, to: at(i, maxR) }));
    const data = points.map((p, i) => at(i, (Math.max(0, Math.min(10, p.value)) / 10) * maxR));
    const labelPos = points.map((p, i) => at(i, maxR + 18));
    return { cx, cy, rings, axes, data, labelPos };
  }, [points, size]);

  if (!geometry) return null;

  return (
    <View style={styles.wrap} accessibilityLabel={a11yLabel}>
      <Svg width={size} height={size}>
        {geometry.rings.map((ring, ri) => (
          <Polygon
            key={`ring-${ri}`}
            points={ring.map((p) => `${p.x},${p.y}`).join(' ')}
            fill="none"
            stroke="rgba(255,255,255,0.15)"
            strokeWidth={1}
          />
        ))}
        {geometry.axes.map((axis, i) => (
          <Line
            key={`axis-${i}`}
            x1={axis.from.x}
            y1={axis.from.y}
            x2={axis.to.x}
            y2={axis.to.y}
            stroke="rgba(255,255,255,0.12)"
            strokeWidth={1}
          />
        ))}
        <Polygon
          points={geometry.data.map((p) => `${p.x},${p.y}`).join(' ')}
          fill={`${color}44`}
          stroke={color}
          strokeWidth={2}
        />
        {geometry.data.map((p, i) => (
          <Circle key={`dot-${i}`} cx={p.x} cy={p.y} r={3} fill={color} />
        ))}
        {points.map((p, i) => (
          <SvgText
            key={`lbl-${i}`}
            x={geometry.labelPos[i].x}
            y={geometry.labelPos[i].y}
            fill={textColor}
            fontSize={10}
            fontWeight="600"
            textAnchor="middle"
            alignmentBaseline="middle"
          >
            {p.label.length > 14 ? `${p.label.slice(0, 13)}…` : p.label}
          </SvgText>
        ))}
      </Svg>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    alignItems: 'center',
    marginVertical: 8,
  },
});
