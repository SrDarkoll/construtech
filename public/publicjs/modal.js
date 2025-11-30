export function showConfirmModal(title, message) {
    return new Promise((resolve) => {
        // Check if modal already exists
        let modal = document.getElementById('custom-confirm-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'custom-confirm-modal';
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
            modal.style.display = 'flex';
            modal.style.justifyContent = 'center';
            modal.style.alignItems = 'center';
            modal.style.zIndex = '10000';
            modal.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

            modal.innerHTML = `
                <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
                    <h3 id="custom-modal-title" style="margin-top: 0; color: #333; margin-bottom: 1rem;"></h3>
                    <p id="custom-modal-message" style="color: #666; margin-bottom: 2rem; line-height: 1.5;"></p>
                    <div style="display: flex; justify-content: center; gap: 1rem;">
                        <button id="custom-modal-cancel" style="padding: 0.8rem 1.5rem; border: none; border-radius: 6px; background: #f1f2f6; color: #333; cursor: pointer; font-weight: 600; transition: background 0.2s;">Cancelar</button>
                        <button id="custom-modal-ok" style="padding: 0.8rem 1.5rem; border: none; border-radius: 6px; background: #e74c3c; color: white; cursor: pointer; font-weight: 600; transition: background 0.2s;">Confirmar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Add hover effects via JS since we are using inline styles
            const cancelBtn = modal.querySelector('#custom-modal-cancel');
            const okBtn = modal.querySelector('#custom-modal-ok');

            cancelBtn.onmouseover = () => cancelBtn.style.background = '#e1e2e6';
            cancelBtn.onmouseout = () => cancelBtn.style.background = '#f1f2f6';

            okBtn.onmouseover = () => okBtn.style.background = '#c0392b';
            okBtn.onmouseout = () => okBtn.style.background = '#e74c3c';
        }

        const titleEl = modal.querySelector('#custom-modal-title');
        const messageEl = modal.querySelector('#custom-modal-message');
        const cancelBtn = modal.querySelector('#custom-modal-cancel');
        const okBtn = modal.querySelector('#custom-modal-ok');

        titleEl.textContent = title;
        messageEl.textContent = message;
        modal.style.display = 'flex';

        const cleanup = () => {
            modal.style.display = 'none';
            cancelBtn.onclick = null;
            okBtn.onclick = null;
        };

        cancelBtn.onclick = () => {
            cleanup();
            resolve(false);
        };

        okBtn.onclick = () => {
            cleanup();
            resolve(true);
        };
    });
}

export function showPromptModal(title, message, defaultValue = '') {
    return new Promise((resolve) => {
        let modal = document.getElementById('custom-prompt-modal');
        if (!modal) {
            modal = document.createElement('div');
            modal.id = 'custom-prompt-modal';
            modal.style.position = 'fixed';
            modal.style.top = '0';
            modal.style.left = '0';
            modal.style.width = '100%';
            modal.style.height = '100%';
            modal.style.backgroundColor = 'rgba(0,0,0,0.5)';
            modal.style.display = 'flex';
            modal.style.justifyContent = 'center';
            modal.style.alignItems = 'center';
            modal.style.zIndex = '10000';
            modal.style.fontFamily = "'Segoe UI', Tahoma, Geneva, Verdana, sans-serif";

            modal.innerHTML = `
                <div style="background: white; padding: 2rem; border-radius: 12px; max-width: 400px; width: 90%; text-align: center; box-shadow: 0 4px 20px rgba(0,0,0,0.2);">
                    <h3 id="custom-prompt-title" style="margin-top: 0; color: #333; margin-bottom: 1rem;"></h3>
                    <p id="custom-prompt-message" style="color: #666; margin-bottom: 1rem; line-height: 1.5;"></p>
                    <input type="text" id="custom-prompt-input" style="width: 100%; padding: 0.8rem; margin-bottom: 2rem; border: 2px solid #e0e0e0; border-radius: 6px; font-size: 1rem;">
                    <div style="display: flex; justify-content: center; gap: 1rem;">
                        <button id="custom-prompt-cancel" style="padding: 0.8rem 1.5rem; border: none; border-radius: 6px; background: #f1f2f6; color: #333; cursor: pointer; font-weight: 600; transition: background 0.2s;">Cancelar</button>
                        <button id="custom-prompt-ok" style="padding: 0.8rem 1.5rem; border: none; border-radius: 6px; background: #3498db; color: white; cursor: pointer; font-weight: 600; transition: background 0.2s;">Aceptar</button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);

            // Add hover effects
            const cancelBtn = modal.querySelector('#custom-prompt-cancel');
            const okBtn = modal.querySelector('#custom-prompt-ok');

            cancelBtn.onmouseover = () => cancelBtn.style.background = '#e1e2e6';
            cancelBtn.onmouseout = () => cancelBtn.style.background = '#f1f2f6';

            okBtn.onmouseover = () => okBtn.style.background = '#2980b9';
            okBtn.onmouseout = () => okBtn.style.background = '#3498db';
        }

        const titleEl = modal.querySelector('#custom-prompt-title');
        const messageEl = modal.querySelector('#custom-prompt-message');
        const inputEl = modal.querySelector('#custom-prompt-input');
        const cancelBtn = modal.querySelector('#custom-prompt-cancel');
        const okBtn = modal.querySelector('#custom-prompt-ok');

        titleEl.textContent = title;
        messageEl.textContent = message;
        inputEl.value = defaultValue;
        modal.style.display = 'flex';
        inputEl.focus();

        const cleanup = () => {
            modal.style.display = 'none';
            cancelBtn.onclick = null;
            okBtn.onclick = null;
        };

        cancelBtn.onclick = () => {
            cleanup();
            resolve(null);
        };

        okBtn.onclick = () => {
            const val = inputEl.value;
            cleanup();
            resolve(val);
        };

        // Handle Enter key in input
        inputEl.onkeydown = (e) => {
            if (e.key === 'Enter') {
                const val = inputEl.value;
                cleanup();
                resolve(val);
            }
        };
    });
}
