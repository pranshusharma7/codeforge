import { useState } from 'react'
import { CheckIcon, SpinnerIcon, XIcon } from './icons'

interface Props {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
  showToast: (msg: string) => void
  currentUsage: number
  maxFree: number
}

export default function UpgradeProModal({
  isOpen,
  onClose,
  onSuccess,
  showToast,
  currentUsage,
  maxFree,
}: Props) {
  const [paymentMethod, setPaymentMethod] = useState<'card' | 'upi' | 'paypal'>('card')
  const [cardNumber, setCardNumber] = useState('4242 •••• •••• 4242')
  const [cardExpiry, setCardExpiry] = useState('12/28')
  const [cardCvc, setCardCvc] = useState('888')
  const [cardName, setCardName] = useState('CodeForge Developer')
  const [processing, setProcessing] = useState(false)

  if (!isOpen) return null

  const handlePay = () => {
    setProcessing(true)
    setTimeout(() => {
      setProcessing(false)
      onSuccess()
      showToast('🎉 Payment successful! CodeForge Pro activated with unlimited AI!')
      onClose()
    }, 1200)
  }

  return (
    <div className="modal-backdrop" onClick={onClose} style={{ zIndex: 9999 }}>
      <div
        className="modal-box animate-scale-in"
        style={{
          width: 520,
          maxWidth: '92vw',
          padding: 0,
          overflow: 'hidden',
          background: '#0f141c',
          border: '1px solid rgba(139, 92, 246, 0.3)',
          boxShadow: '0 20px 60px rgba(0, 0, 0, 0.8), 0 0 40px rgba(124, 58, 237, 0.15)',
          borderRadius: 14,
        }}
        onClick={e => e.stopPropagation()}
      >
        {/* Header gradient banner */}
        <div
          style={{
            padding: '24px 24px 20px',
            background: 'linear-gradient(135deg, rgba(124, 58, 237, 0.25) 0%, rgba(56, 189, 248, 0.15) 100%)',
            borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
            position: 'relative',
          }}
        >
          <button
            onClick={onClose}
            style={{
              position: 'absolute',
              top: 18,
              right: 18,
              background: 'rgba(255,255,255,0.06)',
              border: 'none',
              borderRadius: 6,
              color: 'var(--text-muted)',
              cursor: 'pointer',
              padding: 6,
              display: 'flex',
            }}
          >
            <XIcon size={14} />
          </button>

          <div style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 10px', borderRadius: 20, background: 'rgba(124, 58, 237, 0.25)', border: '1px solid rgba(139, 92, 246, 0.4)', color: '#c084fc', fontSize: 11, fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase', marginBottom: 12 }}>
            <span>👑 CodeForge Pro Plan</span>
          </div>

          <h2 style={{ margin: 0, fontSize: 22, fontWeight: 800, color: '#f3f4f6', letterSpacing: '-0.02em' }}>
            Upgrade for Unlimited AI
          </h2>
          <p style={{ margin: '6px 0 0', fontSize: 13, color: '#9ca3af', lineHeight: 1.5 }}>
            You've used {currentUsage} of {maxFree} free monthly queries. Upgrade to continue without limits.
          </p>
        </div>

        {/* Modal body */}
        <div style={{ padding: '22px 24px', display: 'flex', flexDirection: 'column', gap: 20 }}>
          {/* Pricing tier card */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '14px 18px',
              borderRadius: 10,
              background: 'rgba(255, 255, 255, 0.03)',
              border: '1px solid rgba(139, 92, 246, 0.2)',
            }}
          >
            <div>
              <div style={{ fontWeight: 700, fontSize: 15, color: '#ffffff' }}>Pro Membership</div>
              <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 2 }}>Unlimited AI queries • Cancel anytime</div>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: 24, fontWeight: 800, color: '#38bdf8' }}>$9<span style={{ fontSize: 13, fontWeight: 500, color: '#9ca3af' }}>/mo</span></div>
              <div style={{ fontSize: 10, color: '#34d399', fontWeight: 600 }}>Billed monthly</div>
            </div>
          </div>



          {/* Benefits list */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              'Unlimited CodeForge AI queries',
              'Advanced Gemini & Claude models',
              'Context-aware code refactoring',
              'Instant error fixing & tests',
              'Priority compiler execution',
              'All 40+ programming languages',
            ].map((feat, idx) => (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: '#e5e7eb' }}>
                <div style={{ width: 16, height: 16, borderRadius: '50%', background: 'rgba(52, 211, 153, 0.15)', color: '#34d399', display: 'grid', placeItems: 'center', flexShrink: 0 }}>
                  <CheckIcon size={10} />
                </div>
                <span>{feat}</span>
              </div>
            ))}
          </div>

          {/* Payment Method selector */}
          <div>
            <div style={{ fontSize: 12, fontWeight: 600, color: '#9ca3af', marginBottom: 8 }}>
              Select Payment Method
            </div>
            <div style={{ display: 'flex', gap: 10 }}>
              {[
                { id: 'card' as const, label: 'Credit Card', icon: '💳' },
                { id: 'upi' as const, label: 'UPI / NetBanking', icon: '⚡' },
                { id: 'paypal' as const, label: 'PayPal', icon: '🅿️' },
              ].map(m => (
                <button
                  key={m.id}
                  onClick={() => setPaymentMethod(m.id)}
                  style={{
                    flex: 1,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: 6,
                    padding: '8px 12px',
                    borderRadius: 8,
                    background: paymentMethod === m.id ? 'rgba(124, 58, 237, 0.18)' : 'rgba(255,255,255,0.03)',
                    border: `1px solid ${paymentMethod === m.id ? 'rgba(139, 92, 246, 0.5)' : 'rgba(255,255,255,0.08)'}`,
                    color: paymentMethod === m.id ? '#c084fc' : '#9ca3af',
                    fontSize: 12,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                  }}
                >
                  <span>{m.icon}</span> {m.label}
                </button>
              ))}
            </div>
          </div>

          {/* Card fields */}
          {paymentMethod === 'card' && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              <div>
                <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>Card Number</label>
                <input
                  type="text"
                  value={cardNumber}
                  onChange={e => setCardNumber(e.target.value)}
                  className="ide-input"
                  style={{ width: '100%', fontFamily: 'JetBrains Mono', fontSize: 13 }}
                />
              </div>
              <div style={{ display: 'flex', gap: 10 }}>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>Expiry</label>
                  <input
                    type="text"
                    value={cardExpiry}
                    onChange={e => setCardExpiry(e.target.value)}
                    className="ide-input"
                    style={{ width: '100%', fontFamily: 'JetBrains Mono', fontSize: 13 }}
                  />
                </div>
                <div style={{ flex: 1 }}>
                  <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 4 }}>CVC</label>
                  <input
                    type="text"
                    value={cardCvc}
                    onChange={e => setCardCvc(e.target.value)}
                    className="ide-input"
                    style={{ width: '100%', fontFamily: 'JetBrains Mono', fontSize: 13 }}
                  />
                </div>
              </div>
            </div>
          )}

          {paymentMethod === 'upi' && (
            <div style={{ padding: '14px', borderRadius: 8, background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)' }}>
              <label style={{ fontSize: 11, color: '#9ca3af', display: 'block', marginBottom: 6 }}>Enter Virtual Payment Address (VPA / UPI ID)</label>
              <input
                type="text"
                placeholder="username@okhdfcbank"
                defaultValue="developer@upi"
                className="ide-input"
                style={{ width: '100%', fontSize: 13 }}
              />
            </div>
          )}

          {paymentMethod === 'paypal' && (
            <div style={{ padding: '14px', textAlign: 'center', color: '#9ca3af', fontSize: 12, borderRadius: 8, background: 'rgba(255,255,255,0.03)' }}>
              Clicking below will connect to your PayPal account to complete the $9.00 payment.
            </div>
          )}

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 10, marginTop: 4 }}>
            <button
              onClick={onClose}
              className="btn btn-ghost"
              style={{ flex: 1, justifyContent: 'center', height: 42 }}
            >
              Cancel
            </button>
            <button
              onClick={handlePay}
              disabled={processing}
              className="btn btn-primary"
              style={{
                flex: 2,
                justifyContent: 'center',
                height: 42,
                background: 'linear-gradient(135deg, #7c3aed 0%, #2563eb 100%)',
                border: 'none',
                fontWeight: 700,
                fontSize: 14,
                boxShadow: '0 4px 20px rgba(124, 58, 237, 0.4)',
              }}
            >
              {processing ? (
                <>
                  <SpinnerIcon size={14} /> Processing $9.00...
                </>
              ) : (
                'Pay $9.00 & Upgrade to Pro'
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
