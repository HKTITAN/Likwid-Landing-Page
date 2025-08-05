# Blog CRUD Operations Test Suite

This test suite provides comprehensive testing for the blog system's Create, Read, Update, Delete (CRUD) operations as specified in task 7 of the blog system fix specification.

## Overview

The test suite validates the following workflows:
- **7.1 Post Creation Workflow**: Creating new posts and verifying they're saved to the database
- **7.2 Post Editing Workflow**: Editing existing posts and testing auto-save functionality  
- **7.3 Post Publishing Workflow**: Publishing posts and verifying they appear on the public blog
- **7.4 Post Deletion Workflow**: Deleting posts and confirming removal from database and listings

## Test Files

### 1. Web-based Test Interface
- **File**: `test-crud-operations.html`
- **Usage**: Open in browser at `http://localhost:3001/blog/test-crud-operations.html`
- **Features**: 
  - Interactive web interface
  - Real-time test execution
  - Visual test results
  - Detailed logging
  - Export test results

### 2. Command-line Test Runner
- **File**: `run-crud-tests.js`
- **Usage**: `node run-crud-tests.js`
- **Features**:
  - Automated test execution
  - Colored console output
  - Exit codes for CI/CD integration
  - Timeout handling

## Prerequisites

1. **Backend Server Running**: Ensure the Node.js server is running on port 3001
   ```bash
   node server.js
   ```

2. **Database Initialized**: The SQLite database should be properly initialized

3. **Dependencies**: For command-line runner, ensure `node-fetch` is available:
   ```bash
   npm install node-fetch
   ```

## Running Tests

### Web Interface Method

1. Start the backend server:
   ```bash
   node server.js
   ```

2. Open your browser and navigate to:
   ```
   http://localhost:3001/blog/test-crud-operations.html
   ```

3. Click "Run All Tests" or run individual test sections

### Command Line Method

1. Start the backend server:
   ```bash
   node server.js
   ```

2. Run the test suite:
   ```bash
   cd blog
   node run-crud-tests.js
   ```

3. For help:
   ```bash
   node run-crud-tests.js --help
   ```

## Test Scenarios

### 7.1 Post Creation Workflow
- ✅ Creates a new post through the API
- ✅ Verifies post is saved to database
- ✅ Confirms post appears in blog listing

### 7.2 Post Editing Workflow  
- ✅ Edits existing post content and metadata
- ✅ Verifies changes are saved to database
- ✅ Tests auto-save functionality (simulated)

### 7.3 Post Publishing Workflow
- ✅ Changes post status from draft to published
- ✅ Verifies published post appears on public blog endpoint
- ✅ Tests featured post functionality

### 7.4 Post Deletion Workflow
- ✅ Deletes post through the API
- ✅ Verifies post is removed from database (404 response)
- ✅ Confirms post no longer appears in listings

## Expected Results

All tests should pass if the CRUD operations are working correctly. The test suite will:

1. Create a test post with unique timestamp
2. Perform various operations on the test post
3. Verify each operation through database queries
4. Clean up by deleting the test post
5. Verify cleanup was successful

## Troubleshooting

### Common Issues

1. **Server Not Running**
   - Error: Connection refused or timeout
   - Solution: Start the backend server with `node server.js`

2. **Database Issues**
   - Error: Database connection or query failures
   - Solution: Check database file permissions and initialization

3. **API Endpoint Errors**
   - Error: 404 or 500 responses
   - Solution: Verify API routes are properly configured in server.js

4. **Test Post Not Found**
   - Error: Post creation succeeded but retrieval fails
   - Solution: Check database write permissions and API consistency

### Debug Mode

For detailed debugging, check the browser console (web interface) or enable verbose logging (command line).

## Integration with CI/CD

The command-line test runner returns appropriate exit codes:
- `0`: All tests passed
- `1`: Some tests failed or error occurred

Example CI/CD usage:
```bash
# Start server in background
node server.js &
SERVER_PID=$!

# Wait for server to start
sleep 2

# Run tests
cd blog
node run-crud-tests.js

# Store exit code
TEST_RESULT=$?

# Clean up
kill $SERVER_PID

# Exit with test result
exit $TEST_RESULT
```

## Requirements Verification

This test suite verifies the following requirements from the specification:

- **Requirement 4.1**: New post creation functionality
- **Requirement 4.2**: Post editing and auto-save
- **Requirement 4.3**: Post publishing workflow  
- **Requirement 4.4**: Post deletion functionality
- **Requirement 4.6**: Posts appear in blog listing
- **Requirement 7.2**: Posts removed from listings after deletion
- **Requirement 7.4**: Dashboard statistics accuracy
- **Requirement 8.2**: Auto-save functionality
- **Requirement 8.4**: Content persistence
- **Requirement 9.1**: Published posts on public blog
- **Requirement 9.2**: Featured post functionality

## Test Data

The test suite creates temporary test data with the following characteristics:
- Unique titles with timestamps
- Sample EditorJS content blocks
- Test metadata (categories, SEO fields)
- Draft and published status testing
- Featured post testing

All test data is cleaned up after test completion.