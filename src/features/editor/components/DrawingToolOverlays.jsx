import React from 'react';
import Button from '../../../components/ui/Button.jsx';
import GlassIconButton from '../../../components/ui/GlassIconButton.jsx';
import SolidIconButton from '../../../components/ui/SolidIconButton.jsx';
import SolidSurface from '../../../components/ui/SolidSurface.jsx';
import ToolIcon from '../../../components/icons/ToolIcon.jsx';
import OpacitySlider from './OpacitySlider.jsx';
import SelectionModeButtons from './SelectionModeButtons.jsx';
import StickerRefineControls from './StickerRefineControls.jsx';
import {
  ToolPanelColorButton,
  ToolPanelColorPicker,
  ToolPanelRow,
  ToolPanelSegment,
  ToolPanelSegmentButton,
} from './ToolPanelControls.jsx';

const SWATCH_COLORS = [
  { color: '#FFFFFF', label: 'White' },
  { color: '#1A1A2E', label: 'Black' },
  { color: '#F0E84A', label: 'Yellow' },
  { color: '#FF3B30', label: 'Red' },
  { color: '#6A00FF', label: 'Purple' },
  { color: '#00C2A8', label: 'Teal' },
];

function colorInputValue(color) {
  return /^#[0-9a-f]{6}$/i.test(color) ? color : '#ffffff';
}

function PenGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <circle cx="8" cy="8" r="4" fill="currentColor" />
    </svg>
  );
}

function PencilGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="6" y="1" width="4" height="10" rx="1.5" fill="currentColor" />
      <polygon points="6,11 10,11 8,15" fill="currentColor" />
    </svg>
  );
}

function MarkerGlyph() {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" aria-hidden="true">
      <rect x="1" y="6" width="14" height="4" rx="2" fill="currentColor" />
    </svg>
  );
}

/**
 * DrawingToolOverlays — the shared tool-mode UI that appears when the user
 * is drawing on the canvas:
 *   • Undo / redo buttons
 *   • "Done" pill button
 *   • Left size-track panel
 *   • Pen bar (color swatches + pen type buttons)
 *
 * InviterPage renders extra eraser-specific UI after this component.
 */
