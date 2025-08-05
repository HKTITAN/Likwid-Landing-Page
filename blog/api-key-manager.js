/**
 * API Key Manager UI Component
 * Provides interface for securely updating and managing the Gemini API key
 */

class APIKeyManager {
    constructor(containerId = 'api-key-manager') {
        this.containerId = containerId;
        this.configManager = window.configManager || new ConfigManager();
        this.aiService = null; // Will be set when AI service is available
        this.isVisible = false;
    }

    // Set AI service reference
    setAIService(aiService) {
        this.aiService = aiService;
    }

    // Create the API key management interface
    createInterface() {
        const container = document.getElementById(this.containerId);
        if (!container) {
            console.error(`Container with ID '${this.containerId}' not found`);
            return;
        }

        const status = this.configManager.getStatus();
        
        container.innerHTML = `
            <div class="api-key-manager">
                <div class="api-key-header">
                    <h3>🔑 API Key Management</h3>
                    <button class="toggle-btn" onclick="apiKeyManager.toggleVisibility()">
                        ${this.isVisible ? 'Hide' : 'Show'}
                    </button>
                </div>
                
                <div class="api-key-content" style="display: ${this.isVisible ? 'block' : 'none'}">
                    <div class="api-key-status">
                        <div class="status-item">
                            <span class="label">Status:</span>
                            <span class="status ${status.isValid ? 'valid' : 'invalid'}">
                                ${status.isValid ? '✅ Valid' : '❌ Invalid/Missing'}
                            </span>
                        </div>
                        
                        <div class="status-item">
                            <span class="label">Current Key:</span>
                            <span class="api-key-display">${status.apiKeyMasked || 'Not set'}</span>
                        </div>
                        
                        <div class="status-item">
                            <span class="label">Last Updated:</span>
                            <span class="last-updated">${status.lastUpdated ? new Date(status.lastUpdated).toLocaleString() : 'Never'}</span>
                        </div>
                    </div>

                    <div class="api-key-actions">
                        <div class="input-group">
                            <label for="new-api-key">New API Key:</label>
                            <input 
                                type="password" 
                                id="new-api-key" 
                                placeholder="Enter new Gemini API key (AIza...)"
                                class="api-key-input"
                            >
                            <button class="show-hide-btn" onclick="apiKeyManager.togglePasswordVisibility()">👁️</button>
                        </div>
                        
                        <div class="button-group">
                            <button class="update-btn" onclick="apiKeyManager.updateApiKey()">
                                Update API Key
                            </button>
                            <button class="test-btn" onclick="apiKeyManager.testApiKey()">
                                Test Connection
                            </button>
                            <button class="reset-btn" onclick="apiKeyManager.resetConfig()">
                                Reset Config
                            </button>
                        </div>
                    </div>

                    <div class="api-key-help">
                        <details>
                            <summary>How to get a Gemini API Key</summary>
                            <div class="help-content">
                                <ol>
                                    <li>Go to <a href="https://makersuite.google.com/app/apikey" target="_blank">Google AI Studio</a></li>
                                    <li>Sign in with your Google account</li>
                                    <li>Click "Create API Key"</li>
                                    <li>Copy the generated key (starts with "AIza")</li>
                                    <li>Paste it in the field above and click "Update API Key"</li>
                                </ol>
                                <p><strong>Note:</strong> Keep your API key secure and never share it publicly.</p>
                            </div>
                        </details>
                    </div>

                    <div id="api-key-messages" class="messages"></div>
                </div>
            </div>
        `;

        this.addStyles();
    }

