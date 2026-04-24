// ============================================
// SIDEBAR / HAMBURGER
// ============================================
const hamburger    = document.getElementById('hamburger');
const sidebar      = document.getElementById('sidebar');
const sidebarClose = document.getElementById('sidebarClose');
const overlay      = document.getElementById('sidebarOverlay');

function openSidebar() {
  sidebar.classList.add('active');
  overlay.classList.add('active');
  document.body.style.overflow = 'hidden';
}
function closeSidebar() {
  sidebar.classList.remove('active');
  overlay.classList.remove('active');
  document.body.style.overflow = '';
}

hamburger.addEventListener('click', openSidebar);
sidebarClose.addEventListener('click', closeSidebar);
overlay.addEventListener('click', closeSidebar);

document.querySelectorAll('.sidebar-link').forEach(link => {
  link.addEventListener('click', closeSidebar);
});

// ============================================
// FADE-IN ON SCROLL
// ============================================
const fadeEls = document.querySelectorAll('.fade-in');

const observer = new IntersectionObserver((entries) => {
  entries.forEach((entry, i) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('visible'), i * 80);
      observer.unobserve(entry.target);
    }
  });
}, { threshold: 0.12 });

fadeEls.forEach(el => observer.observe(el));

// ============================================
// GALLERY DATA
// ============================================
const galleryData = {
  plaza: {
    title: 'Plaza',
    count: 4,
    labels: ['Plaza - Imagem 1','Plaza - Imagem 2','Plaza - Imagem 3','Plaza - Imagem 4']
  },
  acqua: {
    title: 'Acqua Spa',
    count: 4,
    labels: ['Acqua Spa - Imagem 1','Acqua Spa - Imagem 2','Acqua Spa - Imagem 3','Acqua Spa - Imagem 4']
  },
  sb1: {
    title: 'Santa Bárbara 1',
    count: 4,
    labels: ['Santa Bárbara 1 - Imagem 1','Santa Bárbara 1 - Imagem 2','Santa Bárbara 1 - Imagem 3','Santa Bárbara 1 - Imagem 4']
  },
  'lago-trapiche': {
    title: 'Lago Trapiche',
    count: 4,
    labels: ['Lago Trapiche - Imagem 1','Lago Trapiche - Imagem 2','Lago Trapiche - Imagem 3','Lago Trapiche - Imagem 4']
  },
  'lago-peixes': {
    title: 'Lago dos Peixes',
    count: 2,
    labels: ['Lago dos Peixes - Imagem 1','Lago dos Peixes - Imagem 2']
  },
  trilha: {
    title: 'Trilha da Cachoeira',
    count: 4,
    labels: ['Trilha da Cachoeira - Imagem 1','Trilha da Cachoeira - Imagem 2','Trilha da Cachoeira - Imagem 3','Trilha da Cachoeira - Imagem 4']
  },
  praca: {
    title: 'Praça da Fonte',
    count: 4,
    labels: ['Praça da Fonte - Imagem 1','Praça da Fonte - Imagem 2','Praça da Fonte - Imagem 3','Praça da Fonte - Imagem 4']
  }
};

// ============================================
// MODAL / CAROUSEL
// ============================================
const modal        = document.getElementById('galeriaModal');
const modalOverlay = document.getElementById('modalOverlay');
const modalClose   = document.getElementById('modalClose');
const modalTitle   = document.getElementById('modalTitle');
const carouselTrack= document.getElementById('carouselTrack');
const carouselDots = document.getElementById('carouselDots');
const prevBtn      = document.getElementById('carouselPrev');
const nextBtn      = document.getElementById('carouselNext');

let currentSlide = 0;
let totalSlides  = 0;

function openModal(cat) {
  const data = galleryData[cat];
  if (!data) return;

  modalTitle.textContent = data.title;
  carouselTrack.innerHTML = '';
  carouselDots.innerHTML  = '';
  totalSlides = data.count;
  currentSlide = 0;

  for (let i = 0; i < data.count; i++) {
    const slide = document.createElement('div');
    slide.className = 'carousel-slide' + (i === 0 ? ' active' : '');
    slide.innerHTML = `<div class="img-placeholder dark"><span>${data.labels[i]}</span></div>`;
    carouselTrack.appendChild(slide);

    const dot = document.createElement('span');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => goToSlide(i));
    carouselDots.appendChild(dot);
  }

  modal.classList.add('active');
  document.body.style.overflow = 'hidden';
}

function closeModal() {
  modal.classList.remove('active');
  document.body.style.overflow = '';
}

function goToSlide(index) {
  const slides = carouselTrack.querySelectorAll('.carousel-slide');
  const dots   = carouselDots.querySelectorAll('.dot');
  slides[currentSlide].classList.remove('active');
  dots[currentSlide].classList.remove('active');
  currentSlide = (index + totalSlides) % totalSlides;
  slides[currentSlide].classList.add('active');
  dots[currentSlide].classList.add('active');
}

prevBtn.addEventListener('click', () => goToSlide(currentSlide - 1));
nextBtn.addEventListener('click', () => goToSlide(currentSlide + 1));
modalClose.addEventListener('click', closeModal);
modalOverlay.addEventListener('click', closeModal);

document.querySelectorAll('.galeria-cat').forEach(cat => {
  cat.addEventListener('click', () => openModal(cat.dataset.cat));
});

// Swipe support for carousel
let touchStartX = 0;
carouselTrack.addEventListener('touchstart', e => {
  touchStartX = e.changedTouches[0].screenX;
}, { passive: true });
carouselTrack.addEventListener('touchend', e => {
  const diff = touchStartX - e.changedTouches[0].screenX;
  if (Math.abs(diff) > 40) goToSlide(diff > 0 ? currentSlide + 1 : currentSlide - 1);
}, { passive: true });

// Keyboard navigation
document.addEventListener('keydown', e => {
  if (!modal.classList.contains('active')) return;
  if (e.key === 'Escape')       closeModal();
  if (e.key === 'ArrowLeft')    goToSlide(currentSlide - 1);
  if (e.key === 'ArrowRight')   goToSlide(currentSlide + 1);
});

// ============================================
// SMOOTH SCROLL (fallback for older browsers)
// ============================================
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function(e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth' });
    }
  });
});
