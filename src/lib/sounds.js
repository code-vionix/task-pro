
/**
 * SoundManager handles audio feedback for messages and notifications.
 * It uses a Lazy-Load approach for the AudioContext to comply with browser autoplay policies.
 */
class SoundManager {
    constructor() {
        this.ctx = null;
        this.buffers = {};
        this.isMuted = false;
        this.sounds = {
            message: '/sounds/message.mp3',
            notification: '/sounds/notification.mp3'
        };

        // UI trigger for context initialization (must be after user interaction)
        if (typeof window !== 'undefined') {
            const unlock = () => {
                this.init();
                window.removeEventListener('click', unlock);
                window.removeEventListener('keydown', unlock);
            };
            window.addEventListener('click', unlock);
            window.addEventListener('keydown', unlock);
        }
    }

    async init() {
        if (this.ctx) return;
        
        try {
            this.ctx = new (window.AudioContext || window.webkitAudioContext)();
            
            // Resume if suspended (common in Chrome)
            if (this.ctx.state === 'suspended') {
                await this.ctx.resume();
            }

            // Pre-load sounds
            for (const [name, url] of Object.entries(this.sounds)) {
                this.loadBuffer(name, url);
            }
        } catch (e) {

        }
    }

    async loadBuffer(name, url) {
        try {
            const response = await fetch(url);
            const arrayBuffer = await response.arrayBuffer();
            this.buffers[name] = await this.ctx.decodeAudioData(arrayBuffer);
        } catch (e) {

        }
    }

    setMuted(m) {
        this.isMuted = m;
    }

    play(name) {
        if (this.isMuted || !this.ctx || !this.buffers[name]) return;

        // Double check context state
        if (this.ctx.state === 'suspended') {
            this.ctx.resume();
        }

        const source = this.ctx.createBufferSource();
        source.buffer = this.buffers[name];
        source.connect(this.ctx.destination);
        source.start(0);
    }

    playMessage() {
        this.play('message');
    }

    playNotification() {
        this.play('notification');
    }
}

export const soundManager = new SoundManager();
