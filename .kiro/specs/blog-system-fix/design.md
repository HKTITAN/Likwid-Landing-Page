# Design Document

## Overview

This design document outlines the architecture and implementation approach for fixing the Likwid.AI blog system. The solution focuses on establishing proper backend connectivity, organizing files correctly, implementing reliable CRUD operations, and ensuring seamless AI integration.

## Architecture

### System Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend      │    │   Backend       │    │   External      │
│   (Browser)     │    │   (Node.js)     │    │   Services      │
├─────────────────┤    ├─────────────────┤    ├─────────────────┤
│ • Blog Dashboard│◄──►│ • Express Server│◄──►│ • Gemini AI API │
│ • Blog Editor   │    │ • SQLite DB     │    │ • File Storage  │
│ • Public Blog   │    │ • API Routes    │    │                 │
│ • AI Integration│    │ • Error Handling│    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

### File Organization Structure

```
/blog/
├── blog.html              # Public blog listing
├── blog-post.html         # Individual post view
├── blog-dashboard.html    # Admin dashboard
├── blog-editor.html       # Post editor
├── blog-manager.js        # Client-side blog management
├── ai-service.js          # AI integration service
├── post-storage.js        # Backend communication
├── database.js            # Database service (server-side)
├── keywords.csv           # SEO keywords database
├── blog.db               # SQLite database file
└── migrate-posts.js      # Migration utility
```

## Components and Interfaces

### 1. Backend API Service (Node.js)

**Purpose:** Provide RESTful API endpoints for blog operations

**Key Components:**
- Express.js server with CORS enabled
- SQLite database integration
- Comprehensive error handling
- API endpoint validation

**API Endpoints:**
```
GET    /api/posts              # Get all posts
GET    /api/posts/published    # Get published posts only
GET    /api/posts/featured     # Get featured posts
GET    /api/posts/:id          # Get single post by ID
GET    /api/posts/slug/:slug   # Get post by slug
POST   /api/posts              # Create new post
PUT    /api/posts/:id          # Update existing post
DELETE /api/posts/:id          # Delete post
GET    /api/posts/search?q=    # Search posts
GET    /api/health             # Health check
```

### 2. Database Service

**Purpose:** Handle all database operations with proper error handling

**Schema Design:**
```sql
CREATE TABLE posts (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    title TEXT NOT NULL,
    slug TEXT UNIQUE NOT NULL,
    content TEXT,                    -- JSON string of EditorJS content
    excerpt TEXT,
    status TEXT DEFAULT 'draft',     -- 'draft' | 'published'
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
);
```

### 3. Frontend Communication Layer

**Purpose:** Handle all frontend-backend communication with proper error handling

**Key Features:**
- Centralized API communication
- Request/response caching
- Automatic retry logic
- Error state management
- Loading state indicators

**PostStorageService Interface:**
```javascript
class PostStorageService {
    async getAllPosts()
    async getPost(postId)
    async createPost(postData)
    async updatePost(postId, updates)
    async deletePost(postId)
    async savePost(postData)        // Auto-detect create vs update
    async searchPosts(query, filters)
    setupAutoSave(callback, interval)
    stopAutoSave()
}
```

### 4. AI Service Integration

**Purpose:** Provide AI-powered content generation and optimization

**Configuration:**
- Use provided Gemini API key: `AIzaSyCwXQak1jfXrALC0Lb5Q4PHLPP_bFxBnfU`
- Implement proper error handling for API failures
- Support multiple AI operations (content, images, SEO)

**AI Service Interface:**
```javascript
class AIService {
    async generateCompleteContent(userInput)
    async generateImage(prompt)
    async generateSEOMetadata(content)
    async optimizeContent(content)
    async analyzeKeywords(content)
}
```

### 5. Blog Dashboard

**Purpose:** Provide administrative interface for blog management

**Key Features:**
- Real-time statistics display
- Post management table
- AI content generation interface
- Bulk operations support
- Search and filtering

**Dashboard Components:**
- Statistics cards (total posts, published, drafts, SEO scores)
- AI content suggestion interface
- Posts database table with actions
- Quick actions toolbar

### 6. Blog Editor

**Purpose:** Rich text editor with AI assistance for content creation

**Editor Features:**
- EditorJS integration with multiple block types
- Real-time auto-save functionality
- AI-powered content generation
- SEO metadata management
- Image upload and generation
- Preview functionality

