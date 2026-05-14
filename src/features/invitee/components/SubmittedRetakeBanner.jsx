import React from 'react';
import Button from '../../../components/ui/Button.jsx';
import SolidIconButton from '../../../components/ui/SolidIconButton.jsx';
import ToolIcon from '../../../components/icons/ToolIcon.jsx';

function SubmittedPreview({ preview }) {
  if (!preview?.url) return null;

  return (
    <div className="invitee-submitted-composition" aria-label="Sent Retake preview">
      {preview.mode === 'video' ? (
        <video
          src={preview.url}
          autoPlay
          loop
          muted
          playsInline
        />
      ) : (
        <img src={preview.url} alt="" draggable="false" />
      )}
    </div>
  );
}

export default function SubmittedRetakeBanner({
  preview,
  username,
  onClose,
  onStartOwnFrame,
  onRetake,
  onSave,
  onShare,
}) {
  return (
    <div className="invitee-submitted-banner" role="status" aria-live="polite">
      <SolidIconButton
        className="invitee-submitted-close"
        icon="close"
        label="Close sent Retake"
        onClick={onClose}
      />

      <div className="invitee-submitted-hero">
        <h1>This one’s good</h1>
        <SubmittedPreview preview={preview} />
      </div>

      <div className="invitee-submitted-confirmation">
        <p className="invitee-submitted-copy">Sent to {username || 'them'}</p>
        <div className="invitee-submitted-actions">
          <Button
            variant="primary"
            className="invitee-submitted-action"
            onClick={onStartOwnFrame}
          >
            Start your own frame
          </Button>
          <Button
            variant="secondary"
            className="invitee-submitted-action"
            onClick={onRetake}
          >
            Take another
          </Button>
        </div>
      </div>

      <div className="invitee-submitted-share" role="group" aria-label="Share sent Retake">
        <p className="invitee-submitted-share-title">Share</p>
        <div className="invitee-submitted-share-row">
          <button
            type="button"
            className="invitee-submitted-share-btn invitee-submitted-share-btn--save"
            aria-label="Save to camera roll"
            onClick={onSave}
          >
            <span className="invitee-submitted-share-icon" aria-hidden="true">
              <ToolIcon type="save" />
            </span>
            <span className="invitee-submitted-share-label">Save</span>
          </button>
          <button
            type="button"
            className="invitee-submitted-share-btn invitee-submitted-share-btn--more"
            aria-label="Open more share options"
            onClick={() => onShare('More')}
          >
            <span className="invitee-submitted-share-icon" aria-hidden="true">
              <ToolIcon type="share" />
            </span>
            <span className="invitee-submitted-share-label">More</span>
          </button>
        </div>
      </div>
    </div>
  );
}
