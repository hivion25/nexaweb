document.documentElement.classList.add('js');

/* Motion (Framer Motion's DOM build, vendored in assets/vendor) is an enhancement:
   every feature below has a working fallback when it's missing or when the user
   prefers reduced motion. */
const M = window.Motion && typeof window.Motion.animate === 'function' ? window.Motion : null;
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const finePointer = window.matchMedia('(hover: hover) and (pointer: fine)').matches;
const useMotion = !!M && !reduceMotion;
if(useMotion) document.documentElement.classList.add('has-motion');

const EASE_OUT = [.22, 1, .36, 1];
const SPRING = {type:'spring', stiffness:420, damping:34};

/* ---------- Toast ---------- */
const toast = document.getElementById('toast');
function showToast(msg){
  toast.textContent = msg;
  toast.classList.add('show');
  clearTimeout(window.toastTimer);
  window.toastTimer = setTimeout(()=>toast.classList.remove('show'),3200);
}

/* ---------- Plans / form ---------- */
const WHATSAPP_NUMBER = '966599185199'; // رقم استقبال الطلبات (بصيغة دولية بدون + أو أصفار)
function choosePlan(plan){
  document.getElementById('type').value =
    plan === 'Starter' ? 'صفحة هبوط' :
    plan === 'Store' ? 'متجر إلكتروني' :
    plan === 'App' ? 'تطبيق' :
    plan === 'Custom' ? 'نظام خاص' : 'موقع شركة';
  document.getElementById('contact').scrollIntoView({behavior:'smooth'});
  showToast(`تم اختيار باقة ${plan} — أكمل بياناتك لإرسال الطلب`);
  // visual cue: highlight the form and move focus to the first field once the scroll settles
  const form = document.getElementById('contactForm');
  if(form){
    form.classList.remove('flash'); void form.offsetWidth; form.classList.add('flash');
    setTimeout(()=>document.getElementById('name').focus({preventScroll:true}), 700);
  }
}
function sendForm(e){
  e.preventDefault();
  const name = document.getElementById('name').value.trim();
  const phone = document.getElementById('phone').value.trim();
  const type = document.getElementById('type').value;
  const message = document.getElementById('message').value.trim();
  if(!name || !phone) return;
  // Opens WhatsApp with the request pre-written; the customer presses send there.
  const text = [
    'طلب جديد من موقع نكسا ويب',
    `الاسم: ${name}`,
    `رقم الجوال: ${phone}`,
    `نوع المشروع: ${type}`,
    message ? `التفاصيل: ${message}` : ''
  ].filter(Boolean).join('\n');
  window.open(`https://wa.me/${WHATSAPP_NUMBER}?text=${encodeURIComponent(text)}`, '_blank', 'noopener');
  showToast(`شكرًا ${name} ✨ اضغط «إرسال» في الواتساب لإكمال طلبك`);
}

/* ---------- Nav: scrolled state + mobile menu ---------- */
const nav = document.getElementById('nav');
const navToggle = document.getElementById('navToggle');
const navLinks = document.getElementById('navLinks');
const navScrim = document.getElementById('navScrim');

function setMenu(open){
  nav.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
  if(navScrim) navScrim.classList.toggle('show', open);
}
navToggle.addEventListener('click', ()=>setMenu(!nav.classList.contains('open')));
navLinks.addEventListener('click', e=>{ if(e.target.closest('a')) setMenu(false); });
if(navScrim) navScrim.addEventListener('click', ()=>setMenu(false));
document.addEventListener('keydown', e=>{
  if(e.key === 'Escape' && nav.classList.contains('open')){ setMenu(false); navToggle.focus(); }
});
window.matchMedia('(min-width: 901px)').addEventListener('change', e=>{ if(e.matches) setMenu(false); });

const scrollBar = document.getElementById('scrollBar');
const onScroll = ()=>{
  nav.classList.toggle('scrolled', window.scrollY > 12);
  if(!useMotion && scrollBar){
    const max = document.documentElement.scrollHeight - innerHeight;
    scrollBar.style.transform = `scaleX(${max > 0 ? Math.min(scrollY / max, 1) : 0})`;
  }
};
window.addEventListener('scroll', onScroll, {passive:true});
onScroll();

