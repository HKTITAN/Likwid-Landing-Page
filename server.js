const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3001;
const POSTS_DIR = path.join(__dirname, 'posts');

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));

// Ensure posts directory exists
async function ensurePostsDirectory() {
    try {
        await fs.access(POSTS_DIR);
    } catch (error) {
        await fs.mkdir(POSTS_DIR, { recursive: true });
        console.log('📁 Created posts directory');
    }
}

// Helper function to get post file path
function getPostFilePath(postId) {
    return path.join(POSTS_DIR, `${postId}.json`);
}

// API Routes

// Get all posts (list with metadata)
app.get('/api/posts', async (req, res) => {
    try {
        const files = await fs.readdir(POSTS_DIR);
        const postFiles = files.filter(file => file.endsWith('.json'));
        
        const posts = [];
        for (const file of postFiles) {
            try {
                const filePath = path.join(POSTS_DIR, file);
                const postData = JSON.parse(await fs.readFile(filePath, 'utf8'));
                
                // Return only metadata for list view
                posts.push({
                    id: postData.id,
                    title: postData.title || 'Untitled',
                    excerpt: postData.excerpt || '',
                    category: postData.category || 'Uncategorized',
                    status: postData.status || 'draft',
                    author: postData.author || 'Admin',
                    createdAt: postData.createdAt,
                    updatedAt: postData.updatedAt,
                    readTime: postData.readTime || 5,
                    featuredImage: postData.featuredImage || ''
                });
            } catch (error) {
                console.error(`Error reading post file ${file}:`, error);
            }
        }
        
        // Sort by updatedAt (newest first)
        posts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        res.json(posts);
    } catch (error) {
        console.error('Error getting posts:', error);
        res.status(500).json({ error: 'Failed to get posts' });
    }
});

// Get single post by ID
app.get('/api/posts/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        const filePath = getPostFilePath(postId);
        
        const postData = JSON.parse(await fs.readFile(filePath, 'utf8'));
        res.json(postData);
    } catch (error) {
        if (error.code === 'ENOENT') {
            res.status(404).json({ error: 'Post not found' });
        } else {
            console.error('Error getting post:', error);
            res.status(500).json({ error: 'Failed to get post' });
        }
    }
});

