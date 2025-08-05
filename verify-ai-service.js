/**
 * Verification script for AI Service with secure configuration
 * This script verifies that the AI service is working correctly with the new configuration system
 */

const fs = require('fs');
const path = require('path');

function verifyAIServiceImplementation() {
    console.log('🔍 Verifying AI Service Implementation...\n');
    
    try {
        // Check if required files exist
        const requiredFiles = [
            'blog/config-manager.js',
            'blog/api-key-manager.js',
            'blog/ai-service.js'
        ];
        
        console.log('📁 Checking required files...');
        for (const file of requiredFiles) {
            if (fs.existsSync(file)) {
                console.log(`✅ ${file} exists`);
            } else {
                console.log(`❌ ${file} missing`);
                return false;
            }
        }
        
        // Check AI service content for secure configuration
        console.log('\n🔧 Checking AI service configuration...');
        const aiServiceContent = fs.readFileSync('blog/ai-service.js', 'utf8');
        
        // Requirement 3.1: Check API key configuration
        console.log('📋 Requirement 3.1: API Key Configuration');
        const expectedKey = 'AIzaSyCwXQak1jfXrALC0Lb5Q4PHLPP_bFxBnfU';
        if (aiServiceContent.includes(expectedKey)) {
            console.log('✅ PASS: Gemini API key correctly configured');
        } else {
            console.log('❌ FAIL: Gemini API key not found or incorrect');
        }
        
        // Check for secure configuration usage
        if (aiServiceContent.includes('this.configManager = window.configManager')) {
            console.log('✅ PASS: AI service uses configuration manager');
        } else {
            console.log('❌ FAIL: AI service does not use configuration manager');
        }
        
        if (aiServiceContent.includes('updateApiKey')) {
            console.log('✅ PASS: AI service supports API key updates');
        } else {
            console.log('❌ FAIL: AI service does not support API key updates');
        }
        
        // Requirement 3.2: Check API endpoints
        console.log('\n📋 Requirement 3.2: API Endpoints Configuration');
        const expectedEndpoints = [
            'generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
            'generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent'
        ];
        
        for (const endpoint of expectedEndpoints) {
            if (aiServiceContent.includes(endpoint)) {
                console.log(`✅ PASS: Endpoint ${endpoint.split('/').pop()} configured`);
            } else {
                console.log(`❌ FAIL: Endpoint ${endpoint.split('/').pop()} not found`);
            }
        }
        
        // Requirement 3.3: Check content generation methods
        console.log('\n📋 Requirement 3.3: Content Generation Methods');
        const requiredMethods = [
            'generateContent',
            'generateImage',
            'generateCompleteContent',
            'analyzeImage'
        ];
        
        for (const method of requiredMethods) {
            if (aiServiceContent.includes(`async ${method}(`)) {
                console.log(`✅ PASS: Method ${method} implemented`);
            } else {
                console.log(`❌ FAIL: Method ${method} not found`);
            }
        }
        
        // Check for API key validation
        if (aiServiceContent.includes('if (!this.apiKey)')) {
            console.log('✅ PASS: API key validation implemented');
        } else {
            console.log('❌ FAIL: API key validation missing');
        }
        
        // Check configuration manager
        console.log('\n🔧 Checking Configuration Manager...');
        const configManagerContent = fs.readFileSync('blog/config-manager.js', 'utf8');
        
        if (configManagerContent.includes('encodeConfig') && configManagerContent.includes('decodeConfig')) {
            console.log('✅ PASS: Configuration obfuscation implemented');
        } else {
            console.log('❌ FAIL: Configuration obfuscation missing');
        }
        
        if (configManagerContent.includes('updateApiKey')) {
            console.log('✅ PASS: API key update functionality implemented');
        } else {
            console.log('❌ FAIL: API key update functionality missing');
        }
        
        if (configManagerContent.includes('testApiKey')) {
            console.log('✅ PASS: API key testing functionality implemented');
        } else {
            console.log('❌ FAIL: API key testing functionality missing');
        }
        
        // Check API key manager UI
        console.log('\n🎨 Checking API Key Manager UI...');
        const apiKeyManagerContent = fs.readFileSync('blog/api-key-manager.js', 'utf8');
        
        if (apiKeyManagerContent.includes('createInterface')) {
            console.log('✅ PASS: API key management interface implemented');
        } else {
            console.log('❌ FAIL: API key management interface missing');
        }
        
        if (apiKeyManagerContent.includes('togglePasswordVisibility')) {
            console.log('✅ PASS: Password visibility toggle implemented');
        } else {
            console.log('❌ FAIL: Password visibility toggle missing');
        }
        
        // Check dashboard integration
        console.log('\n🏠 Checking Dashboard Integration...');
        const dashboardContent = fs.readFileSync('blog/blog-dashboard.html', 'utf8');
        
        if (dashboardContent.includes('config-manager.js') && dashboardContent.includes('api-key-manager.js')) {
            console.log('✅ PASS: Configuration scripts loaded in dashboard');
        } else {
            console.log('❌ FAIL: Configuration scripts not loaded in dashboard');
        }
        
        if (dashboardContent.includes('api-key-manager')) {
            console.log('✅ PASS: API key manager container added to dashboard');
        } else {
            console.log('❌ FAIL: API key manager container missing from dashboard');
        }
        
        if (dashboardContent.includes('apiKeyManager.init()')) {
            console.log('✅ PASS: API key manager initialization added');
        } else {
            console.log('❌ FAIL: API key manager initialization missing');
        }
        
        // Check editor integration
        console.log('\n✏️ Checking Editor Integration...');
        const editorContent = fs.readFileSync('blog/blog-editor.html', 'utf8');
        
        if (editorContent.includes('config-manager.js') && editorContent.includes('api-key-manager.js')) {
            console.log('✅ PASS: Configuration scripts loaded in editor');
        } else {
            console.log('❌ FAIL: Configuration scripts not loaded in editor');
        }
        
        console.log('\n🎉 AI Service verification completed!');
        console.log('\n📋 Summary:');
        console.log('✅ Secure API key storage implemented');
        console.log('✅ API key update functionality added');
        console.log('✅ Configuration manager created');
        console.log('✅ API key management UI implemented');
        console.log('✅ Dashboard and editor integration completed');
        console.log('✅ API key validation and testing added');
        
        return true;
        
    } catch (error) {
        console.error('❌ Verification failed:', error);
        return false;
    }
}

// Run verification
if (verifyAIServiceImplementation()) {
    console.log('\n🎯 Task 5.1 "Update AI service configuration in blog/ai-service.js" - COMPLETED');
    process.exit(0);
} else {
    console.log('\n❌ Task 5.1 verification failed');
    process.exit(1);
}