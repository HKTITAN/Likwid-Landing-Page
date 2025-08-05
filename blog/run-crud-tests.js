#!/usr/bin/env node

/**
 * CRUD Operations Test Runner
 * Command-line test runner for blog CRUD operations
 */

// Try to import fetch - handle both Node.js versions
let fetch;
try {
    // Node.js 18+ has built-in fetch
    fetch = globalThis.fetch;
    if (!fetch) {
        // Fallback to node-fetch for older versions
        fetch = require('node-fetch');
    }
} catch (error) {
    console.error('❌ fetch is not available. Please install node-fetch or use Node.js 18+');
    console.error('   Run: npm install node-fetch');
    process.exit(1);
}

// Test configuration
const BASE_URL = 'http://localhost:3001/api';
const TEST_TIMEOUT = 30000; // 30 seconds

// Test results tracking
let testResults = {
    total: 0,
    passed: 0,
    failed: 0,
    startTime: null,
    endTime: null,
    logs: []
};

let testPostId = null;

// Logging function
function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = `[${timestamp}] ${type.toUpperCase()}: ${message}`;
    testResults.logs.push(logEntry);
    
    const colors = {
        info: '\x1b[36m',    // Cyan
        success: '\x1b[32m', // Green
        error: '\x1b[31m',   // Red
        warning: '\x1b[33m', // Yellow
        reset: '\x1b[0m'     // Reset
    };
    
    console.log(`${colors[type] || colors.info}${logEntry}${colors.reset}`);
}

// Test result tracking
function recordTest(testName, success, message, details = null) {
    testResults.total++;
    if (success) {
        testResults.passed++;
        log(`✅ ${testName}: ${message}`, 'success');
    } else {
        testResults.failed++;
        log(`❌ ${testName}: ${message}`, 'error');
        if (details) log(`   Details: ${details}`, 'error');
    }
}

// API helper function
async function makeRequest(endpoint, options = {}) {
    const url = `${BASE_URL}${endpoint}`;
    
    const defaultOptions = {
        headers: {
            'Content-Type': 'application/json',
        },
        timeout: 10000,
    };

    const requestOptions = { ...defaultOptions, ...options };
    
    log(`📡 API Request: ${requestOptions.method || 'GET'} ${url}`, 'info');
    
    try {
        const response = await fetch(url, requestOptions);
        
        if (!response.ok) {
            let errorData;
            try {
                errorData = await response.json();
            } catch {
                try {
                    errorData = await response.text();
                } catch {
                    errorData = `HTTP ${response.status} ${response.statusText}`;
                }
            }
            
            const errorMessage = typeof errorData === 'object' ? 
                (errorData.message || errorData.error || JSON.stringify(errorData)) : 
                errorData;
            
            const error = new Error(errorMessage || `HTTP ${response.status}`);
            error.status = response.status;
            throw error;
        }
        
        const data = await response.json();
        log(`✅ API Response received`, 'info');
        return data;
        
    } catch (error) {
        log(`❌ API Request failed: ${error.message}`, 'error');
        throw error;
    }
}

// Test 7.1: Post Creation Workflow
async function testPostCreation() {
    log('=== Testing Post Creation Workflow ===', 'info');
    
    try {
        // Step 1: Create new post
        log('Step 1: Creating new test post...', 'info');
        const testPost = {
            title: `Test Post ${Date.now()}`,
            content: JSON.stringify({
                blocks: [
                    {
                        type: "header",
                        data: { text: "Test Post Content", level: 1 }
                    },
                    {
                        type: "paragraph",
                        data: { text: "This is a test post created by the CRUD test suite." }
                    }
                ]
            }),
            excerpt: 'Test post for CRUD operations',
            category: 'Testing',
            status: 'draft',
            author_name: 'Test Suite',
            meta_title: 'Test Post Meta Title',
            meta_description: 'Test post meta description'
        };

        const createdPost = await makeRequest('/posts', {
            method: 'POST',
            body: JSON.stringify(testPost)
        });
        
        testPostId = createdPost.id;
        recordTest('Post Creation', true, 
            `Post created successfully with ID: ${createdPost.id}`);

        // Step 2: Verify post saved to database
        log('Step 2: Verifying post exists in database...', 'info');
        const retrievedPost = await makeRequest(`/posts/${testPostId}`);
        
        if (retrievedPost && retrievedPost.id === testPostId) {
            recordTest('Database Save Verification', true, 
                'Post successfully saved to database');
        } else {
            recordTest('Database Save Verification', false, 
                'Post not found in database');
        }

        // Step 3: Check post appears in blog listing
        log('Step 3: Checking post appears in blog listing...', 'info');
        const allPosts = await makeRequest('/posts');
        const postInListing = allPosts.find(post => post.id === testPostId);
        
        if (postInListing) {
            recordTest('Blog Listing Check', true, 
                `Post appears in blog listing (${allPosts.length} total posts)`);
        } else {
            recordTest('Blog Listing Check', false, 
                `Post not found in blog listing (${allPosts.length} posts checked)`);
        }

    } catch (error) {
        recordTest('Post Creation', false, 'Post creation failed', error.message);
    }
}

