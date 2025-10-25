/**
 * Main Application Entry Point
 * Wires up all components and handles user interactions
 */

import { StateManager } from './state-manager.js';
import { AudioSyncEngine } from './audio-sync.js';
import { VerseRenderer } from './verse-renderer.js';
import { AnimationController } from './animation-controller.js';
import { FireflyController } from './firefly-controller.js';

class KaixinApp {
    constructor() {
        this.state = new StateManager();
        this.audioSync = null;
        this.verseRenderer = null;
        this.animator = null;
        this.fireflies = null;
        
        // DOM elements
        this.audio = null;
        this.flower = null;
        this.verseContainer = null;
        this.translationDisplay = null;
        this.timeline = null;
        this.timelineProgress = null;
        this.timelineHandle = null;
        this.timelineTimeDisplay = null;
        
        // Interlude timing (1:56 to 2:20)
        this.interludeStart = 116; // 1:56
        this.interludeEnd = 140; // 2:20
    }
    
    /**
     * Initialize the application
     */
    async init() {
        console.log('Kaixin: Initializing...');
        
        // Put app into intro mode initially
        document.body.classList.add('app-intro');

        // Get DOM elements
        this.audio = document.getElementById('audio');
        this.flower = document.getElementById('flower');
        this.verseContainer = document.getElementById('verse-container');
        this.translationDisplay = document.getElementById('translation-display');
        this.timeline = document.getElementById('timeline');
        this.timelineProgress = document.getElementById('timeline-progress');
        this.timelineHandle = document.getElementById('timeline-handle');
        this.timelineTimeDisplay = document.getElementById('timeline-time-display');
        this.titleOverlay = document.querySelector('.title-overlay');
        this.firefliesContainer = document.getElementById('fireflies');
        this.ctrlPlay = document.getElementById('ctrl-play');
        this.ctrlSkipBack = document.getElementById('ctrl-skip-back');
        this.ctrlSkipForward = document.getElementById('ctrl-skip-forward');
        this.timeCurrent = document.getElementById('time-current');
        this.timeDuration = document.getElementById('time-duration');
        this.settingsBtn = document.getElementById('settings-flower');
        this.settingsOverlay = document.getElementById('settings-overlay');
        this.settingsClose = document.getElementById('settings-close');
        this.settingsCancel = document.getElementById('settings-cancel');
        this.settingsSave = document.getElementById('settings-save');
        this.settingsList = document.getElementById('settings-list');
        this.darkModeToggle = document.getElementById('dark-mode-toggle');
 
        this.updatePlayButtonIcon(false);
        
        // Load song data
        const songData = await this.loadSongData();
        this.state.setState({ song: songData });
        
        // Initialize components
        this.audioSync = new AudioSyncEngine(this.audio, songData, this.state);
        this.verseRenderer = new VerseRenderer(this.verseContainer, songData);
        this.animator = new AnimationController(this.verseRenderer);
        this.fireflies = new FireflyController(this.firefliesContainer);
        
        // Render verses (kept hidden until intro completes)
        this.verseRenderer.renderAll();
        
        // Wire up events
        this.setupEventListeners();
        this.setupSettings();
        
        console.log('Kaixin: Ready');
    }
    
    /**
     * Load song data from JSON
     */
    async loadSongData() {
        const response = await fetch('./data/dan-yuan-ren-chang-jiu.json');
        return await response.json();
    }
    
    /**
     * Set up all event listeners
     */
    setupEventListeners() {
        // Audio sync events
        this.audioSync.on('character-change', (charData) => {
            this.animator.highlightCharacter(charData);
            this.state.setState({ currentCharIndex: charData.globalIdx });
        });
        
        this.audioSync.on('verse-change', (data) => {
            console.log('Main: Received verse-change event', data);
            this.verseRenderer.showVerse(data.verseIdx);
            this.updateTranslation(data.verseIdx);
            this.state.setState({ currentVerseIndex: data.verseIdx });
        });
        
        this.audioSync.on('time-update', (timeData) => {
            this.updateTimeline(timeData);
            this.state.setState({ audioTime: timeData.currentTime });
            
            // Check for interlude and toggle fireflies/lyrics
            this.handleInterlude(timeData.currentTime);
        });
        
        // Flower button: if intro not complete, run intro; else toggle playback
        this.flower.addEventListener('click', () => {
            if (!this.state.state.introComplete) {
                this.startIntroSequence();
            } else {
                this.togglePlayback();
            }
        });
        // Control buttons
        this.ctrlPlay.addEventListener('click', () => {
            if (!this.state.state.introComplete) return;
            this.togglePlayback();
        });
        this.ctrlSkipBack.addEventListener('click', () => {
            if (!this.state.state.introComplete) return;
            this.nudge(-5);
        });
        this.ctrlSkipForward.addEventListener('click', () => {
            if (!this.state.state.introComplete) return;
            this.nudge(5);
        });
        
        // Audio events
        this.audio.addEventListener('loadedmetadata', () => {
            this.state.setState({ duration: this.audio.duration });
        });
        
        this.audio.addEventListener('ended', () => {
            this.stopPlayback();
        });
        
        // Timeline scrubbing
        this.setupTimelineScrubbing();
        
        // Keyboard shortcuts
        this.setupKeyboardShortcuts();

        // Click-to-seek on stones (event delegated from verse-container)
        this.verseContainer.addEventListener('stone-click', (e) => {
            const { time } = e.detail || {};
            if (typeof time !== 'number') return;
            this.seekTo(time);
        });
    }

