class ParticleBackground {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'particleCanvas';
    this.canvas.style.cssText = 'position:fixed;top:0;left:0;width:100%;height:100%;pointer-events:none;z-index:0;opacity:0.6';
    document.body.insertBefore(this.canvas, document.body.firstChild);
    
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.config = {
      count: 80,
      speed: 0.5,
      size: 2,
      color: '#3b82f6',
      enabled: localStorage.getItem('particlesEnabled') !== 'false'
    };
    
    this.resize();
    window.addEventListener('resize', () => this.resize());
    
    if (this.config.enabled) this.init();
  }
  
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }
  
  init() {
    this.particles = [];
    for (let i = 0; i < this.config.count; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        vx: (Math.random() - 0.5) * this.config.speed,
        vy: (Math.random() - 0.5) * this.config.speed,
        size: Math.random() * this.config.size + 1
      });
    }
    this.animate();
  }
  
  animate() {
    if (!this.config.enabled) return;
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    this.particles.forEach((p, i) => {
      p.x += p.vx;
      p.y += p.vy;
      
      if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
      
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
      this.ctx.fillStyle = this.config.color;
      this.ctx.fill();
      
      this.particles.forEach((p2, j) => {
        if (i !== j) {
          const dx = p.x - p2.x;
          const dy = p.y - p2.y;
          const dist = Math.sqrt(dx * dx + dy * dy);
          
          if (dist < 120) {
            this.ctx.beginPath();
            this.ctx.strokeStyle = this.config.color;
            this.ctx.globalAlpha = (120 - dist) / 120 * 0.3;
            this.ctx.lineWidth = 0.5;
            this.ctx.moveTo(p.x, p.y);
            this.ctx.lineTo(p2.x, p2.y);
            this.ctx.stroke();
            this.ctx.globalAlpha = 1;
          }
        }
      });
    });
    
    requestAnimationFrame(() => this.animate());
  }
  
  updateConfig(key, value) {
    this.config[key] = value;
    if (key === 'enabled') {
      localStorage.setItem('particlesEnabled', value);
      if (value) {
        this.init();
      } else {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
    } else if (key === 'count') {
      this.init();
    }
  }
}

const particleBg = new ParticleBackground();
