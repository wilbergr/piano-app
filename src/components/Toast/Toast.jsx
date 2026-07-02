import { useEffect } from 'react';
import { CircleAlert, CircleCheck, Info, X } from 'lucide-react';
import './Toast.css';

const TONE_ICONS = {
  success: CircleCheck,
  danger: CircleAlert,
  default: Info,
};

const AUTO_DISMISS_MS = 5000;

/**
 * Transient in-app notice (replaces browser alert()).
 * `toast` is `{ message, tone, id }` or null; a new id restarts the timer.
 */
export default function Toast({ toast, onDismiss }) {
  useEffect(() => {
    if (!toast) return undefined;
    const timer = setTimeout(onDismiss, AUTO_DISMISS_MS);
    return () => clearTimeout(timer);
  }, [toast, onDismiss]);

  if (!toast) return null;

  const tone = toast.tone || 'default';
  const Icon = TONE_ICONS[tone] || Info;

  return (
    <div className="toast-stack">
      <div className={`toast toast-${tone}`} role="status">
        <Icon className="toast-icon" aria-hidden="true" />
        <span className="toast-message">{toast.message}</span>
        <button
          type="button"
          className="toast-dismiss"
          onClick={onDismiss}
          aria-label="Dismiss notification"
        >
          <X aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
