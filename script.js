/* ============================================================
   CAHL CORTES — Script
   Handles: Lucide icons, scroll effects, mobile nav,
            reveal animations, back-to-top
   ============================================================ */

'use strict';

document.addEventListener('DOMContentLoaded', () => {

  /* ─── LUCIDE ICONS ─── */
  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }

  /* ─── ELEMENTS ─── */
  const header    = document.getElementById('header');
  const navToggle = document.getElementById('navToggle');
  const navMenu   = document.getElementById('navMenu');
  const backTop   = document.getElementById('backTop');
  const navLinks  = document.querySelectorAll('.nav__link:not(.nav__link--cta)');
  const sections  = document.querySelectorAll('section[id]');

  /* ─── HEADER SCROLL EFFECT ─── */
  function onScroll() {
    const y = window.scrollY;

    // sticky header
    header.classList.toggle('scrolled', y > 60);

    // back-to-top button
    backTop.classList.toggle('visible', y > 500);

    // active nav link (highlight current section)
    let current = '';
    sections.forEach(sec => {
      if (y >= sec.offsetTop - 120) current = sec.getAttribute('id');
    });
    navLinks.forEach(link => {
      const href = link.getAttribute('href').replace('#', '');
      link.classList.toggle('active', href === current);
    });
  }

  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll(); // run once on load

  /* ─── MOBILE NAVIGATION ─── */
  function toggleMenu(force) {
    const isOpen = typeof force === 'boolean' ? force : !navMenu.classList.contains('open');
    navMenu.classList.toggle('open', isOpen);
    navToggle.setAttribute('aria-expanded', String(isOpen));

    // swap icon
    navToggle.innerHTML = isOpen
      ? '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
      : '<svg xmlns="http://www.w3.org/2000/svg" width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/></svg>';
  }

  navToggle.addEventListener('click', () => toggleMenu());

  // close menu when a link is clicked
  navMenu.querySelectorAll('a').forEach(link => {
    link.addEventListener('click', () => toggleMenu(false));
  });

  // close on outside click
  document.addEventListener('click', e => {
    if (navMenu.classList.contains('open') &&
        !navMenu.contains(e.target) &&
        !navToggle.contains(e.target)) {
      toggleMenu(false);
    }
  });

  // close on Escape key
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && navMenu.classList.contains('open')) toggleMenu(false);
  });

  /* ─── SMOOTH SCROLL (anchor links) ─── */
  document.querySelectorAll('a[href^="#"]').forEach(anchor => {
    anchor.addEventListener('click', e => {
      const id = anchor.getAttribute('href');
      if (id === '#') return;
      const target = document.querySelector(id);
      if (!target) return;
      e.preventDefault();
      const offset = header.offsetHeight + 8;
      const top = target.getBoundingClientRect().top + window.scrollY - offset;
      window.scrollTo({ top, behavior: 'smooth' });
    });
  });

  /* ─── BACK TO TOP ─── */
  backTop.addEventListener('click', () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  });

  /* ─── REVEAL ON SCROLL ─── */
  const revealItems = document.querySelectorAll('[data-reveal]');

  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if (!entry.isIntersecting) return;
      // stagger siblings inside the same parent
      const siblings = [...entry.target.parentElement.querySelectorAll('[data-reveal]')];
      const idx = siblings.indexOf(entry.target);
      setTimeout(() => {
        entry.target.classList.add('visible');
      }, idx * 80);
      revealObserver.unobserve(entry.target);
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });

  revealItems.forEach(el => revealObserver.observe(el));

  /* ─── ACTIVE NAV LINK STYLE ─── */
  const style = document.createElement('style');
  style.textContent = `
    .nav__link.active {
      color: #D4AF37 !important;
    }
    .nav__link.active::after {
      width: 100% !important;
      background: #D4AF37;
    }
  `;
  document.head.appendChild(style);

  /* ─── SERVICE CARD STAGGER ─── */
  const serviceCards = document.querySelectorAll('.service-card[data-reveal]');
  serviceCards.forEach((card, i) => {
    card.style.transitionDelay = `${i * 60}ms`;
  });

  /* ─── TESTIMONIAL CARD STAGGER ─── */
  const testimonialCards = document.querySelectorAll('.testimonial-card[data-reveal]');
  testimonialCards.forEach((card, i) => {
    card.style.transitionDelay = `${i * 70}ms`;
  });

});
