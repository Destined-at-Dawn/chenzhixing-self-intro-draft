const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if(!reduceMotion && 'IntersectionObserver' in window){
    const io = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add('in-view'); io.unobserve(e.target); } });
    }, { threshold: .2 });
    document.querySelectorAll('.stat-card, .signature-card').forEach(el=>io.observe(el));
    setTimeout(()=>{
      document.querySelectorAll('.stat-card:not(.in-view), .signature-card:not(.in-view)').forEach(el=>el.classList.add('in-view'));
    }, 4000);
  } else {
    document.querySelectorAll('.stat-card, .signature-card').forEach(el=>el.classList.add('in-view'));
  }

  // 板块标题滚动进场（首屏内容已经用纯CSS的 .hero-enter 动画，不依赖这段JS）
  if(reduceMotion || !('IntersectionObserver' in window)){
    document.querySelectorAll('.reveal-scroll').forEach(el=>el.classList.add('in-view'));
  } else {
    const revealIO = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(!e.isIntersecting) return;
        e.target.classList.add('in-view');
        revealIO.unobserve(e.target);
      });
    }, { threshold: .15 });
    document.querySelectorAll('.reveal-scroll').forEach(el=> revealIO.observe(el));
    // 兜底：万一 observer 在某些环境下没触发，几秒后强制全部显示，不让内容永久隐身
    setTimeout(()=>{
      document.querySelectorAll('.reveal-scroll:not(.in-view)').forEach(el=>el.classList.add('in-view'));
    }, 4000);
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