    // Add CSS styles for the interface
    addStyles() {
        if (document.getElementById('api-key-manager-styles')) return;

        const styles = document.createElement('style');
        styles.id = 'api-key-manager-styles';
        styles.textContent = `
            .api-key-manager {
                background: #f8f9fa;
                border: 1px solid #dee2e6;
                border-radius: 8px;
                padding: 20px;
                margin: 20px 0;
                font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            }

            .api-key-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 15px;
            }

            .api-key-header h3 {
                margin: 0;
                color: #495057;
            }

            .toggle-btn {
                background: #007bff;
                color: white;
                border: none;
                padding: 5px 15px;
                border-radius: 4px;
                cursor: pointer;
                font-size: 12px;
            }

            .toggle-btn:hover {
                background: #0056b3;
            }

            .api-key-status {
                background: white;
                padding: 15px;
                border-radius: 6px;
                margin-bottom: 15px;
                border: 1px solid #e9ecef;
            }

            .status-item {
                display: flex;
                justify-content: space-between;
                margin-bottom: 8px;
            }

            .status-item:last-child {
                margin-bottom: 0;
            }

            .label {
                font-weight: 600;
                color: #495057;
            }

            .status.valid {
                color: #28a745;
                font-weight: 600;
            }

            .status.invalid {
                color: #dc3545;
                font-weight: 600;
            }

            .api-key-display {
                font-family: monospace;
                background: #f8f9fa;
                padding: 2px 6px;
                border-radius: 3px;
                font-size: 12px;
            }

            .input-group {
                margin-bottom: 15px;
            }

            .input-group label {
                display: block;
                margin-bottom: 5px;
                font-weight: 600;
                color: #495057;
            }

            .input-group {
                position: relative;
            }

            .api-key-input {
                width: calc(100% - 40px);
                padding: 10px;
                border: 1px solid #ced4da;
                border-radius: 4px;
                font-family: monospace;
                font-size: 14px;
            }

            .show-hide-btn {
                position: absolute;
                right: 5px;
                top: 50%;
                transform: translateY(-50%);
                background: none;
                border: none;
                cursor: pointer;
                padding: 5px;
                margin-top: 12px;
            }

            .button-group {
                display: flex;
                gap: 10px;
                flex-wrap: wrap;
            }

            .button-group button {
                padding: 10px 15px;
                border: none;
                border-radius: 4px;
                cursor: pointer;
                font-weight: 600;
                transition: background-color 0.2s;
            }

            .update-btn {
                background: #28a745;
                color: white;
            }

            .update-btn:hover {
                background: #218838;
            }

            .test-btn {
                background: #17a2b8;
                color: white;
            }

            .test-btn:hover {
                background: #138496;
            }

            .reset-btn {
                background: #dc3545;
                color: white;
            }

            .reset-btn:hover {
                background: #c82333;
            }

            .api-key-help {
                margin-top: 20px;
                padding-top: 15px;
                border-top: 1px solid #e9ecef;
            }

            .api-key-help details {
                cursor: pointer;
            }

            .api-key-help summary {
                font-weight: 600;
                color: #007bff;
                padding: 5px 0;
            }

            .help-content {
                margin-top: 10px;
                padding: 10px;
                background: #e7f3ff;
                border-radius: 4px;
                font-size: 14px;
            }

            .help-content ol {
                margin: 10px 0;
                padding-left: 20px;
            }

            .help-content a {
                color: #007bff;
                text-decoration: none;
            }

            .help-content a:hover {
                text-decoration: underline;
            }

            .messages {
                margin-top: 15px;
                min-height: 20px;
            }

            .message {
                padding: 10px;
                border-radius: 4px;
                margin-bottom: 10px;
                font-weight: 500;
            }

            .message.success {
                background: #d4edda;
                color: #155724;
                border: 1px solid #c3e6cb;
            }

            .message.error {
                background: #f8d7da;
                color: #721c24;
                border: 1px solid #f5c6cb;
            }

            .message.info {
                background: #d1ecf1;
                color: #0c5460;
                border: 1px solid #bee5eb;
            }

            .message.warning {
                background: #fff3cd;
                color: #856404;
                border: 1px solid #ffeaa7;
            }
        `;

        document.head.appendChild(styles);
    }

