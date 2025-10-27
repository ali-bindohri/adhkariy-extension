// Toast Notification System for Islamic Adhkar Reminder
// Optional custom toast overlays for enhanced user experience

export class ToastManager {
  constructor() {
    this.toastContainer = null;
    this.activeToasts = new Set();
    this.initialize();
  }

  initialize() {
    // Create toast container if it doesn't exist
    if (!document.getElementById('toast-container')) {
      this.toastContainer = document.createElement('div');
      this.toastContainer.id = 'toast-container';
      this.toastContainer.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 10000;
        display: flex;
        flex-direction: column;
        gap: 12px;
        max-width: 400px;
      `;
      document.body.appendChild(this.toastContainer);
    }
  }

  show(options = {}) {
    const {
      message = '',
      arabic = '',
      transliteration = '',
      translation = '',
      type = 'default', // default, success, warning, error
      duration = 10000, // 10 seconds
      autoClose = true,
      onClose = null
    } = options;

    const toast = this.createToast({
      message,
      arabic,
      transliteration,
      translation,
      type,
      autoClose
    });

    this.toastContainer.appendChild(toast);
    this.activeToasts.add(toast);

    // Animate in
    setTimeout(() => {
      toast.classList.add('show');
    }, 10);

    // Auto close
    if (autoClose && duration > 0) {
      setTimeout(() => {
        this.closeToast(toast, onClose);
      }, duration);
    }

    return toast;
  }

  createToast({ message, arabic, transliteration, translation, type, autoClose }) {
    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.cssText = `
      background: white;
      border-radius: 12px;
      padding: 20px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.15);
      transform: translateX(400px);
      opacity: 0;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border-left: 4px solid ${this.getTypeColor(type)};
      max-width: 380px;
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Arial, sans-serif;
    `;

    // Header
    const header = document.createElement('div');
    header.style.cssText = `
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 12px;
    `;

    const title = document.createElement('div');
    title.style.cssText = `
      font-size: 16px;
      font-weight: 600;
      color: #333;
      display: flex;
      align-items: center;
      gap: 8px;
    `;
    title.innerHTML = `<span>${this.getTypeIcon(type)}</span><span>اذكر الله - Remember Allah</span>`;
    header.appendChild(title);

    // Close button
    const closeBtn = document.createElement('button');
    closeBtn.innerHTML = '✕';
    closeBtn.style.cssText = `
      background: none;
      border: none;
      font-size: 20px;
      color: #999;
      cursor: pointer;
      padding: 0;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 4px;
      transition: all 0.2s;
    `;
    closeBtn.onmouseover = () => {
      closeBtn.style.background = '#f0f0f0';
      closeBtn.style.color = '#333';
    };
    closeBtn.onmouseout = () => {
      closeBtn.style.background = 'none';
      closeBtn.style.color = '#999';
    };
    closeBtn.onclick = () => this.closeToast(toast);
    header.appendChild(closeBtn);

    toast.appendChild(header);

    // Content
    const content = document.createElement('div');
    content.style.cssText = `
      display: flex;
      flex-direction: column;
      gap: 12px;
    `;

    if (arabic) {
      const arabicText = document.createElement('div');
      arabicText.textContent = arabic;
      arabicText.style.cssText = `
        font-size: 22px;
        font-weight: 700;
        color: #2e7d32;
        direction: rtl;
        text-align: right;
        line-height: 1.8;
        padding: 8px 0;
      `;
      content.appendChild(arabicText);
    }

    if (transliteration) {
      const transliterationText = document.createElement('div');
      transliterationText.textContent = transliteration;
      transliterationText.style.cssText = `
        font-size: 14px;
        font-style: italic;
        color: #666;
        line-height: 1.6;
      `;
      content.appendChild(transliterationText);
    }

    if (translation) {
      const translationText = document.createElement('div');
      translationText.textContent = translation;
      translationText.style.cssText = `
        font-size: 14px;
        color: #333;
        line-height: 1.6;
        padding-top: 8px;
        border-top: 1px solid #e0e0e0;
      `;
      content.appendChild(translationText);
    }

    if (message) {
      const messageText = document.createElement('div');
      messageText.textContent = message;
      messageText.style.cssText = `
        font-size: 14px;
        color: #333;
        line-height: 1.6;
      `;
      content.appendChild(messageText);
    }

    toast.appendChild(content);

    // Add show class styles
    const style = document.createElement('style');
    style.textContent = `
      .toast.show {
        transform: translateX(0) !important;
        opacity: 1 !important;
      }
      .toast.hide {
        transform: translateX(400px) !important;
        opacity: 0 !important;
      }
    `;
    if (!document.getElementById('toast-styles')) {
      style.id = 'toast-styles';
      document.head.appendChild(style);
    }

    return toast;
  }

  closeToast(toast, callback) {
    toast.classList.add('hide');
    toast.classList.remove('show');
    
    setTimeout(() => {
      if (toast.parentNode) {
        toast.parentNode.removeChild(toast);
      }
      this.activeToasts.delete(toast);
      if (callback) callback();
    }, 300);
  }

  closeAll() {
    this.activeToasts.forEach(toast => {
      this.closeToast(toast);
    });
  }

  getTypeColor(type) {
    const colors = {
      default: '#2e7d32',
      success: '#4caf50',
      warning: '#ff9800',
      error: '#f44336'
    };
    return colors[type] || colors.default;
  }

  getTypeIcon(type) {
    const icons = {
      default: '🕌',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    return icons[type] || icons.default;
  }
}

// Export singleton instance
export const toast = new ToastManager();

// Convenience methods
export function showDhikrToast(dhikr, options = {}) {
  return toast.show({
    arabic: dhikr.arabic,
    transliteration: dhikr.transliteration,
    translation: dhikr.translation,
    ...options
  });
}

export function showMessageToast(message, type = 'default', duration = 3000) {
  return toast.show({
    message,
    type,
    duration
  });
}
