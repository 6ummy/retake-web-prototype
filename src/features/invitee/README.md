# Invitee Flow

The invitee flow owns accepting a real Retake invite, opening the shared frame with the camera viewfinder inside it, capturing a Retake, editing the review using shared S3-style tools, and submitting the finished Retake back to the invite.

Shared camera, frame, review, and tool behavior should live in `src/features/editor` so changes apply to both inviter and invitee unless a flow-specific fork is explicitly requested.
