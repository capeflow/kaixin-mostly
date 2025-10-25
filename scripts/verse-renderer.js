/**
 * VerseRenderer - Renders verses as DOM, handles verse transitions
 * Minimal DOM manipulation, stores references for quick access
 */

export class VerseRenderer {
    constructor(container, songData) {
        this.container = container;
        this.verses = songData.verses;
        this.renderedVerses = [];
        this.characterElements = new Map(); // Map<"verseIdx-charIdx", element>
        // Default display order & visibility
        this.layers = [
            { key: 'hanzi', label: 'Chinese', enabled: true },
            { key: 'pinyin', label: 'Pinyin', enabled: true },
            { key: 'english', label: 'English', enabled: false }
        ];
    }
    
    /**
     * Render all verses into the container
     */
    renderAll() {
        this.container.innerHTML = '';
        
        this.verses.forEach((verse, verseIdx) => {
            const verseEl = this.createVerseElement(verse, verseIdx);
            this.container.appendChild(verseEl);
            this.renderedVerses.push(verseEl);
            
            // Debug: count stones in this verse
            const stones = verseEl.querySelectorAll('.stone');
            console.log(`VerseRenderer: Verse ${verseIdx} has ${stones.length} stones`);
        });
        
        console.log(`VerseRenderer: Rendered ${this.verses.length} verses`);
        
        // Debug: Check total DOM structure
        const totalStones = this.container.querySelectorAll('.stone').length;
        console.log(`VerseRenderer: Total stones in DOM: ${totalStones}`);
    }
    
    /**
     * Create a verse element with all its character tiles
     */
    createVerseElement(verse, verseIdx) {
        const verseEl = document.createElement('div');
        verseEl.className = 'verse';
        verseEl.dataset.verseIdx = verseIdx;
        verseEl.dataset.translation = verse.translation; // Store for later use

        // Parametric break: use verse.breakAfter to split into (max) two rows
        let breakAfter = Number.isInteger(verse.breakAfter) ? Math.max(0, Math.min(verse.characters.length, verse.breakAfter)) : null;
        if (breakAfter) {
            const remaining = verse.characters.length - breakAfter;
            if (remaining === 1 && breakAfter > 1) {
                breakAfter -= 1;
            }
        }
        const rows = breakAfter ? [
            verse.characters.slice(0, breakAfter),
            verse.characters.slice(breakAfter)
        ] : [verse.characters];

        rows.forEach((rowChars, rowStartIndex) => {
            if (rowChars.length === 0) return;
            const rowEl = document.createElement('div');
            rowEl.className = 'verse-row';

            rowChars.forEach((charData, offset) => {
                const charIdx = (breakAfter ? (rowStartIndex === 0 ? 0 : breakAfter) : 0) + offset;
                const stone = this.createStoneElement(charData, verseIdx, charIdx);
                rowEl.appendChild(stone);
                const key = `${verseIdx}-${charIdx}`;
                this.characterElements.set(key, stone);
            });

            verseEl.appendChild(rowEl);
        });

        return verseEl;
    }
    
    /**
     * Create a single mahjong stone element
     */
    createStoneElement(charData, verseIdx, charIdx) {
        const stone = document.createElement('div');
        stone.className = 'stone';
        stone.dataset.verseIdx = verseIdx;
        stone.dataset.charIdx = charIdx;
        stone.dataset.time = String(charData.time ?? '');
        
        // Build sections based on current layer order:
        // For each layer, create a visual band. The hanzi band uses the larger style; others use compact band.
        const mk = (cls, text) => { const el = document.createElement('div'); el.className = cls; el.textContent = text || ''; return el; };

        this.layers.forEach(layer => {
            if (!layer.enabled) return;
            if (layer.key === 'hanzi') {
                const band = document.createElement('div');
                band.className = 'stone-top';
                band.appendChild(mk('hanzi', charData.char));
                stone.appendChild(band);
            } else if (layer.key === 'pinyin') {
                const band = document.createElement('div');
                band.className = 'stone-band';
                band.appendChild(mk('pinyin', charData.pinyin || ''));
                stone.appendChild(band);
            } else if (layer.key === 'english') {
                const band = document.createElement('div');
                band.className = 'stone-band';
                band.appendChild(mk('english', charData.meaning || ''));
                stone.appendChild(band);
            }
        });
        
        // Click-to-seek: dispatch an event upward so the main app can handle seeking
        stone.addEventListener('click', () => {
            const time = typeof charData.time === 'number' ? charData.time : null;
            const detail = { verseIdx, charIdx, time };
            stone.dispatchEvent(new CustomEvent('stone-click', { detail, bubbles: true }));
        });

        return stone;
    }
    
    /**
     * Show a specific verse (hide others)
     */
    showVerse(verseIdx) {
        console.log(`VerseRenderer: Showing verse ${verseIdx}`);
        this.renderedVerses.forEach((verse, idx) => {
            if (idx === verseIdx) {
                verse.classList.add('active');
                console.log(`VerseRenderer: Activated verse ${idx}`, verse);
            } else {
                verse.classList.remove('active');
            }
        });
        
        // Debug: Check if verse is actually active
        const activeVerses = document.querySelectorAll('.verse.active');
        console.log(`VerseRenderer: Active verses count: ${activeVerses.length}`, activeVerses);
    }
    
    /**
     * Get a character element by verse and char index
     */
    getCharacterElement(verseIdx, charIdx) {
        const key = `${verseIdx}-${charIdx}`;
        return this.characterElements.get(key);
    }
    
    /**
     * Clear all rendered verses
     */
    clear() {
        this.container.innerHTML = '';
        this.renderedVerses = [];
        this.characterElements.clear();
    }
}

