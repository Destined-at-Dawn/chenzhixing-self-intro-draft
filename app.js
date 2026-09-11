const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduceMotion && 'IntersectionObserver' in window){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in-view'); io.unobserve(e.target); } });
    }, { threshold: .2 });
    document.querySelectorAll('.stat-card, .signature-card').forEach(el=>io.observe(el));
  } else {
    document.querySelectorAll('.stat-card, .signature-card').forEach(el=>el.classList.add('in-view'));
  }

  // 平滑滑入展示：首屏元素按顺序错开，其它板块标题滚动到可视区域时触发
  const heroRevealEls = Array.from(document.querySelectorAll('.hero .reveal-slide'));
  if(reduceMotion || !('IntersectionObserver' in window)){
    document.querySelectorAll('.reveal-slide').forEach(el=>el.classList.add('in-view'));
  } else {
    const revealIO = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(!e.isIntersecting) return;
        const el = e.target;
        const heroIndex = heroRevealEls.indexOf(el);
        const delay = heroIndex >= 0 ? heroIndex * 90 : 0;
        setTimeout(()=> el.classList.add('in-view'), delay);
        revealIO.unobserve(el);
      });
    }, { threshold: .15 });
    document.querySelectorAll('.reveal-slide').forEach(el=> revealIO.observe(el));
  }

  function typewriter(el, speed){
    return new Promise((resolve)=>{
      const finalHTML = el.innerHTML;
      const tmp = document.createElement('div');
      tmp.innerHTML = finalHTML;
      const text = tmp.textContent;
      el.textContent = '';
      const caret = document.createElement('span');
      caret.className = 'type-caret';
      el.appendChild(caret);
      let i = 0;
      (function tick(){
        if(i < text.length){
          caret.insertAdjacentText('beforebegin', text[i]);
          i++;
          setTimeout(tick, speed + Math.random() * 35);
        } else {
          el.innerHTML = finalHTML;
          resolve();
        }
      })();
    });
  }

  if(!reduceMotion){
    (async () => {
      await new Promise(r => setTimeout(r, 900)); // 等首屏滑入动画先跑完，再开始打字机
      const tagline = document.getElementById('tagline');
      if(tagline) await typewriter(tagline, 55);
      const introLine = document.getElementById('intro-line');
      if(introLine) await typewriter(introLine, 20);
      const logLines = document.querySelectorAll('.hud-log .type-line');
      for(const line of logLines){ await typewriter(line, 24); }
    })();
  }

  // 照片轮播：自动播放 + 手动左右切换，支持任意数量的 .carousel-slide
  document.querySelectorAll('.carousel').forEach((carousel)=>{
    const track = carousel.querySelector('.carousel-track');
    const slides = Array.from(carousel.querySelectorAll('.carousel-slide'));
    const dotsWrap = carousel.parentElement.querySelector('.carousel-dots');
    if(slides.length <= 1) return;
    let index = 0;
    let timer = null;

    if(dotsWrap){
      dotsWrap.innerHTML = '';
      slides.forEach((_, i)=>{
        const dot = document.createElement('span');
        dot.className = 'carousel-dot' + (i === 0 ? ' active' : '');
        dot.addEventListener('click', ()=> goTo(i));
        dotsWrap.appendChild(dot);
      });
    }

    function render(){
      track.style.transform = `translateX(-${index * 100}%)`;
      if(dotsWrap){
        Array.from(dotsWrap.children).forEach((d, i)=> d.classList.toggle('active', i === index));
      }
    }
    function goTo(i){ index = (i + slides.length) % slides.length; render(); }
    function next(){ goTo(index + 1); }
    function prev(){ goTo(index - 1); }

    carousel.querySelector('.carousel-btn.next')?.addEventListener('click', ()=>{ next(); restart(); });
    carousel.querySelector('.carousel-btn.prev')?.addEventListener('click', ()=>{ prev(); restart(); });

    function restart(){
      if(reduceMotion) return;
      clearInterval(timer);
      timer = setInterval(next, 4000);
    }
    restart();
  });
