import React from 'react';

/**
 * Custom Confirm Dialog — replaces window.confirm() everywhere
 * Usage:
 *   const { confirm, ConfirmDialogUI } = useConfirm();
 *   await confirm({ title: 'Delete?', message: '...' })
 */

export function useConfirm() {
  const [state, setState] = React.useState(null);
  // state = { title, message, icon, resolve }

  const confirm = ({ title = 'Are you sure?', message = '', icon = '🗑️', confirmText = 'Delete', confirmColor = '#ef4444' } = {}) => {
    return new Promise((resolve) => {
      setState({ title, message, icon, confirmText, confirmColor, resolve });
    });
  };

  const handleClose = (result) => {
    state?.resolve(result);
    setState(null);
  };

  const ConfirmDialogUI = state ? (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 9999,
      background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(4px)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      animation: 'fadeIn 0.15s ease',
    }}>
      <div style={{
        background: 'var(--surface)',
        border: '1px solid var(--border)',
        borderRadius: 16,
        padding: '32px 28px',
        maxWidth: 400, width: '90%',
        boxShadow: '0 24px 80px rgba(0,0,0,0.6)',
        animation: 'slideUp 0.2s ease',
      }}>
        {/* Icon */}
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: `${state.confirmColor}22`,
          border: `2px solid ${state.confirmColor}44`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 24, margin: '0 auto 20px',
        }}>
          {state.icon}
        </div>

        {/* Title */}
        <h3 style={{
          textAlign: 'center', fontSize: 18, fontWeight: 700,
          color: 'var(--text)', marginBottom: 10,
        }}>
          {state.title}
        </h3>

        {/* Message */}
        {state.message && (
          <p style={{
            textAlign: 'center', fontSize: 14,
            color: 'var(--text2)', lineHeight: 1.6, marginBottom: 28,
          }}>
            {state.message}
          </p>
        )}

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 10 }}>
          <button
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10,
              border: '1px solid var(--border)', background: 'var(--bg2)',
              color: 'var(--text2)', fontSize: 14, fontWeight: 600, cursor: 'pointer',
              transition: 'all 0.15s',
            }}
            onMouseEnter={e => e.target.style.background = 'var(--surface2)'}
            onMouseLeave={e => e.target.style.background = 'var(--bg2)'}
            onClick={() => handleClose(false)}
          >
            Cancel
          </button>
          <button
            style={{
              flex: 1, padding: '10px 0', borderRadius: 10,
              border: 'none',
              background: state.confirmColor,
              color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              transition: 'all 0.15s',
              boxShadow: `0 4px 16px ${state.confirmColor}55`,
            }}
            onMouseEnter={e => e.target.style.opacity = '0.88'}
            onMouseLeave={e => e.target.style.opacity = '1'}
            onClick={() => handleClose(true)}
          >
            {state.confirmText}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn { from { opacity: 0 } to { opacity: 1 } }
        @keyframes slideUp { from { transform: translateY(20px); opacity: 0 } to { transform: translateY(0); opacity: 1 } }
      `}</style>
    </div>
  ) : null;

  return { confirm, ConfirmDialogUI };
}
