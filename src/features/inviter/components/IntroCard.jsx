import React from 'react';

export default function IntroCard({ visible, onChoosePhoto, onTakePhoto, onStartBlank }) {
  return (
    <div className={`invite-card${visible ? ' visible' : ''}`} id="introCard">
      <div className="card-content">
        <div className="card-text">
          <span className="card-username">Make a frame,</span>
          <span className="card-subtitle">share it.</span>
        </div>
        <div className="card-buttons intro-actions">
          <button className="btn btn-primary intro-action-btn" id="btnChoosePhoto" onClick={onChoosePhoto}>
            <svg className="intro-action-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke-width)" strokeLinecap="round" strokeLinejoin="round">
              <rect x="3" y="3" width="18" height="18" rx="3" />
              <circle cx="8.5" cy="8.5" r="1.5" />
              <polyline points="21 15 16 10 5 21" />
            </svg>
            Pick a photo
          </button>
          <button className="btn btn-secondary intro-action-btn" id="btnTakePhoto" onClick={onTakePhoto}>
            <svg className="intro-action-icon" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="var(--icon-stroke-width)" strokeLinecap="round" strokeLinejoin="round">
              <path d="M14.5 4.5 16 7h3a2 2 0 0 1 2 2v8a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2h3l1.5-2.5h5Z" />
              <circle cx="12" cy="13" r="3.5" />
            </svg>
            Take a photo
          </button>
          <button className="btn btn-tertiary intro-action-btn" id="btnStartBlank" onClick={onStartBlank}>
            Blank canvas
          </button>
        </div>
      </div>
    </div>
  );
}
