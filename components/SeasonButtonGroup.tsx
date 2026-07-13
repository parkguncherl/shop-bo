import React from 'react';

const SEASONS = [
  { value: 'spring', label: '봄' },
  { value: 'summer', label: '여름' },
  { value: 'autumn', label: '가을' },
  { value: 'winter', label: '겨울' },
] as const;

type SeasonValue = (typeof SEASONS)[number]['value'];

interface Props {
  value?: string[];
  onChange?: (value: string[]) => void;
}

const baseStyle: React.CSSProperties = {
  padding: '0 14px',
  height: 32,
  fontSize: 13,
  fontWeight: 500,
  border: '1px solid var(--dark-border, #d9d9d9)',
  cursor: 'pointer',
  transition: 'background 0.2s, color 0.2s',
  marginLeft: -1,
  position: 'relative',
};

const activeStyle: React.CSSProperties = {
  ...baseStyle,
  background: 'var(--purple, #4b5563)',
  color: '#fff',
  borderColor: 'var(--purple, #4b5563)',
  zIndex: 1,
};

const inactiveStyle: React.CSSProperties = {
  ...baseStyle,
  background: 'var(--dark-surface-2, #f3f4f6)',
  color: 'var(--dark-text, #6b7280)',
  borderColor: 'var(--dark-border, #d9d9d9)',
};

const SeasonButtonGroup = ({ value = [], onChange }: Props) => {
  const toggle = (season: SeasonValue) => {
    const next = value.includes(season) ? value.filter((v) => v !== season) : [...value, season];
    onChange?.(next);
  };

  return (
    <div style={{ display: 'inline-flex' }}>
      {SEASONS.map((s, i) => (
        <button
          key={s.value}
          type="button"
          onClick={() => toggle(s.value)}
          style={{
            ...(value.includes(s.value) ? activeStyle : inactiveStyle),
            borderRadius: i === 0 ? '6px 0 0 6px' : i === SEASONS.length - 1 ? '0 6px 6px 0' : 0,
          }}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
};

export default SeasonButtonGroup;
