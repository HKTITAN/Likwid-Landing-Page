# Requirements Document

## Introduction

This specification addresses critical issues in the Likwid.AI blog system, including broken CRUD operations, duplicate files, incorrect API connections, and poor file organization. The goal is to create a fully functional, well-organized blog system with proper backend connectivity and AI-powered content generation.

## Requirements

### Requirement 1: Backend API Integration

**User Story:** As a blog administrator, I want the frontend to properly connect to the Node.js backend so that I can create, read, update, and delete blog posts reliably.

#### Acceptance Criteria

1. WHEN the blog frontend loads THEN it SHALL connect to the Node.js server at `http://localhost:3001/api` instead of the non-existent `blog-serverless.php`
2. WHEN I create a new blog post THEN the system SHALL save it to the SQLite database via the Node.js API
3. WHEN I update an existing post THEN the changes SHALL be persisted to the database immediately
4. WHEN I delete a post THEN it SHALL be removed from the database and no longer appear in the blog listing
5. WHEN I view the blog listing THEN it SHALL display all posts retrieved from the database
6. WHEN the backend server is not running THEN the frontend SHALL display appropriate error messages

### Requirement 2: File Organization and Cleanup

**User Story:** As a developer, I want all blog-related files organized in the `/blog` folder with no duplicates so that the codebase is clean and maintainable.

#### Acceptance Criteria

1. WHEN examining the project structure THEN all blog-related files SHALL be located only in the `/blog` directory
2. WHEN looking for duplicate files THEN there SHALL be no duplicate files between root and `/blog` directories
3. WHEN accessing blog functionality THEN all HTML files SHALL reference the correct file paths within the `/blog` directory
4. WHEN the system loads JavaScript modules THEN they SHALL be loaded from the `/blog` directory only
5. IF a file exists in both root and `/blog` directories THEN the root version SHALL be removed and only the `/blog` version SHALL remain

### Requirement 3: AI Service Configuration

**User Story:** As a content creator, I want the AI service to use the correct API key so that I can generate blog content, images, and SEO optimizations.

#### Acceptance Criteria

1. WHEN the AI service initializes THEN it SHALL use the provided Gemini API key `AIzaSyCwXQak1jfXrALC0Lb5Q4PHLPP_bFxBnfU`
2. WHEN I request AI content generation THEN the system SHALL successfully connect to Google's Gemini API
3. WHEN generating blog content THEN the AI SHALL create comprehensive posts with proper formatting
4. WHEN generating images THEN the AI SHALL create appropriate cover images for blog posts
5. WHEN the API key is invalid or expired THEN the system SHALL display clear error messages

### Requirement 4: Blog CRUD Operations

**User Story:** As a blog administrator, I want full CRUD (Create, Read, Update, Delete) functionality working properly so that I can manage blog content effectively.

#### Acceptance Criteria

1. WHEN I click "New Post" THEN a new draft post SHALL be created in the database with a unique ID
2. WHEN I edit a post title or content THEN the changes SHALL be auto-saved to the database
3. WHEN I publish a post THEN its status SHALL change to "published" and appear on the public blog
4. WHEN I delete a post THEN it SHALL be permanently removed from the database
5. WHEN I search for posts THEN the system SHALL return relevant results from the database
6. WHEN I filter posts by category or status THEN only matching posts SHALL be displayed

### Requirement 5: Database Integration

**User Story:** As a system administrator, I want the blog system to use SQLite database for reliable data persistence so that blog content is safely stored and retrievable.

#### Acceptance Criteria

1. WHEN the server starts THEN it SHALL initialize the SQLite database with proper table structure
2. WHEN posts are created THEN they SHALL be stored with all metadata including SEO fields, categories, and timestamps
3. WHEN the database is queried THEN it SHALL return properly formatted JSON responses
4. WHEN database operations fail THEN appropriate error handling SHALL prevent data corruption
5. WHEN migrating from localStorage THEN existing posts SHALL be preserved in the database

### Requirement 6: Frontend-Backend Communication

**User Story:** As a user of the blog system, I want seamless communication between frontend and backend so that all operations work smoothly without errors.

#### Acceptance Criteria

1. WHEN the frontend makes API requests THEN they SHALL use the correct Node.js endpoints (`/api/posts`, `/api/posts/:id`, etc.)
2. WHEN API responses are received THEN they SHALL be properly parsed and displayed in the UI
3. WHEN network errors occur THEN the system SHALL display user-friendly error messages
4. WHEN the server is unavailable THEN the frontend SHALL gracefully handle the offline state
5. WHEN authentication is required THEN the system SHALL properly manage session tokens

### Requirement 7: Blog Dashboard Functionality

**User Story:** As a blog administrator, I want a functional dashboard that displays blog statistics and allows easy content management so that I can efficiently oversee the blog system.

#### Acceptance Criteria

1. WHEN I access the dashboard THEN it SHALL display accurate statistics (total posts, published posts, drafts, SEO scores)
2. WHEN I view the posts list THEN it SHALL show all posts with their current status, category, and last updated date
3. WHEN I click on a post in the dashboard THEN it SHALL open the editor with that post loaded
4. WHEN I use the AI content generation feature THEN it SHALL create complete posts with title, content, SEO metadata, and images
5. WHEN dashboard data is stale THEN it SHALL refresh automatically or provide manual refresh options

### Requirement 8: Blog Editor Functionality

**User Story:** As a content creator, I want a fully functional blog editor with AI assistance so that I can create high-quality blog posts efficiently.

#### Acceptance Criteria

1. WHEN I open the blog editor THEN it SHALL load with a rich text editor (EditorJS) properly configured
2. WHEN I type content THEN it SHALL auto-save periodically to prevent data loss
3. WHEN I use AI features THEN they SHALL generate relevant content, SEO metadata, and images
4. WHEN I save a post THEN all content and metadata SHALL be persisted to the database
5. WHEN I preview a post THEN it SHALL display exactly as it will appear on the public blog

### Requirement 9: Public Blog Display

**User Story:** As a website visitor, I want to view published blog posts in an attractive, functional interface so that I can read the content easily.

#### Acceptance Criteria

1. WHEN I visit the blog page THEN it SHALL display all published posts retrieved from the database
2. WHEN I click on a post THEN it SHALL open the full post content with proper formatting
3. WHEN I filter posts by category THEN only posts in that category SHALL be displayed
4. WHEN posts have featured images THEN they SHALL be displayed properly
5. WHEN no posts are available THEN an appropriate message SHALL be shown

### Requirement 10: Error Handling and Resilience

**User Story:** As a user of the blog system, I want proper error handling so that I understand what's happening when things go wrong and can take appropriate action.

#### Acceptance Criteria

1. WHEN database operations fail THEN specific error messages SHALL be logged and user-friendly messages displayed
2. WHEN API requests fail THEN the system SHALL retry automatically or prompt for manual retry
3. WHEN the AI service is unavailable THEN alternative content creation methods SHALL remain available
4. WHEN file operations fail THEN data integrity SHALL be maintained and errors reported clearly
5. WHEN the system encounters unexpected errors THEN it SHALL fail gracefully without corrupting data