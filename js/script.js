const progressBar = document.getElementById('progressBar');
  const header = document.getElementById('siteHeader');
  const toTop = document.getElementById('toTop');
  let lastScrollY = window.scrollY;
  let headerRefY = window.scrollY;
  const HIDE_THRESHOLD = 10; // px of net movement required before toggling — avoids flicker from sub-pixel scroll jitter
  window.addEventListener('scroll', () => {
    const h = document.documentElement;
    const pct = (h.scrollTop) / (h.scrollHeight - h.clientHeight) * 100;
    progressBar.style.width = pct + '%';
    const y = window.scrollY;
    header.classList.toggle('scrolled', y > 10);

    if(y <= 140){
      header.classList.remove('hide-on-scroll');
      headerRefY = y;
    } else {
      const delta = y - headerRefY;
      if(delta > HIDE_THRESHOLD){
        header.classList.add('hide-on-scroll');
        headerRefY = y;
      } else if(delta < -HIDE_THRESHOLD){
        header.classList.remove('hide-on-scroll');
        headerRefY = y;
      }
    }

    lastScrollY = y;
    toTop.classList.toggle('show', y > 500);
  });
  toTop.addEventListener('click', () => smoothScrollTo(0));

  // ================= SMOOTH SCROLL SYSTEM =================
  // One system drives everything: mouse-wheel inertia AND anchor-link navigation,
  // so they never fight each other (no snap-back on nav clicks).
  // NOTE: this wheel-driven inertia loop is desktop-only. On touch devices it fought
  // the browser's native momentum scrolling (re-writing scroll position every animation
  // frame), which is what made mobile scrolling feel heavy/laggy. Mobile now gets plain
  // native scrolling, with anchor-link taps using the browser's built-in smooth scroll.
  const smoothScrollReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const isTouchDevice = window.matchMedia('(hover: none), (pointer: coarse)').matches || navigator.maxTouchPoints > 0;
  const useInertiaScroll = !smoothScrollReduce && !isTouchDevice;
  let scrollCurrent = window.scrollY;
  let scrollTarget = window.scrollY;

  function maxScrollY(){ return document.documentElement.scrollHeight - window.innerHeight; }
  function clampScrollTarget(){ scrollTarget = Math.max(0, Math.min(scrollTarget, maxScrollY())); }

  function smoothScrollTo(y){
    const clamped = Math.max(0, Math.min(y, maxScrollY()));
    if(!useInertiaScroll){ window.scrollTo({ top: clamped, behavior: smoothScrollReduce ? 'auto' : 'smooth' }); return; }
    scrollTarget = clamped;
  }

  if(useInertiaScroll){
    // wheel → buttery inertia (mouse/trackpad only)
    window.addEventListener('wheel', (e) => {
      e.preventDefault();
      scrollTarget += e.deltaY;
      clampScrollTarget();
    }, { passive:false });

    // keep in sync with native scroll sources (keyboard, touch, scrollbar drag)
    window.addEventListener('scroll', () => {
      if(Math.abs(window.scrollY - scrollCurrent) > 2){
        scrollCurrent = window.scrollY;
        scrollTarget = window.scrollY;
      }
    }, { passive:true });

    window.addEventListener('resize', clampScrollTarget);

    (function scrollLoop(){
      scrollCurrent += (scrollTarget - scrollCurrent) * 0.085;
      if(Math.abs(scrollTarget - scrollCurrent) < 0.4){ scrollCurrent = scrollTarget; }
      window.scrollTo(0, scrollCurrent);
      requestAnimationFrame(scrollLoop);
    })();
  }

  // in-page anchor links always go through smoothScrollTo (works in both modes)
  document.querySelectorAll('a[href^="#"]').forEach(a => {
    a.addEventListener('click', (e) => {
      const id = a.getAttribute('href');
      if(id.length < 2) return;
      const target = document.querySelector(id);
      if(!target) return;
      e.preventDefault();
      const headerOffset = 90;
      const y = target.getBoundingClientRect().top + window.scrollY - headerOffset;
      smoothScrollTo(y);
    });
  });


  // parallax layers — smooth, rAF-driven so it never fights the scroll
  const parallaxEls = [
    ...Array.from(document.querySelectorAll('.scatter-tile')).map((el,i) => ({ el, speed: 0.06 + (i % 4) * 0.035 })),
  ];
  const watermark = document.querySelector('.about-watermark');
  const heroReduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!heroReduce){
    let targetY = 0, currentY = 0;
    window.addEventListener('scroll', () => { targetY = window.scrollY; }, { passive:true });
    (function parallaxLoop(){
      currentY += (targetY - currentY) * 0.08;
      parallaxEls.forEach(p => { p.el.style.transform += ''; p.el.style.setProperty('--py', (currentY * p.speed) + 'px'); });
      requestAnimationFrame(parallaxLoop);
    })();
  }

  const cursor = document.getElementById('cursorDot');
  const ring = document.getElementById('cursorRing');
  const ringLabel = document.getElementById('cursorLabel');
  const isFinePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
  if(isFinePointer){
    let mx = window.innerWidth/2, my = window.innerHeight/2;
    let rx = mx, ry = my;
    window.addEventListener('mousemove', e => {
      mx = e.clientX; my = e.clientY;
      cursor.style.left = mx+'px'; cursor.style.top = my+'px';
    });
    (function loop(){
      rx += (mx - rx) * 0.16;
      ry += (my - ry) * 0.16;
      ring.style.left = rx+'px'; ring.style.top = ry+'px';
      requestAnimationFrame(loop);
    })();

    const setRing = (big, mode, label) => {
      ring.classList.toggle('big', big);
      ring.classList.toggle('pop', mode === 'pop');
      cursor.classList.toggle('big', big);
      ringLabel.textContent = label || '';
    };
    document.querySelectorAll('.project-card').forEach(el => {
      el.addEventListener('mouseenter', () => setRing(true, 'default', 'View'));
      el.addEventListener('mouseleave', () => setRing(false));
    });
    document.querySelectorAll('.submit-btn, .btn-primary').forEach(el => {
      el.addEventListener('mouseenter', () => setRing(true, 'pop', 'Go'));
      el.addEventListener('mouseleave', () => setRing(false));
    });
    document.querySelectorAll('a, .btn, .skill-card, .acc-head, .filter-btn, .cat-btn, .photo-frame').forEach(el => {
      if(el.closest('.project-card') || el.classList.contains('submit-btn') || el.classList.contains('btn-primary')) return;
      el.addEventListener('mouseenter', () => setRing(true, 'default', ''));
      el.addEventListener('mouseleave', () => setRing(false));
    });

    window.addEventListener('mousedown', e => {
      const r = document.createElement('div');
      r.className = 'click-ripple';
      r.style.left = e.clientX+'px'; r.style.top = e.clientY+'px';
      document.body.appendChild(r);
      setTimeout(() => r.remove(), 650);
    });
    document.addEventListener('mouseleave', () => { ring.style.opacity = 0; cursor.style.opacity = 0; });
    document.addEventListener('mouseenter', () => { ring.style.opacity = 1; cursor.style.opacity = 1; });
  }

  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const io = new IntersectionObserver((entries) => {
    entries.forEach((entry, i) => {
      if(entry.isIntersecting){
        setTimeout(() => entry.target.classList.add('in'), i * 50);
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  document.querySelectorAll('.reveal').forEach(el => io.observe(el));

  // split section h2 headings into per-letter spans for a wipe-up reveal
  if(!reduceMotion){
    document.querySelectorAll('.section-head h2').forEach(h => {
      const text = h.textContent;
      h.innerHTML = '<span class="char-reveal">' + text.split('').map(c => `<span class="ch">${c === ' ' ? '&nbsp;' : c}</span>`).join('') + '</span>';
    });
    const charIO = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if(entry.isIntersecting){
          const chars = entry.target.querySelectorAll('.ch');
          chars.forEach((c, i) => { c.style.transitionDelay = (i * 22) + 'ms'; });
          entry.target.classList.add('in');
          charIO.unobserve(entry.target);
        }
      });
    }, { threshold: 0.5 });
    document.querySelectorAll('.char-reveal').forEach(el => charIO.observe(el));
  }

  // hero — subtle scroll-linked parallax fade/scale for an extra-polished feel
  // career path — the vertical line fills in as you scroll through the journey
  const careerPath = document.getElementById('careerPath');
  const cpTrackFill = document.getElementById('cpTrackFill');
  if(careerPath && cpTrackFill){
    const updateCareerFill = () => {
      const rect = careerPath.getBoundingClientRect();
      const viewportMark = window.innerHeight * 0.7;
      const progressPx = viewportMark - rect.top;
      const pct = Math.max(0, Math.min(1, progressPx / rect.height));
      cpTrackFill.style.height = (pct * 100) + '%';
    };
    window.addEventListener('scroll', updateCareerFill, { passive:true });
    window.addEventListener('resize', updateCareerFill);
    updateCareerFill();
  }

  const heroSection = document.querySelector('.hero');
  const heroInner = heroSection ? heroSection.querySelector('.wrap') : null;
  if(heroSection && heroInner && !reduceMotion){
    window.addEventListener('scroll', () => {
      const h = heroSection.offsetHeight;
      const p = Math.min(Math.max(window.scrollY / h, 0), 1);
      heroInner.style.opacity = 1 - p * 1.1;
      heroInner.style.transform = `translateY(${p * 60}px) scale(${1 - p * 0.06})`;
    }, { passive:true });
  }

  // skill meter bars — animate fill on scroll into view
  const meterIO = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        const card = entry.target;
        const pct = parseFloat(card.dataset.pct);
        const fill = card.querySelector('.meter-fill');
        requestAnimationFrame(() => { fill.style.width = pct + '%'; });
        meterIO.unobserve(card);
      }
    });
  }, { threshold: 0.35 });
  document.querySelectorAll('.skill-card').forEach(card => meterIO.observe(card));

  // skills category filter
  const catBtns = document.querySelectorAll('.cat-btn');
  const skillCards = document.querySelectorAll('.skill-card');
  catBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      catBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const cat = btn.dataset.cat;
      skillCards.forEach(card => {
        const match = cat === 'all' || card.dataset.cat === cat;
        card.classList.toggle('hide', !match);
      });
    });
  });

  // ================= HERO ROLE — SHUTTER SWAP =================
   const roles = ['Web Developer', 'UI/UX Focused', 'Pixel Perfectionist'];
  const typedEl = document.getElementById('typedRole');
  // measure the widest phrase once and lock the box to that width so typing never shifts layout
  function lockRoleWidth(){
    const probe = typedEl.cloneNode(false);
    probe.style.position = 'absolute';
    probe.style.visibility = 'hidden';
    probe.style.whiteSpace = 'nowrap';
    probe.style.minWidth = '0';
    probe.style.left = '-9999px';
    probe.style.top = '0';
    typedEl.parentElement.appendChild(probe);
    let maxW = 0;
    roles.forEach(r => { probe.textContent = r; maxW = Math.max(maxW, probe.getBoundingClientRect().width); });
    // typedEl.style.minWidth = Math.ceil(maxW) + 4 + 'px';
    typedEl.parentElement.removeChild(probe);
  }
  lockRoleWidth();
  let resizeT;
  window.addEventListener('resize', () => { clearTimeout(resizeT); resizeT = setTimeout(lockRoleWidth, 200); });
  let ri = 0, ci = 0, deleting = false;
  function typeLoop(){
    if(reduceMotion){ typedEl.textContent = roles[0]; return; }
    const word = roles[ri];
    typedEl.textContent = word.slice(0, ci);
    if(!deleting && ci < word.length){ ci++; setTimeout(typeLoop, 65); }
    else if(!deleting && ci === word.length){ deleting = true; setTimeout(typeLoop, 1400); }
    else if(deleting && ci > 0){ ci--; setTimeout(typeLoop, 35); }
    else { deleting = false; ri = (ri+1) % roles.length; setTimeout(typeLoop, 300); }
  }
  typeLoop();

  const photoStage = document.querySelector('.photo-stage');
  const photoFrame = document.getElementById('photoFrame');
  if(photoStage && photoFrame && !reduceMotion){
    photoStage.addEventListener('mousemove', e => {
      const r = photoStage.getBoundingClientRect();
      const x = (e.clientX - r.left)/r.width - 0.5, y = (e.clientY - r.top)/r.height - 0.5;
      photoFrame.style.transform = `perspective(700px) rotateY(${x*8}deg) rotateX(${-y*8}deg) scale(1.02)`;
    });
    photoStage.addEventListener('mouseleave', () => { photoFrame.style.transform = 'perspective(700px) rotateY(0) rotateX(0) scale(1)'; });
  }

  document.querySelectorAll('.btn').forEach(btn => {
    btn.addEventListener('mousemove', e => {
      if(reduceMotion) return;
      const r = btn.getBoundingClientRect();
      const x = e.clientX - r.left - r.width/2, y = e.clientY - r.top - r.height/2;
      btn.style.transform = `translate(${x*0.15}px, ${y*0.3}px)`;
    });
    btn.addEventListener('mouseleave', () => { btn.style.transform = 'translate(0,0)'; });
  });

  document.querySelectorAll('.project-card').forEach(card => {
    card.addEventListener('mousemove', e => {
      if(reduceMotion) return;
      const r = card.getBoundingClientRect();
      const x = (e.clientX - r.left)/r.width - 0.5, y = (e.clientY - r.top)/r.height - 0.5;
      card.style.transform = `perspective(800px) rotateY(${x*4}deg) rotateX(${-y*4}deg) translateY(-4px)`;
    });
    card.addEventListener('mouseleave', () => { card.style.transform = 'perspective(800px) rotateY(0) rotateX(0) translateY(0)'; });
  });

  document.querySelectorAll('.acc-item').forEach(item => {
    const head = item.querySelector('.acc-head');
    const body = item.querySelector('.acc-body');
    head.addEventListener('click', () => {
      const isOpen = item.classList.contains('open');
      document.querySelectorAll('.acc-item.open').forEach(other => {
        if(other !== item){ other.classList.remove('open'); other.querySelector('.acc-body').style.maxHeight = null; }
      });
      if(isOpen){ item.classList.remove('open'); body.style.maxHeight = null; }
      else { item.classList.add('open'); body.style.maxHeight = body.scrollHeight + 'px'; }
    });
  });

  const filterBtns = document.querySelectorAll('.filter-btn');
  const cards = document.querySelectorAll('.project-card');
  filterBtns.forEach(btn => {
    btn.addEventListener('click', () => {
      filterBtns.forEach(b => b.classList.remove('active'));
      btn.classList.add('active');
      const f = btn.dataset.filter;
      cards.forEach(card => {
        const match = f === 'all' || card.dataset.cat === f;
        if(match){
          card.classList.remove('hide');
          card.style.opacity = 0; card.style.transform = 'scale(.94)';
          requestAnimationFrame(() => {
            card.style.transition = 'opacity .4s ease, transform .4s ease';
            card.style.opacity = 1; card.style.transform = 'scale(1)';
          });
        } else {
          card.style.opacity = 0; card.style.transform = 'scale(.94)';
          setTimeout(() => card.classList.add('hide'), 350);
        }
      });
    });
  });

  const form = document.getElementById('contactForm');
  const submitBtn = document.getElementById('submitBtn');

  const footerNotifyBtn = document.getElementById('footerNotifyBtn');
  if(footerNotifyBtn){
    footerNotifyBtn.addEventListener('click', () => {
      const input = footerNotifyBtn.previousElementSibling;
      if(input.value.trim()){
        footerNotifyBtn.textContent = 'Thanks ✓';
        input.value = '';
        setTimeout(() => { footerNotifyBtn.textContent = 'Notify me'; }, 2200);
      } else {
        input.focus();
      }
    });
  }
const FORMSPREE_ENDPOINT = 'https://formspree.io/f/xdeoqjzd'; // ← paste your real endpoint here

form.addEventListener('submit', async (e) => {
  e.preventDefault();
  submitBtn.textContent = 'Sending…';
  submitBtn.disabled = true;

  try {
    const response = await fetch(FORMSPREE_ENDPOINT, {
      method: 'POST',
      body: new FormData(form),
      headers: { 'Accept': 'application/json' }
    });

    if (response.ok) {
      submitBtn.textContent = 'Message sent ✓';
      submitBtn.classList.add('sent');
      form.reset();
    } else {
      submitBtn.textContent = 'Something went wrong';
    }
  } catch (err) {
    submitBtn.textContent = 'Network error — try again';
  } finally {
    setTimeout(() => {
      submitBtn.textContent = 'Talk';
      submitBtn.classList.remove('sent');
      submitBtn.disabled = false;
    }, 2500);
  }
});