
import React, { useState } from 'react';

const FeedbackPage = ({ onClose, currentTheme }) => {
  const [feedbackType, setFeedbackType] = useState('suggestion');
  const [rating, setRating] = useState(0);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Create feedback data object
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

    // Save to localStorage as backup
    try {
      const existingFeedback = JSON.parse(localStorage.getItem('fg_feedback') || '[]');
      existingFeedback.push(feedbackData);
      localStorage.setItem('fg_feedback', JSON.stringify(existingFeedback));
    } catch (error) {
      console.warn('Failed to save feedback locally:', error);
    }

    // Send email using EmailJS or FormSubmit service
    try {
      const formData = new FormData();
      formData.append('_to', 'techxtechnologies2671@gmail.com');
      formData.append('_subject', `FocusGuard ${feedbackType === 'bug' ? 'Bug Report' : feedbackType === 'suggestion' ? 'Feature Request' : 'Feedback'}: ${title}`);
      formData.append('_template', 'table');
      formData.append('_captcha', 'false');
      
      // Add form fields
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
      
      // Use FormSubmit.co service (free and reliable)
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
      
      // Fallback to mailto link
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
      
      // Auto-open email client
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
        padding: 20
      }}>
        <div style={{
          backgroundColor: currentTheme.cardBg,
          padding: '40px',
          borderRadius: 16,
          maxWidth: 500,
          width: '100%',
          textAlign: 'center',
          boxShadow: `8px 8px 0px ${currentTheme.shadow}`,
          border: `3px solid ${currentTheme.border}`,
          color: currentTheme.text
        }}>
          <div style={{ fontSize: 48, marginBottom: 20 }}>🎉</div>
          <h2 style={{ margin: 0, marginBottom: 16, color: currentTheme.text }}>
            Thank You!
          </h2>
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
            onClick={onClose}
          >
            Back to Focus
          </button>
        </div>
      </div>
    );
  }

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
        maxWidth: 600,
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
            💬 Share Your Feedback
          </h2>
          <button 
            style={{
              backgroundColor: 'transparent',
              border: 'none',
              fontSize: 24,
              cursor: 'pointer',
              color: currentTheme.textSecondary,
              padding: 8,
              borderRadius: 8
            }}
            onClick={onClose}
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
          <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8, color: currentTheme.text }}>
            Help Us Improve FocusGuard!
          </div>
          <div style={{ fontSize: 14, color: currentTheme.textSecondary }}>
            Your feedback shapes the future of our productivity app. Every suggestion matters!
          </div>
        </div>

        {/* Feedback Form */}
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
                    onMouseOver={(e) => {
                      if (star <= rating) return;
                      e.target.style.color = '#fbbf24';
                    }}
                    onMouseOut={(e) => {
                      e.target.style.color = star <= rating ? '#f59e0b' : '#d1d5db';
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

          {/* Privacy Note */}
          <div style={{
            padding: 16,
            backgroundColor: currentTheme.background,
            borderRadius: 8,
            border: `1px solid ${currentTheme.border}`,
            marginBottom: 24
          }}>
            <div style={{ fontSize: 12, color: currentTheme.textSecondary }}>
              🔒 <strong>Privacy:</strong> Your feedback is stored locally and will be included in an email to our team. 
              We don't collect any personal data beyond what you provide here.
            </div>
          </div>

          {/* Submit Buttons */}
          <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
            <button 
              type="button"
              style={{
                backgroundColor: 'transparent',
                color: currentTheme.textSecondary,
                border: `2px solid ${currentTheme.border}`,
                padding: '12px 24px',
                borderRadius: 8,
                fontSize: 14,
                cursor: 'pointer'
              }}
              onClick={onClose}
            >
              Cancel
            </button>
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
    </div>
  );
};

export default FeedbackPage;
