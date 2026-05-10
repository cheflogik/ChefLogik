export default function LoyaltyRewardEmail() {
  return (
    <table style={{
      maxWidth: '600px',
      margin: '0 auto',
      backgroundColor: '#FFFFFF',
      width: '100%',
      boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
      borderRadius: '16px',
      overflow: 'hidden',
      border: '1px solid #E5E7EB'
    }} cellPadding="0" cellSpacing="0" border={0}>
      <tbody>
        {/* Decorative Top Bar */}
        <tr>
          <td style={{
            background: 'linear-gradient(90deg, #F59E0B 0%, #EAB308 50%, #F97316 100%)',
            height: '4px'
          }}></td>
        </tr>

        {/* Header */}
        <tr>
          <td style={{
            background: 'linear-gradient(135deg, #1E293B 0%, #334155 100%)',
            padding: '48px 32px',
            textAlign: 'center',
            position: 'relative'
          }}>
            <div style={{
              display: 'inline-block',
              backgroundColor: '#6366F1',
              width: '56px',
              height: '56px',
              borderRadius: '12px',
              marginBottom: '16px',
              lineHeight: '56px',
              fontSize: '28px',
              boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.4)'
            }}>
              🍽️
            </div>

            <h1 style={{
              color: '#FFFFFF',
              fontSize: '32px',
              fontWeight: '800',
              margin: '0',
              letterSpacing: '-0.5px',
              textShadow: '0 2px 8px rgba(0, 0, 0, 0.3)'
            }}>
              ChefLogik
            </h1>

            <p style={{
              color: '#CBD5E1',
              fontSize: '13px',
              margin: '8px 0 0 0',
              letterSpacing: '1px',
              textTransform: 'uppercase',
              fontWeight: '600'
            }}>
              Restaurant Management System
            </p>
          </td>
        </tr>

        {/* Main Body */}
        <tr>
          <td style={{
            backgroundColor: '#FFFFFF',
            padding: '48px 40px',
          }}>
            <div style={{
              textAlign: 'center',
              marginBottom: '32px'
            }}>
              <div style={{
                display: 'inline-block',
                background: 'linear-gradient(135deg, #F59E0B 0%, #D97706 100%)',
                padding: '10px 24px',
                borderRadius: '100px',
                boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.3)'
              }}>
                <span style={{
                  fontSize: '13px',
                  color: '#FFFFFF',
                  fontWeight: '700',
                  letterSpacing: '0.5px',
                  textTransform: 'uppercase'
                }}>
                  🎁 Rewards Unlocked
                </span>
              </div>
            </div>

            <p style={{
              fontSize: '18px',
              color: '#374151',
              margin: '0 0 32px 0',
              lineHeight: '1.6'
            }}>
              Hi <strong style={{ color: '#111827', fontSize: '19px' }}>{'{{name}}'}</strong>,
            </p>

            <h2 style={{
              fontSize: '28px',
              color: '#111827',
              margin: '0 0 16px 0',
              fontWeight: '800',
              lineHeight: '1.3',
              letterSpacing: '-0.5px',
              textAlign: 'center'
            }}>
              Congratulations! 🎉
            </h2>

            <p style={{
              fontSize: '20px',
              color: '#111827',
              margin: '0 0 24px 0',
              lineHeight: '1.5',
              textAlign: 'center',
              fontWeight: '600'
            }}>
              You've Earned New Rewards!
            </p>

            <p style={{
              fontSize: '16px',
              color: '#4B5563',
              margin: '0 0 36px 0',
              lineHeight: '1.8',
              textAlign: 'center'
            }}>
              Thank you for being a loyal customer! Your recent visit has earned you exciting new rewards and brought you closer to exclusive benefits.
            </p>

            {/* Points Earned Banner */}
            <div style={{
              background: 'linear-gradient(135deg, #FEF3C7 0%, #FDE68A 100%)',
              padding: '32px',
              borderRadius: '16px',
              marginBottom: '32px',
              border: '2px solid #F59E0B',
              boxShadow: '0 4px 6px -1px rgba(245, 158, 11, 0.2)',
              textAlign: 'center'
            }}>
              <p style={{
                fontSize: '14px',
                color: '#92400E',
                margin: '0 0 8px 0',
                textTransform: 'uppercase',
                letterSpacing: '1px',
                fontWeight: '600'
              }}>
                Points Earned
              </p>
              <div style={{
                fontSize: '56px',
                fontWeight: '800',
                color: '#D97706',
                letterSpacing: '-2px',
                margin: '0',
                textShadow: '0 2px 4px rgba(217, 119, 6, 0.2)'
              }}>
                +250
              </div>
              <p style={{
                fontSize: '14px',
                color: '#92400E',
                margin: '12px 0 0 0',
                fontWeight: '500'
              }}>
                Total Balance: <strong style={{ fontSize: '18px', color: '#B45309' }}>1,250 points</strong>
              </p>
            </div>

            {/* Rewards Details */}
            <div style={{
              background: 'linear-gradient(135deg, #F9FAFB 0%, #F3F4F6 100%)',
              padding: '32px',
              borderRadius: '12px',
              marginBottom: '32px',
              border: '2px solid #E5E7EB',
              boxShadow: '0 1px 3px 0 rgba(0, 0, 0, 0.05)'
            }}>
              <div style={{
                display: 'flex',
                alignItems: 'center',
                marginBottom: '24px'
              }}>
                <div style={{
                  backgroundColor: '#F59E0B',
                  width: '32px',
                  height: '32px',
                  borderRadius: '6px',
                  display: 'inline-block',
                  lineHeight: '32px',
                  textAlign: 'center',
                  fontSize: '16px',
                  marginRight: '12px'
                }}>
                  🏆
                </div>
                <h3 style={{
                  fontSize: '14px',
                  color: '#111827',
                  margin: '0',
                  fontWeight: '800',
                  textTransform: 'uppercase',
                  letterSpacing: '0.8px'
                }}>
                  Your Rewards
                </h3>
              </div>

              <table style={{ width: '100%' }} cellPadding="0" cellSpacing="0" border={0}>
                <tbody>
                  <tr>
                    <td style={{
                      fontSize: '15px',
                      color: '#374151',
                      padding: '14px 0',
                      borderBottom: '1px solid #E5E7EB',
                      fontWeight: '500'
                    }}>
                      <strong style={{ color: '#111827' }}>🎫 Free Appetizer</strong><br />
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>
                        Redeemable on your next visit
                      </span>
                    </td>
                    <td style={{
                      fontSize: '13px',
                      color: '#059669',
                      padding: '14px 0',
                      textAlign: 'right',
                      fontWeight: '700',
                      borderBottom: '1px solid #E5E7EB',
                      backgroundColor: '#ECFDF5',
                      paddingLeft: '12px',
                      paddingRight: '12px',
                      borderRadius: '4px'
                    }}>
                      UNLOCKED
                    </td>
                  </tr>
                  <tr>
                    <td style={{
                      fontSize: '15px',
                      color: '#374151',
                      padding: '14px 0',
                      borderBottom: '1px solid #E5E7EB',
                      fontWeight: '500'
                    }}>
                      <strong style={{ color: '#111827' }}>💰 10% Off Next Order</strong><br />
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>
                        Valid for 30 days
                      </span>
                    </td>
                    <td style={{
                      fontSize: '13px',
                      color: '#059669',
                      padding: '14px 0',
                      textAlign: 'right',
                      fontWeight: '700',
                      borderBottom: '1px solid #E5E7EB',
                      backgroundColor: '#ECFDF5',
                      paddingLeft: '12px',
                      paddingRight: '12px',
                      borderRadius: '4px'
                    }}>
                      UNLOCKED
                    </td>
                  </tr>
                  <tr>
                    <td style={{
                      fontSize: '15px',
                      color: '#374151',
                      padding: '14px 0',
                      fontWeight: '500'
                    }}>
                      <strong style={{ color: '#111827' }}>⭐ VIP Access</strong><br />
                      <span style={{ fontSize: '13px', color: '#6B7280' }}>
                        Early access to new menu items
                      </span>
                    </td>
                    <td style={{
                      fontSize: '13px',
                      color: '#059669',
                      padding: '14px 0',
                      textAlign: 'right',
                      fontWeight: '700',
                      backgroundColor: '#ECFDF5',
                      paddingLeft: '12px',
                      paddingRight: '12px',
                      borderRadius: '4px'
                    }}>
                      UNLOCKED
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Progress to Next Tier */}
            <div style={{
              background: 'linear-gradient(135deg, #EEF2FF 0%, #E0E7FF 100%)',
              padding: '28px',
              borderRadius: '12px',
              marginBottom: '32px',
              border: '2px solid #C7D2FE'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: '12px'
              }}>
                <h3 style={{
                  fontSize: '15px',
                  color: '#4338CA',
                  margin: '0',
                  fontWeight: '700'
                }}>
                  Progress to Gold Tier
                </h3>
                <span style={{
                  fontSize: '13px',
                  color: '#6366F1',
                  fontWeight: '700'
                }}>
                  250 pts to go
                </span>
              </div>

              {/* Progress Bar */}
              <div style={{
                backgroundColor: '#FFFFFF',
                height: '12px',
                borderRadius: '100px',
                overflow: 'hidden',
                border: '1px solid #C7D2FE'
              }}>
                <div style={{
                  background: 'linear-gradient(90deg, #6366F1 0%, #8B5CF6 100%)',
                  height: '100%',
                  width: '83%',
                  borderRadius: '100px'
                }}></div>
              </div>

              <p style={{
                fontSize: '13px',
                color: '#4338CA',
                margin: '12px 0 0 0',
                fontWeight: '500'
              }}>
                🌟 You're 83% of the way to unlocking <strong>exclusive Gold member benefits!</strong>
              </p>
            </div>

            {/* CTA Button */}
            <div style={{
              textAlign: 'center',
              marginBottom: '32px'
            }}>
              <table cellPadding="0" cellSpacing="0" border={0} style={{ margin: '0 auto' }}>
                <tbody>
                  <tr>
                    <td style={{
                      borderRadius: '8px',
                      background: 'linear-gradient(135deg, #6366F1 0%, #4F46E5 100%)',
                      boxShadow: '0 10px 15px -3px rgba(99, 102, 241, 0.4), 0 4px 6px -2px rgba(99, 102, 241, 0.3)'
                    }}>
                      <a href="#" style={{
                        display: 'inline-block',
                        padding: '18px 48px',
                        fontSize: '16px',
                        color: '#FFFFFF',
                        textDecoration: 'none',
                        fontWeight: '700',
                        borderRadius: '8px',
                        letterSpacing: '0.3px'
                      }}>
                        View All Rewards →
                      </a>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div style={{
              backgroundColor: '#FEF3C7',
              padding: '24px',
              borderRadius: '8px',
              borderLeft: '4px solid #F59E0B',
              marginBottom: '24px'
            }}>
              <p style={{
                fontSize: '14px',
                color: '#92400E',
                margin: '0',
                lineHeight: '1.6',
                fontWeight: '500'
              }}>
                💡 <strong>Pro Tip:</strong> Earn double points on weekdays! Visit us Monday through Thursday and accelerate your journey to the next tier.
              </p>
            </div>

            <div style={{
              borderTop: '2px dashed #E5E7EB',
              margin: '32px 0'
            }}></div>

            <p style={{
              fontSize: '15px',
              color: '#6B7280',
              margin: '0',
              lineHeight: '1.6',
              fontStyle: 'italic',
              textAlign: 'center'
            }}>
              Thank you for being a valued member of the ChefLogik family!
            </p>
          </td>
        </tr>

        {/* Footer */}
        <tr>
          <td style={{
            backgroundColor: '#F9FAFB',
            padding: '40px 32px',
            textAlign: 'center',
            borderTop: '1px solid #E5E7EB'
          }}>
            <div style={{
              marginBottom: '16px'
            }}>
              <span style={{
                fontSize: '24px'
              }}>🍽️</span>
            </div>

            <p style={{
              fontSize: '13px',
              color: '#9CA3AF',
              margin: '0 0 16px 0',
              lineHeight: '1.7'
            }}>
              <strong style={{ color: '#6B7280', fontWeight: '700' }}>ChefLogik Restaurant Management System</strong><br />
              123 Kitchen Street, Suite 400<br />
              San Francisco, CA 94105<br />
              <a href="tel:+15551234567" style={{ color: '#6366F1', textDecoration: 'none', fontWeight: '600' }}>
                (555) 123-4567
              </a>
            </p>

            <div style={{
              borderTop: '1px solid #E5E7EB',
              paddingTop: '16px',
              marginTop: '16px'
            }}>
              <p style={{
                fontSize: '12px',
                color: '#9CA3AF',
                margin: '0 0 12px 0',
                lineHeight: '1.8'
              }}>
                <a href="#" style={{
                  color: '#6366F1',
                  textDecoration: 'none',
                  fontWeight: '600'
                }}>
                  Manage Preferences
                </a>
                {' · '}
                <a href="#" style={{
                  color: '#6366F1',
                  textDecoration: 'none',
                  fontWeight: '600'
                }}>
                  Unsubscribe
                </a>
                {' · '}
                <a href="#" style={{
                  color: '#6366F1',
                  textDecoration: 'none',
                  fontWeight: '600'
                }}>
                  Privacy Policy
                </a>
                {' · '}
                <a href="#" style={{
                  color: '#6366F1',
                  textDecoration: 'none',
                  fontWeight: '600'
                }}>
                  Contact Support
                </a>
              </p>

              <p style={{
                fontSize: '11px',
                color: '#9CA3AF',
                margin: '0',
                lineHeight: '1.6'
              }}>
                You're receiving this email because you're a member of the ChefLogik Loyalty Program.<br />
                To stop receiving loyalty rewards notifications,{' '}
                <a href="#" style={{ color: '#6366F1', textDecoration: 'underline' }}>update your email preferences</a> or{' '}
                <a href="#" style={{ color: '#6366F1', textDecoration: 'underline' }}>unsubscribe here</a>.
              </p>

              <p style={{
                fontSize: '11px',
                color: '#D1D5DB',
                margin: '12px 0 0 0'
              }}>
                © 2026 ChefLogik. All rights reserved.
              </p>
            </div>
          </td>
        </tr>
      </tbody>
    </table>
  );
}
