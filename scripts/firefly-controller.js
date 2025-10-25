/**
 * FireflyController - Manages ambient particle effects
 * Modular system for showing fireflies during intro and interludes
 */

export class FireflyController {
    constructor(container) {
        this.container = container;
        this.particles = [];
        this.particleCount = 25; // Number of fireflies
        this.sunriseParticles = [];
        this.sunriseParticleCount = 120; // Dramatic increase for interlude contrast
        this.isActive = false;
        
        // Wind field parameters (inspired by wind-js)
        this.windField = {
            baseU: 0.8,  // Base horizontal wind component (left to right)
            baseV: 0.0,  // Base vertical component
            scale: 0.003 // Scale for noise influence
        };
    }
    
    /**
     * Sample wind vector at a given position using Perlin-like noise
     * Inspired by wind-js vector field interpolation
     */
    sampleWind(x, y, t) {
        // Simple noise approximation using sin/cos for natural variation
        const noiseX = Math.sin(x * 0.02 + t * 0.5) * Math.cos(y * 0.015);
        const noiseY = Math.cos(x * 0.015 + t * 0.3) * Math.sin(y * 0.02);
        
        return {
            u: this.windField.baseU + noiseX * 0.3,  // Horizontal with variation
            v: this.windField.baseV + noiseY * 0.4   // Vertical with more variation
        };
    }
    
    /**
     * Initialize firefly particles
     */
    init() {
        this.container.innerHTML = '';
        this.particles = [];
        
        for (let i = 0; i < this.particleCount; i++) {
            const firefly = this.createFirefly();
            this.container.appendChild(firefly);
            this.particles.push(firefly);
        }
    }
    
    /**
     * Initialize sunrise particles (for interlude)
     */
    initSunrise() {
        // Keep existing particles, add sunrise ones
        this.sunriseParticles = [];
        
        for (let i = 0; i < this.sunriseParticleCount; i++) {
            const particle = this.createFirefly('sunrise');
            this.container.appendChild(particle);
            this.sunriseParticles.push(particle);
        }
    }
    
    /**
     * Remove sunrise particles
     */
    removeSunrise() {
        this.sunriseParticles.forEach(p => {
            p.remove();
        });
        this.sunriseParticles = [];
    }
    
