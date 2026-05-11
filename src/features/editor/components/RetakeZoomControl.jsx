import React from 'react';

function formatZoomLabel(option, active) {
  if (option === 0.5) return '.5';
  if (option === 1 && active) return '1x';
  return option;
}

export default function RetakeZoomControl({
  visible,
  zoomOptions,
  zoomMode,
  onZoom,
  className = '',
}) {
  if (!zoomOptions.length) return null;

  return (
    <div className={`retake-zoom-control${visible ? ' visible' : ''}${className ? ` ${className}` : ''}`} role="group" aria-label="Camera zoom">
      {zoomOptions.map((option) => {
        const active = zoomMode === option;
        return (
          <button
            type="button"
            className={`retake-zoom-option${active ? ' solid-surface active' : ''}`}
            key={option}
            aria-pressed={active}
            onClick={() => onZoom(option)}
          >
            {formatZoomLabel(option, active)}
          </button>
        );
      })}
    </div>
  );
}
