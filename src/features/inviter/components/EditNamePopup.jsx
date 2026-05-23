import React from 'react';

export default function EditNamePopup({
  visible,
  inputValue,
  onChange,
  onSave,
  saveLabel = 'Save',
  usernameValue = '',
  onUsernameChange,
}) {
  const showUsername = typeof onUsernameChange === 'function';
  return (
    <div className={`share-pop${visible ? ' visible' : ''}`} id="editNamePop">
      <p className="s7-pop-title">Name your frame</p>
      <div className="edit-name-field">
        <input className="edit-name-input" id="editNameInput" type="text"
          placeholder="what's this frame called?" maxLength="32"
          autoComplete="off" autoCorrect="off" spellCheck="false"
          value={inputValue}
          onChange={onChange}
          onKeyDown={e => { if (e.key === 'Enter') onSave(); }} />
      </div>
      {showUsername && (
        <div className="edit-name-field edit-username-field">
          <input className="edit-name-input" id="editUsernameInput" type="text"
            placeholder="your name (shown to friends)" maxLength="32"
            autoComplete="off" autoCorrect="off" spellCheck="false"
            value={usernameValue}
            onChange={onUsernameChange}
            onKeyDown={e => { if (e.key === 'Enter') onSave(); }} />
        </div>
      )}
      <button className="edit-name-save" id="btnEditNameDone" onClick={onSave}>{saveLabel}</button>
    </div>
  );
}
