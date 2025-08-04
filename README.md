# Likwid Blog System

A comprehensive blog management system with AI-powered content generation, backend storage, and modern editing interface.

## Features

- ✅ **Backend Storage**: Posts stored in backend with full CRUD operations
- ✅ **Modern Editor**: Rich text editor with blocks, lists, headers, and more
- ✅ **AI Content Generation**: Complete blog posts with SEO optimization
- ✅ **Post Management**: Create, edit, delete, and duplicate posts
- ✅ **Image Generation**: AI-powered featured image creation
- ✅ **SEO Optimization**: Meta titles, descriptions, keywords, and analytics
- ✅ **Bulk Operations**: Select and delete multiple posts
- ✅ **Search & Filters**: Find posts by title, category, or status
- ✅ **Auto-save**: Automatic saving every 30 seconds
- ✅ **Dashboard**: Overview of all posts with statistics

## Quick Start

### 1. Setup (Windows)
```bash
# Run the setup script
setup.bat
```

### 2. Manual Setup
```bash
# Install dependencies
npm install

# Start the backend server
npm start
```

### 3. Open the Blog System
- Backend server: http://localhost:3001
- Posts dashboard: Open `blog-posts.html` in your browser
- Create new post: Open `blog-editor.html` in your browser

## File Structure

```
├── server.js              # Backend Express server
├── package.json           # Node.js dependencies
├── post-storage.js        # Frontend storage service
├── ai-service.js          # AI content generation
├── blog-editor.html       # Rich text blog editor
├── blog-posts.html        # Posts dashboard
├── posts/                 # Backend storage directory (auto-created)
└── README.md              # This file
```

## API Endpoints

The backend server provides these REST API endpoints:

### Posts
- `GET /api/posts` - List all posts
- `GET /api/posts/:id` - Get single post
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update existing post
- `DELETE /api/posts/:id` - Delete post

### Search & Bulk Operations
- `GET /api/posts/search?q=query&category=tech&status=draft` - Search posts
- `POST /api/posts/bulk-delete` - Delete multiple posts

### System
- `GET /api/health` - Backend health check

## Using the System

### Creating a New Post

1. **Open the Editor**
   ```
   Open blog-editor.html in your browser
   ```

2. **AI Content Generation**
   - Enter a topic in the AI generation section
   - Click "Generate Complete Content"
   - AI will create title, content, keywords, SEO, and featured image

3. **Manual Creation**
   - Fill in title, content, and metadata manually
   - Use the rich text editor for formatting
   - Add featured images and SEO data

4. **Save & Publish**
   - Save as draft or publish immediately
   - Auto-save runs every 30 seconds

### Managing Posts

1. **View All Posts**
   ```
   Open blog-posts.html in your browser
   ```

2. **Search & Filter**
   - Search by title, excerpt, or content
   - Filter by category or status
   - View statistics and analytics

3. **Bulk Operations**
   - Select multiple posts
   - Delete in bulk
   - Export/import functionality

### Editing Existing Posts

1. **From Posts Dashboard**
   - Click "Edit" on any post card
   - Opens editor with all post data loaded

2. **Direct URL**
   ```
   blog-editor.html?edit=POST_ID
   ```

3. **Auto-save**
   - Changes saved automatically
   - Manual save with Ctrl+S

## AI Features

### Complete Content Generation
Enter a simple topic and AI will generate:
- Refined topic and content strategy
- Strategic keywords from CSV database
- Complete blog post with proper structure
- SEO metadata (title, description, slug)
- Featured image with alt text
- Content improvement suggestions

### Progressive Prompting
The AI uses a 6-step process:
1. **Prompt Refinement** - Enhances user input
2. **Strategic Keywords** - Generates targeted keywords
3. **Enhanced Blog Post** - Creates comprehensive content
4. **SEO Optimization** - Optimizes for search engines
5. **Image Generation** - Creates relevant featured image
6. **Content Suggestions** - Provides improvement recommendations

## Storage

### Backend Storage
- Posts stored as JSON files in `posts/` directory
- Automatic ID generation and timestamps
- Full post history and metadata
- Safe concurrent access

### Data Format
```json
{
  "id": "post_1234567890_abc123",
  "title": "Post Title",
  "content": {...},
  "status": "draft|published|archived",
  "category": "Technology",
  "excerpt": "Brief summary...",
  "featuredImage": "image_url",
  "author": "Author Name",
  "keywords": "keyword1, keyword2",
  "meta_title": "SEO Title",
  "meta_description": "SEO Description",
  "slug": "url-friendly-slug",
  "createdAt": "2025-01-01T00:00:00.000Z",
  "updatedAt": "2025-01-01T00:00:00.000Z",
  "readTime": 5
}
```

## Troubleshooting

### Backend Not Starting
```bash
# Check Node.js version (requires 14+)
node --version

# Install dependencies
npm install

# Start server manually
node server.js
```

### Posts Not Loading
1. Ensure backend server is running on port 3001
2. Check browser console for errors
3. Verify `post-storage.js` is loaded

### AI Features Not Working
1. Check Gemini API key in `ai-service.js`
2. Verify internet connection
3. Check browser console for API errors

### Port Already in Use
```bash
# Kill process on port 3001
netstat -ano | findstr :3001
taskkill /PID <PID_NUMBER> /F

# Or change port in server.js
```

## Development

### Adding New Features
1. Backend API: Modify `server.js`
2. Frontend Storage: Update `post-storage.js`
3. UI: Modify `blog-editor.html` or `blog-posts.html`
4. AI: Enhance `ai-service.js`

### Testing
- Test backend: `curl http://localhost:3001/api/health`
- Test storage: Use browser developer tools
- Test AI: Use test pages in project

## Contributing

1. Fork the repository
2. Create feature branch: `git checkout -b feature-name`
3. Commit changes: `git commit -am 'Add feature'`
4. Push to branch: `git push origin feature-name`
5. Submit pull request

## License

MIT License - see LICENSE file for details.

## Support

For issues and questions:
1. Check this README
2. Review browser console errors
3. Check server logs
4. Create issue in repository