/* ---------- Active nav link + sliding indicator (shared-element style) ---------- */
const linkFor = {};
navLinks.querySelectorAll('a:not(.btn)').forEach(a=>{ linkFor[a.getAttribute('href').slice(1)] = a; });
const pill = navLinks.querySelector('.nav-pill');
let activeLink = null, hoverLink = null, pillShown = false;

function movePill(a, instant){
  if(!useMotion || !pill || innerWidth <= 900) return;
  if(!a){
    if(pillShown) M.animate(pill, {opacity:0}, {duration:.18});
    pillShown = false;
    return;
  }
  const to = {x:a.offsetLeft, width:a.offsetWidth};
  if(!pillShown || instant){
    M.animate(pill, to, {duration:0});
    M.animate(pill, {opacity:1}, {duration:.2});
  }else{
    M.animate(pill, to, SPRING);
  }
  pillShown = true;
}
navLinks.addEventListener('pointerover', e=>{
  const a = e.target.closest('a:not(.btn)');
  if(a && a !== hoverLink){ hoverLink = a; movePill(a); }
});
navLinks.addEventListener('pointerleave', ()=>{ hoverLink = null; movePill(activeLink); });
window.addEventListener('resize', ()=>movePill(hoverLink || activeLink, true));

const spy = new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(!entry.isIntersecting) return;
    Object.values(linkFor).forEach(a=>a.classList.remove('active'));
    const link = linkFor[entry.target.id];
    if(link) link.classList.add('active');
    activeLink = link || null;
    if(!hoverLink) movePill(activeLink);
  });
},{rootMargin:'-45% 0px -50% 0px'});
document.querySelectorAll('main section[id]').forEach(s=>spy.observe(s));

/* ---------- Reveal on scroll (batched + staggered) ---------- */
const reveals = document.querySelectorAll('.reveal');
const byDocOrder = (a, b)=>(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1);
let batch = [], batchFrame = 0;

function flushReveals(){
  batchFrame = 0;
  const els = batch.sort(byDocOrder);
  batch = [];
  if(useMotion){
    M.animate(els,
      {opacity:[0, 1], y:[28, 0], filter:['blur(8px)', 'blur(0px)']},
      {duration:.85, ease:EASE_OUT, delay:M.stagger(.07)}
    ).then(()=>els.forEach(el=>{
      el.classList.add('shown');
      // hand control back to CSS so hover transforms keep working
      el.style.removeProperty('transform');
      el.style.removeProperty('filter');
      el.style.removeProperty('opacity');
    }));
  }else{
    els.forEach((el, i)=>{ el.style.setProperty('--d', `${Math.min(i, 6) * 70}ms`); el.classList.add('in'); });
  }
}
function queueReveal(el){
  batch.push(el);
  if(!batchFrame) batchFrame = requestAnimationFrame(flushReveals);
}

if(reduceMotion){
  reveals.forEach(el=>el.classList.add('shown'));
}else if(useMotion){
  M.inView(reveals, el=>queueReveal(el), {margin:'0px 0px -8% 0px'});
}else{
  const revealer = new IntersectionObserver(entries=>{
    entries.forEach(entry=>{
      if(!entry.isIntersecting) return;
      revealer.unobserve(entry.target);
      queueReveal(entry.target);
    });
  },{threshold:.12});
  reveals.forEach(el=>revealer.observe(el));
}

