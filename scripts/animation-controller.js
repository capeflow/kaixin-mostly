/**
 * AnimationController - Orchestrates visual feedback (golden glow)
 * Pure CSS animations, JS only toggles classes
 */

export class AnimationController {
    constructor(verseRenderer) {
        this.verseRenderer = verseRenderer;
        this.currentActive = null;
    }
    
    /**
     * Highlight a character with golden glow
     * @param {Object} charData - Character data with verseIdx, charIdx
     */
    highlightCharacter(charData) {
        // Remove previous highlight
        if (this.currentActive) {
            this.currentActive.classList.remove('golden-active');
        }
        
        // Get element from renderer
        const element = this.verseRenderer.getCharacterElement(
            charData.verseIdx,
            charData.charIdx
        );
        
        if (element) {
            // Add golden glow class (CSS handles all animation)
            element.classList.add('golden-active');
            this.currentActive = element;
        } else {
            console.warn(`AnimationController: Element not found for ${charData.char}`);
        }
    }
    
    /**
     * Clear all active highlights
     */
    clearAll() {
        document.querySelectorAll('.golden-active').forEach(el => {
            el.classList.remove('golden-active');
        });
        this.currentActive = null;
    }
    
    /**
     * Reset animation state
     */
    reset() {
        this.clearAll();
    }
}

