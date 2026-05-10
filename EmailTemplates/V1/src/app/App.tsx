import { useState } from 'react';
import OrderConfirmationEmail from './components/OrderConfirmationEmail';
import SignupEmail from './components/SignupEmail';
import OTPEmail from './components/OTPEmail';
import LoyaltyRewardEmail from './components/LoyaltyRewardEmail';

type EmailType = 'order' | 'signup' | 'otp' | 'loyalty';

export default function App() {
  const [selectedEmail, setSelectedEmail] = useState<EmailType>('order');

  return (
    <div style={{
      backgroundColor: '#F3F4F6',
      minHeight: '100vh'
    }}>
      {/* Navigation */}
      <div style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid #E5E7EB',
        padding: '24px',
        boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.1)',
        position: 'sticky',
        top: 0,
        zIndex: 1000
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '16px'
        }}>
          <div>
            <h1 style={{
              fontSize: '24px',
              fontWeight: '800',
              color: '#111827',
              margin: '0 0 4px 0',
              letterSpacing: '-0.5px'
            }}>
              ChefLogik Email Templates
            </h1>
            <p style={{
              fontSize: '14px',
              color: '#6B7280',
              margin: '0'
            }}>
              Transactional email templates for restaurant management
            </p>
          </div>

          <div style={{
            display: 'flex',
            gap: '8px',
            backgroundColor: '#F3F4F6',
            padding: '4px',
            borderRadius: '8px'
          }}>
            <button
              onClick={() => setSelectedEmail('order')}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '600',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: selectedEmail === 'order' ? '#6366F1' : 'transparent',
                color: selectedEmail === 'order' ? '#FFFFFF' : '#6B7280',
                boxShadow: selectedEmail === 'order' ? '0 2px 4px rgba(99, 102, 241, 0.2)' : 'none'
              }}
            >
              Order Confirmation
            </button>

            <button
              onClick={() => setSelectedEmail('signup')}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '600',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: selectedEmail === 'signup' ? '#6366F1' : 'transparent',
                color: selectedEmail === 'signup' ? '#FFFFFF' : '#6B7280',
                boxShadow: selectedEmail === 'signup' ? '0 2px 4px rgba(99, 102, 241, 0.2)' : 'none'
              }}
            >
              Signup Verification
            </button>

            <button
              onClick={() => setSelectedEmail('otp')}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '600',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: selectedEmail === 'otp' ? '#6366F1' : 'transparent',
                color: selectedEmail === 'otp' ? '#FFFFFF' : '#6B7280',
                boxShadow: selectedEmail === 'otp' ? '0 2px 4px rgba(99, 102, 241, 0.2)' : 'none'
              }}
            >
              OTP Code
            </button>

            <button
              onClick={() => setSelectedEmail('loyalty')}
              style={{
                padding: '10px 20px',
                fontSize: '14px',
                fontWeight: '600',
                borderRadius: '6px',
                border: 'none',
                cursor: 'pointer',
                transition: 'all 0.2s',
                backgroundColor: selectedEmail === 'loyalty' ? '#6366F1' : 'transparent',
                color: selectedEmail === 'loyalty' ? '#FFFFFF' : '#6B7280',
                boxShadow: selectedEmail === 'loyalty' ? '0 2px 4px rgba(99, 102, 241, 0.2)' : 'none'
              }}
            >
              Loyalty Rewards
            </button>
          </div>
        </div>
      </div>

      {/* Email Preview */}
      <div style={{
        padding: '40px 20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Inter, system-ui, sans-serif'
      }}>
        {selectedEmail === 'order' && <OrderConfirmationEmail />}
        {selectedEmail === 'signup' && <SignupEmail />}
        {selectedEmail === 'otp' && <OTPEmail />}
        {selectedEmail === 'loyalty' && <LoyaltyRewardEmail />}
      </div>
    </div>
  );
}
