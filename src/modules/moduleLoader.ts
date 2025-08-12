interface LoadedModule {
    module: any;
    element: HTMLElement;
    moduleName: string;
}

class ModuleLoader {
    private static instance: ModuleLoader | null = null;
    private loadedModules: LoadedModule[] = [];

    constructor() {
        if (ModuleLoader.instance) {
            return ModuleLoader.instance;
        }
        
        ModuleLoader.instance = this;
    }

    /**
     * Gets the singleton instance of ModuleLoader
     */
    static getInstance(): ModuleLoader {
        if (!ModuleLoader.instance) {
            new ModuleLoader();
        }
        return <ModuleLoader>ModuleLoader.instance;
    }

    /**
     * Scans the DOM for elements with data-module attributes and loads the corresponding modules
     */
    async loadModules(): Promise<void> {
        try {
            const elements = document.querySelectorAll('[data-module]');
            
            for (const element of elements) {
                const moduleNames = element.getAttribute('data-module');
                if (!moduleNames) continue;

                const modules = moduleNames.split(' ');
                
                for (const moduleName of modules) {
                    await this.loadModule(element as HTMLElement, moduleName.trim());
                }
            }
        } catch (error: any) {
            console.error('Error loading modules:', error.message);
        }
    }

    /**
     * Loads a specific module for a given element
     */
    private async loadModule(element: HTMLElement, moduleName: string): Promise<void> {
        try {
            // Check if module is already loaded for this element
            const existingModule = this.loadedModules.find(
                m => m.element === element && m.moduleName === moduleName
            );
            
            if (existingModule) {
                console.warn(`Module '${moduleName}' already loaded for element`, element);
                return;
            }

            // Dynamically import the module
            const moduleFile = await import(`./${moduleName}.js`);
            const ModuleClass = moduleFile.default;

            if (!ModuleClass) {
                throw new Error(`Module '${moduleName}' does not have a default export`);
            }

            // Instantiate the module
            const moduleInstance = new ModuleClass(element, {});
            
            // Track the loaded module
            this.loadedModules.push({
                module: moduleInstance,
                element,
                moduleName
            });

            console.log(`Module '${moduleName}' loaded successfully`);

        } catch (error: any) {
            console.warn(`Failed to load module '${moduleName}':`, error.message, element);
        }
    }

    /**
     * Returns all currently loaded modules
     */
    getLoadedModules(): LoadedModule[] {
        return this.loadedModules;
    }

    /**
     * Destroys all loaded modules and clears the list
     */
    destroyAll(): void {
        this.loadedModules.forEach(({ module }) => {
            if (module && typeof module.destroy === 'function') {
                module.destroy();
            }
        });
        
        this.loadedModules = [];
        console.log('All modules destroyed');
    }

    /**
     * Initializes the module loader and starts loading modules
     */
    async init(): Promise<void> {
        console.log('ModuleLoader initializing...');
        await this.loadModules();
        console.log(`ModuleLoader initialized with ${this.loadedModules.length} modules`);
    }
}

export default ModuleLoader;