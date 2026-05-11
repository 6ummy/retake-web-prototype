import React from 'react';
import GlassSurface from '../../../components/ui/GlassSurface.jsx';
import SolidIconButton from '../../../components/ui/SolidIconButton.jsx';

export default function RetakeCameraBottomBar({
  visible,
  out,
  review,
  title,
  titleLabel = 'Frame name',
  leftIcon = 'arrowLeft',
  leftLabel,
  onLeft,
  onTitle,
  secondaryIcon = 'library',
  secondaryLabel = 'Saved frames',
  onSecondary,
  primaryIcon = 'share',
  primaryLabel,
  onPrimary,
  showSecondary = true,
}) {
  if (!visible) return null;

  return (
    <GlassSurface className={`retake-camera-bottom-bar visible${out ? ' out' : ''}`}>
      <SolidIconButton
        className={review ? 'retake-camera-retake-btn' : 'retake-camera-circle-btn'}
        icon={leftIcon}
        label={leftLabel}
        shape={review ? 'pill' : 'circle'}
        onClick={onLeft}
      >
        {review ? <span className="retake-camera-retake-label">Retake</span> : null}
      </SolidIconButton>
      <button
        type="button"
        className="retake-camera-title-btn"
        aria-label={titleLabel}
        onClick={onTitle}
      >
        <span className="retake-camera-title-text">{title}</span>
      </button>
      <div className="retake-camera-bottom-actions">
        {showSecondary && (
          <SolidIconButton
            className="retake-camera-circle-btn"
            icon={secondaryIcon}
            label={secondaryLabel}
            onClick={onSecondary}
          />
        )}
        <SolidIconButton
          className="retake-camera-primary-btn"
          icon={primaryIcon}
          label={primaryLabel}
          onClick={onPrimary}
        />
      </div>
    </GlassSurface>
  );
}
