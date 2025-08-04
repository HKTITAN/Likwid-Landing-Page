const sqlite3 = require('sqlite3').verbose();
const path = require('path');

class DatabaseService {
    constructor() {
        this.dbPath = path.join(__dirname, 'blog.db');
        this.db = null;
    }

    // Initialize database connection and create tables
    async initialize() {
        return new Promise((resolve, reject) => {
            this.db = new sqlite3.Database(this.dbPath, (err) => {
                if (err) {
                    console.error('Error opening database:', err);
                    reject(err);
                } else {
                    console.log('📦 Connected to SQLite database');
                    this.createTables().then(resolve).catch(reject);
                }
            });
        });
    }

    // Create database tables
    async createTables() {
        return new Promise((resolve, reject) => {
            const createPostsTable = `
                CREATE TABLE IF NOT EXISTS posts (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    title TEXT NOT NULL,
                    slug TEXT UNIQUE NOT NULL,
                    content TEXT,
                    excerpt TEXT,
                    status TEXT DEFAULT 'draft',
                    category TEXT DEFAULT 'Technology',
                    featured_image TEXT,
                    cover_image TEXT,
                    is_featured INTEGER DEFAULT 0,
                    author TEXT DEFAULT 'Admin',
                    author_title TEXT DEFAULT 'Content Creator',
                    author_avatar TEXT DEFAULT 'AD',
                    meta_title TEXT,
                    meta_description TEXT,
                    keywords TEXT,
                    image_alt TEXT,
                    read_time INTEGER DEFAULT 0,
                    canonical_url TEXT,
                    seo_score INTEGER DEFAULT 0,
                    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
                    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
                )
            `;

            this.db.run(createPostsTable, (err) => {
                if (err) {
                    console.error('Error creating posts table:', err);
                    reject(err);
                } else {
                    console.log('✅ Posts table ready');
                    resolve();
                }
            });
        });
    }

