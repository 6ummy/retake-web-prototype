import React from 'react';

export default function FrameCanvas({
  canvasRef,
  selectionCanvasRef,
  frameElRef,
  frameClassName = '',
  onPointerDown,
  onPointerMove,
  onPointerUp,
  onPointerCancel,
  frameScrimVisible,
  children,
}) {
  return (
    <>
      <div
        id="frameContainer"
        ref={frameElRef}
        className={frameClassName}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        <div id="checkerBg"></div>
        {children}
        <canvas id="editCanvas" ref={canvasRef} width="414" height="736" className="no-tool" />
        <canvas id="selectionCanvas" ref={selectionCanvasRef} width="414" height="736" />
      </div>
      <div id="frameScrim" className={frameScrimVisible ? 'visible' : ''}></div>
    </>
  );
}
