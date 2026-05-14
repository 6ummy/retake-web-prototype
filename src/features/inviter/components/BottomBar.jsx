import React from 'react';
import GlassIconButton from '../../../components/ui/GlassIconButton.jsx';
import GlassSurface from '../../../components/ui/GlassSurface.jsx';

export default function BottomBar({
  visible,
  out,
  onGalleryClick,
  onProceed,
  showProceed = true,
}) {
  return (
    <GlassSurface id="s6BottomBar" className={`s6-bottom-bar${visible ? ' visible' : ''}${out ? ' out' : ''}`}>
      <GlassIconButton className="s6-circle-btn" id="btnGallery" icon="photo" label="Change photo"
        onClick={onGalleryClick} />

      {showProceed && (
        <GlassIconButton className="s6-send-btn" id="btnProceed" icon="arrowRight" label="Preview" shape="pill"
          onClick={onProceed}>
          <span className="s6-send-label">Preview</span>
        </GlassIconButton>
      )}
    </GlassSurface>
  );
}
