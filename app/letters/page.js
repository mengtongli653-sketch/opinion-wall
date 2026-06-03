import { cookies } from 'next/headers';
import { listEditorContacts } from '@/lib/db';
import { readLocaleFromCookies, makeT } from '@/lib/i18n';

export const dynamic = 'force-dynamic';

export default function LettersPage() {
  const locale = readLocaleFromCookies(cookies());
  const t = makeT(locale);
  const contacts = listEditorContacts();

  return (
    <>
      <a href="/" className="back-link">{t('home.back')}</a>

      <article className="article-detail">
        <h1 className="article-title" style={{ paddingRight: 0, marginBottom: 14 }}>
          {t('letters.title')}
        </h1>
        <div className="article-body" style={{ marginBottom: 22 }}>
          {t('letters.intro')}
        </div>

        {contacts.length === 0 ? (
          <div className="muted" style={{ fontStyle: 'italic' }}>
            {t('letters.empty')}
          </div>
        ) : (
          <div className="contacts-list">
            {contacts.map((c) => (
              <ContactRow key={c.id} t={t} contact={c} />
            ))}
          </div>
        )}
      </article>
    </>
  );
}

function ContactRow({ t, contact }) {
  return (
    <div className="contact-row">
      <div className="contact-row-head">
        <span className="contact-name">{contact.name}</span>
        {contact.role && <span className="contact-role">· {contact.role}</span>}
      </div>
      {contact.contact_label || contact.contact_value ? (
        <div className="contact-method">
          {contact.contact_label && (
            <span className="contact-method-label">{contact.contact_label}</span>
          )}
          {contact.contact_value && (
            <span className="contact-method-value">{contact.contact_value}</span>
          )}
        </div>
      ) : null}
    </div>
  );
}
