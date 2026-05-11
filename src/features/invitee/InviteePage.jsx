import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import '../../styles/invitee.css';
import Toast from '../../components/ui/Toast.jsx';
import SolidIconButton from '../../components/ui/SolidIconButton.jsx';
import FrameCanvas from '../editor/components/FrameCanvas.jsx';
import RetakeCameraBottomBar from '../editor/components/RetakeCameraBottomBar.jsx';
import RetakeCameraControls from '../editor/components/RetakeCameraControls.jsx';
import { RetakeCountdownOverlay, RetakeRecordingStroke, RetakeScreenFlash } from '../editor/components/RetakeCameraOverlays.jsx';
import RetakeCameraStage from '../editor/components/RetakeCameraStage.jsx';
import RetakeReviewToolbar from '../editor/components/RetakeReviewToolbar.jsx';
import RetakeZoomControl from '../editor/components/RetakeZoomControl.jsx';
import useRetakeCamera from '../editor/hooks/useRetakeCamera.js';
import { drawRetakeWatermark, RETAKE_CAMERA_MODE } from '../editor/utils/retakeCamera.js';
import { getInvite, recordRetake, uploadRetakeMedia } from '../../lib/api.js';
import { INVITEE_FLOW_STATES } from './state.js';
import InviteAcceptCard from './components/InviteAcceptCard.jsx';

const CANVAS_SIZE = { width: 414, height: 736 };

function loadImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    if (/^https?:\/\//i.test(src)) image.crossOrigin = 'anonymous';
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error('Image load failed'));
    image.src = src;
  });
}

function downloadBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  link.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}

