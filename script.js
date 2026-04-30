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
    images: [
      { src: 'images/plaza-1.jpg', alt: 'Centro Comercial - vista aérea próxima' },
      { src: 'images/plaza-2.jpg', alt: 'Centro Comercial - vista drone ampla' },
      { src: 'images/plaza-4.jpg', alt: 'Plaza - vista aérea com posto' },
      { src: 'images/plaza-5.jpg', alt: 'Plaza - Consultório e Salão de Beleza' },
      { src: 'images/plaza-6.jpg', alt: 'Plaza - mercado interior' }
    ]
  },
  mercado: {
    title: 'Santo Mercado',
    images: [
      { src: 'images/mercado-1.jpg', alt: 'Santo Mercado - interior' },
      { src: 'images/mercado-2.jpg', alt: 'Santo Mercado - Farmácia e Pet Shop' },
      { src: 'images/mercado-3.jpg', alt: 'Santo Mercado - Padaria' },
      { src: 'images/mercado-4.jpg', alt: 'Santo Mercado - Adega' },
      { src: 'images/mercado-5.jpg', alt: 'Santo Mercado - horta orgânica' }
    ]
  },
  acqua: {
    title: 'Acqua Spa',
    images: [
      { src: 'images/acqua-1.jpg', alt: 'Acqua Spa - piscina com espreguiçadeiras' },
      { src: 'images/acqua-2.jpg', alt: 'Acqua Spa - complexo de piscinas' },
      { src: 'images/acqua-3.jpg', alt: 'Acqua Spa - interior com espreguiçadeiras' },
      { src: 'images/acqua-4.jpg', alt: 'Acqua Spa - piscina olímpica aérea' }
    ]
  },
  sb1: {
    title: 'Santa Bárbara 1',
    images: [
      { src: 'images/sb1-1.jpg', alt: 'Santa Bárbara 1 - parque aquático' },
      { src: 'images/sb1-2.jpg', alt: 'Santa Bárbara 1 - aéreo top-down' },
      { src: 'images/sb1-3.jpg', alt: 'Santa Bárbara 1 - aéreo lateral' },
      { src: 'images/sb1-4.jpg', alt: 'Santa Bárbara 1 - piscina com palmeiras' }
    ]
  },
  'lago-trapiche': {
    title: 'Lago Trapiche',
    images: [
      { src: 'images/lago-trapiche-1.jpg', alt: 'Lago Trapiche - palapa ao pôr do sol' },
      { src: 'images/lago-trapiche-2.jpg', alt: 'Lago Trapiche - rede à beira do lago' },
      { src: 'images/lago-trapiche-3.jpg', alt: 'Lago Trapiche - trapiche com caiaques' },
      { src: 'images/lago-trapiche-4.jpg', alt: 'Lago Trapiche - gansos à beira do lago' }
    ]
  },
  'lago-peixes': {
    title: 'Lago dos Peixes',
    images: [
      { src: 'images/lago-peixes-1.jpg', alt: 'Lago dos Peixes - deck de madeira' },
      { src: 'images/lago-peixes-2.jpg', alt: 'Lago dos Peixes - vista aérea' }
    ]
  },
  trilha: {
    title: 'Trilha da Cachoeira',
    images: [
      { src: 'images/trilha-1.jpg', alt: 'Trilha da Cachoeira - entrada' },
      { src: 'images/trilha-2.jpg', alt: 'Trilha da Cachoeira - riacho' },
      { src: 'images/trilha-3.jpg', alt: 'Trilha da Cachoeira - deck com mesas' },
      { src: 'images/trilha-4.jpg', alt: 'Trilha da Cachoeira - passarela na mata' }
    ]
  },
  praca: {
    title: 'Praça da Fonte',
    images: [
      { src: 'images/praca-1.jpg', alt: 'Praça da Fonte - vista aérea' },
      { src: 'images/praca-2.jpg', alt: 'Praça da Fonte - quadriciclos' },
      { src: 'images/praca-3.jpg', alt: 'Praça da Fonte - bicicletário' },
      { src: 'images/praca-4.jpg', alt: 'Praça da Fonte - família de passeio' }
    ]
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
  totalSlides = data.images.length;
  currentSlide = 0;

  data.images.forEach((img, i) => {
    const slide = document.createElement('div');
    slide.className = 'carousel-slide' + (i === 0 ? ' active' : '');
    slide.innerHTML = `<img src="${img.src}" alt="${img.alt}" loading="lazy">`;
    carouselTrack.appendChild(slide);

    const dot = document.createElement('span');
    dot.className = 'dot' + (i === 0 ? ' active' : '');
    dot.addEventListener('click', () => goToSlide(i));
    carouselDots.appendChild(dot);
  });

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
