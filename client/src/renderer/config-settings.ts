
/**
 * App configuration interface.
 */
export interface ConfigSettings {
    /**
     * TODO List service configuration.
     */
    readonly todoListService: {
		/**
		 * TODO List service host URL.
		 */
        host: string;

		/**
		 * TODO item management service endpoint URL.
		 */
		todoItemEndpoint: (todoItemId: string) => string;

		/**
		 * TODO Lists management service endpoint URL.
		 */
		todoListsEndpoint: string;

		/**
		 * TODO List update listener endpoint URL via SSE.
		 */
		todoListUpdatesListenerEndpoint: (todoListId: string, authToken: string) => string;

		/**
		 * TODO Item update service endpoint URL.
		 * @param todoItemId TODO item id.
		 * @param todoListId TODO list id.
		 * @returns TODO item update service endpoint URL.
		 */
		todoItemUpdateEndpoint: (todoItemId: string, todoListId: string) => string;
    };

    /**
     * Authentication service configuration.
     */
    readonly authService: {
		/**
		 * Authentication service host URL.
		 */
        host: string;

		/**
		 * Authentication service registration endpoint.
		 */
		registerEndpoint: string;

		/**
		 * Authentication service authorization endpoint.
		 */
		authorizeEndpoint: string;
    }
}