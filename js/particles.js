class ParticleSystem {
  constructor() {
    this.canvas = document.createElement('canvas');
    this.canvas.id = 'particles-bg';
    document.body.prepend(this.canvas);
    this.ctx = this.canvas.getContext('2d');
    this.particles = [];
    this.particleCount = 80; // Increased for more connections
    this.mouse = { x: null, y: null, radius: 150 };
    
    // Enhanced configuration
    this.config = {
      particleColor: 'rgba(139, 69, 19, 0.4)',
      connectionColor: 'rgba(139, 69, 19, 0.12)',
      particleSize: { min: 2, max: 5 },
      speed: { min: 0.3, max: 0.8 }, // Increased speed for more dynamic movement
      connectionDistance: 150, // Increased connection distance
      maxConnections: 3, // Reduced max connections for clearer visuals
      connectionWidth: 0.8,
      pulseSpeed: 0.01,
      repelForce: 0.1, // Force to push particles apart when too close
      minDistance: 30 // Minimum distance before particles repel
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
        pulse: Math.random() * Math.PI * 2, // Random starting phase
        connections: 0 // Track number of connections
      });
    }
  }

  animate() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    
    // Update particle positions and handle interactions
    for (let i = 0; i < this.particles.length; i++) {
      const p1 = this.particles[i];
      p1.connections = 0;
      
      // Particle interaction with others
      for (let j = i + 1; j < this.particles.length; j++) {
        const p2 = this.particles[j];
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        // Repel if too close
        if (distance < this.config.minDistance) {
          const angle = Math.atan2(dy, dx);
          const force = (this.config.minDistance - distance) * this.config.repelForce;
          
          p1.vx -= Math.cos(angle) * force;
          p1.vy -= Math.sin(angle) * force;
          p2.vx += Math.cos(angle) * force;
          p2.vy += Math.sin(angle) * force;
        }
      }

      // Update position
      p1.x += p1.vx;
      p1.y += p1.vy;
      
      // Apply friction
      p1.vx *= 0.99;
      p1.vy *= 0.99;
      
      // Bounce off edges
      if (p1.x < 0 || p1.x > this.canvas.width) {
        p1.vx *= -1;
        p1.x = p1.x < 0 ? 0 : this.canvas.width;
      }
      if (p1.y < 0 || p1.y > this.canvas.height) {
        p1.vy *= -1;
        p1.y = p1.y < 0 ? 0 : this.canvas.height;
      }

      // Pulse size
      p1.pulse += this.config.pulseSpeed;
      p1.radius = p1.baseRadius + Math.sin(p1.pulse) * 0.5;
    }

    // Draw particles and connections
    this.drawParticlesAndConnections();
    
    requestAnimationFrame(() => this.animate());
  }

  drawParticlesAndConnections() {
    // First draw all connections
    for (let i = 0; i < this.particles.length; i++) {
      const p1 = this.particles[i];
      
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
          
          // Calculate opacity based on distance
          const opacity = Math.pow(1 - distance / this.config.connectionDistance, 2);
          this.ctx.beginPath();
          this.ctx.strokeStyle = this.config.connectionColor.replace('0.12', opacity * 0.15);
          this.ctx.lineWidth = this.config.connectionWidth;
          this.ctx.moveTo(p1.x, p1.y);
          this.ctx.lineTo(p2.x, p2.y);
          this.ctx.stroke();
        }
      }
    }

    // Then draw all particles on top
    this.particles.forEach(p => {
      this.ctx.beginPath();
      this.ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
      this.ctx.fillStyle = this.config.particleColor;
      this.ctx.fill();
    });

    // Handle mouse interactions
    if (this.mouse.x !== null && this.mouse.y !== null) {
      this.particles.forEach(p => {
        const dx = p.x - this.mouse.x;
        const dy = p.y - this.mouse.y;
        const distance = Math.sqrt(dx * dx + dy * dy);
        
        if (distance < this.mouse.radius) {
          const force = (this.mouse.radius - distance) / this.mouse.radius;
          const angle = Math.atan2(dy, dx);
          p.vx += Math.cos(angle) * force * 0.5;
          p.vy += Math.sin(angle) * force * 0.5;
        }
      });
    }
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