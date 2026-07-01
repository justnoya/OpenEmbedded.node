interface AgentIconProps {
  size?: number;
  color?: string;
  style?: React.CSSProperties;
}

export function AgentIcon({ size = 16, color = "currentColor", style }: AgentIconProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={style}
      aria-hidden="true"
    >
      <path
        d="M50 4
           C 49 18 40 36 36.5 39.5
           C 33 43 16 49 4 50
           C 16 51 33 57 36.5 60.5
           C 40 64 49 82 50 96
           C 51 82 60 64 63.5 60.5
           C 67 57 84 51 96 50
           C 84 49 67 43 63.5 39.5
           C 60 36 51 18 50 4 Z"
        fill={color}
      />
    </svg>
  );
}
