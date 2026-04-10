export function YinYangIcon({ size = 20, color = 'currentColor' }: { size?: number; color?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={color} xmlns="http://www.w3.org/2000/svg" aria-hidden="true" style={{ flexShrink: 0 }}>
      <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm0 1.5a8.5 8.5 0 0 1 0 17c-2.347 0-4.25-1.903-4.25-4.25S9.653 12 12 12s4.25-1.903 4.25-4.25S14.347 3.5 12 3.5zm0 2.75a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3zm0 8.5a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>
    </svg>
  )
}
