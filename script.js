/* =============================================
   BLADEHAUS — Interactions & Animations
============================================= */

// === UTILITIES ===
function tempClass(el, cls, duration) {
  el.classList.add(cls);
  setTimeout(() => el.classList.remove(cls), duration);
}

// === CUSTOM CURSOR ===
const cursor = document.querySelector('.cursor');
const cursorFollower = document.querySelector('.cursor-follower');
let mouseX = 0, mouseY = 0;
let followerX = 0, followerY = 0;

document.addEventListener('mousemove', (e) => {
  mouseX = e.clientX;
  mouseY = e.clientY;
  cursor.style.left = mouseX + 'px';
  cursor.style.top = mouseY + 'px';
});

function animateFollower() {
  const dx = mouseX - followerX;
  const dy = mouseY - followerY;
  if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
    followerX += dx * 0.12;
    followerY += dy * 0.12;
    cursorFollower.style.left = followerX + 'px';
    cursorFollower.style.top = followerY + 'px';
  }
  requestAnimationFrame(animateFollower);
}
animateFollower();

document.querySelectorAll('a, button, [data-hover]').forEach(el => {
  el.addEventListener('mouseenter', () => document.body.classList.add('cursor-hover'));
  el.addEventListener('mouseleave', () => document.body.classList.remove('cursor-hover'));
});

// === NAVBAR + HAMBURGER ===
const navbar = document.getElementById('navbar');
const hamburger = document.getElementById('hamburger');
const mobileMenu = document.getElementById('mobileMenu');

function closeMenu() {
  mobileMenu.classList.remove('open');
  hamburger.classList.remove('open');
  hamburger.setAttribute('aria-expanded', false);
}

hamburger.addEventListener('click', () => {
  const isOpen = mobileMenu.classList.toggle('open');
  hamburger.classList.toggle('open', isOpen);
  hamburger.setAttribute('aria-expanded', isOpen);
});

document.querySelectorAll('.mobile-link').forEach(link => {
  link.addEventListener('click', closeMenu);
});

// === AOS ===
const aosDelays = new Map();
const aosObserver = new IntersectionObserver((entries) => {
  entries.forEach((entry) => {
    if (entry.isIntersecting) {
      setTimeout(() => entry.target.classList.add('aos-visible'), aosDelays.get(entry.target) || 0);
      aosObserver.unobserve(entry.target);
    }
  });
}, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

document.querySelectorAll('[data-aos]').forEach((el, i) => {
  aosDelays.set(el, i * 80);
  aosObserver.observe(el);
});

// === COUNTER ANIMATION ===
function animateCounter(el) {
  const target = parseInt(el.dataset.target);
  const step = target / (1800 / 16);
  let current = 0;
  const timer = setInterval(() => {
    current = Math.min(current + step, target);
    el.textContent = Math.floor(current).toLocaleString('pt-BR');
    if (current >= target) clearInterval(timer);
  }, 16);
}

const statsObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      document.querySelectorAll('.stat-number').forEach(animateCounter);
      statsObserver.disconnect();
    }
  });
}, { threshold: 0.5 });

const statsSection = document.querySelector('.hero-stats');
if (statsSection) statsObserver.observe(statsSection);

// === TESTIMONIALS SLIDER ===
const track = document.getElementById('testimonialsTrack');
const cards = track ? track.querySelectorAll('.testimonial-card') : [];
const dotsContainer = document.getElementById('tnsDots');
const btnLeft = document.getElementById('tnsLeft');
const btnRight = document.getElementById('tnsRight');

let currentSlide = 0;
let slidesPerView = window.innerWidth <= 768 ? 1 : 2;
let totalSlides = cards.length ? Math.ceil(cards.length / slidesPerView) : 0;

function buildDots() {
  if (!dotsContainer) return;
  dotsContainer.innerHTML = '';
  for (let i = 0; i < totalSlides; i++) {
    const dot = document.createElement('button');
    dot.className = 'tns-dot' + (i === 0 ? ' active' : '');
    dot.setAttribute('aria-label', `Slide ${i + 1}`);
    dot.addEventListener('click', () => goTo(i));
    dotsContainer.appendChild(dot);
  }
}

