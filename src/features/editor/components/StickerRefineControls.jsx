import React from 'react';
import OpacitySlider from './OpacitySlider.jsx';

export default function StickerRefineControls({
  refMode,
  opacity,
  opacitySliderRef,
  opacityValueRef,
  idPrefix = 'Ns',
  opacityInputId = 'nsOpacitySlider',
  opacityValueId = 'nsOpacityVal',
  applyLabel = 'Add Sticker',
  applyClassName = 'ns-pri',
  onRefMode,
  onOpacityInput,
  onApply,
}) {
  return (
    <>
      <div className="magic-toggle">
        <button
          type="button"
          className={`magic-toggle-btn${refMode === 'pen' ? ' on' : ''}`}
          id={`btn${idPrefix}Mark`}
          onClick={() => onRefMode('pen')}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke-width)" strokeLinecap="round">
            <line x1="12" y1="4" x2="12" y2="20" />
            <line x1="4" y1="12" x2="20" y2="12" />
          </svg>
          Mark
        </button>
        <button
          type="button"
          className={`magic-toggle-btn${refMode === 'erase' ? ' on' : ''}`}
          id={`btn${idPrefix}Clear`}
          onClick={() => onRefMode('erase')}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke-width)" strokeLinecap="round">
            <line x1="4" y1="12" x2="20" y2="12" />
          </svg>
          Clear
        </button>
      </div>
      <OpacitySlider
        className="magic-opacity-row"
        inputId={opacityInputId}
        inputRef={opacitySliderRef}
        valueId={opacityValueId}
        valueRef={opacityValueRef}
        valueLabel={`${opacity}%`}
        min="10"
        max="100"
        value={opacity}
        style={{ flex: 1, '--fill': `${opacity}%` }}
        onInput={onOpacityInput}
        onChange={onOpacityInput}
      />
      <button type="button" className={applyClassName} id={`btn${idPrefix}Apply`} onClick={onApply}>
        {applyLabel}
      </button>
    </>
  );
}
