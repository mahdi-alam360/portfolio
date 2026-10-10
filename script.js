const copyButton = document.querySelector('#copy-email');
copyButton.addEventListener('click', async () => {
  const status = document.querySelector('#copy-status');
  try { await navigator.clipboard.writeText('mahdi.alam@torontomu.ca'); status.textContent = 'Email address copied.'; }
  catch { status.textContent = 'mahdi.alam@torontomu.ca — select this address to copy it.'; }
});
const sections = [...document.querySelectorAll('main section[id]')];
if ('IntersectionObserver' in window) {
  const observer = new IntersectionObserver(entries => {
    entries.forEach(entry => { if (entry.isIntersecting) {
      document.querySelectorAll('.header nav a[href^="#"]').forEach(link => {
        if (link.getAttribute('href') === '#' + entry.target.id) link.setAttribute('aria-current', 'location');
        else link.removeAttribute('aria-current');
      });
    }});
  }, {rootMargin: '-10% 0px -65% 0px'});
  sections.forEach(section => observer.observe(section));
}
