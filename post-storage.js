/**
 * Post Storage Service - Backend Communication
 * Handles all post CRUD operations with the backend server
 */

class PostStorageService {
    constructor() {
        this.baseURL = 'http://localhost:3001/api';
        this.cache = new Map();
        this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
    }

    // Helper method to make API requests
    async makeRequest(endpoint, options = {}) {
        const url = `${this.baseURL}${endpoint}`;
        
        const defaultOptions = {
            headers: {
                'Content-Type': 'application/json',
            },
        };

        const requestOptions = { ...defaultOptions, ...options };
        
        console.log(`📡 API Request: ${requestOptions.method || 'GET'} ${url}`);
        
        try {
            const response = await fetch(url, requestOptions);
            
            if (!response.ok) {
                const errorData = await response.text();
                throw new Error(`API Error ${response.status}: ${errorData}`);
            }
            
            const data = await response.json();
            console.log(`✅ API Response received`);
            return data;
        } catch (error) {
            console.error(`❌ API Request failed:`, error);
            throw new Error(`Backend request failed: ${error.message}`);
        }
    }

    // Check if backend server is running
    async checkServerHealth() {
        try {
            const health = await this.makeRequest('/health');
            console.log('🟢 Backend server is healthy:', health);
            return true;
        } catch (error) {
            console.error('🔴 Backend server is not running:', error.message);
            return false;
        }
    }

    // Get all posts (list view)
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
            console.error('Error getting all posts:', error);
            throw error;
        }
    }

    // Get single post by ID
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
            console.error(`Error getting post ${postId}:`, error);
            throw error;
        }
    }

    // Create new post
    async createPost(postData) {
        try {
            const newPost = await this.makeRequest('/posts', {
                method: 'POST',
                body: JSON.stringify(postData)
            });
            
            // Clear cache
            this.clearCache();
            
            console.log(`✨ Created new post: ${newPost.title || newPost.id}`);
            return newPost;
        } catch (error) {
            console.error('Error creating post:', error);
            throw error;
        }
    }

    // Update existing post
    async updatePost(postId, updates) {
        try {
            const updatedPost = await this.makeRequest(`/posts/${postId}`, {
                method: 'PUT',
                body: JSON.stringify(updates)
            });
            
            // Update cache
            this.setCache(`post_${postId}`, updatedPost);
            this.clearCache('all_posts'); // Clear list cache
            
            console.log(`💾 Updated post: ${updatedPost.title || postId}`);
            return updatedPost;
        } catch (error) {
            console.error(`Error updating post ${postId}:`, error);
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
            return result;
        } catch (error) {
            console.error(`Error deleting post ${postId}:`, error);
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

    // Search posts
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
            console.error('Error searching posts:', error);
            throw error;
        }
    }

    // Save post (auto-detect create vs update)
    async savePost(postData) {
        try {
            if (postData.id) {
                // Check if post exists
                try {
                    await this.getPost(postData.id);
                    // Post exists, update it
                    return await this.updatePost(postData.id, postData);
                } catch (error) {
                    // Post doesn't exist, create new one
                    return await this.createPost(postData);
                }
            } else {
                // No ID, create new post
                return await this.createPost(postData);
            }
        } catch (error) {
            console.error('Error saving post:', error);
            throw error;
        }
    }

    // Auto-save functionality
    setupAutoSave(postData, callback, interval = 30000) {
        if (this.autoSaveInterval) {
            clearInterval(this.autoSaveInterval);
        }

        this.autoSaveInterval = setInterval(async () => {
            try {
                const currentData = callback();
                if (this.hasUnsavedChanges(currentData)) {
                    console.log('💾 Auto-saving post...');
                    await this.savePost(currentData);
                    console.log('✅ Auto-save completed');
                }
            } catch (error) {
                console.error('Auto-save failed:', error);
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
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
            return cached.data;
        }
        
        // Remove expired cache
        if (cached) {
            this.cache.delete(key);
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
            console.error('Error getting post statistics:', error);
            throw error;
        }
    }
}

// Export singleton instance
const postStorage = new PostStorageService();
window.postStorage = postStorage;