    /** Settings dialog (drag to reorder, toggles) */
    setupSettings() {
        // Load dark mode preference from localStorage
        const isDarkMode = localStorage.getItem('darkMode');
        if (isDarkMode === 'false') {
            document.body.classList.remove('dark-mode');
            this.darkModeToggle.checked = false;
        } else {
            document.body.classList.add('dark-mode');
            this.darkModeToggle.checked = true;
        }
        
        // Dark mode toggle
        this.darkModeToggle.addEventListener('change', (e) => {
            if (e.target.checked) {
                document.body.classList.add('dark-mode');
                localStorage.setItem('darkMode', 'true');
            } else {
                document.body.classList.remove('dark-mode');
                localStorage.setItem('darkMode', 'false');
            }
        });
        
        const open = () => {
            this.settingsOverlay.classList.add('show');
            this.renderSettingsList();
        };
        const close = () => this.settingsOverlay.classList.remove('show');
        this.settingsBtn.addEventListener('click', open);
        this.settingsClose.addEventListener('click', close);
        this.settingsCancel.addEventListener('click', close);
        this.settingsSave.addEventListener('click', () => {
            // Collect order and enabled values and apply to renderer
            const items = Array.from(this.settingsList.querySelectorAll('.settings-item'));
            const layers = items.map(li => ({
                key: li.dataset.key,
                label: li.dataset.label,
                enabled: li.querySelector('input[type="checkbox"]').checked
            }));
            this.verseRenderer.layers = layers;
            // Re-render verses to reflect changes
            this.verseRenderer.clear();
            this.verseRenderer.renderAll();
            // Make current verse visible again
            const idx = this.state.state.currentVerseIndex >= 0 ? this.state.state.currentVerseIndex : 0;
            this.verseRenderer.showVerse(idx);
            close();
        });

        // Drag & drop
        let dragEl = null;
        this.settingsList.addEventListener('dragstart', (e) => {
            dragEl = e.target.closest('.settings-item');
            if (dragEl) dragEl.classList.add('dragging');
        });
        this.settingsList.addEventListener('dragend', () => {
            if (dragEl) dragEl.classList.remove('dragging');
            dragEl = null;
        });
        this.settingsList.addEventListener('dragover', (e) => {
            e.preventDefault();
            const after = Array.from(this.settingsList.querySelectorAll('.settings-item:not(.dragging)'))
                .find(el => e.clientY <= el.getBoundingClientRect().top + el.offsetHeight / 2);
            const dragging = this.settingsList.querySelector('.settings-item.dragging');
            if (!dragging) return;
            if (after) this.settingsList.insertBefore(dragging, after); else this.settingsList.appendChild(dragging);
        });
    }

    renderSettingsList() {
        this.settingsList.innerHTML = '';
        this.verseRenderer.layers.forEach(layer => {
            const li = document.createElement('li');
            li.className = 'settings-item';
            li.setAttribute('draggable', 'true');
            li.dataset.key = layer.key;
            li.dataset.label = layer.label;
            li.innerHTML = `
                <span class="drag-handle">⋮⋮</span>
                <label>${layer.label}</label>
                <input type="checkbox" ${layer.enabled ? 'checked' : ''} />
            `;
            this.settingsList.appendChild(li);
        });
    }
    
    /**
     * Toggle playback
     */
    togglePlayback() {
        const isPlaying = this.state.state.isPlaying;
        
        if (isPlaying) {
            this.stopPlayback();
        } else {
            this.startPlayback();
        }

        this.updatePlayButtonIcon(!isPlaying);
    }
    
