
import React from 'react';

const AboutUs = ({ onClose, currentTheme }) => {
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
        maxWidth: 800,
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
            🛡️ About FocusGuard
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

        {/* Mission Statement */}
        <div style={{
          padding: '24px',
          background: `linear-gradient(135deg, ${currentTheme.primary}15 0%, ${currentTheme.accent}15 100%)`,
          borderRadius: 12,
          border: `2px solid ${currentTheme.primary}`,
          marginBottom: 32,
          textAlign: 'center'
        }}>
          <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 12, color: currentTheme.text }}>
            🎯 Our Mission
          </div>
          <div style={{ fontSize: 16, lineHeight: 1.6, color: currentTheme.text }}>
            Transforming productivity through intelligent AI that learns, adapts, and grows with you. 
            We believe focus isn't just about time management—it's about understanding your unique patterns 
            and optimizing your mental performance.
          </div>
        </div>

        {/* Key Features Grid */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ 
            fontSize: 22, 
            fontWeight: 700, 
            marginBottom: 20,
            color: currentTheme.text,
            textAlign: 'center'
          }}>
            🚀 What Makes Us Different
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', 
            gap: 16 
          }}>
            <div style={{
              padding: 20,
              backgroundColor: currentTheme.background,
              borderRadius: 12,
              border: `2px solid ${currentTheme.border}`,
              boxShadow: `4px 4px 0px ${currentTheme.shadow}`
            }}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>🧠</div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8, color: currentTheme.text }}>
                AI-Powered Intelligence
              </div>
              <div style={{ fontSize: 14, color: currentTheme.textSecondary, lineHeight: 1.5 }}>
                Machine learning algorithms that analyze your patterns, predict optimal performance windows, 
                and provide personalized recommendations that actually work.
              </div>
            </div>

            <div style={{
              padding: 20,
              backgroundColor: currentTheme.background,
              borderRadius: 12,
              border: `2px solid ${currentTheme.border}`,
              boxShadow: `4px 4px 0px ${currentTheme.shadow}`
            }}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>🔒</div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8, color: currentTheme.text }}>
                Privacy-First Design
              </div>
              <div style={{ fontSize: 14, color: currentTheme.textSecondary, lineHeight: 1.5 }}>
                All AI processing happens locally in your browser. Your data never leaves your device 
                unless you explicitly choose to sync between your own devices.
              </div>
            </div>

            <div style={{
              padding: 20,
              backgroundColor: currentTheme.background,
              borderRadius: 12,
              border: `2px solid ${currentTheme.border}`,
              boxShadow: `4px 4px 0px ${currentTheme.shadow}`
            }}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>📱</div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8, color: currentTheme.text }}>
                Offline-First Experience
              </div>
              <div style={{ fontSize: 14, color: currentTheme.textSecondary, lineHeight: 1.5 }}>
                Works completely offline once loaded. Your productivity doesn't depend on internet 
                connectivity, making it perfect for any environment.
              </div>
            </div>

            <div style={{
              padding: 20,
              backgroundColor: currentTheme.background,
              borderRadius: 12,
              border: `2px solid ${currentTheme.border}`,
              boxShadow: `4px 4px 0px ${currentTheme.shadow}`
            }}>
              <div style={{ fontSize: 24, marginBottom: 12 }}>🎮</div>
              <div style={{ fontWeight: 600, fontSize: 16, marginBottom: 8, color: currentTheme.text }}>
                Gamified Progress
              </div>
              <div style={{ fontSize: 14, color: currentTheme.textSecondary, lineHeight: 1.5 }}>
                70+ achievements, progressive leveling system, and reward shop that makes building 
                focus habits engaging and sustainable.
              </div>
            </div>
          </div>
        </div>

        {/* Technology Stack */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ 
            fontSize: 22, 
            fontWeight: 700, 
            marginBottom: 20,
            color: currentTheme.text,
            textAlign: 'center'
          }}>
            ⚙️ Built with Modern Technology
          </h3>
          
          <div style={{
            padding: 20,
            backgroundColor: currentTheme.background,
            borderRadius: 12,
            border: `2px solid ${currentTheme.border}`,
            boxShadow: `2px 2px 0px ${currentTheme.shadow}`
          }}>
            <div style={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', 
              gap: 16,
              fontSize: 14,
              color: currentTheme.textSecondary 
            }}>
              <div>
                <div style={{ fontWeight: 600, color: currentTheme.text, marginBottom: 8 }}>Frontend</div>
                <div>React 18 with Modern Hooks</div>
                <div>Responsive CSS Design</div>
                <div>Progressive Web App</div>
              </div>
              <div>
                <div style={{ fontWeight: 600, color: currentTheme.text, marginBottom: 8 }}>AI Engine</div>
                <div>Custom ML Algorithms</div>
                <div>Pattern Recognition</div>
                <div>Predictive Analytics</div>
              </div>
              <div>
                <div style={{ fontWeight: 600, color: currentTheme.text, marginBottom: 8 }}>Storage</div>
                <div>Local Browser Storage</div>
                <div>Auto-Migration System</div>
                <div>Secure Device Sync</div>
              </div>
              <div>
                <div style={{ fontWeight: 600, color: currentTheme.text, marginBottom: 8 }}>Performance</div>
                <div>Vite Build System</div>
                <div>Code Splitting</div>
                <div>Optimized Bundle</div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics */}
        <div style={{ marginBottom: 32 }}>
          <h3 style={{ 
            fontSize: 22, 
            fontWeight: 700, 
            marginBottom: 20,
            color: currentTheme.text,
            textAlign: 'center'
          }}>
            📊 By the Numbers
          </h3>
          
          <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', 
            gap: 16,
            textAlign: 'center'
          }}>
            <div style={{
              padding: 16,
              backgroundColor: currentTheme.background,
              borderRadius: 8,
              border: `1px solid ${currentTheme.border}`
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: currentTheme.primary }}>70+</div>
              <div style={{ fontSize: 12, color: currentTheme.textSecondary }}>Features</div>
            </div>
            <div style={{
              padding: 16,
              backgroundColor: currentTheme.background,
              borderRadius: 8,
              border: `1px solid ${currentTheme.border}`
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: currentTheme.primary }}>3,500+</div>
              <div style={{ fontSize: 12, color: currentTheme.textSecondary }}>Lines of Code</div>
            </div>
            <div style={{
              padding: 16,
              backgroundColor: currentTheme.background,
              borderRadius: 8,
              border: `1px solid ${currentTheme.border}`
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: currentTheme.primary }}>100%</div>
              <div style={{ fontSize: 12, color: currentTheme.textSecondary }}>Open Source</div>
            </div>
            <div style={{
              padding: 16,
              backgroundColor: currentTheme.background,
              borderRadius: 8,
              border: `1px solid ${currentTheme.border}`
            }}>
              <div style={{ fontSize: 24, fontWeight: 700, color: currentTheme.primary }}>0%</div>
              <div style={{ fontSize: 12, color: currentTheme.textSecondary }}>Data Collection</div>
            </div>
          </div>
        </div>

        {/* Developer Section */}
        <div style={{
          padding: 24,
          background: `linear-gradient(135deg, ${currentTheme.cardBg} 0%, ${currentTheme.background} 100%)`,
          borderRadius: 12,
          border: `2px solid ${currentTheme.border}`,
          marginBottom: 24,
          textAlign: 'center'
        }}>
          <h3 style={{ 
            fontSize: 20, 
            fontWeight: 700, 
            marginBottom: 16,
            color: currentTheme.text
          }}>
            👨‍💻 Meet the Creator
          </h3>
          <div style={{ fontSize: 15, color: currentTheme.textSecondary, lineHeight: 1.6, marginBottom: 16 }}>
            FocusGuard is created with passion by an indie developer who believes in the power of 
            technology to solve real productivity challenges. Built from personal experience with 
            focus struggles and a deep understanding of cognitive science.
          </div>
          <div style={{ fontSize: 14, color: currentTheme.textSecondary, fontStyle: 'italic' }}>
            "Every feature is battle-tested in my own productivity journey" - Creator
          </div>
        </div>

        {/* Future Vision */}
        <div style={{
          padding: 20,
          backgroundColor: currentTheme.background,
          borderRadius: 12,
          border: `2px solid ${currentTheme.border}`,
          textAlign: 'center'
        }}>
          <h3 style={{ 
            fontSize: 20, 
            fontWeight: 700, 
            marginBottom: 12,
            color: currentTheme.text
          }}>
            🔮 Our Vision
          </h3>
          <div style={{ fontSize: 15, color: currentTheme.textSecondary, lineHeight: 1.6 }}>
            To create the world's most intelligent productivity assistant that adapts to each person's 
            unique cognitive patterns, helping millions achieve their goals through better focus and 
            sustainable productivity habits.
          </div>
        </div>

        {/* Close Button */}
        <div style={{ textAlign: 'center', marginTop: 32 }}>
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

export default AboutUs;