**Editor Components:**
- Main content editor (EditorJS)
- Sidebar with metadata fields
- AI assistance panel
- Image management section
- SEO optimization tools

### 7. Public Blog Interface

**Purpose:** Display published blog posts to website visitors

**Features:**
- Responsive blog listing
- Category filtering
- Search functionality
- Individual post display
- SEO-optimized markup

## Data Models

### Post Model
```javascript
{
    id: number,
    title: string,
    slug: string,
    content: EditorJSContent,
    excerpt: string,
    status: 'draft' | 'published',
    category: string,
    featured_image: string | null,
    cover_image: string | null,
    is_featured: boolean,
    author: string,
    author_title: string,
    author_avatar: string,
    meta_title: string | null,
    meta_description: string | null,
    keywords: string | null,
    image_alt: string | null,
    read_time: number,
    canonical_url: string | null,
    seo_score: number,
    created_at: string,
    updated_at: string
}
```

### AI Content Response Model
```javascript
{
    originalInput: string,
    refinedBrief: ContentBrief,
    blogPost: {
        title: string,
        content: EditorJSContent,
        excerpt: string,
        meta_title: string,
        meta_description: string,
        keywords: string,
        featuredImage: string,
        imageAlt: string,
        estimatedReadTime: number
    },
    seoAnalysis: SEOScore,
    keywordStrategy: KeywordStrategy,
    imageData: ImageData,
    generatedAt: string
}
```

## Error Handling

### Error Categories and Responses

1. **Network Errors**
   - Connection timeouts
   - Server unavailable
   - DNS resolution failures
   - Response: User-friendly messages with retry options

2. **API Errors**
   - 400 Bad Request: Validation errors
   - 404 Not Found: Resource not found
   - 500 Server Error: Internal server issues
   - Response: Specific error messages with suggested actions

3. **Database Errors**
   - Connection failures
   - Constraint violations
   - Data corruption
   - Response: Graceful degradation with data preservation

4. **AI Service Errors**
   - API key issues
   - Rate limiting
   - Content policy violations
   - Response: Fallback to manual content creation

### Error Handling Strategy

```javascript
// Centralized error handling
class ErrorHandler {
    static handleAPIError(error, context) {
        // Log error details
        console.error(`API Error in ${context}:`, error);
        
        // Determine user-friendly message
        const userMessage = this.getUserMessage(error);
        
        // Show notification to user
        this.showNotification(userMessage, 'error');
        
        // Attempt recovery if possible
        this.attemptRecovery(error, context);
    }
    
    static attemptRecovery(error, context) {
        // Implement retry logic, fallbacks, etc.
    }
}
```

## Testing Strategy

### Unit Testing
- Database operations (CRUD functions)
- API endpoint responses
- AI service integration
- Error handling functions

### Integration Testing
- Frontend-backend communication
- Database connectivity
- AI API integration
- File upload/download operations

### End-to-End Testing
- Complete blog post creation workflow
- Dashboard functionality
- Public blog display
- Search and filtering operations

### Performance Testing
- Database query optimization
- API response times
- Large content handling
- Concurrent user scenarios

## Security Considerations

### API Security
- Input validation and sanitization
- SQL injection prevention
- XSS protection
- Rate limiting implementation

### Data Protection
- Secure API key storage
- Database access controls
- File upload restrictions
- Content sanitization

### Authentication
- Admin dashboard access control
- Session management
- CSRF protection
- Secure password handling

## Deployment Strategy

### Development Environment
1. Start Node.js server: `npm start`
2. Initialize database: Auto-created on first run
3. Access dashboard: `http://localhost:3001/blog/blog-dashboard.html`
4. Access public blog: `http://localhost:3001/blog/blog.html`

### File Migration Process
1. Identify duplicate files
2. Compare versions and keep most recent
3. Update all file references
4. Remove duplicate files
5. Test all functionality

### Database Migration
1. Run migration script for existing localStorage data
2. Verify data integrity
3. Update frontend to use database endpoints
4. Test CRUD operations

## Monitoring and Maintenance

### Logging Strategy
- API request/response logging
- Database operation logging
- Error tracking and alerting
- Performance metrics collection

### Maintenance Tasks
- Database optimization
- Log file rotation
- API key rotation
- Security updates

### Backup Strategy
- Regular database backups
- Configuration file backups
- Content export functionality
- Disaster recovery procedures