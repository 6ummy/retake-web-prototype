import React from 'react';

export default function PhotoInputs({
  galleryInputRef,
  cameraInputRef,
  onPhotoChange,
}) {
  return (
    <>
      <input
        type="file"
        id="galleryInput"
        ref={galleryInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={onPhotoChange}
      />
      <input
        type="file"
        id="cameraInput"
        ref={cameraInputRef}
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={onPhotoChange}
      />
    </>
  );
}