export default function DrawingToolOverlays({
  tmLeftPanelRef,
  tmSizeHandleRef,
  tmIn,
  tmLeftIn,
  tmPenBarIn,
  tmMagicPenBarIn,
  doodleColor,
  doodleMode = 'draw',
  doodleOpacity = 100,
  penType,
  magicPenMode = 'freehand',
  magicPenOpacity = 100,
  magicSelectPhase = 'lasso',
  magicSelectConfirmDisabled = true,
  magicSelectDetecting = false,
  magicSelectRefMode = 'pen',
  tmUndoBtnDisabled,
  tmRedoBtnDisabled,
  onDone,
  onUndo,
  onRedo,
  onSwatchClick,
  onDoodleModeClick,
  onColorPickerChange,
  onDoodleOpacityInput,
  onPenTypeClick,
  onMagicPenModeClick,
  onMagicPenOpacityInput,
  onMagicSelectBack,
  onMagicSelectConfirm,
  onMagicSelectRefMode,
  onMagicSelectApply,
}) {
  const selectedSwatch = SWATCH_COLORS.some(({ color }) => color.toUpperCase() === doodleColor.toUpperCase());

  return (
    <>
      {/* ── Undo / redo ── */}
      <div id="tmUndoRedo" className={`tool-mode-el${tmIn ? ' tm-in' : ''}`}>
        <GlassIconButton className="history-btn" id="tmBtnUndo" icon="undo" label="Undo"
          contained={false} disabled={tmUndoBtnDisabled} onClick={onUndo} />
        <GlassIconButton className="history-btn" id="tmBtnRedo" icon="redo" label="Redo"
          contained={false} disabled={tmRedoBtnDisabled} onClick={onRedo} />
      </div>

      {/* ── Done pill ── */}
      <button
        id="tmDoneBtn"
        className={`tool-mode-el${tmIn ? ' tm-in' : ''}`}
        aria-label="Done"
        onClick={onDone}
      >
        <ToolIcon type="check" />
      </button>

      {magicPenMode === 'magic' && (
        <button
          id="tmBackBtn"
          className={`tool-mode-el${tmIn ? ' tm-in' : ''}`}
          aria-label="Back"
          onClick={onMagicSelectBack || (() => onMagicPenModeClick?.('freehand'))}
        >
          <ToolIcon type="arrowLeft" />
        </button>
      )}

      {/* ── Left size-track panel ── */}
      <div id="tmLeftPanel" ref={tmLeftPanelRef} className={tmLeftIn ? 'tm-in' : ''}>
        <div id="tmTrackTop"></div>
        <div id="tmTrackBottom"></div>
        <div id="tmSizeHandle" ref={tmSizeHandleRef}></div>
      </div>

      {/* ── Pen bar ── */}
      <div id="tmPenBar" className={`tm-pen-panel${tmPenBarIn ? ' tm-in' : ''}`}>
        <ToolPanelRow>
          <ToolPanelSegment ariaLabel="Drawing mode">
            <ToolPanelSegmentButton
              active={doodleMode === 'draw'}
              label="Draw"
              onClick={() => onDoodleModeClick?.('draw')}
            >
              <ToolIcon type="draw" />
            </ToolPanelSegmentButton>
            <ToolPanelSegmentButton
              active={doodleMode === 'erase'}
              label="Erase"
              onClick={() => onDoodleModeClick?.('erase')}
            >
              <ToolIcon type="eraser" />
            </ToolPanelSegmentButton>
          </ToolPanelSegment>

          <div className="tm-divider" />

          <OpacitySlider
            inline
            inputId="doodleOpacitySlider"
            valueClassName="tm-val"
            value={doodleOpacity}
            valueLabel={`${doodleOpacity}%`}
            min={5}
            max={100}
            style={{ flex: 1, '--fill': `${doodleOpacity}%` }}
            onInput={onDoodleOpacityInput}
            onChange={onDoodleOpacityInput}
          />
        </ToolPanelRow>

        <ToolPanelRow>
          <div className="tool-panel-colors">
            {SWATCH_COLORS.map(({ color, label }) => (
              <ToolPanelColorButton
                key={color}
                active={doodleColor.toUpperCase() === color.toUpperCase()}
                color={color}
                label={label}
                extraStyle={color === '#1A1A2E' ? {
                  boxShadow: '0 1px 5px rgba(0,0,0,0.7), inset 0 0 0 1.5px rgba(255,255,255,0.22)',
                } : undefined}
                onClick={() => onSwatchClick(color)}
              />
            ))}
            <ToolPanelColorPicker
              active={!selectedSwatch}
              color={doodleColor}
              inputValue={colorInputValue(doodleColor)}
              onChange={onColorPickerChange}
            />
          </div>

          <div className="tm-divider" />

          <ToolPanelSegment ariaLabel="Pen type">
            <ToolPanelSegmentButton active={penType === 'pen'} label="Pen" onClick={() => onPenTypeClick('pen')}>
              <PenGlyph />
            </ToolPanelSegmentButton>
            <ToolPanelSegmentButton active={penType === 'pencil'} label="Pencil" onClick={() => onPenTypeClick('pencil')}>
              <PencilGlyph />
            </ToolPanelSegmentButton>
            <ToolPanelSegmentButton active={penType === 'marker'} label="Marker" onClick={() => onPenTypeClick('marker')}>
              <MarkerGlyph />
            </ToolPanelSegmentButton>
          </ToolPanelSegment>
        </ToolPanelRow>
      </div>

      {/* ── Magic Pen bar ── */}
      <div id="tmMagicPenBar" className={`${tmMagicPenBarIn ? 'tm-in' : ''}${magicPenMode === 'magic' ? ' magic-select-mode' : ''}`}>
        {magicPenMode === 'magic' ? (
          magicSelectPhase === 'refine' ? (
            <StickerRefineControls
              idPrefix="MagicPen"
              opacityInputId="magicPenOpacitySlider"
              opacityValueId="magicPenOpacityVal"
              applyLabel="Apply"
              applyClassName="magic-apply-btn"
              refMode={magicSelectRefMode}
              opacity={magicPenOpacity}
              onRefMode={onMagicSelectRefMode}
              onOpacityInput={onMagicPenOpacityInput}
              onApply={onMagicSelectApply}
            />
          ) : (
            <div className="magic-step">
              <span className="magic-action-hint">
                {magicSelectPhase === 'detecting' || magicSelectDetecting ? 'Finding the area...' : 'Draw around the area to make transparent'}
              </span>
              <SolidSurface className="magic-action-row" role="group" aria-label="Transparent pen smart selection actions">
                <SolidIconButton
                  className="magic-back-btn"
                  icon="arrowLeft"
                  label="Back"
                  onClick={onMagicSelectBack || (() => onMagicPenModeClick?.('freehand'))}
                />
                <Button
                  className="magic-confirm-btn"
                  variant={null}
                  material="solid-yellow"
                  disabled={magicSelectConfirmDisabled || magicSelectDetecting || magicSelectPhase === 'detecting'}
                  onClick={onMagicSelectConfirm}
                >
                  {magicSelectPhase === 'detecting' || magicSelectDetecting ? 'Detecting...' : 'Confirm'}
                </Button>
              </SolidSurface>
            </div>
          )
        ) : (
          <>
            <div className="eraser-shapes">
              <SelectionModeButtons
                mode={magicPenMode}
                modes={['freehand', 'circle', 'rect', 'magic']}
                onModeClick={onMagicPenModeClick}
              />
            </div>
            <div className="tm-divider"></div>
            <OpacitySlider
              inline
              inputId="magicPenOpacitySlider"
              valueClassName="tm-val"
              value={magicPenOpacity}
              valueLabel={`${magicPenOpacity}%`}
              min={5}
              max={100}
              style={{ '--fill': `${magicPenOpacity}%` }}
              onInput={onMagicPenOpacityInput}
              onChange={onMagicPenOpacityInput}
            />
          </>
        )}
      </div>
    </>
  );
}