    // Toggle visibility of the configuration panel
    toggleVisibility() {
        this.isVisible = !this.isVisible;
        const content = document.querySelector('.api-key-content');
        const toggleBtn = document.querySelector('.toggle-btn');
        
        if (content) {
            content.style.display = this.isVisible ? 'block' : 'none';
        }
        
        if (toggleBtn) {
            toggleBtn.textContent = this.isVisible ? 'Hide' : 'Show';
        }
    }

    // Toggle password visibility
    togglePasswordVisibility() {
        const input = document.getElementById('new-api-key');
        const btn = document.querySelector('.show-hide-btn');
        
        if (input.type === 'password') {
            input.type = 'text';
            btn.textContent = '🙈';
        } else {
            input.type = 'password';
            btn.textContent = '👁️';
        }
    }

    // Update API key
    async updateApiKey() {
        const input = document.getElementById('new-api-key');
        const newApiKey = input.value.trim();

        if (!newApiKey) {
            this.showMessage('Please enter an API key', 'error');
            return;
        }

        try {
            this.showMessage('Updating API key...', 'info');
            
            // Confirmation callback
            const confirmCallback = async (details) => {
                return confirm(`Update API key?\n\nOld: ${details.oldKey}\nNew: ${details.newKey}\n\nThis will replace your current API key.`);
            };

            const result = await this.configManager.updateApiKey(newApiKey, confirmCallback);
            
            // Update AI service if available
            if (this.aiService) {
                this.aiService.refreshApiKey();
            }

            this.showMessage(`✅ ${result.message}`, 'success');
            input.value = ''; // Clear the input
            
            // Refresh the interface to show new status
            setTimeout(() => {
                this.createInterface();
                this.isVisible = true; // Keep it visible after update
                document.querySelector('.api-key-content').style.display = 'block';
            }, 1000);

        } catch (error) {
            this.showMessage(`❌ Failed to update API key: ${error.message}`, 'error');
        }
    }

    // Test API key connection
    async testApiKey() {
        try {
            this.showMessage('Testing API connection...', 'info');
            
            const result = await this.configManager.testApiKey();
            
            if (result.success) {
                this.showMessage(`✅ ${result.message}`, 'success');
            } else {
                this.showMessage(`❌ ${result.message}`, 'error');
            }

        } catch (error) {
            this.showMessage(`❌ Test failed: ${error.message}`, 'error');
        }
    }

    // Reset configuration
    resetConfig() {
        if (confirm('Are you sure you want to reset the configuration? This will remove your API key and all settings.')) {
            try {
                this.configManager.resetConfig();
                
                // Update AI service if available
                if (this.aiService) {
                    this.aiService.refreshApiKey();
                }

                this.showMessage('✅ Configuration reset successfully', 'success');
                
                // Refresh the interface
                setTimeout(() => {
                    this.createInterface();
                    this.isVisible = true;
                    document.querySelector('.api-key-content').style.display = 'block';
                }, 1000);

            } catch (error) {
                this.showMessage(`❌ Failed to reset configuration: ${error.message}`, 'error');
            }
        }
    }

    // Show message to user
    showMessage(message, type = 'info') {
        const messagesContainer = document.getElementById('api-key-messages');
        if (!messagesContainer) return;

        const messageDiv = document.createElement('div');
        messageDiv.className = `message ${type}`;
        messageDiv.textContent = message;

        messagesContainer.appendChild(messageDiv);

        // Auto-remove message after 5 seconds
        setTimeout(() => {
            if (messageDiv.parentNode) {
                messageDiv.parentNode.removeChild(messageDiv);
            }
        }, 5000);

        // Scroll to message
        messageDiv.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    }

    // Initialize the manager
    init() {
        this.createInterface();
        console.log('🔑 API Key Manager initialized');
    }
}

// Create global instance
const apiKeyManager = new APIKeyManager();

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
    module.exports = APIKeyManager;
} else {
    window.APIKeyManager = APIKeyManager;
    window.apiKeyManager = apiKeyManager;
}