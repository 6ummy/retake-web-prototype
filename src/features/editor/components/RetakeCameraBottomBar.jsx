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
  primaryAvatar,
  primaryBusy = false,
  onPrimary,
  showSecondary = true,
  hideTitle = false,
  glassControls = false,
  className = '',
}) {
  if (!visible) return null;

  const ActionButton = glassControls ? GlassIconButton : SolidIconButton;
  const hasPrimaryAvatar = Boolean(primaryAvatar);
  const primaryAvatarSrc = primaryAvatar?.src;
  const primaryAvatarText = primaryAvatar?.avatarText || primaryAvatar?.text;
  const primaryAvatarBadgeText = primaryAvatar?.badgeText;
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
          className={`retake-camera-primary-btn${primaryAvatar ? ' has-primary-avatar' : ''}${primaryBusy ? ' is-primary-busy' : ''}`}
          icon={primaryIcon}
          label={primaryLabel}
          onClick={onPrimary}
          disabled={primaryBusy}
          aria-busy={primaryBusy ? 'true' : undefined}
          shape={(primaryText || hasPrimaryAvatar) ? 'pill' : 'circle'}
        >
          {hasPrimaryAvatar ? (
            <span className="retake-camera-primary-avatar-set" aria-hidden="true">
              {(primaryAvatarSrc || primaryAvatar?.showPlaceholder) ? (
                <span className={`retake-camera-primary-avatar retake-camera-primary-avatar--${primaryAvatarSrc ? 'image' : 'placeholder'}`}>
                  {primaryAvatarSrc ? (
                    <img src={primaryAvatarSrc} alt="" draggable="false" />
                  ) : (
                    <span>{primaryAvatarText}</span>
                  )}
                </span>
              ) : null}
              {primaryAvatarBadgeText ? (
                <span className="retake-camera-primary-avatar retake-camera-primary-avatar--badge">
                  <span>{primaryAvatarBadgeText}</span>
                </span>
              ) : null}
            </span>
          ) : null}
          {primaryText ? <span className="retake-camera-primary-label">{primaryText}</span> : null}
        </ActionButton>
      </div>
    </GlassSurface>
  );
}