function goTo(index) {
  if (!track || !cards.length) return;
  currentSlide = Math.max(0, Math.min(index, totalSlides - 1));
  const cardWidth = cards[0].offsetWidth + 20;
  track.style.transform = `translateX(-${currentSlide * slidesPerView * cardWidth}px)`;
  track.style.transition = 'transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)';
  cards.forEach((c, i) => {
    c.classList.toggle('active', i >= currentSlide * slidesPerView && i < (currentSlide + 1) * slidesPerView);
  });
  dotsContainer?.querySelectorAll('.tns-dot').forEach((d, i) => d.classList.toggle('active', i === currentSlide));
}

if (btnLeft) btnLeft.addEventListener('click', () => goTo(currentSlide - 1));
if (btnRight) btnRight.addEventListener('click', () => goTo(currentSlide + 1));

if (cards.length && totalSlides > 1) {
  buildDots();
  goTo(0);
  let autoplay = setInterval(() => goTo((currentSlide + 1) % totalSlides), 5000);
  track.addEventListener('mouseenter', () => clearInterval(autoplay));
  track.addEventListener('mouseleave', () => {
    autoplay = setInterval(() => goTo((currentSlide + 1) % totalSlides), 5000);
  });
}

let resizeTimer;
window.addEventListener('resize', () => {
  clearTimeout(resizeTimer);
  resizeTimer = setTimeout(() => {
    slidesPerView = window.innerWidth <= 768 ? 1 : 2;
    totalSlides = Math.ceil(cards.length / slidesPerView);
    buildDots();
    goTo(0);
  }, 200);
});

// === BOOKING FORM ===
const bookingForm = document.getElementById('bookingForm');
const toast = document.getElementById('toast');

const dateInput = document.getElementById('date');
if (dateInput) {
  dateInput.setAttribute('min', new Date().toISOString().split('T')[0]);
}

bookingForm?.addEventListener('submit', (e) => {
  e.preventDefault();
  const btn = bookingForm.querySelector('.form-submit span');
  btn.textContent = 'Processando...';
  setTimeout(() => {
    btn.textContent = 'Confirmar Agendamento';
    bookingForm.reset();
    if (toast) tempClass(toast, 'show', 4500);
  }, 1500);
});

// === SMOOTH SCROLL ===
document.querySelectorAll('a[href^="#"]').forEach(anchor => {
  anchor.addEventListener('click', function (e) {
    const target = document.querySelector(this.getAttribute('href'));
    if (target) {
      e.preventDefault();
      target.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  });
});

// === SERVICE CARD HOVER TILT ===
document.querySelectorAll('.service-card').forEach(card => {
  card.addEventListener('mousemove', (e) => {
    const rect = card.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5;
    const y = (e.clientY - rect.top) / rect.height - 0.5;
    card.style.transform = `translateY(-6px) rotateX(${y * -6}deg) rotateY(${x * 6}deg)`;
    card.style.transition = 'transform 0.1s ease';
  });
  card.addEventListener('mouseleave', () => {
    card.style.transform = '';
    card.style.transition = 'transform 0.35s cubic-bezier(0.4, 0, 0.2, 1)';
  });
});

// === MERGED SCROLL HANDLER (navbar + active-link + gallery parallax) ===
const sections = document.querySelectorAll('section[id], footer[id]');
const navLinks = document.querySelectorAll('.nav-links a');
const galleryItems = document.querySelectorAll('.gallery-item');
let lastActiveSection = '';
let rafScrollPending = false;

function onScroll() {
  const scrollY = window.scrollY;

  navbar.classList.toggle('scrolled', scrollY > 60);

  let current = '';
  sections.forEach(section => {
    if (scrollY >= section.offsetTop - 120) current = section.getAttribute('id');
  });
  if (current !== lastActiveSection) {
    lastActiveSection = current;
    navLinks.forEach(link => link.classList.toggle('active', link.getAttribute('href') === `#${current}`));
  }

  galleryItems.forEach((item, i) => {
    const rect = item.getBoundingClientRect();
    if (rect.top < window.innerHeight && rect.bottom > 0) {
      item.style.transform = `translateY(${scrollY * 0.03 * (i % 2 === 0 ? 1 : -1)}px)`;
    }
  });

  rafScrollPending = false;
}

window.addEventListener('scroll', () => {
  if (!rafScrollPending) {
    rafScrollPending = true;
    requestAnimationFrame(onScroll);
  }
}, { passive: true });
