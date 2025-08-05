/**
 * Configuration Manager for Blog System
 * Handles secure storage and management of API keys and other sensitive configuration
 */

class ConfigManager {
    constructor() {
        this.configKey = 'blog_system_config';
        this.defaultConfig = {
            geminiApiKey: '',
            lastUpdated: null,
            version: '1.0.0'
        };
        this.loadConfig();
    }

    // Load configuration from localStorage with encryption-like obfuscation
    loadConfig() {
        try {
            const storedConfig = localStorage.getItem(this.configKey);
            if (storedConfig) {
                const decodedConfig = this.decodeConfig(storedConfig);
                this.config = { ...this.defaultConfig, ...decodedConfig };
            } else {
                this.config = { ...this.defaultConfig };
                // Set the default API key if not already configured
                this.setApiKey('AIzaSyCwXQak1jfXrALC0Lb5Q4PHLPP_bFxBnfU');
            }
        } catch (error) {
            console.error('Error loading configuration:', error);
            this.config = { ...this.defaultConfig };
        }
    }

    // Save configuration to localStorage with obfuscation
    saveConfig() {
        try {
            const encodedConfig = this.encodeConfig(this.config);
            localStorage.setItem(this.configKey, encodedConfig);
            console.log('Configuration saved successfully');
        } catch (error) {
            console.error('Error saving configuration:', error);
            throw new Error('Failed to save configuration');
        }
    }

    // Simple obfuscation for API key (not true encryption, but better than plain text)
    encodeConfig(config) {
        const configString = JSON.stringify(config);
        return btoa(configString).split('').reverse().join('');
    }

    // Decode obfuscated configuration
    decodeConfig(encodedConfig) {
        try {
            const reversed = encodedConfig.split('').reverse().join('');
            const configString = atob(reversed);
            return JSON.parse(configString);
        } catch (error) {
            console.error('Error decoding configuration:', error);
            return {};
        }
    }

    // Get API key (returns masked version for logging)
    getApiKey(masked = false) {
        const apiKey = this.config.geminiApiKey;
        if (masked && apiKey) {
            return apiKey.substring(0, 8) + '...' + apiKey.substring(apiKey.length - 4);
        }
        return apiKey;
    }

    // Set new API key
    setApiKey(newApiKey) {
        if (!newApiKey || typeof newApiKey !== 'string') {
            throw new Error('Invalid API key provided');
        }

        // Basic validation for Gemini API key format
        if (!newApiKey.startsWith('AIza') || newApiKey.length < 30) {
            throw new Error('Invalid Gemini API key format');
        }

        this.config.geminiApiKey = newApiKey;
        this.config.lastUpdated = new Date().toISOString();
        this.saveConfig();
        
        console.log(`API key updated successfully: ${this.getApiKey(true)}`);
        return true;
    }

    // Validate current API key
    validateApiKey() {
        const apiKey = this.getApiKey();
        return apiKey && apiKey.startsWith('AIza') && apiKey.length >= 30;
    }

    // Get configuration status
    getStatus() {
        return {
            hasApiKey: !!this.config.geminiApiKey,
            apiKeyMasked: this.getApiKey(true),
            lastUpdated: this.config.lastUpdated,
            version: this.config.version,
            isValid: this.validateApiKey()
        };
    }

    // Reset configuration
    resetConfig() {
        this.config = { ...this.defaultConfig };
        localStorage.removeItem(this.configKey);
        console.log('Configuration reset successfully');
    }

    // Export configuration (without sensitive data)
    exportConfig() {
        return {
            version: this.config.version,
            lastUpdated: this.config.lastUpdated,
            hasApiKey: !!this.config.geminiApiKey,
            apiKeyMasked: this.getApiKey(true)
        };
    }

    // Update API key with validation and confirmation
    async updateApiKey(newApiKey, confirmCallback = null) {
        try {
            // Validate new API key
            if (!newApiKey || typeof newApiKey !== 'string') {
                throw new Error('Invalid API key provided');
            }

            if (!newApiKey.startsWith('AIza') || newApiKey.length < 30) {
                throw new Error('Invalid Gemini API key format. Key should start with "AIza" and be at least 30 characters long.');
            }

            // If confirmation callback provided, ask for confirmation
            if (confirmCallback && typeof confirmCallback === 'function') {
                const confirmed = await confirmCallback({
                    oldKey: this.getApiKey(true),
                    newKey: newApiKey.substring(0, 8) + '...' + newApiKey.substring(newApiKey.length - 4),
                    action: 'update_api_key'
                });

                if (!confirmed) {
                    throw new Error('API key update cancelled by user');
                }
            }

            // Store old key for rollback if needed
            const oldApiKey = this.config.geminiApiKey;
            
            // Update the key
            this.setApiKey(newApiKey);

            return {
                success: true,
                message: 'API key updated successfully',
                oldKeyMasked: oldApiKey ? oldApiKey.substring(0, 8) + '...' + oldApiKey.substring(oldApiKey.length - 4) : 'none',
                newKeyMasked: this.getApiKey(true),
                updatedAt: this.config.lastUpdated
            };

        } catch (error) {
            console.error('Error updating API key:', error);
            throw error;
        }
    }

    // Test API key by making a simple request
    async testApiKey(apiKey = null) {
        const keyToTest = apiKey || this.getApiKey();
        
        if (!keyToTest) {
            throw new Error('No API key available to test');
        }

        try {
            const testEndpoint = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent';
            const testPayload = {
                contents: [{
                    parts: [{
                        text: 'Hello, this is a test. Please respond with "API key is working correctly."'
                    }]
                }],
                generationConfig: {
                    maxOutputTokens: 50
                }
            };

            const response = await fetch(`${testEndpoint}?key=${keyToTest}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(testPayload)
            });

            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`API test failed: ${response.status} - ${errorData}`);
            }

            const data = await response.json();
            
            if (data.candidates && data.candidates.length > 0) {
                return {
                    success: true,
                    message: 'API key is working correctly',
                    response: data.candidates[0].content.parts[0].text,
                    testedAt: new Date().toISOString()
                };
            } else {
                throw new Error('Unexpected API response format');
            }

        } catch (error) {
            console.error('API key test failed:', error);
            return {
                success: false,
                message: `API key test failed: ${error.message}`,
                testedAt: new Date().toISOString()
            };
        }
    }
}

// Create singleton instance
const configManager = new ConfigManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = ConfigManager;
} else {
    window.ConfigManager = ConfigManager;
    window.configManager = configManager;
}