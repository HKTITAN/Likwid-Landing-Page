# Likwid Landing Page

A modern landing page with an integrated blog system for Likwid AI.

## Project Structure

```
Likwid Landing Page/
├── assets/                 # Static assets (images, icons)
├── blog/                   # Blog system (isolated)
│   ├── ai-service.js       # AI content generation service
│   ├── blog-dashboard.html # Blog management dashboard
│   ├── blog-editor.html    # Rich blog post editor
│   ├── blog-manager.js     # Blog management utilities
│   ├── blog-post.html      # Individual post template
│   ├── blog-posts.html     # Blog listing page
│   ├── blog-preview.html   # Post preview page
│   ├── blog.html           # Blog home page
│   ├── blog.db            # SQLite database
│   ├── database.js        # Database service
│   ├── keywords.csv       # AI keywords database
│   ├── migrate-posts.js   # Migration utility
│   └── post-storage.js    # Post storage service
├── index.html             # Main landing page
├── onboarding.html        # User onboarding page
├── script.js              # Main site JavaScript
├── style.css              # Main site styles
├── server.js              # Express backend server
└── package.json           # Node.js dependencies
```

## Features

### Landing Page
- Modern, responsive design
- Company information and services
- Contact forms and call-to-actions

### Blog System
- **Rich Text Editor**: EditorJS-powered blog editor
- **Database Storage**: SQLite database for persistence
- **AI Content Generation**: Automated blog post creation
- **Cover Images**: Auto-generated 1920x1080 cover images
- **Full CRUD**: Create, read, update, delete operations
- **Search**: Full-text search across all posts
- **Categories**: Organized content categorization

## Getting Started

### Prerequisites
- Node.js (v14 or higher)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd "Likwid Landing Page"
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
# or
node server.js
```

4. Open your browser:
- Landing Page: http://localhost:3001/
- Blog Dashboard: http://localhost:3001/blog/blog-dashboard.html
- Blog Editor: http://localhost:3001/blog/blog-editor.html

## Blog System Usage

### Dashboard Management
- Navigate to `/blog/blog-dashboard.html`
- View all posts, create new ones, edit existing posts
- Search and filter posts by status or category

### Creating Posts
- Click "New Post" from dashboard
- Use the rich text editor with live preview
- Generate AI-powered cover images
- Auto-save functionality keeps your work safe

### Editing Posts
- Access via dashboard or direct URL: `/blog/blog-editor.html?id=X`
- Full editing capabilities with real-time saving
- Cover image management (generate, upload, remove)

### Previewing Posts
- Preview URL: `/blog/blog-preview.html?id=X`
- Full post rendering with cover images
- Mobile-responsive design

## API Endpoints

### Blog API
- `GET /api/posts` - Get all posts
- `GET /api/posts/:id` - Get specific post
- `POST /api/posts` - Create new post
- `PUT /api/posts/:id` - Update post
- `DELETE /api/posts/:id` - Delete post
- `GET /api/posts/search?q=term` - Search posts

### AI API
- `POST /api/ai/generate-cover-image` - Generate cover image
- `POST /api/ai/regenerate-cover-image` - Regenerate cover image

## Database

The blog system uses SQLite for data persistence:
- Database file: `blog/blog.db`
- Automatic table creation on first run
- Full backup capability (single file)

## Development

### File Organization
- All blog-related files are contained in the `/blog` folder
- Landing page files remain in the root directory
- Clean separation of concerns

### Adding Features
- Blog features: Modify files in `/blog` folder
- Landing page features: Modify root files
- Server functionality: Update `server.js`

## Deployment

1. Ensure all dependencies are installed
2. Set environment variables if needed
3. Run `node server.js` on your server
4. Configure reverse proxy (nginx/Apache) if needed

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - See LICENSE file for details
