const fs = require('fs').promises;
const path = require('path');
const DatabaseService = require('./database');

async function migrateFilePostsToDatabase() {
    const db = new DatabaseService();
    
    try {
        console.log('🔄 Starting migration from file-based posts to database...');
        
        // Initialize database
        await db.initialize();
        
        // Check if posts directory exists
        const postsDir = path.join(__dirname, 'posts');
        try {
            await fs.access(postsDir);
        } catch (error) {
            console.log('📁 No posts directory found - nothing to migrate');
            return;
        }
        
        // Read all JSON files from posts directory
        const files = await fs.readdir(postsDir);
        const postFiles = files.filter(file => file.endsWith('.json'));
        
        if (postFiles.length === 0) {
            console.log('📄 No post files found - nothing to migrate');
            return;
        }
        
        console.log(`📚 Found ${postFiles.length} post files to migrate`);
        
        let migrated = 0;
        let errors = 0;
        
        for (const file of postFiles) {
            try {
                const filePath = path.join(postsDir, file);
                const fileContent = await fs.readFile(filePath, 'utf8');
                const postData = JSON.parse(fileContent);
                
                // Clean up the post data for database insertion
                const cleanPostData = {
                    title: postData.title || 'Untitled',
                    slug: postData.slug || generateSlug(postData.title || 'untitled'),
                    content: postData.content || '',
                    excerpt: postData.excerpt || '',
                    status: postData.status || 'draft',
                    category: postData.category || 'Technology',
                    featuredImage: postData.featuredImage || postData.featured_image || null,
                    coverImage: postData.coverImage || postData.cover_image || null,
                    is_featured: postData.is_featured || false,
                    author: postData.author || 'Admin',
                    author_title: postData.author_title || 'Content Creator',
                    author_avatar: postData.author_avatar || 'AD',
                    meta_title: postData.meta_title || null,
                    meta_description: postData.meta_description || null,
                    keywords: postData.keywords || null,
                    imageAlt: postData.imageAlt || postData.image_alt || null,
                    readTime: postData.readTime || postData.read_time || 0,
                    canonical_url: postData.canonical_url || null,
                    seo_score: postData.seo_score || 0
                };
                
                // Check if post already exists by slug
                const existingPost = await db.getPostBySlug(cleanPostData.slug);
                if (existingPost) {
                    console.log(`⚠️  Skipping ${file} - post with slug "${cleanPostData.slug}" already exists`);
                    continue;
                }
                
                // Create the post in database
                const newPost = await db.createPost(cleanPostData);
                console.log(`✅ Migrated: ${file} -> Database ID: ${newPost.id} (${cleanPostData.title})`);
                migrated++;
                
            } catch (error) {
                console.error(`❌ Error migrating ${file}:`, error.message);
                errors++;
            }
        }
        
        console.log('\n📊 Migration Summary:');
        console.log(`   ✅ Successfully migrated: ${migrated} posts`);
        console.log(`   ❌ Errors: ${errors} posts`);
        console.log(`   📁 Total files processed: ${postFiles.length}`);
        
        if (migrated > 0) {
            console.log('\n🎉 Migration completed! You can now use the database-based blog system.');
            console.log('💡 Tip: You may want to backup the posts directory before deleting it.');
        }
        
    } catch (error) {
        console.error('💥 Migration failed:', error);
    } finally {
        db.close();
    }
}

// Helper function to generate slug from title
function generateSlug(title) {
    return title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '');
}

// Run migration if called directly
if (require.main === module) {
    migrateFilePostsToDatabase();
}

module.exports = { migrateFilePostsToDatabase };
