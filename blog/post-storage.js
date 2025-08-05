/**
 * Post Storage Service - Backend Communication
 * Handles all post CRUD operations with the backend server
 */

class PostStorageService {
    constructor() {
        this.baseURL = 'http://localhost:3001/api';
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
        this.maxRetries = 3;
        this.retryDelay = 1000; // 1 second
        this.isOnline = navigator.onLine;
        this.setupNetworkListeners();
    }

    // Setup network status listeners
    setupNetworkListeners() {
        window.addEventListener('online', () => {
            this.isOnline = true;
            this.showNotification('Connection restored', 'success');
            console.log('🟢 Network connection restored');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            this.showNotification('You are offline. Some features may not work.', 'warning');
            console.log('🔴 Network connection lost');
        });
    }

    // Show user-friendly notifications
    showNotification(message, type = 'info', duration = 5000) {
        // Create notification element if it doesn't exist
        let notificationContainer = document.getElementById('notification-container');
        if (!notificationContainer) {
            notificationContainer = document.createElement('div');
            notificationContainer.id = 'notification-container';
            notificationContainer.style.cssText = `
                position: fixed;
                top: 20px;
                right: 20px;
                z-index: 10000;
                max-width: 400px;
            `;
            document.body.appendChild(notificationContainer);
        }

        const notification = document.createElement('div');
        notification.style.cssText = `
            background: ${this.getNotificationColor(type)};
            color: white;
            padding: 12px 16px;
            margin-bottom: 8px;
            border-radius: 4px;
            box-shadow: 0 2px 8px rgba(0,0,0,0.2);
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            font-size: 14px;
            line-height: 1.4;
            opacity: 0;
            transform: translateX(100%);
            transition: all 0.3s ease;
        `;
        
        notification.textContent = message;
        notificationContainer.appendChild(notification);

        // Animate in
        setTimeout(() => {
            notification.style.opacity = '1';
            notification.style.transform = 'translateX(0)';
        }, 10);

        // Auto remove
        setTimeout(() => {
            notification.style.opacity = '0';
            notification.style.transform = 'translateX(100%)';
            setTimeout(() => {
                if (notification.parentNode) {
                    notification.parentNode.removeChild(notification);
                }
            }, 300);
        }, duration);
    }

    getNotificationColor(type) {
        const colors = {
            success: '#10b981',
            error: '#ef4444',
            warning: '#f59e0b',
            info: '#3b82f6'
        };
        return colors[type] || colors.info;
    }