// Create new post
app.post('/api/posts', async (req, res) => {
    try {
        const postData = req.body;
        
        // Generate ID if not provided
        if (!postData.id) {
            postData.id = `post_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
        }
        
        // Set timestamps
        const now = new Date().toISOString();
        postData.createdAt = postData.createdAt || now;
        postData.updatedAt = now;
        
        // Set default values
        postData.status = postData.status || 'draft';
        postData.author = postData.author || 'Admin';
        
        // Generate slug if not provided
        if (!postData.slug && postData.title) {
            postData.slug = postData.title
                .toLowerCase()
                .replace(/[^a-z0-9 -]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
        }
        
        const filePath = getPostFilePath(postData.id);
        await fs.writeFile(filePath, JSON.stringify(postData, null, 2));
        
        console.log(`✅ Created post: ${postData.title || postData.id}`);
        res.status(201).json(postData);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

// Update existing post
app.put('/api/posts/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        const updates = req.body;
        const filePath = getPostFilePath(postId);
        
        // Check if post exists
        let existingPost;
        try {
            existingPost = JSON.parse(await fs.readFile(filePath, 'utf8'));
        } catch (error) {
            if (error.code === 'ENOENT') {
                return res.status(404).json({ error: 'Post not found' });
            }
            throw error;
        }
        
        // Merge updates with existing post
        const updatedPost = {
            ...existingPost,
            ...updates,
            id: postId, // Ensure ID doesn't change
            createdAt: existingPost.createdAt, // Preserve creation date
            updatedAt: new Date().toISOString()
        };
        
        // Update slug if title changed
        if (updates.title && (!updates.slug || updates.slug === existingPost.slug)) {
            updatedPost.slug = updates.title
                .toLowerCase()
                .replace(/[^a-z0-9 -]/g, '')
                .replace(/\s+/g, '-')
                .replace(/-+/g, '-')
                .replace(/^-|-$/g, '');
        }
        
        await fs.writeFile(filePath, JSON.stringify(updatedPost, null, 2));
        
        console.log(`✅ Updated post: ${updatedPost.title || postId}`);
        res.json(updatedPost);
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Failed to update post' });
    }
});

// Delete post
app.delete('/api/posts/:id', async (req, res) => {
    try {
        const postId = req.params.id;
        const filePath = getPostFilePath(postId);
        
        // Check if post exists
        try {
            await fs.access(filePath);
        } catch (error) {
            if (error.code === 'ENOENT') {
                return res.status(404).json({ error: 'Post not found' });
            }
            throw error;
        }
        
        await fs.unlink(filePath);
        
        console.log(`🗑️ Deleted post: ${postId}`);
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// Bulk operations
app.post('/api/posts/bulk-delete', async (req, res) => {
    try {
        const { postIds } = req.body;
        
        if (!Array.isArray(postIds) || postIds.length === 0) {
            return res.status(400).json({ error: 'Invalid post IDs' });
        }
        
        const results = {
            deleted: [],
            errors: []
        };
        
        for (const postId of postIds) {
            try {
                const filePath = getPostFilePath(postId);
                await fs.unlink(filePath);
                results.deleted.push(postId);
            } catch (error) {
                results.errors.push({ postId, error: error.message });
            }
        }
        
        console.log(`🗑️ Bulk deleted ${results.deleted.length} posts`);
        res.json(results);
    } catch (error) {
        console.error('Error bulk deleting posts:', error);
        res.status(500).json({ error: 'Failed to bulk delete posts' });
    }
});

// Search posts
app.get('/api/posts/search', async (req, res) => {
    try {
        const { q, category, status } = req.query;
        
        const files = await fs.readdir(POSTS_DIR);
        const postFiles = files.filter(file => file.endsWith('.json'));
        
        const posts = [];
        for (const file of postFiles) {
            try {
                const filePath = path.join(POSTS_DIR, file);
                const postData = JSON.parse(await fs.readFile(filePath, 'utf8'));
                
                // Apply filters
                let matches = true;
                
                if (q) {
                    const searchText = q.toLowerCase();
                    const searchableText = [
                        postData.title || '',
                        postData.excerpt || '',
                        postData.keywords || '',
                        JSON.stringify(postData.content || '')
                    ].join(' ').toLowerCase();
                    
                    matches = matches && searchableText.includes(searchText);
                }
                
                if (category && category !== 'all') {
                    matches = matches && (postData.category || '').toLowerCase() === category.toLowerCase();
                }
                
                if (status && status !== 'all') {
                    matches = matches && (postData.status || 'draft') === status;
                }
                
                if (matches) {
                    posts.push({
                        id: postData.id,
                        title: postData.title || 'Untitled',
                        excerpt: postData.excerpt || '',
                        category: postData.category || 'Uncategorized',
                        status: postData.status || 'draft',
                        author: postData.author || 'Admin',
                        createdAt: postData.createdAt,
                        updatedAt: postData.updatedAt,
                        readTime: postData.readTime || 5,
                        featuredImage: postData.featuredImage || ''
                    });
                }
            } catch (error) {
                console.error(`Error reading post file ${file}:`, error);
            }
        }
        
        // Sort by relevance/updatedAt
        posts.sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt));
        
        res.json(posts);
    } catch (error) {
        console.error('Error searching posts:', error);
        res.status(500).json({ error: 'Failed to search posts' });
    }
});

// Health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        version: '1.0.0'
    });
});

// Start server
async function startServer() {
    await ensurePostsDirectory();
    
    app.listen(PORT, () => {
        console.log(`🚀 Blog backend server running on http://localhost:${PORT}`);
        console.log(`📁 Posts stored in: ${POSTS_DIR}`);
        console.log(`🔗 API endpoints:`);
        console.log(`   GET    /api/posts          - List all posts`);
        console.log(`   GET    /api/posts/:id      - Get single post`);
        console.log(`   POST   /api/posts          - Create new post`);
        console.log(`   PUT    /api/posts/:id      - Update post`);
        console.log(`   DELETE /api/posts/:id      - Delete post`);
        console.log(`   GET    /api/posts/search   - Search posts`);
        console.log(`   GET    /api/health         - Health check`);
    });
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down blog backend server...');
    process.exit(0);
});

startServer().catch(console.error);