export default function InviteePage() {
  const { inviteId: routeInviteId } = useParams();
  const [searchParams] = useSearchParams();
  const inviteId = routeInviteId || searchParams.get('id') || '';
  const canvasRef = useRef(null);
  const selectionCanvasRef = useRef(null);
  const frameElRef = useRef(null);
  const [invite, setInvite] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [accepted, setAccepted] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [activeTool, setActiveTool] = useState('');
  const [toastMsg, setToastMsg] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const toastTimerRef = useRef(null);
  const drawingRef = useRef(false);
  const lastPointRef = useRef(null);

  const showToast = useCallback((message) => {
    clearTimeout(toastTimerRef.current);
    setToastMsg(message);
    setToastVisible(true);
    toastTimerRef.current = setTimeout(() => setToastVisible(false), 1800);
  }, []);

  const camera = useRetakeCamera({
    getCanvasSize: () => CANVAS_SIZE,
    onToast: showToast,
    label: 'invitee',
  });

  const flowState = submitted
    ? INVITEE_FLOW_STATES.SUBMITTED
    : error
      ? INVITEE_FLOW_STATES.ERROR
      : !accepted
        ? INVITEE_FLOW_STATES.ACCEPT
        : camera.live
          ? INVITEE_FLOW_STATES.CAMERA_LIVE
          : camera.videoReview
            ? INVITEE_FLOW_STATES.VIDEO_REVIEW
            : camera.photoReview
              ? INVITEE_FLOW_STATES.PHOTO_REVIEW
              : INVITEE_FLOW_STATES.LOADING;

  const orderedToolIds = useMemo(() => ['text', 'stickers', 'doodle', 'download'], []);

  useEffect(() => {
    document.body.classList.add('invitee-mode');
    return () => {
      document.body.classList.remove('invitee-mode');
      clearTimeout(toastTimerRef.current);
    };
  }, []);

  useEffect(() => {
    let cancelled = false;
    async function loadInvite() {
      setLoading(true);
      setError('');
      if (!inviteId) {
        setError('This invite link is missing an id.');
        setLoading(false);
        return;
      }
      try {
        const nextInvite = await getInvite({ id: inviteId });
        if (!cancelled) setInvite(nextInvite);
      } catch (err) {
        if (!cancelled) setError(err?.message || 'Could not load this invite.');
      } finally {
        if (!cancelled) setLoading(false);
      }
    }
    loadInvite();
    return () => {
      cancelled = true;
    };
  }, [inviteId]);

  const clearReviewCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, []);

  const acceptInvite = useCallback(async () => {
    setAccepted(true);
    setSubmitted(false);
    setActiveTool('');
    clearReviewCanvas();
    await camera.enterLive();
  }, [camera, clearReviewCanvas]);

  const handleRetake = useCallback(async () => {
    setSubmitted(false);
    setActiveTool('');
    clearReviewCanvas();
    await camera.returnToLive();
  }, [camera, clearReviewCanvas]);

  const getCanvasPoint = useCallback((event) => {
    const canvas = canvasRef.current;
    const rect = canvas.getBoundingClientRect();
    return {
      x: (event.clientX - rect.left) * (canvas.width / rect.width),
      y: (event.clientY - rect.top) * (canvas.height / rect.height),
    };
  }, []);

  const startDoodle = useCallback((event) => {
    if (activeTool !== 'doodle' || !camera.review) return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    event.preventDefault();
    drawingRef.current = true;
    lastPointRef.current = getCanvasPoint(event);
    ctx.lineCap = 'round';
    ctx.lineJoin = 'round';
    ctx.lineWidth = 8;
    ctx.strokeStyle = '#F0E84A';
  }, [activeTool, camera.review, getCanvasPoint]);

  const moveDoodle = useCallback((event) => {
    if (!drawingRef.current || activeTool !== 'doodle') return;
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx || !lastPointRef.current) return;
    event.preventDefault();
    const point = getCanvasPoint(event);
    ctx.beginPath();
    ctx.moveTo(lastPointRef.current.x, lastPointRef.current.y);
    ctx.lineTo(point.x, point.y);
    ctx.stroke();
    lastPointRef.current = point;
  }, [activeTool, getCanvasPoint]);

  const endDoodle = useCallback(() => {
    drawingRef.current = false;
    lastPointRef.current = null;
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return undefined;
    canvas.addEventListener('pointerdown', startDoodle);
    canvas.addEventListener('pointermove', moveDoodle);
    canvas.addEventListener('pointerup', endDoodle);
    canvas.addEventListener('pointercancel', endDoodle);
    return () => {
      canvas.removeEventListener('pointerdown', startDoodle);
      canvas.removeEventListener('pointermove', moveDoodle);
      canvas.removeEventListener('pointerup', endDoodle);
      canvas.removeEventListener('pointercancel', endDoodle);
    };
  }, [endDoodle, moveDoodle, startDoodle]);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.classList.toggle('no-tool', activeTool !== 'doodle');
  }, [activeTool]);

  const drawText = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.save();
    ctx.font = '48px Bedstead, monospace';
    ctx.fillStyle = '#FFFFFF';
    ctx.strokeStyle = 'rgba(0,0,0,0.42)';
    ctx.lineWidth = 8;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.strokeText('retake!', canvas.width / 2, canvas.height / 2);
    ctx.fillText('retake!', canvas.width / 2, canvas.height / 2);
    ctx.restore();
    setActiveTool('');
    showToast('Text added');
  }, [showToast]);

  const drawSticker = useCallback(() => {
    const canvas = canvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    ctx.save();
    ctx.font = '72px system-ui';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', canvas.width / 2, canvas.height / 2 - 82);
    ctx.restore();
    setActiveTool('');
    showToast('Sticker added');
  }, [showToast]);

  const composePhotoBlob = useCallback(async () => {
    if (!camera.photoUrl || !invite?.frameUrl) throw new Error('Photo is not ready');
    const out = document.createElement('canvas');
    out.width = CANVAS_SIZE.width;
    out.height = CANVAS_SIZE.height;
    const ctx = out.getContext('2d');
    const photo = await loadImage(camera.photoUrl);
    const frame = await loadImage(invite.frameUrl);
    ctx.drawImage(photo, 0, 0, out.width, out.height);
    ctx.drawImage(frame, 0, 0, out.width, out.height);
    if (canvasRef.current) ctx.drawImage(canvasRef.current, 0, 0, out.width, out.height);
    drawRetakeWatermark(ctx, out.width, out.height);
    return new Promise((resolve, reject) => {
      out.toBlob(blob => blob ? resolve(blob) : reject(new Error('Photo export failed')), 'image/jpeg', 0.92);
    });
  }, [camera.photoUrl, invite]);

  const getSubmissionBlob = useCallback(async () => {
    if (camera.photoReview) return composePhotoBlob();
    if (camera.videoReview && camera.videoBlobRef.current) return camera.videoBlobRef.current;
    throw new Error('Retake is not ready');
  }, [camera.photoReview, camera.videoBlobRef, camera.videoReview, composePhotoBlob]);

  const handleDownload = useCallback(async () => {
    try {
      const blob = await getSubmissionBlob();
      const ext = camera.videoReview ? 'webm' : 'jpg';
      downloadBlob(blob, `retake-${Date.now()}.${ext}`);
      showToast('Saved!');
    } catch (err) {
      console.warn('[invitee] Download failed:', err);
      showToast('Could not save Retake');
    }
  }, [camera.videoReview, getSubmissionBlob, showToast]);

  const handleSubmit = useCallback(async () => {
    if (!invite || submitting) return;
    setSubmitting(true);
    try {
      const blob = await getSubmissionBlob();
      const mode = camera.videoReview ? 'video' : 'photo';
      const ext = mode === 'video' ? 'webm' : 'jpg';
      const uploaded = await uploadRetakeMedia({
        inviteId: invite.id,
        mode,
        filename: `retake-${Date.now()}.${ext}`,
        blob,
      });
      await recordRetake({
        inviteId: invite.id,
        mediaUrl: uploaded.url,
        mediaType: blob.type,
        mode,
        frameName: invite.frameName,
        username: invite.username,
      });
      setSubmitted(true);
      showToast('Retake sent');
    } catch (err) {
      console.warn('[invitee] Submit failed:', err);
      showToast(err?.message || 'Could not send Retake');
    } finally {
      setSubmitting(false);
    }
  }, [camera.videoReview, getSubmissionBlob, invite, showToast, submitting]);

  if (!accepted) {
    return (
      <main className="invitee-screen invitee-screen--entry" data-flow-state={flowState}>
        <InviteAcceptCard
          invite={invite}
          loading={loading}
          error={error}
          onAccept={acceptInvite}
        />
        <Toast className="s6-toast" visible={toastVisible}>{toastMsg}</Toast>
      </main>
    );
  }

  return (
    <main className="invitee-screen" data-flow-state={flowState}>
      <FrameCanvas
        canvasRef={canvasRef}
        selectionCanvasRef={selectionCanvasRef}
        frameElRef={frameElRef}
        showCheckerBg={false}
        frameScrimVisible
      >
        <RetakeCameraStage
          mode={camera.mode}
          recording={camera.recording}
          videoRef={camera.videoRef}
          cameraStyle={camera.cameraStyle}
          cameraReady={camera.cameraReady}
          cameraIssue={camera.cameraIssue}
          photoUrl={camera.photoUrl}
          videoUrl={camera.videoUrl}
          onPointerDown={camera.handlePointerDown}
          onPointerMove={camera.handlePointerMove}
          onPointerUp={camera.handlePointerUp}
          onPointerCancel={camera.handlePointerCancel}
        />
        {invite?.frameUrl && (
          <img className="invitee-frame-overlay" src={invite.frameUrl} alt="" draggable="false" />
        )}
      </FrameCanvas>

      <RetakeRecordingStroke visible={camera.recording} progress={camera.recordingProgress} />
      <RetakeCountdownOverlay value={camera.countdownValue} />
      {camera.live && (
        <RetakeScreenFlash
          visible={camera.screenFlashActive || (camera.recording && camera.usesScreenFlash)}
          recording={camera.recording && camera.usesScreenFlash}
        />
      )}

      <RetakeCameraControls
        visible={camera.live && !camera.captureBusy}
        flashAvailable={camera.cameraReady}
        flashEnabled={camera.flashEnabled}
        timerSeconds={camera.timerSeconds}
        onFlash={camera.toggleFlash}
        onTimer={camera.toggleTimer}
        onFlip={camera.flipCamera}
      />

      <RetakeZoomControl
        visible={camera.live && !camera.captureBusy}
        zoomOptions={camera.zoomOptions}
        zoomMode={camera.zoomMode}
        onZoom={camera.setZoom}
      />

      {camera.review && !camera.captureBusy && (
        <RetakeReviewToolbar
          visible
          out={false}
          collapsed={false}
          labelsExpanded={false}
          activeTool={activeTool}
          orderedToolIds={orderedToolIds}
          onToolText={drawText}
          onToolStickers={drawSticker}
          onToolDoodle={() => {
            setActiveTool(current => current === 'doodle' ? '' : 'doodle');
            showToast(activeTool === 'doodle' ? 'Draw off' : 'Draw on');
          }}
          onToolMagicPen={() => {}}
          onToolDownload={handleDownload}
          onToggle={() => {}}
          onInteraction={() => {}}
        />
      )}

      {camera.mode && !camera.captureBusy && (
        <RetakeCameraBottomBar
          visible
          out={false}
          review={camera.review}
          title={submitted ? 'Sent!' : invite?.frameName || 'Retake'}
          titleLabel="Invite frame name"
          leftLabel={camera.review ? 'Retake photo or video' : 'Back to invite'}
          onLeft={camera.review ? handleRetake : () => setAccepted(false)}
          onTitle={() => {}}
          secondaryIcon="save"
          secondaryLabel="Save Retake"
          onSecondary={camera.review ? handleDownload : undefined}
          showSecondary={camera.review}
          primaryIcon={submitted ? 'check' : 'share'}
          primaryLabel={camera.review ? (submitting ? 'Sending Retake' : 'Submit Retake') : 'Submit Retake'}
          onPrimary={camera.review ? handleSubmit : () => showToast('Capture a Retake first')}
        />
      )}

      {submitted && (
        <div className="invitee-submitted-banner">
          <span>Retake sent</span>
          <SolidIconButton icon="photo" label="Take another" onClick={handleRetake} />
        </div>
      )}

      <Toast className="s6-toast" visible={toastVisible}>{toastMsg}</Toast>
    </main>
  );
}
