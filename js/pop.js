(function () {
  const lightbox = document.getElementById('lightbox');
  const viewport = document.getElementById('lbViewport');
  const lbTitle = document.getElementById('lbTitle');
  const lbSubtitle = document.getElementById('lbSubtitle');
  const lbCounter = document.getElementById('lbCounter');
  const lbDots = document.getElementById('lbDots');
  const prevBtn = document.getElementById('lbPrev');
  const nextBtn = document.getElementById('lbNext');
  const closeBtn = document.getElementById('lbClose');

  let currentIndex = 0;
  let currentImages = [];
  let lastFocused = null;

  function buildSlides(images) {
    viewport.innerHTML = '';
    images.forEach((src, idx) => {
      const slide = document.createElement('div');
      slide.className = 'lightbox-slide';
      slide.dataset.index = idx;
      slide.innerHTML = `<img src="${src.trim()}" alt="Screenshot ${idx + 1}">`;
      viewport.appendChild(slide);
    });
  }

  function buildDots(count) {
    lbDots.innerHTML = '';
    for (let i = 0; i < count; i++) {
      const dot = document.createElement('button');
      dot.setAttribute('aria-label', `Go to screenshot ${i + 1}`);
      dot.addEventListener('click', () => goTo(i));
      lbDots.appendChild(dot);
    }
  }

  function showSlide(index) {
    [...viewport.children].forEach((slide, i) => {
      slide.classList.toggle('active', i === index);
    });
    viewport.scrollTop = 0;
  }

  function updateUI() {
    lbCounter.textContent = `${currentIndex + 1} / ${currentImages.length}`;
    [...lbDots.children].forEach((d, i) => d.classList.toggle('active', i === currentIndex));
    prevBtn.disabled = currentIndex === 0;
    nextBtn.disabled = currentIndex === currentImages.length - 1;
  }

  function goTo(index) {
    if (index < 0 || index >= currentImages.length) return;
    currentIndex = index;
    showSlide(currentIndex);
    updateUI();
  }

  let scrollLockY = 0;

function openLightbox(images, title, tag) {
  lastFocused = document.activeElement;
  currentImages = images;
  currentIndex = 0;
  lbTitle.textContent = title;
  lbSubtitle.textContent = tag;
  buildSlides(images);
  buildDots(images.length);
  showSlide(0);
  updateUI();
  lightbox.classList.add('open');

  // lock page scroll, preserving current scroll position
  scrollLockY = window.scrollY;
  document.body.style.top = `-${scrollLockY}px`;
  document.body.classList.add('lightbox-open');

  closeBtn.focus();
}

function closeLightbox() {
  lightbox.classList.remove('open');
  document.body.classList.remove('lightbox-open');
  document.body.style.top = '';
  window.scrollTo(0, scrollLockY);
  if (lastFocused) lastFocused.focus();
}

  document.querySelectorAll('.project-card[data-images]').forEach((card) => {
    card.addEventListener('click', () => {
      const images = card.dataset.images.split(',').filter(Boolean);
      const title = card.querySelector('h3')?.textContent || '';
      const tag = card.querySelector('.stack-chip')?.textContent || '';
      openLightbox(images, title, tag);
    });
  });
prevBtn.addEventListener('click', () => goTo(currentIndex - 1));
nextBtn.addEventListener('click', () => goTo(currentIndex + 1));
closeBtn.addEventListener('click', closeLightbox);

// Force scroll inside the popup regardless of any page-level scroll interception
lightbox.addEventListener('wheel', (e) => {
  e.preventDefault();
  e.stopPropagation();
  viewport.scrollTop += e.deltaY;
}, { passive: false, capture: true });

let touchStartY = 0;
lightbox.addEventListener('touchstart', (e) => {
  touchStartY = e.touches[0].clientY;
}, { passive: true, capture: true });

lightbox.addEventListener('touchmove', (e) => {
  const touchY = e.touches[0].clientY;
  const deltaY = touchStartY - touchY;
  viewport.scrollTop += deltaY;
  touchStartY = touchY;
  e.stopPropagation();
}, { passive: true, capture: true });

document.addEventListener('keydown', (e) => {
  if (!lightbox.classList.contains('open')) return;
  if (e.key === 'Escape') closeLightbox();
  if (e.key === 'ArrowRight') goTo(currentIndex + 1);
  if (e.key === 'ArrowLeft') goTo(currentIndex - 1);
});

  document.addEventListener('keydown', (e) => {
    if (!lightbox.classList.contains('open')) return;
    if (e.key === 'Escape') closeLightbox();
    if (e.key === 'ArrowRight') goTo(currentIndex + 1);
    if (e.key === 'ArrowLeft') goTo(currentIndex - 1);
  });
})();