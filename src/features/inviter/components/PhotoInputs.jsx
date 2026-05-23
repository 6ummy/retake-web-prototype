import React from 'react';

// Note on iOS Safari: when `accept` contains *any* image MIME type (including
// explicit lists like `image/jpeg,image/png`), iOS 16+ still shows a picker
// with Photo Library, Take Photo, and Choose File. The "Take Photo" option
// cannot be suppressed via accept/capture attributes. We accept this
// limitation and keep a separate intro "Take a photo" button anyway, which
// uses `capture="environment"` to skip the picker and jump straight to the
// camera (the more direct flow for that intent).
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
