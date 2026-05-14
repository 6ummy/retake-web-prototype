import React from 'react';
import GlassIconButton from '../../../components/ui/GlassIconButton.jsx';
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
  primaryText,
  onPrimary,
  showSecondary = true,
  hideTitle = false,
  glassControls = false,
  className = '',
}) {
  if (!visible) return null;

  const ActionButton = glassControls ? GlassIconButton : SolidIconButton;
  const classes = [
    'retake-camera-bottom-bar',
    className,
    'visible',
    out ? ' out' : '',
  ].filter(Boolean).join(' ');

  return (
    <GlassSurface className={classes}>
      <ActionButton
        className={review ? 'retake-camera-retake-btn' : 'retake-camera-circle-btn'}
        icon={leftIcon}
        label={leftLabel}
        shape={review ? 'pill' : 'circle'}
        onClick={onLeft}
      >
        {review ? <span className="retake-camera-retake-label">Retake</span> : null}
      </ActionButton>
      {!hideTitle && (
        <button
          type="button"
          className="retake-camera-title-btn"
          aria-label={titleLabel}
          onClick={onTitle}
        >
          <span className="retake-camera-title-text">{title}</span>
        </button>
      )}
      <div className="retake-camera-bottom-actions">
        {showSecondary && (
          <ActionButton
            className="retake-camera-circle-btn"
            icon={secondaryIcon}
            label={secondaryLabel}
            onClick={onSecondary}
          />
        )}
        <ActionButton
          className="retake-camera-primary-btn"
          icon={primaryIcon}
          label={primaryLabel}
          onClick={onPrimary}
          shape={primaryText ? 'pill' : 'circle'}
        >
          {primaryText ? <span className="retake-camera-primary-label">{primaryText}</span> : null}
        </ActionButton>
      </div>
    </GlassSurface>
  );
}
