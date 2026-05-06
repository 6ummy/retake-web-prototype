import React from 'react';
import GlassSurface from '../../../components/ui/GlassSurface.jsx';
import SolidIconButton from '../../../components/ui/SolidIconButton.jsx';

export default function Step3CameraControls({
  visible,
  flashAvailable,
  flashEnabled,
  timerSeconds,
  onFlash,
  onTimer,
  onFlip,
}) {
  return (
    <GlassSurface className={`step3-camera-controls${visible ? ' visible' : ''}`}>
      <SolidIconButton
        className="step3-camera-control-btn"
        icon="timer"
        label={timerSeconds ? `Timer ${timerSeconds} seconds` : 'Timer off'}
        active={timerSeconds > 0}
        onClick={onTimer}
      >
        {timerSeconds > 0 ? <span className="step3-camera-timer-badge">{timerSeconds}s</span> : null}
      </SolidIconButton>
      <SolidIconButton
        className="step3-camera-control-btn"
        icon="flash"
        label={flashAvailable ? (flashEnabled ? 'Turn flash off' : 'Turn flash on') : 'Flash unavailable'}
        active={flashEnabled}
        disabled={!flashAvailable}
        onClick={onFlash}
      />
      <SolidIconButton
        className="step3-camera-control-btn"
        icon="flipCamera"
        label="Flip camera"
        onClick={onFlip}
      />
    </GlassSurface>
  );
}
