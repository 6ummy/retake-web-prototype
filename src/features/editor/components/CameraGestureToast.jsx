import React from 'react';
import Toast from '../../../components/ui/Toast.jsx';

export default function CameraGestureToast({
  visible,
  message = 'Double tap to flip camera',
  className = '',
}) {
  return (
    <Toast className={`camera-gesture-toast${className ? ` ${className}` : ''}`} visible={visible}>
      {message}
    </Toast>
  );
}