    // Sleep utility for retry delays
    sleep(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // Helper method to make API requests with retry logic
    async makeRequest(endpoint, options = {}, retryCount = 0) {
        const url = `${this.baseURL}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
            timeout: 10000, // 10 second timeout
        };

        const requestOptions = { ...defaultOptions, ...options };
        
        console.log(`📡 API Request: ${requestOptions.method || 'GET'} ${url} (attempt ${retryCount + 1})`);
        
        // Check network connectivity
        if (!this.isOnline) {
            const error = new Error('No internet connection');
            error.type = 'NETWORK_ERROR';
            throw error;
        }

        try {
            // Create AbortController for timeout
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), requestOptions.timeout);
            
            const response = await fetch(url, {
                ...requestOptions,
                signal: controller.signal
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                let errorData;
                try {
                    errorData = await response.json();
                } catch {
                    errorData = await response.text();
                }
                
                const error = new Error(errorData.message || errorData || `HTTP ${response.status}`);
                error.status = response.status;
                error.type = this.getErrorType(response.status);
                throw error;
            }
            
            const data = await response.json();
            console.log(`✅ API Response received`);
            return data;
            
        } catch (error) {
            console.error(`❌ API Request failed (attempt ${retryCount + 1}):`, error);
            
            // Determine if we should retry
            const shouldRetry = this.shouldRetryRequest(error, retryCount);
            
            if (shouldRetry) {
                const delay = this.getRetryDelay(retryCount);
                console.log(`⏳ Retrying in ${delay}ms...`);
                await this.sleep(delay);
                return this.makeRequest(endpoint, options, retryCount + 1);
            }
            
            // Enhance error with user-friendly message
            const enhancedError = this.enhanceError(error, endpoint, requestOptions.method);
            throw enhancedError;
        }
    }

    // Determine error type based on status code
    getErrorType(status) {
        if (status >= 500) return 'SERVER_ERROR';
        if (status === 404) return 'NOT_FOUND';
        if (status === 401 || status === 403) return 'AUTH_ERROR';
        if (status >= 400) return 'CLIENT_ERROR';
        return 'UNKNOWN_ERROR';
    }

    // Determine if request should be retried
    shouldRetryRequest(error, retryCount) {
        if (retryCount >= this.maxRetries) return false;
        
        // Retry on network errors, timeouts, and server errors
        if (error.name === 'AbortError') return true; // Timeout
        if (error.type === 'NETWORK_ERROR') return true;
        if (error.type === 'SERVER_ERROR') return true;
        if (error.message.includes('fetch')) return true; // Network fetch errors
        
        return false;
    }

    // Calculate retry delay with exponential backoff
    getRetryDelay(retryCount) {
        return this.retryDelay * Math.pow(2, retryCount);
    }

    // Enhance error with user-friendly messages
    enhanceError(error, endpoint, method = 'GET') {
        const enhancedError = new Error(error.message);
        enhancedError.originalError = error;
        enhancedError.endpoint = endpoint;
        enhancedError.method = method;
        
        // Add user-friendly message
        if (error.name === 'AbortError') {
            enhancedError.userMessage = 'Request timed out. Please check your connection and try again.';
            enhancedError.type = 'TIMEOUT_ERROR';
        } else if (error.type === 'NETWORK_ERROR' || error.message.includes('fetch')) {
            enhancedError.userMessage = 'Unable to connect to the server. Please check your internet connection.';
            enhancedError.type = 'NETWORK_ERROR';
        } else if (error.type === 'SERVER_ERROR') {
            enhancedError.userMessage = 'Server error occurred. Please try again in a few moments.';
            enhancedError.type = 'SERVER_ERROR';
        } else if (error.type === 'NOT_FOUND') {
            enhancedError.userMessage = 'The requested resource was not found.';
            enhancedError.type = 'NOT_FOUND';
        } else if (error.type === 'AUTH_ERROR') {
            enhancedError.userMessage = 'Authentication required. Please log in and try again.';
            enhancedError.type = 'AUTH_ERROR';
        } else {
            enhancedError.userMessage = 'An unexpected error occurred. Please try again.';
            enhancedError.type = 'UNKNOWN_ERROR';
        }
        
        return enhancedError;
    }

    // Handle errors with user notifications
    handleError(error, context = '') {
        console.error(`Error in ${context}:`, error);
        
        // Show user notification
        if (error.userMessage) {
            this.showNotification(error.userMessage, 'error');
        } else {
            this.showNotification('An unexpected error occurred. Please try again.', 'error');
        }
        
        // Log detailed error for debugging
        if (error.originalError) {
            console.error('Original error:', error.originalError);
        }
        
        return error;
    }

    // Check if backend server is running
    async checkServerHealth() {
        try {
            const health = await this.makeRequest('/health');
            console.log('🟢 Backend server is healthy:', health);
            return { isHealthy: true, data: health };
        } catch (error) {
            console.error('🔴 Backend server is not running:', error.message);
            return { 
                isHealthy: false, 
                error: error.userMessage || 'Backend server is not available',
                details: error
            };
        }
    }

    // Get all posts (list view) - Backend only
    async getAllPosts() {
        try {
            // Check cache first
            const cacheKey = 'all_posts';
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                console.log('📋 Returning cached posts list');
                return cached;
            }

            const posts = await this.makeRequest('/posts');
            
            // Cache the result
            this.setCache(cacheKey, posts);
            
            console.log(`📋 Retrieved ${posts.length} posts from backend`);
            return posts;
        } catch (error) {
            this.handleError(error, 'getAllPosts');
            throw error; // No localStorage fallback - backend only
        }
    }

    // Get single post by ID - Backend only
    async getPost(postId) {
        try {
            // Check cache first
            const cacheKey = `post_${postId}`;
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                console.log(`📄 Returning cached post: ${postId}`);
                return cached;
            }

            const post = await this.makeRequest(`/posts/${postId}`);
            
            // Cache the result
            this.setCache(cacheKey, post);
            
            console.log(`📄 Retrieved post: ${post.title || postId}`);
            return post;
        } catch (error) {
            this.handleError(error, `getPost(${postId})`);
            throw error; // No localStorage fallback - backend only
        }
    }

    // Create new post
    async createPost(postData) {
        try {
            // Validate post data first
            const validation = this.validatePostData(postData);
            if (!validation.isValid) {
                const error = new Error(`Validation failed: ${validation.errors.join(', ')}`);
                error.type = 'VALIDATION_ERROR';
                error.userMessage = `Please fix the following issues: ${validation.errors.join(', ')}`;
                throw error;
            }

            const newPost = await this.makeRequest('/posts', {
                method: 'POST',
                body: JSON.stringify(postData)
            });
            
            // Clear cache
            this.clearCache();
            
            console.log(`✨ Created new post: ${newPost.title || newPost.id}`);
            this.showNotification(`Post "${newPost.title}" created successfully!`, 'success');
            return newPost;
        } catch (error) {
            this.handleError(error, 'createPost');
            throw error;
        }
    }

    // Update existing post
    async updatePost(postId, updates) {
        try {
            // Validate post data first
            const validation = this.validatePostData(updates);
            if (!validation.isValid) {
                const error = new Error(`Validation failed: ${validation.errors.join(', ')}`);
                error.type = 'VALIDATION_ERROR';
                error.userMessage = `Please fix the following issues: ${validation.errors.join(', ')}`;
                throw error;
            }

            const updatedPost = await this.makeRequest(`/posts/${postId}`, {
                method: 'PUT',
                body: JSON.stringify(updates)
            });
            
            // Update cache
            this.setCache(`post_${postId}`, updatedPost);
            this.clearCache('all_posts'); // Clear list cache
            
            console.log(`💾 Updated post: ${updatedPost.title || postId}`);
            this.showNotification(`Post "${updatedPost.title}" updated successfully!`, 'success');
            return updatedPost;
        } catch (error) {
            this.handleError(error, `updatePost(${postId})`);
            throw error;
        }
    }

    // Delete post
    async deletePost(postId) {
        try {
            const result = await this.makeRequest(`/posts/${postId}`, {
                method: 'DELETE'
            });
            
            // Clear cache
            this.clearCache();
            
            console.log(`🗑️ Deleted post: ${postId}`);
            this.showNotification('Post deleted successfully!', 'success');
            return result;
        } catch (error) {
            this.handleError(error, `deletePost(${postId})`);
            throw error;
        }
    }

    // Bulk delete posts
    async bulkDeletePosts(postIds) {
        try {
            const result = await this.makeRequest('/posts/bulk-delete', {
                method: 'POST',
                body: JSON.stringify({ postIds })
            });
            
            // Clear cache
            this.clearCache();
            
            console.log(`🗑️ Bulk deleted ${result.deleted.length} posts`);
            return result;
        } catch (error) {
            console.error('Error bulk deleting posts:', error);
            throw error;
        }
    }

    // Search posts - Backend only
    async searchPosts(query, filters = {}) {
        try {
            const params = new URLSearchParams();
            if (query) params.append('q', query);
            if (filters.category) params.append('category', filters.category);
            if (filters.status) params.append('status', filters.status);
            
            const searchEndpoint = `/posts/search?${params.toString()}`;
            const posts = await this.makeRequest(searchEndpoint);
            
            console.log(`🔍 Search found ${posts.length} posts`);
            return posts;
        } catch (error) {
            this.handleError(error, 'searchPosts');
            throw error; // No localStorage fallback - backend only
        }
    }

    // Upload image to backend
    async uploadImage(file) {
        try {
            const formData = new FormData();
            formData.append('image', file);

            const response = await fetch(`${this.baseURL}/upload/image`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const imageData = await response.json();
            console.log('📸 Image uploaded successfully:', imageData);
            this.showNotification('Image uploaded successfully!', 'success');
            return imageData;
        } catch (error) {
            this.handleError(error, 'uploadImage');
            throw error;
        }
    }

    // Generate cover image using AI
    async generateCoverImage(prompt) {
        try {
            const imageData = await this.makeRequest('/ai/generate-cover-image', {
                method: 'POST',
                body: JSON.stringify({ prompt })
            });
            
            console.log('🎨 Cover image generated:', imageData);
            this.showNotification('Cover image generated successfully!', 'success');
            return imageData;
        } catch (error) {
            this.handleError(error, 'generateCoverImage');
            throw error;
        }
    }

    // Generate complete post with AI (including images)
    async generateCompletePost(prompt) {
        try {
            const postData = await this.makeRequest('/ai/generate-complete-post', {
                method: 'POST',
                body: JSON.stringify({ prompt })
            });
            
            console.log('✨ Complete post generated with AI:', postData);
            this.showNotification('AI post generated successfully!', 'success');
            return postData;
        } catch (error) {
            this.handleError(error, 'generateCompletePost');
            throw error;
        }
    }

    // Save post (auto-detect create vs update)
    async savePost(postData) {
        try {
            if (postData.id && typeof postData.id === 'number' && postData.id > 0) {
                // Only try to update if ID is a valid database ID
                try {
                    await this.getPost(postData.id);
                    // Post exists, update it
                    return await this.updatePost(postData.id, postData);
                } catch (error) {
                    if (error.type === 'NOT_FOUND' || error.message.includes('Post not found') || error.message.includes('404')) {
                        // Post doesn't exist, create new one without the old ID
                        const { id, ...postDataWithoutId } = postData;
                        console.log('Post not found, creating new post instead');
                        return await this.createPost(postDataWithoutId);
                    }
                    throw error;
                }
            } else {
                // No valid ID or invalid ID (like timestamp), create new post
                const { id, ...postDataWithoutId } = postData;
                return await this.createPost(postDataWithoutId);
            }
        } catch (error) {
            this.handleError(error, 'savePost');
            throw error;
        }
    }

    // Auto-save functionality with error handling
    setupAutoSave(postData, callback, interval = 30000) {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        this.autoSaveFailures = 0;
        this.maxAutoSaveFailures = 3;

        this.autoSaveInterval = setInterval(async () => {
            try {
                const currentData = callback();
                if (this.hasUnsavedChanges(currentData)) {
                    console.log('💾 Auto-saving post...');
                    await this.savePost(currentData);
                    console.log('✅ Auto-save completed');
                    this.autoSaveFailures = 0; // Reset failure count on success
                    
                    // Update last saved data
                    this.lastSavedData = JSON.parse(JSON.stringify(currentData));
                }
            } catch (error) {
                this.autoSaveFailures++;
                console.error(`Auto-save failed (attempt ${this.autoSaveFailures}):`, error);
                
                if (this.autoSaveFailures >= this.maxAutoSaveFailures) {
                    this.showNotification(
                        'Auto-save has failed multiple times. Please save manually to prevent data loss.', 
                        'error', 
                        10000
                    );
                    this.stopAutoSave();
                } else {
                    this.showNotification(
                        `Auto-save failed. Will retry in ${interval/1000} seconds.`, 
                        'warning', 
                        3000
                    );
                }
            }
        }, interval);

        console.log(`⏰ Auto-save enabled (every ${interval/1000}s)`);
    }

    // Stop auto-save
    stopAutoSave() {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
            this.autoSaveInterval = null;
            console.log('⏹️ Auto-save stopped');
        }
    }

    // Check if data has unsaved changes
    hasUnsavedChanges(currentData) {
        if (!this.lastSavedData) return true;
        
        // Simple comparison - in real app, you'd want more sophisticated comparison
        return JSON.stringify(this.lastSavedData) !== JSON.stringify(currentData);
    }

    // Import posts from JSON file
    async importPosts(jsonData) {
        try {
            const posts = Array.isArray(jsonData) ? jsonData : [jsonData];
            const results = {
                imported: [],
                errors: []
            };

            for (const post of posts) {
                try {
                    const importedPost = await this.createPost(post);
                    results.imported.push(importedPost);
                } catch (error) {
                    results.errors.push({ 
                        post: post.title || 'Unknown',
                        error: error.message 
                    });
                }
            }

            console.log(`📥 Imported ${results.imported.length} posts`);
            return results;
        } catch (error) {
            console.error('Error importing posts:', error);
            throw error;
        }
    }

    // Export posts to JSON
    async exportPosts(postIds = null) {
        try {
            let posts;
            
            if (postIds && postIds.length > 0) {
                // Export specific posts
                posts = [];
                for (const id of postIds) {
                    try {
                        const post = await this.getPost(id);
                        posts.push(post);
                    } catch (error) {
                        console.warn(`Skipping post ${id}: ${error.message}`);
                    }
                }
            } else {
                // Export all posts
                const postList = await this.getAllPosts();
                posts = [];
                for (const postMeta of postList) {
                    try {
                        const fullPost = await this.getPost(postMeta.id);
                        posts.push(fullPost);
                    } catch (error) {
                        console.warn(`Skipping post ${postMeta.id}: ${error.message}`);
                    }
                }
            }

            console.log(`📤 Exported ${posts.length} posts`);
            return posts;
        } catch (error) {
            console.error('Error exporting posts:', error);
            throw error;
        }
    }

    // Cache management
    getFromCache(key, allowExpired = false) {
        const cached = this.cache.get(key);
        if (cached) {
            const isExpired = Date.now() - cached.timestamp >= this.cacheExpiry;
            
            if (!isExpired || allowExpired) {
                return cached.data;
            }
            
            // Remove expired cache only if we're not allowing expired data
            if (!allowExpired) {
                this.cache.delete(key);
            }
        }
        
        return null;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data: data,
            timestamp: Date.now()
        });
    }

    clearCache(key = null) {
        if (key) {
            this.cache.delete(key);
        } else {
            this.cache.clear();
        }
    }

    // Get cache statistics
    getCacheStats() {
        const stats = {
            totalEntries: this.cache.size,
            entries: []
        };

        for (const [key, value] of this.cache.entries()) {
            const age = Date.now() - value.timestamp;
            const isExpired = age > this.cacheExpiry;
            
            stats.entries.push({
                key,
                age: Math.round(age / 1000), // in seconds
                isExpired,
                size: JSON.stringify(value.data).length
            });
        }

        return stats;
    }

    // Utility: Generate post slug from title
    generateSlug(title) {
        return title
            .toLowerCase()
            .replace(/[^a-z0-9 -]/g, '')
            .replace(/\s+/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
    }

    // Utility: Validate post data
    validatePostData(postData) {
        const errors = [];
        
        if (!postData.title || postData.title.trim().length === 0) {
            errors.push('Title is required');
        }
        
        if (!postData.content || !postData.content.blocks || postData.content.blocks.length === 0) {
            errors.push('Content is required');
        }
        
        if (postData.title && postData.title.length > 200) {
            errors.push('Title is too long (max 200 characters)');
        }
        
        return {
            isValid: errors.length === 0,
            errors
        };
    }

    // Get post statistics
    async getPostStatistics() {
        try {
            const posts = await this.getAllPosts();
            
            const stats = {
                total: posts.length,
                byStatus: {},
                byCategory: {},
                byAuthor: {},
                totalWords: 0,
                avgReadTime: 0,
                recentPosts: posts.slice(0, 5)
            };

            posts.forEach(post => {
                // Count by status
                const status = post.status || 'draft';
                stats.byStatus[status] = (stats.byStatus[status] || 0) + 1;
                
                // Count by category
                const category = post.category || 'Uncategorized';
                stats.byCategory[category] = (stats.byCategory[category] || 0) + 1;
                
                // Count by author
                const author = post.author || 'Unknown';
                stats.byAuthor[author] = (stats.byAuthor[author] || 0) + 1;
                
                // Add to total read time
                stats.totalWords += post.readTime || 0;
            });
            
            stats.avgReadTime = posts.length > 0 ? Math.round(stats.totalWords / posts.length) : 0;
            
            return stats;
        } catch (error) {
            this.handleError(error, 'getPostStatistics');
            
            // Return default stats as fallback
            return {
                total: 0,
                byStatus: { draft: 0, published: 0 },
                byCategory: {},
                byAuthor: {},
                totalWords: 0,
                avgReadTime: 0,
                recentPosts: [],
                error: true
            };
        }
    }
}

// Export singleton instance
const postStorage = new PostStorageService();
window.postStorage = postStorage;
