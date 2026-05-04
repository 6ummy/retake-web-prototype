import React from 'react';
import GlassSurface from '../../../components/ui/GlassSurface.jsx';
import GlassIconButton from '../../../components/ui/GlassIconButton.jsx';

export default function UndoRedoCluster({ visible, out, undoDisabled, redoDisabled, onUndo, onRedo }) {
  return (
    <GlassSurface id="undoRedoCluster" className={`${visible ? 'visible' : ''}${out ? ' out' : ''}`}>
      <GlassIconButton contained={false} className="history-btn" id="btnUndo" icon="undo" label="Undo"
        disabled={undoDisabled} onClick={onUndo} />
      <GlassIconButton contained={false} className="history-btn" id="btnRedo" icon="redo" label="Redo"
        disabled={redoDisabled} onClick={onRedo} />
    </GlassSurface>
  );
}
