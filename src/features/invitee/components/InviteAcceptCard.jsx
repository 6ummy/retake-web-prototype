import React from 'react';

export default function InviteAcceptCard({
  invite,
  loading,
  error,
  onAccept,
}) {
  if (loading) {
    return (
      <section className="invitee-card invitee-card--loading">
        <p className="invitee-eyebrow">Retake</p>
        <h1>Loading invite</h1>
      </section>
    );
  }

  if (error) {
    return (
      <section className="invitee-card">
        <p className="invitee-eyebrow">Retake</p>
        <h1>Invite unavailable</h1>
        <p className="invitee-copy">{error}</p>
      </section>
    );
  }

  return (
    <section className="invitee-card">
      <p className="invitee-eyebrow">Retake invite</p>
      <div className="invitee-frame-preview">
        <img src={invite.frameUrl} alt="" draggable="false" />
      </div>
      <h1>{invite.username} wants you in the frame</h1>
      <p className="invitee-copy">{invite.frameName}</p>
      <button type="button" className="invitee-accept-btn" onClick={onAccept}>
        Accept Retake
      </button>
    </section>
  );
}
