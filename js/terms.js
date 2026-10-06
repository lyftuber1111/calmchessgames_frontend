/**
 * Calm Chess Computers (c) 2026. All Rights Reserved.
 * Terms of Service UI Interaction Script
 * Completely unobfuscated, clean JavaScript
 */

document.addEventListener('DOMContentLoaded', () => {
    const tosContainer = document.getElementById('_cc_tos');
    if (!tosContainer) return;

    const backButtons = tosContainer.querySelectorAll('a.back-btn');
    backButtons.forEach(btn => {
        btn.addEventListener('click', (e) => {
            if (!btn.getAttribute('href')) {
                e.preventDefault();
                window.location.href = 'index.html';
            }
        });
    });
});