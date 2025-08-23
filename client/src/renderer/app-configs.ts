import { ConfigSettings } from "./config-settings";

export function getDefaultConfig(): ConfigSettings {
    return {
        todoListService: {
            host: 'http://localhost:4000'
        },
        authService: {
            host: 'http://localhost:4000'
        }
    }
}