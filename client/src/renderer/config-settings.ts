
/**
 * App configuration interface.
 */
export interface ConfigSettings {
    /**
     * TODO List service configuration.
     */
    readonly todoListService: {
        host: string;
    };

    /**
     * Authentication service configuration.
     */
    readonly authService: {
        host: string;
    }
}