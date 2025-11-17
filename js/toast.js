export function showToast(message, type = 'info', duration = 3000) {
    let container = document.getElementById('toast-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'toast-container';
        container.style.position = 'fixed';
        container.style.right = '20px';
        container.style.top = '20px';
        container.style.zIndex = 9999;
        document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = `toast toast-${type}`;
    toast.style.marginTop = '8px';
    toast.style.minWidth = '200px';
    toast.style.padding = '10px 14px';
    toast.style.borderRadius = '6px';
    toast.style.color = '#fff';
    toast.style.boxShadow = '0 2px 6px rgba(0,0,0,0.2)';
    toast.style.fontFamily = 'Arial, sans-serif';
    toast.style.fontSize = '14px';

    switch (type) {
        case 'success':
            toast.style.background = '#28a745';
            break;
        case 'error':
            toast.style.background = '#dc3545';
            break;
        case 'warn':
            toast.style.background = '#ffc107';
            toast.style.color = '#000';
            break;
        default:
            toast.style.background = '#333';
    }

    toast.textContent = message;
    container.appendChild(toast);

    setTimeout(() => {
        toast.style.opacity = '0';
        toast.style.transition = 'opacity 300ms ease';
        setTimeout(() => container.removeChild(toast), 350);
    }, duration);
}