    // Get all posts with optional filters
    async getAllPosts(filters = {}) {
        return new Promise((resolve, reject) => {
            let query = 'SELECT * FROM posts';
            let params = [];
            let conditions = [];

            if (filters.status) {
                conditions.push('status = ?');
                params.push(filters.status);
            }

            if (filters.category) {
                conditions.push('category = ?');
                params.push(filters.category);
            }

            if (filters.search) {
                conditions.push('(title LIKE ? OR content LIKE ? OR excerpt LIKE ?)');
                const searchTerm = `%${filters.search}%`;
                params.push(searchTerm, searchTerm, searchTerm);
            }

            if (conditions.length > 0) {
                query += ' WHERE ' + conditions.join(' AND ');
            }

            query += ' ORDER BY updated_at DESC';

            if (filters.limit) {
                query += ' LIMIT ?';
                params.push(filters.limit);
            }

            this.db.all(query, params, (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    // Parse content JSON for each post
                    const posts = rows.map(post => ({
                        ...post,
                        content: post.content ? this.safeJsonParse(post.content) : null,
                        is_featured: Boolean(post.is_featured)
                    }));
                    resolve(posts);
                }
            });
        });
    }

    // Get a single post by ID
    async getPostById(id) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM posts WHERE id = ?', [id], (err, row) => {
                if (err) {
                    reject(err);
                } else if (row) {
                    // Parse content JSON
                    const post = {
                        ...row,
                        content: row.content ? this.safeJsonParse(row.content) : null,
                        is_featured: Boolean(row.is_featured)
                    };
                    resolve(post);
                } else {
                    resolve(null);
                }
            });
        });
    }

    // Get a post by slug
    async getPostBySlug(slug) {
        return new Promise((resolve, reject) => {
            this.db.get('SELECT * FROM posts WHERE slug = ?', [slug], (err, row) => {
                if (err) {
                    reject(err);
                } else if (row) {
                    const post = {
                        ...row,
                        content: row.content ? this.safeJsonParse(row.content) : null,
                        is_featured: Boolean(row.is_featured)
                    };
                    resolve(post);
                } else {
                    resolve(null);
                }
            });
        });
    }

    // Create a new post
    async createPost(postData) {
        return new Promise((resolve, reject) => {
            const {
                title, slug, content, excerpt, status, category,
                featuredImage, coverImage, is_featured, author, author_title, author_avatar,
                meta_title, meta_description, keywords, imageAlt, readTime,
                canonical_url, seo_score
            } = postData;

            const query = `
                INSERT INTO posts (
                    title, slug, content, excerpt, status, category,
                    featured_image, cover_image, is_featured, author, author_title, author_avatar,
                    meta_title, meta_description, keywords, image_alt, read_time,
                    canonical_url, seo_score
                ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
            `;

            const params = [
                title, slug, JSON.stringify(content), excerpt, status || 'draft', category || 'Technology',
                featuredImage || null, coverImage || null, is_featured ? 1 : 0,
                author || 'Admin', author_title || 'Content Creator', author_avatar || 'AD',
                meta_title || null, meta_description || null, keywords || null,
                imageAlt || null, readTime || 0, canonical_url || null, seo_score || 0
            ];

            this.db.run(query, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    resolve({ id: this.lastID, ...postData });
                }
            });
        });
    }

    // Update an existing post
    async updatePost(id, postData) {
        return new Promise((resolve, reject) => {
            const {
                title, slug, content, excerpt, status, category,
                featuredImage, coverImage, is_featured, author, author_title, author_avatar,
                meta_title, meta_description, keywords, imageAlt, readTime,
                canonical_url, seo_score
            } = postData;

            const query = `
                UPDATE posts SET
                    title = ?, slug = ?, content = ?, excerpt = ?, status = ?, category = ?,
                    featured_image = ?, cover_image = ?, is_featured = ?, author = ?, 
                    author_title = ?, author_avatar = ?, meta_title = ?, meta_description = ?,
                    keywords = ?, image_alt = ?, read_time = ?, canonical_url = ?, seo_score = ?,
                    updated_at = CURRENT_TIMESTAMP
                WHERE id = ?
            `;

            const params = [
                title, slug, JSON.stringify(content), excerpt, status || 'draft', category || 'Technology',
                featuredImage || null, coverImage || null, is_featured ? 1 : 0,
                author || 'Admin', author_title || 'Content Creator', author_avatar || 'AD',
                meta_title || null, meta_description || null, keywords || null,
                imageAlt || null, readTime || 0, canonical_url || null, seo_score || 0,
                id
            ];

            this.db.run(query, params, function(err) {
                if (err) {
                    reject(err);
                } else {
                    if (this.changes === 0) {
                        reject(new Error('Post not found'));
                    } else {
                        resolve({ id, ...postData });
                    }
                }
            });
        });
    }

    // Delete a post
    async deletePost(id) {
        return new Promise((resolve, reject) => {
            this.db.run('DELETE FROM posts WHERE id = ?', [id], function(err) {
                if (err) {
                    reject(err);
                } else {
                    if (this.changes === 0) {
                        reject(new Error('Post not found'));
                    } else {
                        resolve({ success: true, deletedId: id });
                    }
                }
            });
        });
    }

    // Search posts
    async searchPosts(searchTerm) {
        return this.getAllPosts({ search: searchTerm });
    }

    // Get posts by category
    async getPostsByCategory(category) {
        return this.getAllPosts({ category });
    }

    // Get published posts
    async getPublishedPosts() {
        return this.getAllPosts({ status: 'published' });
    }

    // Get featured posts
    async getFeaturedPosts() {
        return new Promise((resolve, reject) => {
            const query = 'SELECT * FROM posts WHERE is_featured = 1 AND status = "published" ORDER BY updated_at DESC';
            
            this.db.all(query, [], (err, rows) => {
                if (err) {
                    reject(err);
                } else {
                    const posts = rows.map(post => ({
                        ...post,
                        content: post.content ? this.safeJsonParse(post.content) : null,
                        is_featured: Boolean(post.is_featured)
                    }));
                    resolve(posts);
                }
            });
        });
    }

    // Generate unique slug
    async generateUniqueSlug(baseSlug, excludeId = null) {
        return new Promise((resolve, reject) => {
            let counter = 0;
            let currentSlug = baseSlug;

            const checkSlug = () => {
                let query = 'SELECT id FROM posts WHERE slug = ?';
                let params = [currentSlug];

                if (excludeId) {
                    query += ' AND id != ?';
                    params.push(excludeId);
                }

                this.db.get(query, params, (err, row) => {
                    if (err) {
                        reject(err);
                    } else if (row) {
                        // Slug exists, try with counter
                        counter++;
                        currentSlug = `${baseSlug}-${counter}`;
                        checkSlug();
                    } else {
                        // Slug is unique
                        resolve(currentSlug);
                    }
                });
            };

            checkSlug();
        });
    }

    // Utility function to safely parse JSON
    safeJsonParse(jsonString) {
        try {
            return JSON.parse(jsonString);
        } catch (e) {
            console.warn('Error parsing JSON content:', e);
            return jsonString;
        }
    }

    // Close database connection
    close() {
        if (this.db) {
            this.db.close((err) => {
                if (err) {
                    console.error('Error closing database:', err);
                } else {
                    console.log('📦 Database connection closed');
                }
            });
        }
    }
}

module.exports = DatabaseService;
