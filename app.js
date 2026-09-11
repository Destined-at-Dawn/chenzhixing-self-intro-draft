const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  // 打字机目标提前同步清空——避免"首屏淡入时先露出完整文字，再被清空重打"的穿帮。
  // 不用visibility/display隐藏它们：万一后面的typewriter因为任何原因没跑起来，
  // 原文字只是"被清空"而不是"被隐藏"，兜底会在下面把它们放回来，不会永久空白。
  const typeTargets = [
    ...['tagline', 'intro-line'].map(id => document.getElementById(id)).filter(Boolean),
    ...document.querySelectorAll('.hud-log .type-line')
  ];
  const typeTargetOriginal = new Map(typeTargets.map(el => [el, el.innerHTML]));
  if(!reduceMotion){
    typeTargets.forEach(el => { el.textContent = ''; });
    // 兜底：万一打字机逻辑没跑起来(报错/JS未执行到这里)，放回完整文字。
    // 延时要大于整段打字序列最长可能耗时(tagline+intro-line+3行hud-log)，
    // 否则会打断正常进行中的打字动画。
    setTimeout(() => {
      typeTargets.forEach(el => { if(!el.textContent) el.innerHTML = typeTargetOriginal.get(el); });
    }, 9000);
  }

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