    /**
     * Start playback
     */
    async startPlayback() {
        // Show verse container
        this.verseContainer.classList.add('active');
        this.translationDisplay.classList.add('visible');
        console.log('Main: Verse container activated', this.verseContainer.classList.contains('active'));
        
        // Play audio
        try {
            await this.audio.play();
            this.state.setState({ isPlaying: true });
            if (!this.state.state.introComplete) {
                this.state.setState({ introComplete: true });
                document.body.classList.remove('app-intro');
            }
            this.updatePlayButtonIcon(true);
            
            // Start sync (this will emit verse-change and show first verse)
            this.audioSync.startSync();
            
            // Update UI
            this.timeline.classList.add('visible');
            
            console.log('Kaixin: Playback started');
        } catch (err) {
            console.error('Kaixin: Error playing audio:', err);
        }
    }
    
    /**
     * Stop playback
     */
    stopPlayback() {
        this.audio.pause();
        this.audioSync.stopSync();
        this.state.setState({ isPlaying: false });
        this.updatePlayButtonIcon(false);
        
        // Reset time display (if present)
        if (this.timelineTimeDisplay) {
            this.timelineTimeDisplay.textContent = '0.00s';
        }
        
        console.log('Kaixin: Playback stopped');
    }
    
    /**
     * Update timeline scrubber
     */
    updateTimeline(timeData) {
        const { currentTime, duration } = timeData;
        if (duration > 0) {
            const progress = Math.min(100, (currentTime / duration) * 100);
            this.timelineProgress.style.width = `${progress}%`;
            this.timelineHandle.style.left = `${progress}%`;
            this.timeCurrent.textContent = this.formatTime(currentTime);
            this.timeDuration.textContent = this.formatTime(duration);
        }
        
        // Update time display (2 decimals) if debug label exists
        if (this.timelineTimeDisplay) {
            this.timelineTimeDisplay.textContent = `${currentTime.toFixed(2)}s`;
        }
    }

    /**
     * Skip forward/back by seconds
     */
    nudge(seconds) {
        const duration = this.audio.duration || 258;
        const target = Math.max(0, Math.min(duration, (this.audio.currentTime || 0) + seconds));
        this.seekTo(target);
    }

    /**
     * Centralized seek method
     */
    seekTo(time) {
        if (!this.audio) return;
        
        const duration = this.audio.duration || 258;
        const targetTime = Math.max(0, Math.min(duration, time));
        
        // Simply set the time - this is all that's needed
        this.audio.currentTime = targetTime;
        
        // Update audio-sync to the new position
        if (this.audioSync) {
            this.audioSync.seekTo(targetTime);
        }
        
        // Update timeline immediately
        this.updateTimeline({ currentTime: targetTime, duration });
    }

