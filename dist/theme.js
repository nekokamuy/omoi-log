(() => {
  const key = 'omoi-log-theme';
  let theme = 'dark';
  try { if (localStorage.getItem(key) === 'light') theme = 'light'; } catch {}
  function sync() {
    document.documentElement.dataset.theme = theme;
    document.documentElement.style.colorScheme = theme;
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.content = theme === 'light' ? '#f6f5f0' : '#202526';
    document.querySelectorAll('img[src="./icon.svg"], img[src="./icon-light.svg"]').forEach(image => {
      image.src = theme === 'light' ? './icon-light.svg' : './icon.svg';
    });
    document.querySelectorAll('[data-theme-choice]').forEach(button => {
      button.setAttribute('aria-pressed', String(button.dataset.themeChoice === theme));
    });
  }
  function select(value) {
    if (!['dark', 'light'].includes(value)) return;
    theme = value;
    try { localStorage.setItem(key, theme); } catch {}
    sync();
  }
  document.addEventListener('click', event => {
    const button = event.target.closest?.('[data-theme-choice]');
    if (button) select(button.dataset.themeChoice);
  });
  window.addEventListener('storage', event => {
    if (event.key === key) { theme = event.newValue === 'light' ? 'light' : 'dark'; sync(); }
  });
  window.OmoiTheme = { sync };
  sync();
})();
