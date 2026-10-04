// The fallback page uses external handlers so script-src-attr can remain 'none'.
document.getElementById('retry-button')?.addEventListener('click', () => location.reload());
window.addEventListener('online', () => location.reload());
document.getElementById('play-button')?.addEventListener('click', () => { location.href = '/'; });
