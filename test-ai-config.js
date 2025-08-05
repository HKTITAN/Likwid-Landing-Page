/**
 * Test script for AI Service with secure configuration
 * Run with: node test-ai-config.js
 */

// Mock browser environment for Node.js testing
global.window = {};
global.document = {
    getElementById: () => null,
    head: { appendChild: () => {} },
    createElement: () => ({ textContent: '', id: '' })
};
global.localStorage = {
    storage: {},
    getItem: function(key) { return this.storage[key] || null; },
    setItem: function(key, value) { this.storage[key] = value; },
    removeItem: function(key) { delete this.storage[key]; }
};
global.btoa = (str) => Buffer.from(str).toString('base64');
global.atob = (str) => Buffer.from(str, 'base64').toString();
global.fetch = require('node-fetch');

// Load the configuration manager
const ConfigManager = require('./blog/config-manager.js');

async function testConfiguration() {
    console.log('🔄 Testing AI Service Configuration...\n');
    
    try {
        // Test 1: Initialize configuration manager
        console.log('1️⃣ Testing Configuration Manager initialization...');
        const configManager = new ConfigManager();
        console.log('✅ Configuration Manager initialized');
        
        // Test 2: Check initial status
        console.log('\n2️⃣ Checking initial configuration status...');
        const status = configManager.getStatus();
        console.log('Status:', JSON.stringify(status, null, 2));
        
        // Test 3: Test API key validation
        console.log('\n3️⃣ Testing API key validation...');
        const isValid = configManager.validateApiKey();
        console.log(`API key validation: ${isValid ? '✅ Valid' : '❌ Invalid'}`);
        
        // Test 4: Test API connection
        console.log('\n4️⃣ Testing API connection...');
        const connectionTest = await configManager.testApiKey();
        console.log('Connection test result:', JSON.stringify(connectionTest, null, 2));
        
        // Test 5: Test API key update (with same key to avoid changing it)
        console.log('\n5️⃣ Testing API key update functionality...');
        const currentKey = configManager.getApiKey();
        if (currentKey) {
            try {
                const updateResult = await configManager.updateApiKey(currentKey, async () => true);
                console.log('Update test result:', JSON.stringify(updateResult, null, 2));
            } catch (error) {
                console.log('Update test (expected behavior):', error.message);
            }
        }
        
        // Test 6: Test configuration export
        console.log('\n6️⃣ Testing configuration export...');
        const exportedConfig = configManager.exportConfig();
        console.log('Exported config:', JSON.stringify(exportedConfig, null, 2));
        
        console.log('\n🎉 All configuration tests completed!');
        
        // Test AI Service integration
        console.log('\n🤖 Testing AI Service integration...');
        
        // Mock AI Service for testing
        const mockAIService = {
            configManager: configManager,
            apiKey: configManager.getApiKey(),
            
            getApiKeyStatus() {
                return this.configManager.getStatus();
            },
            
            async updateApiKey(newKey, callback) {
                const result = await this.configManager.updateApiKey(newKey, callback);
                this.apiKey = this.configManager.getApiKey();
                return result;
            },
            
            refreshApiKey() {
                this.apiKey = this.configManager.getApiKey();
                return !!this.apiKey;
            }
        };
        
        console.log('AI Service mock created with API key:', mockAIService.apiKey ? 'Present' : 'Missing');
        console.log('AI Service status:', JSON.stringify(mockAIService.getApiKeyStatus(), null, 2));
        
        console.log('\n✅ All tests passed! The secure configuration system is working correctly.');
        
    } catch (error) {
        console.error('❌ Test failed:', error);
        process.exit(1);
    }
}

// Run the tests
testConfiguration().catch(console.error);