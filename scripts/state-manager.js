/**
 * StateManager - Single source of truth for application state
 * Implements observer pattern for reactive updates
 */

export class StateManager {
    constructor() {
        this.state = {
            song: null,              // Song data object
            currentVerseIndex: -1,   // Currently visible verse
            currentCharIndex: -1,    // Currently highlighted character (global index)
            isPlaying: false,        // Playback state
            audioTime: 0,            // Current audio time
            duration: 0,             // Total audio duration
            introComplete: false     // Intro sequence completed
        };
        
        // Observers: Map<key, Set<callback>>
        this.observers = new Map();
    }
    
    /**
     * Update state and notify observers
     * @param {Object} updates - Partial state object to merge
     */
    setState(updates) {
        const oldState = { ...this.state };
        Object.assign(this.state, updates);
        
        // Notify observers of changed keys
        for (const key in updates) {
            if (this.observers.has(key)) {
                const callbacks = this.observers.get(key);
                callbacks.forEach(callback => {
                    callback(this.state[key], oldState[key]);
                });
            }
        }
    }
    
    /**
     * Subscribe to state changes
     * @param {string} key - State key to observe
     * @param {Function} callback - Called when key changes (newVal, oldVal)
     * @returns {Function} Unsubscribe function
     */
    subscribe(key, callback) {
        if (!this.observers.has(key)) {
            this.observers.set(key, new Set());
        }
        this.observers.get(key).add(callback);
        
        // Return unsubscribe function
        return () => {
            this.observers.get(key).delete(callback);
        };
    }
    
    /**
     * Get current state
     * @returns {Object} Current state object
     */
    getState() {
        return { ...this.state };
    }
    
    /**
     * Reset state to initial values
     */
    reset() {
        this.setState({
            currentVerseIndex: -1,
            currentCharIndex: -1,
            isPlaying: false,
            audioTime: 0
        });
    }
}

