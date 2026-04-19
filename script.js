document.addEventListener('DOMContentLoaded', () => {
    // Math Parameters
    const nSlider = document.getElementById('nSlider');
    const mSlider = document.getElementById('mSlider');
    const nVal = document.getElementById('nVal');
    const mVal = document.getElementById('mVal');
    const variantToggle = document.getElementById('variantToggle');
    
    // Buttons
    const randomizeBtn = document.getElementById('randomizeBtn');
    const downloadBtn = document.getElementById('downloadBtn');

    // --- Chladni Visualizer ---
    class ChladniVisualizer {
        constructor() {
            this.canvas = document.getElementById('visualizer');
            this.ctx = this.canvas.getContext('2d');
            this.particles = [];
            this.numParticles = 2000;
            
            // Current Pattern
            this.pattern = { n: 3, m: 5, v: 0 };
            
            this.isPlaying = true;

            // Customization State
            this.config = {
                particleColor1: '#39FF14',
                particleColor2: '#00FFFF',
                trailColor: '#000a00',
                useGradient: true,
                bgGradStart: '#000000',
                bgGradEnd: '#1a1a2e',
                useBgGradient: false,
                particleSize: 1.5
            };

            this.aspectRatio = '1:1';
            this.resize();

            this.initParticles();
            this.animate();
        }

        setAspectRatio(ratioStr) {
            this.aspectRatio = ratioStr;
            this.resize();
        }

        updatePattern(n, m, v) {
            this.pattern = { n, m, v };
        }

        updateConfig(newConfig) {
            this.config = { ...this.config, ...newConfig };
        }

        updateParticleCount(count) {
            this.numParticles = count;
            this.initParticles();
        }

        resize() {
            // Internal high-res dimensions for clear SVG output
            const ratios = {
                '1:1': { w: 1200, h: 1200 },
                '16:9': { w: 1920, h: 1080 },
                '9:16': { w: 1080, h: 1920 },
                '4:3': { w: 1600, h: 1200 }
            };
            
            const dims = ratios[this.aspectRatio] || ratios['1:1'];
            
            // Set the canvas internal resolution
            this.canvas.width = dims.w;
            this.canvas.height = dims.h;

            // Provide inline CSS to enforce the aspect ratio in the DOM
            this.canvas.style.aspectRatio = `${dims.w} / ${dims.h}`;
            
            // Ensure width/height CSS scales to bounds but maintains ratio
            this.canvas.style.width = '100%';
            this.canvas.style.height = '100%';
            this.canvas.style.objectFit = 'contain';

            // Restart particles so they distribute across the new canvas bounds
            if (this.particles.length > 0) {
                this.initParticles();
            }
        }

        initParticles() {
            this.particles = [];
            for (let i = 0; i < this.numParticles; i++) {
                this.particles.push({
                    x: Math.random() * this.canvas.width,
                    y: Math.random() * this.canvas.height,
                    vx: 0,
                    vy: 0
                });
            }
        }

        getVibration(x, y, n, m, v) {
            const pi = Math.PI;
            // Normalize x,y to aspect ratio preserved range
            const aspect = this.canvas.width / this.canvas.height;
            const nx = (x / this.canvas.width - 0.5) * 2 * aspect;
            const ny = (y / this.canvas.height - 0.5) * 2;

            const term1 = Math.cos(n * pi * nx) * Math.cos(m * pi * ny);
            const term2 = Math.cos(m * pi * nx) * Math.cos(n * pi * ny);

            if (v === 1) {
                return term1 + term2;
            } else {
                return term1 - term2;
            }
        }

        togglePlay() {
            this.isPlaying = !this.isPlaying;
            if (this.isPlaying) {
                this.animate();
            }
        }

        animate(singleFrame = false) {
            if (!this.isPlaying && !singleFrame) return;

            const hexToRgba = (hex, alpha) => {
                const r = parseInt(hex.slice(1, 3), 16);
                const g = parseInt(hex.slice(3, 5), 16);
                const b = parseInt(hex.slice(5, 7), 16);
                return `rgba(${r}, ${g}, ${b}, ${alpha})`;
            };

            if (this.config.useBgGradient) {
                const gradient = this.ctx.createLinearGradient(0, 0, 0, this.canvas.height);
                gradient.addColorStop(0, hexToRgba(this.config.bgGradStart, 0.2));
                gradient.addColorStop(1, hexToRgba(this.config.bgGradEnd, 0.2));
                this.ctx.fillStyle = gradient;
            } else {
                this.ctx.fillStyle = hexToRgba(this.config.trailColor, 0.2);
            }

            this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

            // Set Particle Color
            if (this.config.useGradient) {
                const gradient = this.ctx.createLinearGradient(0, 0, this.canvas.width, this.canvas.height);
                gradient.addColorStop(0, this.config.particleColor1);
                gradient.addColorStop(1, this.config.particleColor2);
                this.ctx.fillStyle = gradient;
            } else {
                this.ctx.fillStyle = this.config.particleColor1;
            }

            this.ctx.beginPath();
            for (let p of this.particles) {
                const vib = this.getVibration(p.x, p.y, this.pattern.n, this.pattern.m, this.pattern.v);
                const totalVibration = Math.abs(vib);

                const moveAmount = totalVibration * 50 + 1.0; 

                p.x += (Math.random() - 0.5) * moveAmount;
                p.y += (Math.random() - 0.5) * moveAmount;

                // Bounds checking
                if (p.x < 0) p.x = this.canvas.width;
                if (p.x > this.canvas.width) p.x = 0;
                if (p.y < 0) p.y = this.canvas.height;
                if (p.y > this.canvas.height) p.y = 0;

                this.ctx.moveTo(p.x + this.config.particleSize, p.y);
                this.ctx.arc(p.x, p.y, this.config.particleSize, 0, Math.PI * 2);
            }
            this.ctx.fill();

            if (!singleFrame) {
                requestAnimationFrame(() => this.animate());
            }
        }

        exportToSVG() {
            const width = this.canvas.width;
            const height = this.canvas.height;
            let svgContent = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} ${height}" width="${width}" height="${height}">\n`;

            // Background
            if (this.config.useBgGradient) {
               svgContent += `  <defs>\n    <linearGradient id="bgGrad" x1="0" y1="0" x2="0" y2="1">\n      <stop offset="0%" stop-color="${this.config.bgGradStart}" />\n      <stop offset="100%" stop-color="${this.config.bgGradEnd}" />\n    </linearGradient>\n  </defs>\n`;
               svgContent += `  <rect width="${width}" height="${height}" fill="url(#bgGrad)" />\n`;
            } else {
               svgContent += `  <rect width="${width}" height="${height}" fill="${this.config.trailColor}" />\n`;
            }

            // Particle Gradient Def
            if (this.config.useGradient) {
                svgContent += `  <defs>\n    <linearGradient id="particleGrad" x1="0" y1="0" x2="1" y2="0">\n      <stop offset="0%" stop-color="${this.config.particleColor1}" />\n      <stop offset="100%" stop-color="${this.config.particleColor2}" />\n    </linearGradient>\n  </defs>\n`;
            }

            const fillStyle = this.config.useGradient ? 'url(#particleGrad)' : this.config.particleColor1;

            // Particles as a single path
            let pathData = '';
            for(let p of this.particles) {
                const y = parseFloat(p.y).toFixed(2);
                const r = this.config.particleSize;
                const xMinus = (parseFloat(p.x) - r).toFixed(2);
                const xPlus = (parseFloat(p.x) + r).toFixed(2);
                
                // SVG Arc commands to draw a full circle
                pathData += `M ${xMinus} ${y} A ${r} ${r} 0 1 0 ${xPlus} ${y} A ${r} ${r} 0 1 0 ${xMinus} ${y} `;
            }
            svgContent += `  <path d="${pathData.trim()}" fill="${fillStyle}" />\n`;

            svgContent += `</svg>`;
            return svgContent;
        }
    }

    const visualizer = new ChladniVisualizer();

    // --- Math UI Handlers ---
    const updatePatternFromUI = () => {
        const n = parseInt(nSlider.value);
        const m = parseInt(mSlider.value);
        const v = variantToggle.checked ? 1 : 0;
        visualizer.updatePattern(n, m, v);
    };

    nSlider.addEventListener('input', (e) => {
        nVal.textContent = e.target.value;
        updatePatternFromUI();
        visualizer.initParticles();
    });

    mSlider.addEventListener('input', (e) => {
        mVal.textContent = e.target.value;
        updatePatternFromUI();
        visualizer.initParticles();
    });

    variantToggle.addEventListener('change', () => {
        updatePatternFromUI();
        visualizer.initParticles();
    });

    randomizeBtn.addEventListener('click', () => {
        nSlider.value = Math.floor(Math.random() * 10) + 1;
        mSlider.value = Math.floor(Math.random() * 10) + 1;
        nVal.textContent = nSlider.value;
        mVal.textContent = mSlider.value;
        variantToggle.checked = Math.random() > 0.5;
        updatePatternFromUI();
        visualizer.initParticles();
        if (!visualizer.isPlaying) {
            visualizer.isPlaying = true;
            playBtnText.textContent = 'Pause';
            togglePlayBtn.querySelector('svg').innerHTML = `<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>`;
            visualizer.animate();
        }
    });

    const togglePlayBtn = document.getElementById('togglePlayBtn');
    const playBtnText = document.getElementById('playBtnText');

    togglePlayBtn.addEventListener('click', () => {
        visualizer.togglePlay();
        if (visualizer.isPlaying) {
            playBtnText.textContent = 'Pause';
            togglePlayBtn.querySelector('svg').innerHTML = `<rect x="6" y="4" width="4" height="16"></rect><rect x="14" y="4" width="4" height="16"></rect>`;
        } else {
            playBtnText.textContent = 'Play';
            togglePlayBtn.querySelector('svg').innerHTML = `<polygon points="5 3 19 12 5 21 5 3"></polygon>`;
        }
    });

    const aspectRatioSelect = document.getElementById('aspectRatioSelect');
    aspectRatioSelect.addEventListener('change', (e) => {
        visualizer.setAspectRatio(e.target.value);
    });

    downloadBtn.addEventListener('click', () => {
        const svgString = visualizer.exportToSVG();
        const blob = new Blob([svgString], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `chladni-pattern-N${nSlider.value}-M${mSlider.value}.svg`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
    });

    // --- Core Customization UI ---
    const fullscreenBtn = document.getElementById('fullscreenBtn');
    fullscreenBtn.addEventListener('click', () => {
        if (!document.fullscreenElement) {
            document.documentElement.requestFullscreen().catch(err => {
                console.error(`Error attempting to enable fullscreen: ${err.message}`);
            });
        } else {
            document.exitFullscreen();
        }
    });

    // Color Customization Listeners
    const themeSelect = document.getElementById('themeSelect');
    const color1Input = document.getElementById('color1');
    const color2Input = document.getElementById('color2');
    const bgTrailInput = document.getElementById('bgTrail');
    const useGradientInput = document.getElementById('useGradient');

    const bgGradStartInput = document.getElementById('bgGradStart');
    const bgGradEndInput = document.getElementById('bgGradEnd');
    const useBgGradientInput = document.getElementById('useBgGradient');

    const themes = {
        neon: {
            color1: '#39FF14',
            color2: '#00FFFF',
            trail: '#000a00',
            useGradient: true,
            bgGradStart: '#000000',
            bgGradEnd: '#1a1a2e',
            useBgGradient: false
        },
        fire: {
            color1: '#FF4500',
            color2: '#FFD700',
            trail: '#1a0500',
            useGradient: true,
            bgGradStart: '#200500',
            bgGradEnd: '#501000',
            useBgGradient: true
        },
        ocean: {
            color1: '#00BFFF',
            color2: '#7FFFD4',
            trail: '#001020',
            useGradient: true,
            bgGradStart: '#000510',
            bgGradEnd: '#002040',
            useBgGradient: true
        },
        forest: {
            color1: '#228B22',
            color2: '#ADFF2F',
            trail: '#051a05',
            useGradient: true,
            bgGradStart: '#051005',
            bgGradEnd: '#102e10',
            useBgGradient: true
        },
        custom: {}
    };

    const applyTheme = (themeName) => {
        if (themeName === 'custom') return;
        const theme = themes[themeName];
        if (!theme) return;

        color1Input.value = theme.color1;
        color2Input.value = theme.color2;
        bgTrailInput.value = theme.trail;
        useGradientInput.checked = theme.useGradient;

        bgGradStartInput.value = theme.bgGradStart;
        bgGradEndInput.value = theme.bgGradEnd;
        useBgGradientInput.checked = theme.useBgGradient;

        updateVisualizerConfig();
    };

    const updateVisualizerConfig = () => {
        visualizer.updateConfig({
            particleColor1: color1Input.value,
            particleColor2: color2Input.value,
            trailColor: bgTrailInput.value,
            useGradient: useGradientInput.checked,
            bgGradStart: bgGradStartInput.value,
            bgGradEnd: bgGradEndInput.value,
            useBgGradient: useBgGradientInput.checked
        });
    };

    const setCustomTheme = () => {
        themeSelect.value = 'custom';
        updateVisualizerConfig();
    };

    themeSelect.addEventListener('change', (e) => {
        applyTheme(e.target.value);
    });

    color1Input.addEventListener('input', setCustomTheme);
    color2Input.addEventListener('input', setCustomTheme);
    bgTrailInput.addEventListener('input', setCustomTheme);
    useGradientInput.addEventListener('change', setCustomTheme);
    bgGradStartInput.addEventListener('input', setCustomTheme);
    bgGradEndInput.addEventListener('input', setCustomTheme);
    useBgGradientInput.addEventListener('change', setCustomTheme);

    // Particle Count Logic
    const particleCountSlider = document.getElementById('particleCount');
    const particleCountVal = document.getElementById('particleCountVal');
    const particleWarning = document.getElementById('particleWarning');

    const updateParticleWarning = (val) => {
        if (val < 1000) {
            particleWarning.textContent = "Sparse (Smaller SVG)";
            particleWarning.style.color = "var(--md-sys-color-primary)";
        } else if (val <= 3000) {
            particleWarning.textContent = "Recommended (Balanced)";
            particleWarning.style.color = "var(--md-sys-color-primary)";
        } else if (val <= 6000) {
            particleWarning.textContent = "High Density (Large SVG size)";
            particleWarning.style.color = "#FFD700";
        } else {
            particleWarning.style.color = "#FF4500";
        }
    };

    particleCountSlider.addEventListener('input', (e) => {
        const val = parseInt(e.target.value);
        particleCountVal.textContent = val;
        updateParticleWarning(val);
    });

    particleCountSlider.addEventListener('change', (e) => {
        const val = parseInt(e.target.value);
        visualizer.updateParticleCount(val);
    });

    const particleSizeSlider = document.getElementById('particleSize');
    const particleSizeVal = document.getElementById('particleSizeVal');
    particleSizeSlider.addEventListener('input', (e) => {
        const val = parseFloat(e.target.value);
        particleSizeVal.textContent = val.toFixed(1);
        visualizer.updateConfig({ particleSize: val });
        if (!visualizer.isPlaying) {
            visualizer.animate(true); // Redraw immediately if paused
        }
    });
});
