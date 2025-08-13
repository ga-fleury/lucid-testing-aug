export default class BannerModule {
    private readonly boundResizeHandler: OmitThisParameter<() => void>;
    private closeButton: Element | null | undefined;

    constructor(
        private element:HTMLElement,
        private options:object
    ) {
        this.element = element;
        this.options = options;

        this.boundResizeHandler = this.resize.bind(this);

        this.init();
    }

    /**
     * Initializes the module by finding elements and binding events.
     */
    init() {
        // Discover internal elements using the robust data-ref contract.
        this.closeButton = this.element.querySelector('[data-ref="banner-close"]');

        if (this.closeButton) {
            this.closeButton.addEventListener('click', () => this.hide());
        }

        // Subscribe to the framework's global resize event.
        window.Lucid.bus.subscribe('framework:resize', this.boundResizeHandler);

        // Perform an initial calculation for the banner's height.
        this.resize();
    }

    /**
     * Hides the banner element and publishes its state change.
     */
    hide() {
        this.element.classList.add('hidden');

        // Publish a state change to the event bus for other modules to react to.
        // window.Lucid.bus.publish('banner:closed', { id: this.element.id });

        // Once hidden, we no longer need to listen for resize events.
        this.destroy();
    }

    /**
     * Recalculates and sets the --height CSS custom property.
     * This is useful for smooth CSS height transitions.
     */
    resize() {
        // Don't calculate height for a hidden element.
        if (this.element.classList.contains('hidden')) {
            return;
        }

        // Temporarily set height to 'auto' to measure its natural content height.
        this.element.style.setProperty('--height', 'auto');

        // Get the calculated height and set it as a CSS variable.
        const height = this.element.clientHeight;
        this.element.style.setProperty('--height', `${height}px`);
    }

    /**
     * Cleans up event listeners to prevent memory leaks.
     * This is crucial for performance, especially in single-page applications.
     */
    destroy() {
        //     window.Lucid.bus.unsubscribe('framework:resize', this.boundResizeHandler);
    }
}