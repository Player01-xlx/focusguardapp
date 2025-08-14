
import React, { useState } from 'react';

// Embedded FeedbackForm component
const FeedbackForm = ({ currentTheme }) => {
  const [feedbackType, setFeedbackType] = useState('suggestion');
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const feedbackData = {
      type: feedbackType,
      rating: feedbackType === 'rating' ? rating : null,
      title: title.trim(),
      description: description.trim(),
      email: email.trim(),
      timestamp: new Date().toISOString(),
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    try {
      const existingFeedback = JSON.parse(localStorage.getItem('fg_feedback') || '[]');
      existingFeedback.push(feedbackData);
      localStorage.setItem('fg_feedback', JSON.stringify(existingFeedback));
    } catch (error) {
      console.warn('Failed to save feedback locally:', error);
    }

    try {
      const formData = new FormData();
      formData.append('_to', 'techxtechnologies2671@gmail.com');
      formData.append('_subject', `FocusGuard ${feedbackType === 'bug' ? 'Bug Report' : feedbackType === 'suggestion' ? 'Feature Request' : 'Feedback'}: ${title}`);
      formData.append('_template', 'table');
      formData.append('_captcha', 'false');
      
      formData.append('Feedback Type', feedbackType.charAt(0).toUpperCase() + feedbackType.slice(1));
      if (feedbackType === 'rating') {
        formData.append('Rating', `${rating}/5 stars`);
      }
      formData.append('Title', title);
      formData.append('Description', description);
      formData.append('User Email', email || 'No email provided');
      formData.append('Submitted', new Date().toLocaleString());
      formData.append('Browser', navigator.userAgent);
      formData.append('URL', window.location.href);
      
      const response = await fetch('https://formsubmit.co/ajax/techxtechnologies2671@gmail.com', {
        method: 'POST',
        body: formData
      });

      const result = await response.json();
      
      if (response.ok && result.success) {
        console.log('✅ Feedback sent successfully via FormSubmit');
        setSubmitted(true);
      } else {
        throw new Error('FormSubmit failed');
      }
    } catch (error) {
      console.warn('Failed to send feedback via service, falling back to mailto:', error);
      
      const emailSubject = `FocusGuard ${feedbackType === 'bug' ? 'Bug Report' : feedbackType === 'suggestion' ? 'Feature Request' : 'Feedback'}: ${title}`;
      const emailBody = `
Feedback Type: ${feedbackType.charAt(0).toUpperCase() + feedbackType.slice(1)}
${feedbackType === 'rating' ? `Rating: ${rating}/5 stars\n` : ''}
Title: ${title}

Description:
${description}

${email ? `User Email (for response): ${email}\n` : ''}
Submitted: ${new Date().toLocaleString()}
Browser: ${navigator.userAgent}
URL: ${window.location.href}
      `.trim();

      const mailtoLink = `mailto:techxtechnologies2671@gmail.com?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
      
      setSubmitted(true);
      
      setTimeout(() => {
        window.location.href = mailtoLink;
      }, 1500);
    }
  };

  const getRatingEmoji = (score) => {
    const emojis = ['😞', '😕', '😐', '😊', '🤩'];
    return emojis[score - 1] || '⭐';
  };

  if (submitted) {
    return (
      <div style={{
        padding: '40px',
        backgroundColor: currentTheme.cardBg,
        borderRadius: 16,
        textAlign: 'center',
        boxShadow: `8px 8px 0px ${currentTheme.shadow}`,
        border: `3px solid ${currentTheme.border}`,
        color: currentTheme.text
      }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>🎉</div>
        <h3 style={{ margin: 0, marginBottom: 16, color: currentTheme.text }}>
          Thank You!
        </h3>
        <p style={{ fontSize: 16, marginBottom: 24, color: currentTheme.textSecondary }}>
          Your feedback has been received. We truly appreciate you taking the time to help us improve FocusGuard!
        </p>
        <button 
          style={{
            backgroundColor: currentTheme.primary,
            color: currentTheme.secondary,
            border: `2px solid ${currentTheme.border}`,
            padding: '12px 32px',
            borderRadius: 8,
            fontSize: 16,
            fontWeight: 600,
            cursor: 'pointer',
            boxShadow: `4px 4px 0px ${currentTheme.shadow}`
          }}
          onClick={() => {
            setSubmitted(false);
            setFeedbackType('suggestion');
            setRating(0);
            setTitle('');
            setDescription('');
            setEmail('');
          }}
        >
          Send Another Feedback
        </button>
      </div>
    );
  }

  return (
    <div style={{
      backgroundColor: currentTheme.cardBg,
      padding: '32px',
      borderRadius: 16,
      boxShadow: `8px 8px 0px ${currentTheme.shadow}`,
      border: `3px solid ${currentTheme.border}`,
      color: currentTheme.text
    }}>
      <form onSubmit={handleSubmit}>
        {/* Feedback Type Selection */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ 
            display: 'block', 
            fontSize: 16, 
            fontWeight: 600, 
            marginBottom: 12,
            color: currentTheme.text
          }}>
            What type of feedback do you have?
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
            {[
              { value: 'suggestion', emoji: '💡', label: 'Suggestion' },
              { value: 'bug', emoji: '🐛', label: 'Bug Report' },
              { value: 'rating', emoji: '⭐', label: 'Rating' }
            ].map(type => (
              <button
                key={type.value}
                type="button"
                onClick={() => setFeedbackType(type.value)}
                style={{
                  padding: '16px 8px',
                  borderRadius: 12,
                  border: `2px solid ${feedbackType === type.value ? currentTheme.primary : currentTheme.border}`,
                  backgroundColor: feedbackType === type.value ? `${currentTheme.primary}20` : currentTheme.background,
                  cursor: 'pointer',
                  textAlign: 'center',
                  fontSize: 14,
                  fontWeight: 600,
                  color: currentTheme.text
                }}
              >
                <div style={{ fontSize: 24, marginBottom: 4 }}>{type.emoji}</div>
                {type.label}
              </button>
            ))}
          </div>
        </div>

        {/* Rating Stars (only for rating feedback) */}
        {feedbackType === 'rating' && (
          <div style={{ marginBottom: 24 }}>
            <label style={{ 
              display: 'block', 
              fontSize: 16, 
              fontWeight: 600, 
              marginBottom: 12,
              color: currentTheme.text
            }}>
              How would you rate FocusGuard?
            </label>
            <div style={{ 
              display: 'flex', 
              gap: 8, 
              alignItems: 'center',
              justifyContent: 'center',
              marginBottom: 12
            }}>
              {[1, 2, 3, 4, 5].map(star => (
                <button
                  key={star}
                  type="button"
                  onClick={() => setRating(star)}
                  style={{
                    background: 'none',
                    border: 'none',
                    fontSize: 32,
                    cursor: 'pointer',
                    color: star <= rating ? '#f59e0b' : '#d1d5db',
                    transition: 'color 0.2s ease'
                  }}
                >
                  ⭐
                </button>
              ))}
            </div>
            {rating > 0 && (
              <div style={{ 
                textAlign: 'center', 
                fontSize: 18, 
                marginBottom: 8 
              }}>
                {getRatingEmoji(rating)}
              </div>
            )}
            <div style={{ 
              textAlign: 'center', 
              fontSize: 12, 
              color: currentTheme.textSecondary 
            }}>
              {rating === 0 ? 'Click to rate' :
               rating === 1 ? 'Poor - Needs major improvements' :
               rating === 2 ? 'Fair - Some issues to fix' :
               rating === 3 ? 'Good - Works well overall' :
               rating === 4 ? 'Very Good - Really helpful!' :
               'Excellent - Love it!'}
            </div>
          </div>
        )}

        {/* Title */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            display: 'block', 
            fontSize: 16, 
            fontWeight: 600, 
            marginBottom: 8,
            color: currentTheme.text
          }}>
            Title <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder={
              feedbackType === 'suggestion' ? 'Brief description of your suggestion...' :
              feedbackType === 'bug' ? 'Brief description of the bug...' :
              'What would you like to tell us?'
            }
            required
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 8,
              border: `2px solid ${currentTheme.border}`,
              backgroundColor: currentTheme.background,
              color: currentTheme.text,
              fontSize: 14,
              outline: 'none'
            }}
          />
        </div>

        {/* Description */}
        <div style={{ marginBottom: 20 }}>
          <label style={{ 
            display: 'block', 
            fontSize: 16, 
            fontWeight: 600, 
            marginBottom: 8,
            color: currentTheme.text
          }}>
            Details <span style={{ color: '#dc2626' }}>*</span>
          </label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder={
              feedbackType === 'suggestion' ? 
              'Describe your feature idea in detail. What problem would it solve? How would it work?' :
              feedbackType === 'bug' ? 
              'Please describe what happened, what you expected to happen, and steps to reproduce the issue.' :
              'Tell us more about your experience with FocusGuard...'
            }
            required
            rows={6}
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 8,
              border: `2px solid ${currentTheme.border}`,
              backgroundColor: currentTheme.background,
              color: currentTheme.text,
              fontSize: 14,
              resize: 'vertical',
              outline: 'none'
            }}
          />
        </div>

        {/* Email (optional) */}
        <div style={{ marginBottom: 24 }}>
          <label style={{ 
            display: 'block', 
            fontSize: 16, 
            fontWeight: 600, 
            marginBottom: 8,
            color: currentTheme.text
          }}>
            Email (optional)
          </label>
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="your.email@example.com (if you'd like a response)"
            style={{
              width: '100%',
              padding: '12px 16px',
              borderRadius: 8,
              border: `2px solid ${currentTheme.border}`,
              backgroundColor: currentTheme.background,
              color: currentTheme.text,
              fontSize: 14,
              outline: 'none'
            }}
          />
          <div style={{ 
            fontSize: 12, 
            color: currentTheme.textSecondary, 
            marginTop: 4 
          }}>
            We'll only use this to respond to your feedback if needed.
          </div>
        </div>

        {/* Submit Button */}
        <div style={{ textAlign: 'center' }}>
          <button 
            type="submit"
            disabled={!title.trim() || !description.trim() || (feedbackType === 'rating' && rating === 0)}
            style={{
              backgroundColor: (!title.trim() || !description.trim() || (feedbackType === 'rating' && rating === 0)) 
                ? '#9ca3af' : currentTheme.primary,
              color: currentTheme.secondary,
              border: `2px solid ${currentTheme.border}`,
              padding: '12px 24px',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: (!title.trim() || !description.trim() || (feedbackType === 'rating' && rating === 0)) 
                ? 'not-allowed' : 'pointer',
              boxShadow: `4px 4px 0px ${currentTheme.shadow}`
            }}
          >
            {feedbackType === 'suggestion' ? '💡 Send Suggestion' :
             feedbackType === 'bug' ? '🐛 Report Bug' :
             '⭐ Submit Rating'}
          </button>
        </div>
      </form>
    </div>
  );
};

const ContactUs = ({ onClose, currentTheme }) => {
  const [copiedItem, setCopiedItem] = useState('');

  const handleCopy = (text, itemName) => {
    navigator.clipboard.writeText(text).then(() => {
      setCopiedItem(itemName);
      setTimeout(() => setCopiedItem(''), 2000);
    });
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.8)',
      zIndex: 2000,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      overflow: 'auto'
    }}>
      <div style={{
        backgroundColor: currentTheme.cardBg,
        padding: '32px',
        borderRadius: 16,
        maxWidth: 700,
        width: '100%',
        maxHeight: '90vh',
        overflow: 'auto',
        boxShadow: `8px 8px 0px ${currentTheme.shadow}`,
        border: `3px solid ${currentTheme.border}`,
        color: currentTheme.text
      }}>
        {/* Header */}
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: 32,
          borderBottom: `2px solid ${currentTheme.border}`,
          paddingBottom: 16
        }}>
          <h2 style={{ 
            margin: 0, 
            fontSize: 28, 
            fontWeight: 700,
            display: 'flex',
            alignItems: 'center',
            gap: 12
          }}>
            📞 Contact Us
          </h2>
          <button 
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: currentTheme.textSecondary,
              padding: 8,
              borderRadius: 8,
              transition: 'all 0.2s ease'
            }}
            onClick={onClose}
            onMouseOver={(e) => {
              e.target.style.backgroundColor = currentTheme.accent;
              e.target.style.color = currentTheme.text;
            }}
            onMouseOut={(e) => {
              e.target.style.backgroundColor = 'transparent';
              e.target.style.color = currentTheme.textSecondary;
            }}
          >
            ✖
          </button>
        </div>

        {/* Introduction */}
        <div style={{
          padding: '20px',
          background: `linear-gradient(135deg, ${currentTheme.primary}15 0%, ${currentTheme.accent}15 100%)`,
          borderRadius: 12,
          border: `2px solid ${currentTheme.primary}`,
          marginBottom: 32,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 12, color: currentTheme.text }}>
            💬 Let's Connect!
          </div>
          <div style={{ fontSize: 15, lineHeight: 1.6, color: currentTheme.text }}>
            We'd love to hear from you! Whether you have questions, feedback, feature requests, 
            or just want to share your productivity journey with FocusGuard.
          </div>
        </div>

        {/* Contact Methods */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ 
            fontSize: 22, 
            fontWeight: 700, 
            marginBottom: 24,
            color: currentTheme.text,
            textAlign: 'center'
          }}>
            🚀 Get in Touch
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px',
                backgroundColor: currentTheme.background,
                borderRadius: 12,
                border: `2px solid ${currentTheme.border}`,
                boxShadow: `4px 4px 0px ${currentTheme.shadow}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => handleCopy('techxtechnologies2671@gmail.com', 'email')}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = `6px 6px 0px ${currentTheme.shadow}`;
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0px)';
                e.target.style.boxShadow = `4px 4px 0px ${currentTheme.shadow}`;
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  backgroundColor: '#ea4335',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24
                }}>
                  📧
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: currentTheme.text }}>
                    Email Support
                  </div>
                  <div style={{ fontSize: 14, color: currentTheme.textSecondary, marginBottom: 2 }}>
                    techxtechnologies2671@gmail.com
                  </div>
                  <div style={{ fontSize: 12, color: currentTheme.textSecondary }}>
                    Best for: Feature requests, bug reports, partnerships
                  </div>
                </div>
              </div>
              <div style={{
                backgroundColor: copiedItem === 'email' ? '#22c55e' : currentTheme.primary,
                color: '#fff',
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}>
                {copiedItem === 'email' ? '✓ Copied!' : 'Click to Copy'}
              </div>
            </div>

            {/* Phone/WhatsApp */}
            <div 
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '20px',
                backgroundColor: currentTheme.background,
                borderRadius: 12,
                border: `2px solid ${currentTheme.border}`,
                boxShadow: `4px 4px 0px ${currentTheme.shadow}`,
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
              onClick={() => handleCopy('+63 961 377 7353', 'phone')}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = `6px 6px 0px ${currentTheme.shadow}`;
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0px)';
                e.target.style.boxShadow = `4px 4px 0px ${currentTheme.shadow}`;
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{
                  width: 48,
                  height: 48,
                  backgroundColor: '#25d366',
                  borderRadius: 12,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24
                }}>
                  📱
                </div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16, marginBottom: 4, color: currentTheme.text }}>
                    Phone / WhatsApp
                  </div>
                  <div style={{ fontSize: 14, color: currentTheme.textSecondary, marginBottom: 2 }}>
                    +63 961 377 7353
                  </div>
                  <div style={{ fontSize: 12, color: currentTheme.textSecondary }}>
                    Best for: Urgent issues, direct communication
                  </div>
                </div>
              </div>
              <div style={{
                backgroundColor: copiedItem === 'phone' ? '#22c55e' : currentTheme.primary,
                color: '#fff',
                padding: '8px 16px',
                borderRadius: 8,
                fontSize: 12,
                fontWeight: 600,
                transition: 'all 0.2s ease'
              }}>
                {copiedItem === 'phone' ? '✓ Copied!' : 'Click to Copy'}
              </div>
            </div>
          </div>
        </div>

        {/* Social Media Links */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ 
            fontSize: 22, 
            fontWeight: 700, 
            marginBottom: 20,
            color: currentTheme.text,
            textAlign: 'center'
          }}>
            🌟 Follow Our Journey
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <a 
              href="https://www.youtube.com/@ctrlaltstudy-g1z" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                backgroundColor: '#ff0000',
                color: '#fff',
                borderRadius: 12,
                border: '2px solid #ff0000',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(255, 0, 0, 0.3)',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(255, 0, 0, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0px)';
                e.target.style.boxShadow = '0 4px 12px rgba(255, 0, 0, 0.3)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 24 }}>🎥</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>YouTube Channel</div>
                  <div style={{ fontSize: 13, opacity: 0.9 }}>Ctrl+Alt+Study • Productivity tips and tutorials</div>
                </div>
              </div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Subscribe →</div>
            </a>

            <a 
              href="https://www.tiktok.com/@focusguard101?is_from_webapp=1&sender_device=pc" 
              target="_blank" 
              rel="noopener noreferrer"
              style={{
                textDecoration: 'none',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '16px 20px',
                backgroundColor: '#000',
                color: '#fff',
                borderRadius: 12,
                border: '2px solid #000',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 12px rgba(0, 0, 0, 0.3)',
                cursor: 'pointer'
              }}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(0, 0, 0, 0.5)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0px)';
                e.target.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.3)';
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ fontSize: 24 }}>📱</div>
                <div>
                  <div style={{ fontWeight: 700, fontSize: 16 }}>TikTok</div>
                  <div style={{ fontSize: 13, opacity: 0.9 }}>@focusguard101 • Quick productivity tips</div>
                </div>
              </div>
              <div style={{ fontSize: 12, opacity: 0.8 }}>Follow →</div>
            </a>
          </div>
        </div>

        

        {/* Support the Creator */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ 
            fontSize: 22, 
            fontWeight: 700, 
            marginBottom: 20,
            color: currentTheme.text,
            textAlign: 'center'
          }}>
            💝 Support FocusGuard
          </h3>
          
          <div style={{
            padding: 20,
            backgroundColor: currentTheme.background,
            borderRadius: 12,
            border: `2px solid ${currentTheme.border}`,
            textAlign: 'center',
            marginBottom: 24
          }}>
            <div style={{ fontSize: 16, marginBottom: 16, color: currentTheme.text }}>
              Love FocusGuard? Help us keep improving!
            </div>
            
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: '16px 24px',
                background: 'linear-gradient(135deg, #0066ff 0%, #004dd9 100%)',
                color: '#fff',
                borderRadius: 12,
                border: '2px solid #0066ff',
                cursor: 'pointer',
                transition: 'all 0.2s ease',
                boxShadow: '0 4px 16px rgba(0, 102, 255, 0.3)',
                textDecoration: 'none',
                fontSize: 15,
                fontWeight: 600
              }}
              onClick={() => handleCopy('09613777353', 'gcash')}
              onMouseOver={(e) => {
                e.target.style.transform = 'translateY(-2px)';
                e.target.style.boxShadow = '0 6px 20px rgba(0, 102, 255, 0.4)';
              }}
              onMouseOut={(e) => {
                e.target.style.transform = 'translateY(0px)';
                e.target.style.boxShadow = '0 4px 16px rgba(0, 102, 255, 0.3)';
              }}
            >
              <span style={{ fontSize: 20, marginRight: 12 }}>☕</span>
              Buy Me a Coffee - GCash: 09613777353
              <span style={{ 
                marginLeft: 12, 
                fontSize: 11,
                backgroundColor: 'rgba(255,255,255,0.2)',
                padding: '4px 8px',
                borderRadius: 6
              }}>
                {copiedItem === 'gcash' ? '✓ Copied!' : 'Click to Copy'}
              </span>
            </div>
            
            <div style={{ fontSize: 12, color: currentTheme.textSecondary, marginTop: 16, lineHeight: 1.4 }}>
              <div style={{ marginBottom: 8 }}>
                💡 <strong>Your support helps us:</strong>
              </div>
              <div>• 🚀 Add new AI features</div>
              <div>• 🛠️ Fix bugs and improve performance</div>
              <div>• 📱 Develop mobile apps</div>
              <div>• 🌟 Keep FocusGuard free for everyone</div>
            </div>
          </div>
        </div>

        {/* Contact Guidelines */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ 
            fontSize: 22, 
            fontWeight: 700, 
            marginBottom: 20,
            color: currentTheme.text,
            textAlign: 'center'
          }}>
            📞 Best Ways to Reach Us
          </h3>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{
              padding: 16,
              backgroundColor: currentTheme.background,
              borderRadius: 8,
              border: `1px solid ${currentTheme.border}`
            }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: currentTheme.text }}>
                📧 General Inquiries & Support
              </div>
              <div style={{ fontSize: 13, color: currentTheme.textSecondary }}>
                Use email for non-urgent questions, account help, and general support requests.
              </div>
            </div>
            
            <div style={{
              padding: 16,
              backgroundColor: currentTheme.background,
              borderRadius: 8,
              border: `1px solid ${currentTheme.border}`
            }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: currentTheme.text }}>
                📱 Urgent Issues
              </div>
              <div style={{ fontSize: 13, color: currentTheme.textSecondary }}>
                WhatsApp or call for urgent technical issues or time-sensitive matters.
              </div>
            </div>
            
            <div style={{
              padding: 16,
              backgroundColor: currentTheme.background,
              borderRadius: 8,
              border: `1px solid ${currentTheme.border}`
            }}>
              <div style={{ fontWeight: 600, fontSize: 14, marginBottom: 6, color: currentTheme.text }}>
                🤝 Business & Partnerships
              </div>
              <div style={{ fontSize: 13, color: currentTheme.textSecondary }}>
                Email us for collaboration opportunities, business partnerships, or media inquiries.
              </div>
            </div>
          </div>
        </div>

        {/* Response Time */}
        <div style={{
          padding: 16,
          backgroundColor: currentTheme.background,
          borderRadius: 8,
          border: `1px solid ${currentTheme.border}`,
          textAlign: 'center',
          marginBottom: 24
        }}>
          <div style={{ fontSize: 14, color: currentTheme.textSecondary }}>
            📅 <strong>Response Time:</strong> We typically respond within 24-48 hours.<br/>
            For urgent issues, please use WhatsApp for faster response.
          </div>
        </div>

        {/* Feedback Form Section */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ 
            fontSize: 22, 
            fontWeight: 700, 
            marginBottom: 20,
            color: currentTheme.text,
            textAlign: 'center'
          }}>
            💬 Send Us Feedback
          </h3>
          
          <FeedbackForm currentTheme={currentTheme} />
        </div>

        {/* Close Button */}
        <div style={{ textAlign: 'center' }}>
          <button 
            style={{
              backgroundColor: currentTheme.primary,
              color: currentTheme.secondary,
              border: `2px solid ${currentTheme.border}`,
              padding: '12px 32px',
              borderRadius: 8,
              fontSize: 16,
              fontWeight: 600,
              cursor: 'pointer',
              boxShadow: `4px 4px 0px ${currentTheme.shadow}`,
              transition: 'all 0.2s ease'
            }}
            onClick={onClose}
            onMouseOver={(e) => {
              e.target.style.transform = 'translateY(-2px)';
              e.target.style.boxShadow = `6px 6px 0px ${currentTheme.shadow}`;
            }}
            onMouseOut={(e) => {
              e.target.style.transform = 'translateY(0px)';
              e.target.style.boxShadow = `4px 4px 0px ${currentTheme.shadow}`;
            }}
          >
            Back to Focus
          </button>
        </div>
      </div>
    </div>
  );
};

export default ContactUs;