// Test 7.2: Post Editing Workflow
async function testPostEditing() {
    log('=== Testing Post Editing Workflow ===', 'info');
    
    if (!testPostId) {
        recordTest('Post Editing', false, 'No test post available for editing');
        return;
    }

    try {
        // Step 1: Edit existing post content
        log('Step 1: Editing post content and metadata...', 'info');
        const updatedData = {
            title: `Updated Test Post ${Date.now()}`,
            content: JSON.stringify({
                blocks: [
                    {
                        type: "header",
                        data: { text: "Updated Test Post Content", level: 1 }
                    },
                    {
                        type: "paragraph",
                        data: { text: "This post has been updated by the CRUD test suite." }
                    }
                ]
            }),
            excerpt: 'Updated test post for CRUD operations',
            category: 'Updated Testing',
            meta_title: 'Updated Test Post Meta Title',
            updated: new Date().toISOString()
        };

        const updatedPost = await makeRequest(`/posts/${testPostId}`, {
            method: 'PUT',
            body: JSON.stringify(updatedData)
        });
        
        recordTest('Post Content Update', true, 
            `Post updated successfully: "${updatedPost.title}"`);

        // Step 2: Verify changes saved to database
        log('Step 2: Verifying changes saved to database...', 'info');
        
        // Wait a moment for database to update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const retrievedPost = await makeRequest(`/posts/${testPostId}`);
        
        if (retrievedPost.title === updatedData.title && 
            retrievedPost.category === updatedData.category) {
            recordTest('Database Update Verification', true, 
                'Changes successfully saved to database');
        } else {
            recordTest('Database Update Verification', false, 
                'Changes not properly saved to database');
        }

        // Step 3: Test auto-save functionality (simulated)
        log('Step 3: Testing auto-save functionality...', 'info');
        
        const autoSaveData = {
            excerpt: `Auto-saved at ${new Date().toISOString()}`,
            updated: new Date().toISOString()
        };
        
        const autoSavedPost = await makeRequest(`/posts/${testPostId}`, {
            method: 'PUT',
            body: JSON.stringify(autoSaveData)
        });
        
        if (autoSavedPost.excerpt === autoSaveData.excerpt) {
            recordTest('Auto-save Functionality', true, 
                'Simulated auto-save update successful');
        } else {
            recordTest('Auto-save Functionality', false, 
                'Auto-save update not reflected');
        }

    } catch (error) {
        recordTest('Post Editing', false, 'Post editing failed', error.message);
    }
}

// Test 7.3: Post Publishing Workflow
async function testPostPublishing() {
    log('=== Testing Post Publishing Workflow ===', 'info');
    
    if (!testPostId) {
        recordTest('Post Publishing', false, 'No test post available for publishing');
        return;
    }

    try {
        // Step 1: Change post status to published
        log('Step 1: Publishing the test post...', 'info');
        const publishData = {
            status: 'published',
            updated: new Date().toISOString()
        };

        const publishedPost = await makeRequest(`/posts/${testPostId}`, {
            method: 'PUT',
            body: JSON.stringify(publishData)
        });
        
        if (publishedPost.status === 'published') {
            recordTest('Post Status Update', true, 
                `Post ID ${testPostId} is now published`);
        } else {
            recordTest('Post Status Update', false, 
                `Failed to change status to published (got: ${publishedPost.status})`);
        }

        // Step 2: Verify published post appears on public blog
        log('Step 2: Checking published posts endpoint...', 'info');
        
        // Wait a moment for database to update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        const publishedPosts = await makeRequest('/posts/published');
        const publishedTestPost = publishedPosts.find(post => post.id === testPostId);
        
        if (publishedTestPost) {
            recordTest('Public Blog Verification', true, 
                `Published post appears in public blog (${publishedPosts.length} published posts)`);
        } else {
            recordTest('Public Blog Verification', false, 
                `Published post not found in public blog (${publishedPosts.length} posts checked)`);
        }

        // Step 3: Test featured post functionality
        log('Step 3: Testing featured post functionality...', 'info');
        const featuredData = {
            is_featured: 1,
            updated: new Date().toISOString()
        };

        const featuredPost = await makeRequest(`/posts/${testPostId}`, {
            method: 'PUT',
            body: JSON.stringify(featuredData)
        });
        
        if (featuredPost.is_featured === 1 || featuredPost.is_featured === true) {
            recordTest('Featured Post Functionality', true, 
                'Post successfully marked as featured');
        } else {
            recordTest('Featured Post Functionality', false, 
                `Failed to mark as featured (got: ${featuredPost.is_featured})`);
        }

    } catch (error) {
        recordTest('Post Publishing', false, 'Post publishing failed', error.message);
    }
}