/* ---------- Motion-only flourishes ---------- */
if(useMotion){
  // page scroll progress
  if(scrollBar) M.scroll(M.animate(scrollBar, {scaleX:[0, 1]}, {ease:'linear'}));

  // hero drifts away gently as you scroll past it
  const hero = document.getElementById('home');
  const stage = hero && hero.querySelector('.hero-stage');
  if(stage){
    M.scroll(M.animate(stage, {y:[0, 90], opacity:[1, .3]}, {ease:'linear'}),
      {target:hero, offset:['start start', 'end start']});
  }

  // process timeline fills as the steps scroll through the viewport
  const steps = document.getElementById('steps');
  const stepsWrap = steps && steps.closest('.steps-wrap');
  if(stepsWrap){
    M.scroll(p=>stepsWrap.style.setProperty('--p', p.toFixed(3)),
      {target:steps, offset:['start 85%', 'end 60%']});
  }

  // count-up for numeric stats
  document.querySelectorAll('[data-count]').forEach(el=>{
    const target = Number(el.dataset.count) || 0;
    el.textContent = '0';
    M.inView(el, ()=>{
      M.animate(0, target, {duration:1.6, ease:EASE_OUT, onUpdate:v=>{ el.textContent = Math.round(v); }});
    });
  });

  // tactile press feedback (springs back on release)
  M.press('.btn, .nav-toggle, .channel, .to-top, .client-next', el=>{
    M.animate(el, {scale:.96}, {type:'spring', stiffness:600, damping:30});
    return ()=>M.animate(el, {scale:1}, {type:'spring', stiffness:500, damping:20});
  });
}

/* ---------- Pointer effects (desktop only) ---------- */
if(finePointer && !reduceMotion){
  // cursor-follow spotlight on cards
  document.addEventListener('pointermove', e=>{
    const el = e.target.closest && e.target.closest('.spot');
    if(!el) return;
    const r = el.getBoundingClientRect();
    el.style.setProperty('--mx', `${e.clientX - r.left}px`);
    el.style.setProperty('--my', `${e.clientY - r.top}px`);
  }, {passive:true});

  // layered depth parallax in the hero visual
  const hv = document.getElementById('heroVisual');
  const heroSection = document.getElementById('home');
  if(hv && heroSection){
    let frame = 0;
    heroSection.addEventListener('pointermove', e=>{
      if(frame) return;
      frame = requestAnimationFrame(()=>{
        frame = 0;
        const r = hv.getBoundingClientRect();
        const x = ((e.clientX - r.left) / r.width - .5) * 2;
        const y = ((e.clientY - r.top) / r.height - .5) * 2;
        hv.style.setProperty('--px', Math.max(-1, Math.min(1, x)).toFixed(3));
        hv.style.setProperty('--py', Math.max(-1, Math.min(1, y)).toFixed(3));
      });
    });
    heroSection.addEventListener('pointerleave', ()=>{
      hv.style.setProperty('--px', 0);
      hv.style.setProperty('--py', 0);
    });
  }
}

/* ---------- Work previews: scale the 1280px demo pages to fit their cards ----------
   On hover the preview scrolls through the whole demo page (CSS transition on --ty). */
const fitShot = shot=>{
  const frame = shot.querySelector('iframe');
  const scale = shot.clientWidth / 1280;
  const pageH = Number(frame.dataset.pageH) || 800;
  frame.style.height = `${pageH}px`;
  frame.style.setProperty('--s', scale);
  frame.style.setProperty('--ty', `${Math.min(0, shot.clientHeight - pageH * scale)}px`);
  frame.style.setProperty('--dur', `${Math.min(Math.max((pageH - 800) / 350, 1.2), 4.5)}s`);
};
const measureShot = shot=>{
  const frame = shot.querySelector('iframe');
  try{
    const doc = frame.contentDocument;
    // measure once at the 800px design height so vh-based pages don't grow with the frame
    if(doc && doc.body && !frame.dataset.pageH) frame.dataset.pageH = Math.max(800, doc.documentElement.scrollHeight);
  }catch(err){ /* cross-origin preview: keep the static 800px crop */ }
  fitShot(shot);
};
const shotSizer = new ResizeObserver(entries=>entries.forEach(e=>fitShot(e.target)));
document.querySelectorAll('.shot').forEach(shot=>{
  fitShot(shot);
  shotSizer.observe(shot);
  const frame = shot.querySelector('iframe');
  frame.addEventListener('load', ()=>measureShot(shot));
  try{
    const doc = frame.contentDocument;
    if(doc && doc.readyState === 'complete' && doc.URL !== 'about:blank') measureShot(shot);
  }catch(err){ /* not same-origin: ignore */ }
});
