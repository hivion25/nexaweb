document.documentElement.classList.add('js');

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

function setMenu(open){
  nav.classList.toggle('open', open);
  navToggle.setAttribute('aria-expanded', String(open));
  navToggle.setAttribute('aria-label', open ? 'إغلاق القائمة' : 'فتح القائمة');
}
navToggle.addEventListener('click', ()=>setMenu(!nav.classList.contains('open')));
navLinks.addEventListener('click', e=>{ if(e.target.closest('a')) setMenu(false); });
document.addEventListener('keydown', e=>{ if(e.key === 'Escape') setMenu(false); });

const onScroll = ()=>nav.classList.toggle('scrolled', window.scrollY > 12);
window.addEventListener('scroll', onScroll, {passive:true});
onScroll();

/* ---------- Active nav link ---------- */
const linkFor = {};
navLinks.querySelectorAll('a').forEach(a=>{ linkFor[a.getAttribute('href').slice(1)] = a; });
const spy = new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(!entry.isIntersecting) return;
    Object.values(linkFor).forEach(a=>a.classList.remove('active'));
    const link = linkFor[entry.target.id];
    if(link) link.classList.add('active');
  });
},{rootMargin:'-45% 0px -50% 0px'});
document.querySelectorAll('main section[id]').forEach(s=>spy.observe(s));

/* ---------- Reveal on scroll ---------- */
const revealer = new IntersectionObserver(entries=>{
  entries.forEach(entry=>{
    if(!entry.isIntersecting) return;
    const el = entry.target;
    el.classList.add('in');
    revealer.unobserve(el);
    // drop the stagger delay once revealed so hover transitions stay instant
    setTimeout(()=>{ el.style.transitionDelay = ''; }, 1100);
  });
},{threshold:.12});
document.querySelectorAll('.reveal').forEach(el=>{
  const i = Array.prototype.indexOf.call(el.parentElement.children, el);
  el.style.transitionDelay = `${Math.min(i, 5) * 70}ms`;
  revealer.observe(el);
});

/* ---------- Work previews: scale the 1280px demo pages to fit their cards ---------- */
const fitShot = shot=>{
  shot.querySelector('iframe').style.transform = `scale(${shot.clientWidth / 1280})`;
};
const shotSizer = new ResizeObserver(entries=>entries.forEach(e=>fitShot(e.target)));
document.querySelectorAll('.shot').forEach(shot=>{ fitShot(shot); shotSizer.observe(shot); });
