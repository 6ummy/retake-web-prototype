import { useState, useCallback, useRef } from 'react';

const USERNAME_KEY = 'retake.username.v1';
const DEFAULT_USERNAME = '';

function readStoredUsername() {
  try {
    return window.localStorage?.getItem(USERNAME_KEY) || DEFAULT_USERNAME;
  } catch {
    return DEFAULT_USERNAME;
  }
}

function persistUsername(value) {
  try {
    if (value) window.localStorage?.setItem(USERNAME_KEY, value);
    else window.localStorage?.removeItem(USERNAME_KEY);
  } catch {
    /* localStorage may be unavailable (private mode etc.); skip. */
  }
}

export function useEditName({ frameName, setFrameName, setScrimVisible }) {
  const [editNameVisible, setEditNameVisible] = useState(false);
  const [editNameInputValue, setEditNameInputValue] = useState('');
  const [editUsernameInputValue, setEditUsernameInputValue] = useState(() => readStoredUsername());
  const usernameRef = useRef(readStoredUsername());

  const openEditName = useCallback(() => {
    setEditNameInputValue(frameName);
    setEditUsernameInputValue(usernameRef.current);
    setEditNameVisible(true);
    setScrimVisible(true);
    document.body.style.overflow = 'hidden';
    document.documentElement.style.overflow = 'hidden';
    setTimeout(() => {
      // Focus the username field if it's still empty (first-time prompt),
      // otherwise focus the frame name like before.
      const targetId = usernameRef.current ? 'editNameInput' : 'editUsernameInput';
      const inp = document.getElementById(targetId);
      if (inp) { inp.focus({ preventScroll: true }); window.scrollTo(0, 0); }
    }, 60);
  }, [frameName, setScrimVisible]);

  const saveEditName = useCallback(() => {
    const nextName = editNameInputValue.trim() || frameName;
    const nextUsername = editUsernameInputValue.trim();
    if (editNameInputValue.trim()) setFrameName(nextName);
    usernameRef.current = nextUsername;
    persistUsername(nextUsername);
    setEditNameVisible(false);
    setScrimVisible(false);
    document.body.style.overflow = '';
    document.documentElement.style.overflow = '';
    window.scrollTo(0, 0);
    return { name: nextName, username: nextUsername };
  }, [editNameInputValue, editUsernameInputValue, frameName, setFrameName, setScrimVisible]);

  return {
    editNameVisible,
    editNameInputValue, setEditNameInputValue,
    editUsernameInputValue, setEditUsernameInputValue,
    usernameRef,
    openEditName, saveEditName,
  };
}