// Test 7.4: Post Deletion Workflow
async function testPostDeletion() {
    log('=== Testing Post Deletion Workflow ===', 'info');
    
    if (!testPostId) {
        recordTest('Post Deletion', false, 'No test post available for deletion');
        return;
    }

    const postIdToDelete = testPostId;
    
    try {
        // Step 1: Delete post from dashboard (via API)
        log(`Step 1: Deleting post ${postIdToDelete} via API...`, 'info');
        
        await makeRequest(`/posts/${testPostId}`, {
            method: 'DELETE'
        });
        
        recordTest('Post Deletion Request', true, 
            `Post ID ${postIdToDelete} deletion API call successful`);

        // Step 2: Verify post removed from database
        log('Step 2: Verifying post removed from database...', 'info');
        
        // Wait a moment for database to update
        await new Promise(resolve => setTimeout(resolve, 500));
        
        try {
            await makeRequest(`/posts/${postIdToDelete}`);
            recordTest('Database Deletion Verification', false, 
                'Post still exists in database');
        } catch (error) {
            if (error.status === 404) {
                recordTest('Database Deletion Verification', true, 
                    'Post successfully removed from database (404 as expected)');
            } else {
                recordTest('Database Deletion Verification', false, 
                    `Unexpected error checking deletion: ${error.message}`);
            }
        }

        // Step 3: Confirm post not in listings
        log('Step 3: Checking post not in listings...', 'info');
        
        const allPosts = await makeRequest('/posts');
        const postInListing = allPosts.find(post => post.id === postIdToDelete);
        
        if (!postInListing) {
            recordTest('Listing Removal Verification', true, 
                `Post not found in listings (${allPosts.length} posts checked)`);
        } else {
            recordTest('Listing Removal Verification', false, 
                'Post still appears in listings');
        }

        // Reset test post ID since it's been deleted
        testPostId = null;

    } catch (error) {
        recordTest('Post Deletion', false, 'Post deletion failed', error.message);
    }
}

// Health check
async function checkServerHealth() {
    log('Checking server health...', 'info');
    try {
        const health = await makeRequest('/health');
        log(`Server is healthy: ${health.status}`, 'success');
        return true;
    } catch (error) {
        log(`Server health check failed: ${error.message}`, 'error');
        return false;
    }
}

// Main test runner
async function runAllTests() {
    console.log('\n🧪 Blog CRUD Operations Test Suite');
    console.log('=====================================\n');
    
    testResults.startTime = Date.now();
    
    // Check server health first
    const isHealthy = await checkServerHealth();
    if (!isHealthy) {
        console.log('\n❌ Server is not healthy. Please start the server and try again.');
        process.exit(1);
    }
    
    // Run all tests sequentially
    await testPostCreation();
    await testPostEditing();
    await testPostPublishing();
    await testPostDeletion();
    
    testResults.endTime = Date.now();
    
    // Print summary
    console.log('\n📊 Test Results Summary');
    console.log('========================');
    console.log(`Total Tests: ${testResults.total}`);
    console.log(`✅ Passed: ${testResults.passed}`);
    console.log(`❌ Failed: ${testResults.failed}`);
    console.log(`⏱️  Duration: ${Math.round((testResults.endTime - testResults.startTime) / 1000)}s`);
    
    if (testResults.failed === 0) {
        console.log('\n🎉 All tests passed! CRUD operations are working correctly.');
        process.exit(0);
    } else {
        console.log('\n⚠️  Some tests failed. Please check the logs above for details.');
        process.exit(1);
    }
}

// Handle command line arguments
if (require.main === module) {
    const args = process.argv.slice(2);
    
    if (args.includes('--help') || args.includes('-h')) {
        console.log(`
Blog CRUD Operations Test Suite

Usage: node run-crud-tests.js [options]

Options:
  --help, -h     Show this help message
  --verbose, -v  Enable verbose logging

Examples:
  node run-crud-tests.js
  node run-crud-tests.js --verbose
        `);
        process.exit(0);
    }
    
    // Set timeout for the entire test suite
    setTimeout(() => {
        console.log('\n⏰ Test suite timed out after 30 seconds');
        process.exit(1);
    }, TEST_TIMEOUT);
    
    // Run tests
    runAllTests().catch(error => {
        console.error('\n💥 Test suite crashed:', error.message);
        process.exit(1);
    });
}

module.exports = {
    runAllTests,
    testPostCreation,
    testPostEditing,
    testPostPublishing,
    testPostDeletion
};