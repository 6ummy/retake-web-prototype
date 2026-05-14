import React from 'react';

export function RetakeRecordingStroke({ visible, progress }) {
  if (!visible) return null;

  return (
    <svg
      className="retake-recording-stroke"
      viewBox="0 0 414 736"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      <path
        className="retake-recording-stroke-path"
        d="M 207 0 H 20 Q 0 0 0 20 V 716 Q 0 736 20 736 H 394 Q 414 736 414 716 V 20 Q 414 0 394 0 H 207"
        pathLength="1"
        style={{ strokeDasharray: `${progress} 1` }}
      />
    </svg>
  );
}

export function RetakeCountdownOverlay({ value }) {
  if (value === null || value === undefined) return null;
  return (
    <div className="retake-countdown-overlay" aria-live="polite">
      {value}
    </div>
  );
}

export function RetakeScreenFlash({ visible, recording }) {
  return (
    <div
      className={[
        'retake-screen-flash',
        visible ? 'visible' : '',
        recording ? 'recording' : '',
      ].filter(Boolean).join(' ')}
      aria-hidden="true"
    />
  );
}
