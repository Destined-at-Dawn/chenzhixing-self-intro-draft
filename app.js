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

  // 数字跳动：卡片可见时从0跳到目标值(参考站 js-stat-value 的做法)
  function animateCount(el){
    const target = parseFloat(el.dataset.target);
    if(Number.isNaN(target)){ return; }
    const decimals = parseInt(el.dataset.decimals || '0', 10);
    if(reduceMotion){ el.textContent = target.toFixed(decimals); return; }
    const duration = 1100;
    const start = performance.now();
    function frame(now){
      const t = Math.min((now - start) / duration, 1);
      const eased = 1 - Math.pow(1 - t, 3);
      el.textContent = (target * eased).toFixed(decimals);
      if(t < 1){ requestAnimationFrame(frame); }
      else { el.textContent = target.toFixed(decimals); }
    }
    requestAnimationFrame(frame);
  }
  if(reduceMotion || !('IntersectionObserver' in window)){
    document.querySelectorAll('.count-up').forEach(animateCount);
  } else {
    const countIO = new IntersectionObserver((entries)=>{
      entries.forEach(e=>{
        if(!e.isIntersecting) return;
        e.target.querySelectorAll('.count-up').forEach(animateCount);
        countIO.unobserve(e.target);
      });
    }, { threshold: .2 });
    document.querySelectorAll('.stat-card').forEach(el=> countIO.observe(el));
    // 兜底：直接写最终值，不再走 requestAnimationFrame——
    // 万一某些环境里 rAF 压根不触发(比如标签页不在前台/未真正渲染)，
    // 走 animateCount 一样会卡住，所以这里必须是同步赋值，不依赖动画帧。
    setTimeout(()=>{
      document.querySelectorAll('.count-up').forEach(el=>{
        const target = parseFloat(el.dataset.target);
        const decimals = parseInt(el.dataset.decimals || '0', 10);
        if(!Number.isNaN(target) && el.textContent !== target.toFixed(decimals)){
          el.textContent = target.toFixed(decimals);
        }
      });
    }, 4000);
  }

  // 灯箱：点开成绩单/详情图片时，在原背景上弹一个可滚动的大窗口，而不是新开白底页面
  const lightbox = document.getElementById('lightbox');
  if(lightbox){
    const lightboxImg = document.getElementById('lightbox-img');
    function openLightbox(src, alt){
      lightboxImg.src = src;
      lightboxImg.alt = alt || '';
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
    function closeLightbox(){
      lightbox.classList.remove('open');
      lightbox.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
    document.querySelectorAll('.proof-link').forEach(a=>{
      a.addEventListener('click', (e)=>{
        e.preventDefault();
        openLightbox(a.getAttribute('href'), a.textContent.trim());
      });
    });
    lightbox.querySelector('.lightbox-backdrop')?.addEventListener('click', closeLightbox);
    lightbox.querySelector('.lightbox-close')?.addEventListener('click', closeLightbox);
    document.addEventListener('keydown', (e)=>{ if(e.key === 'Escape') closeLightbox(); });
  }
