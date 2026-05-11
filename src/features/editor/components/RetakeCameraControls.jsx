import React from 'react';
import GlassSurface from '../../../components/ui/GlassSurface.jsx';
import SolidIconButton from '../../../components/ui/SolidIconButton.jsx';

export default function RetakeCameraControls({
  visible,
  flashAvailable,
  flashEnabled,
  timerSeconds,
  onFlash,
  onTimer,
  onFlip,
  className = '',
}) {
  return (
    <GlassSurface className={`retake-camera-controls${visible ? ' visible' : ''}${className ? ` ${className}` : ''}`}>
      <SolidIconButton
        className="retake-camera-control-btn"
        icon="timer"
        label={timerSeconds ? `Timer ${timerSeconds} seconds` : 'Timer off'}
        active={timerSeconds > 0}
        onClick={onTimer}
      >
        {timerSeconds > 0 ? <span className="retake-camera-timer-badge">{timerSeconds}s</span> : null}
      </SolidIconButton>
      <SolidIconButton
        className="retake-camera-control-btn"
        icon="flash"
        label={flashAvailable ? (flashEnabled ? 'Turn flash off' : 'Turn flash on') : 'Flash unavailable'}
        active={flashEnabled}
        disabled={!flashAvailable}
        onClick={onFlash}
      />
      <SolidIconButton
        className="retake-camera-control-btn"
        icon="flipCamera"
        label="Flip camera"
        onClick={onFlip}
      />
    </GlassSurface>
  );
}
