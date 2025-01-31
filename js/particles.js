export class ParticleSystem {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'particles-bg';
    document.body.prepend(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.particleCount = 100;
    this.mouse = { x: null, y: null, radius: 150 };
    
    this.config = {
      particleColor: 'rgba(139, 69, 19, 0.6)',
      connectionColor: 'rgba(139, 69, 19, 0.5)',
      particleSize: { min: 3, max: 6 },
      speed: { min: 0.2, max: 0.4 }, // Increased speed to make movement visible
      connectionDistance: 180,
      maxConnections: 6,
      connectionWidth: 2.2,
      pulseSpeed: 0.005,
      repelForce: 0.04,
      minDistance: 35,
      particleCount: 100,
      wanderStrength: 0.05, // Increased for more noticeable movement
      flowFieldScale: 0.005, // Adjusted for better flow
      flowFieldStrength: 0.1 // Increased for more defined movement
    };

    this.init();
    this.animate();
    this.handleResize();
    this.handleMouseMove();
  }

  init() {
    this.setCanvasSize();
    this.createParticles();
  }

  setCanvasSize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  createParticles() {
    for (let i = 0; i < this.particleCount; i++) {
      this.particles.push({
        x: Math.random() * this.canvas.width,
        y: Math.random() * this.canvas.height,
        radius: Math.random() * 
          (this.config.particleSize.max - this.config.particleSize.min) + 
          this.config.particleSize.min,
        baseRadius: Math.random() * 
          (this.config.particleSize.max - this.config.particleSize.min) + 
          this.config.particleSize.min,
        vx: (Math.random() - 0.5) * this.config.speed.max,
        vy: (Math.random() - 0.5) * this.config.speed.max,
        angle: Math.random() * Math.PI * 2,
        pulse: Math.random() * Math.PI * 2,
        connections: 0
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Update particle positions
    this.particles.forEach(p => {
      // Update position
      p.x += p.vx;
      p.y += p.vy;
      
      // Bounce off edges
      if (p.x < 0 || p.x > this.canvas.width) p.vx *= -1;
      if (p.y < 0 || p.y > this.canvas.height) p.vy *= -1;
      
      // Gradually change direction
      p.angle += (Math.random() - 0.5) * 0.1;
      p.vx = Math.cos(p.angle) * this.config.speed.min;
      p.vy = Math.sin(p.angle) * this.config.speed.min;
      
      // Keep particles within bounds
      p.x = Math.max(0, Math.min(this.canvas.width, p.x));
      p.y = Math.max(0, Math.min(this.canvas.height, p.y));
    });

    // Draw connections
    for (let i = 0; i < this.particles.length; i++) {
      const p1 = this.particles[i];
      p1.connections = 0;
      
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.config.connectionDistance && 
            p1.connections < this.config.maxConnections && 
            p2.connections < this.config.maxConnections) {
          
          p1.connections++;
          p2.connections++;
          
          const opacity = Math.pow(1 - distance / this.config.connectionDistance, 2);
          this.ctx.beginPath();
          this.ctx.strokeStyle = this.config.connectionColor.replace('0.5', opacity * 0.5);
          this.ctx.lineWidth = this.config.connectionWidth;
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      }
    }

    // Draw particles
    this.particles.forEach(p => {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = this.config.particleColor;
      this.ctx.fill();
    });
    
    requestAnimationFrame(() => this.animate());
  }

  handleMouseMove() {
    document.addEventListener('mousemove', (e) => {
      this.mouse.x = e.clientX;
      this.mouse.y = e.clientY;
    });
    
    document.addEventListener('mouseleave', () => {
      this.mouse.x = null;
      this.mouse.y = null;
    });
  }

  handleResize() {
    window.addEventListener('resize', () => {
      this.setCanvasSize();
      this.particles = [];
      this.createParticles();
    });
  }
} 