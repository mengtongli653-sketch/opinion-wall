'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useT } from './LangProvider';
import { useToast } from './Toast';

// Admin-side CRUD for editorial contact list. The /letters page reads
// these entries directly via listEditorContacts() (server-side), so any
// change here is reflected after router.refresh().
export default function EditorContactsManager({ initial }) {
  const router = useRouter();
  const t = useT();
  const toast = useToast();
  const [items, setItems] = useState(initial || []);

  // Inline-add form state
  const [name, setName] = useState('');
  const [role, setRole] = useState('');
  const [label, setLabel] = useState('');
  const [value, setValue] = useState('');
  const [err, setErr] = useState('');
  const [busy, setBusy] = useState(false);

  // Inline-edit state
  const [editingId, setEditingId] = useState(0);
  const [editName, setEditName] = useState('');
  const [editRole, setEditRole] = useState('');
  const [editLabel, setEditLabel] = useState('');
  const [editValue, setEditValue] = useState('');
  const [editBusy, setEditBusy] = useState(false);

  async function add(e) {
    e.preventDefault();
    setErr('');
    if (!name.trim()) {
      setErr(t('editor.contacts.nameRequired'));
      return;
    }
    setBusy(true);
    const res = await fetch('/api/admin/editor-contacts', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: name.trim(),
        role: role.trim(),
        contact_label: label.trim(),
        contact_value: value.trim(),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setBusy(false);
    if (!res.ok) {
      setErr(data.error || t('editor.contacts.toastFail'));
      return;
    }
    setItems((xs) => [...xs, data.contact]);
    setName(''); setRole(''); setLabel(''); setValue('');
    toast(t('editor.contacts.toastAdded'));
    router.refresh();
  }

  function startEdit(entry) {
    setEditingId(entry.id);
    setEditName(entry.name || '');
    setEditRole(entry.role || '');
    setEditLabel(entry.contact_label || '');
    setEditValue(entry.contact_value || '');
  }

  function cancelEdit() {
    setEditingId(0);
  }

  async function saveEdit(id) {
    if (!editName.trim()) return;
    setEditBusy(true);
    const res = await fetch(`/api/admin/editor-contacts/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: editName.trim(),
        role: editRole.trim(),
        contact_label: editLabel.trim(),
        contact_value: editValue.trim(),
      }),
    });
    const data = await res.json().catch(() => ({}));
    setEditBusy(false);
    if (!res.ok) {
      toast(data.error || t('editor.contacts.toastFail'), { kind: 'danger' });
      return;
    }
    setItems((xs) => xs.map((x) => (x.id === id ? data.contact : x)));
    setEditingId(0);
    toast(t('editor.contacts.toastSaved'));
    router.refresh();
  }

  async function del(id) {
    if (!confirm(t('editor.contacts.confirmDel'))) return;
    const res = await fetch(`/api/admin/editor-contacts/${id}`, { method: 'DELETE' });
    if (!res.ok) return toast(t('editor.contacts.toastFail'), { kind: 'danger' });
    setItems((xs) => xs.filter((x) => x.id !== id));
    toast(t('editor.contacts.toastDeleted'));
    router.refresh();
  }

  return (
    <div className="card">
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{t('editor.contacts.title')}</div>
      <div className="muted" style={{ fontSize: 13, marginBottom: 12 }}>{t('editor.contacts.sub')}</div>

      <form onSubmit={add} className="contact-form">
        <input
          type="text"
          placeholder={t('editor.contacts.namePlaceholder')}
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          type="text"
          placeholder={t('editor.contacts.rolePlaceholder')}
          value={role}
          onChange={(e) => setRole(e.target.value)}
        />
        <div className="row" style={{ gap: 8 }}>
          <input
            type="text"
            placeholder={t('editor.contacts.labelPlaceholder')}
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            style={{ flex: 1 }}
          />
          <input
            type="text"
            placeholder={t('editor.contacts.valuePlaceholder')}
            value={value}
            onChange={(e) => setValue(e.target.value)}
            style={{ flex: 2 }}
          />
        </div>
        <div className="row" style={{ justifyContent: 'flex-end' }}>
          <button type="submit" disabled={busy}>
            {busy ? t('editor.contacts.adding') : t('editor.contacts.add')}
          </button>
        </div>
        {err && <div className="error">{err}</div>}
      </form>

      <div style={{ marginTop: 8 }}>
        {items.length === 0 && (
          <div className="muted" style={{ fontSize: 13, fontStyle: 'italic', padding: '6px 0' }}>
            {t('editor.contacts.empty')}
          </div>
        )}
        {items.map((c) => (
          <div key={c.id} className="contact-admin-row">
            {editingId === c.id ? (
              <div className="contact-edit">
                <input
                  type="text"
                  placeholder={t('editor.contacts.namePlaceholder')}
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                />
                <input
                  type="text"
                  placeholder={t('editor.contacts.rolePlaceholder')}
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                />
                <div className="row" style={{ gap: 8 }}>
                  <input
                    type="text"
                    placeholder={t('editor.contacts.labelPlaceholder')}
                    value={editLabel}
                    onChange={(e) => setEditLabel(e.target.value)}
                    style={{ flex: 1 }}
                  />
                  <input
                    type="text"
                    placeholder={t('editor.contacts.valuePlaceholder')}
                    value={editValue}
                    onChange={(e) => setEditValue(e.target.value)}
                    style={{ flex: 2 }}
                  />
                </div>
                <div className="row" style={{ justifyContent: 'flex-end', gap: 6 }}>
                  <button
                    type="button"
                    className="small secondary"
                    onClick={cancelEdit}
                    disabled={editBusy}
                  >{t('editor.contacts.cancel')}</button>
                  <button
                    type="button"
                    className="small"
                    onClick={() => saveEdit(c.id)}
                    disabled={editBusy}
                  >{editBusy ? t('editor.contacts.saving') : t('editor.contacts.save')}</button>
                </div>
              </div>
            ) : (
              <div className="contact-display">
                <div className="contact-display-left">
                  <div>
                    <span style={{ fontWeight: 600 }}>{c.name}</span>
                    {c.role && (
                      <span className="muted" style={{ marginLeft: 6, fontSize: 13 }}>
                        · {c.role}
                      </span>
                    )}
                  </div>
                  {(c.contact_label || c.contact_value) && (
                    <div className="muted" style={{ fontSize: 13, marginTop: 2 }}>
                      {c.contact_label && (
                        <span style={{ fontWeight: 600, marginRight: 6 }}>{c.contact_label}</span>
                      )}
                      <span style={{ fontFamily: 'var(--font-mono)' }}>{c.contact_value}</span>
                    </div>
                  )}
                </div>
                <div className="row" style={{ gap: 6 }}>
                  <button
                    type="button"
                    className="small secondary"
                    onClick={() => startEdit(c)}
                  >{t('editor.contacts.edit')}</button>
                  <button
                    type="button"
                    className="small danger secondary"
                    onClick={() => del(c.id)}
                  >{t('editor.contacts.delete')}</button>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