    /**
     * Format mm:ss
     */
    formatTime(t) {
        if (!Number.isFinite(t)) return '0:00';
        const m = Math.floor(t / 60);
        const s = Math.floor(t % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }
    
    /**
     * Update translation display for current verse
     */
    updateTranslation(verseIdx) {
        const verse = document.querySelector(`.verse[data-verse-idx="${verseIdx}"]`);
        if (verse?.dataset.translation) {
            this.translationDisplay.textContent = verse.dataset.translation;
            this.translationDisplay.classList.add('visible');
        }
    }
    
    /**
     * Setup timeline scrubbing
     */
    setupTimelineScrubbing() {
        const track = document.getElementById('timeline-track');
        let isDragging = false;
        
        const seekToPosition = (x) => {
            const rect = track.getBoundingClientRect();
            const position = Math.max(0, Math.min(1, (x - rect.left) / rect.width));
            const duration = this.audio.duration || 258;
            const time = position * duration;
            this.seekTo(time);
        };
        
        track.addEventListener('mousedown', (e) => {
            if (!this.state.state.introComplete) return;
            isDragging = true;
            seekToPosition(e.clientX);
            e.preventDefault();
        });
        
        document.addEventListener('mousemove', (e) => {
            if (isDragging) {
                seekToPosition(e.clientX);
                e.preventDefault();
            }
        });
        
        document.addEventListener('mouseup', () => {
            isDragging = false;
        });
        
        track.addEventListener('click', (e) => {
            if (!this.state.state.introComplete) return;
            if (!isDragging) {
                seekToPosition(e.clientX);
            }
        });
    }
    
    /**
     * Setup keyboard shortcuts
     */
    setupKeyboardShortcuts() {
        document.addEventListener('keydown', (e) => {
            if (e.key === ' ' || e.key === 'Spacebar') {
                e.preventDefault();
                if (!this.state.state.introComplete) return;
                this.togglePlayback();
            } else if (e.key === 'Escape') {
                this.stopPlayback();
            }
        });
    }

    /**
     * Handle interlude: hide text completely and immediately during the entire interlude
     */
    handleInterlude(currentTime) {
        const backgroundStart = this.interludeStart; // 116s (1:56)
        const backgroundEnd = this.interludeEnd; // 140s (2:20)
        
        // Check if we're in the interlude period
        const inInterlude = currentTime >= backgroundStart && currentTime < backgroundEnd;
        
        // Hide text IMMEDIATELY when entering interlude
        if (inInterlude && !this._textHidden) {
            // No transition - instant hide
            this.verseContainer.style.transition = 'none';
            this.verseContainer.style.opacity = '0';
            this.verseContainer.style.visibility = 'hidden';
            this.verseContainer.style.pointerEvents = 'none';
            this.translationDisplay.style.transition = 'none';
            this.translationDisplay.style.opacity = '0';
            this.translationDisplay.style.visibility = 'hidden';
            this._textHidden = true;
            
            // Start background morph and particles
            if (this.fireflies.sunriseParticles.length === 0) {
                this.fireflies.show(true);
                document.body.classList.add('interlude-mode');
                console.log('Kaixin: Light show started - text hidden immediately');
            }
        }
        
        // Show text back when exiting interlude
        if (!inInterlude && this._textHidden) {
            // End background morph and particles
            if (this.fireflies.sunriseParticles.length > 0) {
                this.fireflies.hide(true);
                document.body.classList.remove('interlude-mode');
            }
            
            // Restore text with smooth fade-in
            this.verseContainer.style.transition = 'opacity 1s ease, visibility 0s 0s';
            this.verseContainer.style.opacity = '';
            this.verseContainer.style.visibility = '';
            this.verseContainer.style.pointerEvents = '';
            this.translationDisplay.style.transition = 'opacity 1s ease, visibility 0s 0s';
            this.translationDisplay.style.opacity = '';
            this.translationDisplay.style.visibility = '';
            this._textHidden = false;
            console.log('Kaixin: Light show ended - text fading back in');
        }
    }
    
    /**
     * Intro sequence: flower dot -> petals evaporate -> title fade -> reveal UI
     */
    startIntroSequence() {
        // Prevent re-entry
        if (this._introRunning) return;
        this._introRunning = true;

        // Start playback immediately (UI stays hidden during intro)
        this.audio.play()
            .then(() => {
                this.state.setState({ isPlaying: true });
                this.audioSync.startSync();
            })
            .catch((err) => console.error('Kaixin: Error playing audio at intro start:', err));

        // Begin flower animation
        this.flower.classList.add('intro-start');
        
        // Show fireflies during intro
        this.fireflies.show();

        // After petals finish (~4s), hide flower and then show title
        setTimeout(() => {
            this.flower.classList.add('hidden');
            if (this.titleOverlay) {
                this.titleOverlay.classList.add('show');
            }
        }, 4000);

        // After title show completes (~6s from start of title), reveal UI (audio already playing)
        const totalDelay = 4000 + 6000; // petals 4s + title 6s
        setTimeout(() => {
            // Mark intro complete
            this.state.setState({ introComplete: true });
            document.body.classList.remove('app-intro');

            // Show verse container and timeline
            this.verseContainer.classList.add('active');
            this.translationDisplay.classList.add('visible');
            this.timeline.classList.add('visible');

            // Ensure title overlay is removed from hit testing
            if (this.titleOverlay) {
                this.titleOverlay.style.display = 'none';
            }

            // Hide flower permanently after intro
            this.flower.style.display = 'none';
            
            // Keep base fireflies visible throughout (no hide call)
        }, totalDelay);
    }

    updatePlayButtonIcon(isPlaying) {
        if (!this.ctrlPlay) return;
        this.ctrlPlay.innerHTML = isPlaying ? this.getPauseIcon() : this.getPlayIcon();
    }

    getPlayIcon() {
        return `
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <path d="M6.375 4.125L13.5 9L6.375 13.875V4.125Z" fill="currentColor"/>
            </svg>
        `;
    }

    getPauseIcon() {
        return `
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
                <rect x="5" y="4" width="3" height="10" rx="0.6" fill="currentColor"/>
                <rect x="10" y="4" width="3" height="10" rx="0.6" fill="currentColor"/>
            </svg>
        `;
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    const app = new KaixinApp();
    app.init().catch(err => {
        console.error('Kaixin: Initialization failed:', err);
    });
});