    /**
     * Create a single particle with physics-based parameters
     * Implements particle pooling and efficient initialization
     * @param {string} type - 'default' or 'sunrise'
     */
    createFirefly(type = 'default') {
        const firefly = document.createElement('div');
        firefly.className = type === 'sunrise' ? 'firefly firefly-sunrise' : 'firefly';
        
        // Store particle state for potential updates
        firefly.particleType = type;
        
        let startX, startY, midX, midY, endX, endY, duration, delay, opacity;
        
        if (type === 'sunrise') {
            // Geometric formations: spirals, waves, radial bursts
            const pattern = Math.floor(Math.random() * 4); // 4 different patterns
            const particleIndex = Math.random();
            
            if (pattern === 0) {
                // Spiral formation
                const angle = particleIndex * Math.PI * 4; // Multiple rotations
                const radius = particleIndex * 40;
                startX = 50 + Math.cos(angle) * radius;
                startY = 80;
                endX = 50 + Math.cos(angle + Math.PI) * (radius + 20);
                endY = 10 + particleIndex * 30;
                midX = 50 + Math.cos(angle + Math.PI/2) * (radius + 10);
                midY = 50;
            } else if (pattern === 1) {
                // Wave formation
                startX = particleIndex * 100;
                startY = 70 + Math.sin(particleIndex * Math.PI * 3) * 15;
                endX = startX + (Math.random() - 0.5) * 10;
                endY = 10 + Math.sin(particleIndex * Math.PI * 3) * 10;
                midX = startX + Math.sin(particleIndex * Math.PI * 6) * 20;
                midY = 40;
            } else if (pattern === 2) {
                // Radial burst from center
                const burstAngle = particleIndex * Math.PI * 2;
                const burstRadius = 5;
                startX = 50 + Math.cos(burstAngle) * burstRadius;
                startY = 50 + Math.sin(burstAngle) * burstRadius;
                endX = 50 + Math.cos(burstAngle) * 60;
                endY = 50 + Math.sin(burstAngle) * 50 - 30;
                midX = 50 + Math.cos(burstAngle) * 30;
                midY = 50 + Math.sin(burstAngle) * 25 - 10;
            } else {
                // Ascending curtain/columns
                const column = Math.floor(particleIndex * 8);
                startX = 12.5 + column * 12.5;
                startY = 80 + (particleIndex % 0.3) * 20;
                endX = startX + (Math.random() - 0.5) * 8;
                endY = -10 + (particleIndex % 0.2) * 20;
                midX = startX + Math.sin(particleIndex * Math.PI * 4) * 12;
                midY = 40;
            }
            
            // Faster, more dramatic
            duration = 6 + Math.random() * 8; // 6-14s (much faster)
            delay = Math.random() * 6;
            opacity = 0.4 + Math.random() * 0.5; // 0.4-0.9 (brighter)
            
            // Vary size for dramatic effect
            const size = 3 + Math.random() * 5; // 3-8px
            firefly.style.setProperty('--particle-size', `${size}px`);
        } else {
            // Vector field-based wind simulation (wind-js approach)
            // Sample positions along the trajectory
            startX = -5 + Math.random() * 10; // Start from left edge
            startY = Math.random() * 100;
            
            // Time offset for temporal variation
            const timeOffset = Math.random() * 100;
            
            // Sample wind at three points to create natural curved path
            const wind0 = this.sampleWind(startX, startY, timeOffset);
            const wind1 = this.sampleWind(startX + 50, startY, timeOffset + 5);
            const wind2 = this.sampleWind(startX + 100, startY, timeOffset + 10);
            
            // Calculate trajectory points using accumulated wind vectors
            // Each step integrates the wind velocity at that position
            const step1Distance = 40 + Math.random() * 20;
            const step2Distance = 40 + Math.random() * 20;
            
            // Mid-point: accumulated wind influence
            midX = startX + step1Distance * wind0.u + step1Distance * wind1.u * 0.5;
            midY = startY + step1Distance * wind0.v * 15 + step1Distance * wind1.v * 12;
            
            // End-point: full trajectory with all wind influences
            endX = midX + step2Distance * wind1.u + step2Distance * wind2.u * 0.5;
            endY = midY + step2Distance * wind1.v * 15 + step2Distance * wind2.v * 12;
            
            // Clamp to reasonable bounds
            endX = Math.min(endX, 120);
            endY = Math.max(Math.min(endY, 110), -10);
            
            // Duration based on distance traveled
            const distance = Math.sqrt(Math.pow(endX - startX, 2) + Math.pow(endY - startY, 2));
            duration = 8 + (distance / 15); // 8-15s based on path length
            delay = Math.random() * 8;
            opacity = 0.3 + Math.random() * 0.4; // 0.3-0.7
        }
        
        // Set CSS custom properties
        firefly.style.setProperty('--start-x', `${startX}vw`);
        firefly.style.setProperty('--start-y', `${startY}vh`);
        firefly.style.setProperty('--mid-x', `${midX}vw`);
        firefly.style.setProperty('--mid-y', `${midY}vh`);
        firefly.style.setProperty('--end-x', `${endX}vw`);
        firefly.style.setProperty('--end-y', `${endY}vh`);
        firefly.style.setProperty('--duration', `${duration}s`);
        firefly.style.setProperty('--delay', `${delay}s`);
        firefly.style.setProperty('--opacity', opacity);
        
        return firefly;
    }
    
    /**
     * Show fireflies
     * @param {boolean} includeSunrise - Add sunrise particles
     */
    show(includeSunrise = false) {
        if (!this.isActive) {
            this.init(); // Regenerate particles for fresh randomness
            this.isActive = true;
        }
        
        if (includeSunrise && this.sunriseParticles.length === 0) {
            this.initSunrise();
        }
        
        this.container.classList.add('visible');
    }
    
    /**
     * Hide fireflies
     * @param {boolean} keepBase - Keep base fireflies visible
     */
    hide(keepBase = false) {
        if (!keepBase) {
            this.container.classList.remove('visible');
            this.isActive = false;
        }
        
        // Always remove sunrise particles when hiding
        this.removeSunrise();
    }
    
    /**
     * Check if fireflies are currently visible
     */
    isVisible() {
        return this.container.classList.contains('visible');
    }
}

