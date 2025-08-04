const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');
const DatabaseService = require('./blog/database');

const app = express();
const PORT = 3001;
const db = new DatabaseService();

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static('.'));

// Helper function to generate slug from title
function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// API Routes

// Get all posts
app.get('/api/posts', async (req, res) => {
    try {
        const { status, category, search, limit } = req.query;
        const filters = {};
        
        if (status) filters.status = status;
        if (category) filters.category = category;
        if (search) filters.search = search;
        if (limit) filters.limit = parseInt(limit);

        const posts = await db.getAllPosts(filters);
        res.json(posts);
    } catch (error) {
        console.error('Error fetching posts:', error);
        res.status(500).json({ error: 'Failed to fetch posts' });
    }
});

// Get published posts (for public blog)
app.get('/api/posts/published', async (req, res) => {
    try {
        const posts = await db.getPublishedPosts();
        res.json(posts);
    } catch (error) {
        console.error('Error fetching published posts:', error);
        res.status(500).json({ error: 'Failed to fetch published posts' });
    }
});

// Get featured posts
app.get('/api/posts/featured', async (req, res) => {
    try {
        const posts = await db.getFeaturedPosts();
        res.json(posts);
    } catch (error) {
        console.error('Error fetching featured posts:', error);
        res.status(500).json({ error: 'Failed to fetch featured posts' });
    }
});

// Search posts
app.get('/api/posts/search', async (req, res) => {
    try {
        const { q } = req.query;
        if (!q) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        
        const posts = await db.searchPosts(q);
        res.json(posts);
    } catch (error) {
        console.error('Error searching posts:', error);
        res.status(500).json({ error: 'Failed to search posts' });
    }
});

// Get single post by ID
app.get('/api/posts/:id', async (req, res) => {
    try {
        const post = await db.getPostById(req.params.id);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.json(post);
    } catch (error) {
        console.error('Error fetching post:', error);
        res.status(500).json({ error: 'Failed to fetch post' });
    }
});

// Get post by slug (for public viewing)
app.get('/api/posts/slug/:slug', async (req, res) => {
    try {
        const post = await db.getPostBySlug(req.params.slug);
        if (!post) {
            return res.status(404).json({ error: 'Post not found' });
        }
        res.json(post);
    } catch (error) {
        console.error('Error fetching post by slug:', error);
        res.status(500).json({ error: 'Failed to fetch post' });
    }
});

// Create new post
app.post('/api/posts', async (req, res) => {
    try {
        const postData = req.body;
        
        // Generate slug if not provided
        if (!postData.slug && postData.title) {
            const baseSlug = generateSlug(postData.title);
            postData.slug = await db.generateUniqueSlug(baseSlug);
        }
        
        const newPost = await db.createPost(postData);
        console.log('Created new post:', newPost.id);
        res.status(201).json(newPost);
    } catch (error) {
        console.error('Error creating post:', error);
        if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            res.status(400).json({ error: 'Post with this slug already exists' });
        } else {
            res.status(500).json({ error: 'Failed to create post' });
        }
    }
});

// Update existing post
app.put('/api/posts/:id', async (req, res) => {
    try {
        const postData = req.body;
        const postId = req.params.id;
        
        // Generate slug if title changed and no slug provided
        if (!postData.slug && postData.title) {
            const baseSlug = generateSlug(postData.title);
            postData.slug = await db.generateUniqueSlug(baseSlug, postId);
        }
        
        const updatedPost = await db.updatePost(postId, postData);
        console.log('Updated post:', postId);
        res.json(updatedPost);
    } catch (error) {
        console.error('Error updating post:', error);
        if (error.message === 'Post not found') {
            res.status(404).json({ error: 'Post not found' });
        } else if (error.code === 'SQLITE_CONSTRAINT_UNIQUE') {
            res.status(400).json({ error: 'Post with this slug already exists' });
        } else {
            res.status(500).json({ error: 'Failed to update post' });
        }
    }
});

// Delete post
app.delete('/api/posts/:id', async (req, res) => {
    try {
        await db.deletePost(req.params.id);
        console.log('Deleted post:', req.params.id);
        res.json({ success: true, message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        if (error.message === 'Post not found') {
            res.status(404).json({ error: 'Post not found' });
        } else {
            res.status(500).json({ error: 'Failed to delete post' });
        }
    }
});

// AI Endpoints for cover image generation
app.post('/api/ai/generate-cover-image', async (req, res) => {
    try {
        const { title } = req.body;
        
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        // Import ai-service dynamically (assuming it's a module)
        const aiService = await import('./blog/ai-service.js');
        const imageUrl = await aiService.generateContentImage(title);
        
        res.json({ imageUrl });
    } catch (error) {
        console.error('Error generating cover image:', error);
        res.status(500).json({ error: 'Failed to generate cover image' });
    }
});

app.post('/api/ai/regenerate-cover-image', async (req, res) => {
    try {
        const { title } = req.body;
        
        if (!title) {
            return res.status(400).json({ error: 'Title is required' });
        }

        // Import ai-service dynamically
        const aiService = await import('./blog/ai-service.js');
        const imageUrl = await aiService.regenerateCoverImage(title);
        
        res.json({ imageUrl });
    } catch (error) {
        console.error('Error regenerating cover image:', error);
        res.status(500).json({ error: 'Failed to regenerate cover image' });
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
    try {
        // Initialize database
        await db.initialize();
        
        app.listen(PORT, () => {
            console.log('🚀 Blog Backend Server Started!');
            console.log(`📡 Server running on http://localhost:${PORT}`);
            console.log('📊 API Endpoints:');
            console.log(`   GET    /api/posts          - Get all posts`);
            console.log(`   GET    /api/posts/published - Get published posts`);
            console.log(`   GET    /api/posts/featured  - Get featured posts`);
            console.log(`   GET    /api/posts/search   - Search posts`);
            console.log(`   GET    /api/posts/:id      - Get single post`);
            console.log(`   GET    /api/posts/slug/:slug - Get post by slug`);
            console.log(`   POST   /api/posts          - Create new post`);
            console.log(`   PUT    /api/posts/:id      - Update post`);
            console.log(`   DELETE /api/posts/:id      - Delete post`);
            console.log(`   POST   /api/ai/generate-cover-image - Generate cover image`);
            console.log(`   POST   /api/ai/regenerate-cover-image - Regenerate cover image`);
            console.log(`   GET    /api/health         - Health check`);
        });
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
}

// Handle graceful shutdown
process.on('SIGINT', () => {
    console.log('\n👋 Shutting down blog backend server...');
    db.close();
    process.exit(0);
});

startServer().catch(console.error);
