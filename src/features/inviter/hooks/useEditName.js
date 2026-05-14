import { useState, useCallback } from 'react';

export function useEditName({ frameName, setFrameName, setScrimVisible }) {
  const [editNameVisible, setEditNameVisible] = useState(false);
  const [editNameInputValue, setEditNameInputValue] = useState('');

  const openEditName = useCallback(() => {
    setEditNameInputValue(frameName);
    setEditNameVisible(true);
    setScrimVisible(true);
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    setTimeout(() => {
      const inp = document.getElementById('editNameInput');
      if (inp) { inp.focus({ preventScroll: true }); window.scrollTo(0, 0); }
    }, 60);
  }, [frameName, setScrimVisible]);

  const saveEditName = useCallback(() => {
    const nextName = editNameInputValue.trim() || frameName;
    if (editNameInputValue.trim()) setFrameName(nextName);
    setEditNameVisible(false);
    setScrimVisible(false);
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    window.scrollTo(0, 0);
    return nextName;
  }, [editNameInputValue, frameName, setFrameName, setScrimVisible]);

  return {
    editNameVisible, editNameInputValue, setEditNameInputValue,
    openEditName, saveEditName,
  };
}
