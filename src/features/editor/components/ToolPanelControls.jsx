import React from 'react';

export function ToolPanelRow({ children, className = '' }) {
  return (
    <div className={`tool-panel-row ${className}`.trim()}>
      {children}
    </div>
  );
}

export function ToolPanelSegment({ children, className = '', ariaLabel }) {
  return (
    <div className={`tool-panel-segment ${className}`.trim()} role="group" aria-label={ariaLabel}>
      {children}
    </div>
  );
}

export function ToolPanelSegmentButton({ active = false, label, children, onClick }) {
  return (
    <button
      type="button"
      className={`tool-panel-segment-btn${active ? ' active' : ''}`}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

export function ToolPanelColorButton({ active = false, color, label, onClick, extraStyle }) {
  return (
    <button
      type="button"
      className={`tool-panel-color-btn${active ? ' active' : ''}`}
      aria-label={label}
      title={label}
      style={{ background: color, ...extraStyle }}
      onClick={onClick}
    />
  );
}

export function ToolPanelColorPicker({ active = false, color, inputValue, onChange }) {
  return (
    <label className={`tool-panel-color-picker${active ? ' active' : ''}`} aria-label="Custom color" title="Custom color">
      <span className="tool-panel-color-picker-dot" style={{ background: color }} aria-hidden="true" />
      <input type="color" value={inputValue} onChange={onChange} />
    </label>
  );
}
