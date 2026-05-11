import React from 'react';

export default function FrameCanvas({
  canvasRef,
  selectionCanvasRef,
  frameElRef,
  frameClassName = '',
  frameStyle,
  canvasWidth = 414,
  canvasHeight = 736,
  showCheckerBg = true,
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
        style={frameStyle}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerCancel}
      >
        {showCheckerBg && <div id="checkerBg"></div>}
        {children}
        <canvas
          id="editCanvas"
          ref={canvasRef}
          width={canvasWidth}
          height={canvasHeight}
          className="no-tool"
        />
        {selectionCanvasRef && (
          <canvas
            id="selectionCanvas"
            ref={selectionCanvasRef}
            width={canvasWidth}
            height={canvasHeight}
          />
        )}
      </div>
      <div id="frameScrim" className={frameScrimVisible ? 'visible' : ''}></div>
    </>
  );
}
