/**
 * AudioSyncEngine - Master clock that drives all timing
 * Simple forward-only algorithm (no binary search needed)
 */

export class AudioSyncEngine {
    constructor(audioElement, songData, stateManager) {
        this.audio = audioElement;
        this.stateManager = stateManager;
        this.characters = this.flattenCharacters(songData);
        this.currentIndex = 0;
        this.isRunning = false;
        this.syncLoop = null;
        
        // Event handlers
        this.handlers = {
            'character-change': new Set(),
            'verse-change': new Set(),
            'time-update': new Set()
        };
    }
    
    /**
     * Flatten all verses into a single array of characters with timing
     * Pre-sorted by time for efficient forward-only scanning
     */
    flattenCharacters(songData) {
        const chars = [];
        
        songData.verses.forEach((verse, verseIdx) => {
            verse.characters.forEach((charData, charIdx) => {
                chars.push({
                    ...charData,
                    verseIdx,
                    charIdx,
                    globalIdx: chars.length
                });
            });
        });
        
        // Ensure sorted by time
        chars.sort((a, b) => a.time - b.time);
        
        console.log(`AudioSync: Loaded ${chars.length} characters across ${songData.verses.length} verses`);
        return chars;
    }
    
    /**
     * Start synchronization loop
     */
    startSync() {
        if (this.isRunning) return;
        
        this.isRunning = true;
        
        // Emit initial verse and character (ensures first verse is visible)
        if (this.characters.length > 0) {
            const firstChar = this.characters[this.currentIndex];
            this.emit('verse-change', {
                verseIdx: firstChar.verseIdx,
                character: firstChar
            });
            this.emit('character-change', firstChar);
        }
        
        this.update();
        console.log('AudioSync: Started');
    }
    
    /**
     * Stop synchronization loop
     */
    stopSync() {
        this.isRunning = false;
        if (this.syncLoop) {
            cancelAnimationFrame(this.syncLoop);
            this.syncLoop = null;
        }
        console.log('AudioSync: Stopped');
    }
    
    /**
     * Main update loop - runs every frame
     */
    update() {
        if (!this.isRunning) return;
        
        const currentTime = this.audio.currentTime;
        
        // Emit time update for timeline (guard duration)
        const duration = this.audio.duration || this.stateManager.state.duration || 0;
        this.emit('time-update', { currentTime, duration });
        
        // Check if we should advance to next character
        // Simple forward-only check - no binary search complexity
        while (this.currentIndex < this.characters.length - 1) {
            const nextChar = this.characters[this.currentIndex + 1];
            
            if (currentTime >= nextChar.time) {
                // Advance to next character
                this.currentIndex++;
                const currentChar = this.characters[this.currentIndex];
                
                // Check if verse changed
                const prevChar = this.characters[this.currentIndex - 1];
                if (!prevChar || prevChar.verseIdx !== currentChar.verseIdx) {
                    this.emit('verse-change', {
                        verseIdx: currentChar.verseIdx,
                        character: currentChar
                    });
                }
                
                // Emit character change
                this.emit('character-change', currentChar);
                
                console.log(`AudioSync: Character ${currentChar.char} at ${currentTime.toFixed(2)}s`);
            } else {
                // No more characters to process at current time
                break;
            }
        }
        
        // Schedule next frame
        this.syncLoop = requestAnimationFrame(() => this.update());
    }
    
    /**
     * Seek to a specific time in the audio
     * Resets character index to match the time
     */
    seekTo(time) {
        // Audio currentTime is already set by main.js, just update our state
        
        // Find the character index for this time
        // Simple linear scan from beginning (only happens on seek)
        let newIndex = 0;
        for (let i = 0; i < this.characters.length; i++) {
            if (this.characters[i].time <= time) {
                newIndex = i;
            } else {
                break;
            }
        }
        
        this.currentIndex = newIndex;
        const currentChar = this.characters[this.currentIndex];
        
        // Emit events for immediate update
        if (currentChar) {
            this.emit('verse-change', {
                verseIdx: currentChar.verseIdx,
                character: currentChar
            });
            this.emit('character-change', currentChar);
        }
        
        console.log(`AudioSync: Seeked to ${time.toFixed(2)}s, character index ${newIndex} (${currentChar?.char})`);
    }
    
    /**
     * Reset to beginning
     */
    reset() {
        this.currentIndex = 0;
        this.stopSync();
    }
    
    /**
     * Event emitter
     */
    on(event, callback) {
        if (this.handlers[event]) {
            this.handlers[event].add(callback);
        }
    }
    
    off(event, callback) {
        if (this.handlers[event]) {
            this.handlers[event].delete(callback);
        }
    }
    
    emit(event, data) {
        if (this.handlers[event]) {
            this.handlers[event].forEach(callback => {
                callback(data);
            });
        }
    }
}

