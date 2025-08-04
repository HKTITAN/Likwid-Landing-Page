/**
 * Blog Data Manager - Client-side storage simulation
 * Uses localStorage to simulate serverless backend
 */

class BlogManager {
    constructor() {
        this.storageKeys = {
            posts: 'likwid_blog_posts',
            config: 'likwid_blog_config',
            auth: 'likwid_blog_auth'
        };
        this.initializeData();
    }

    // Initialize default data
    initializeData() {
        if (!localStorage.getItem(this.storageKeys.config)) {
            const defaultConfig = {
                admin_password: 'admin123',
                site_title: 'Likwid.AI Blog',
                site_description: 'Manufacturing Intelligence Hub',
                created_at: new Date().toISOString()
            };
            localStorage.setItem(this.storageKeys.config, JSON.stringify(defaultConfig));
        }

        if (!localStorage.getItem(this.storageKeys.posts)) {
            const defaultPosts = [
                {
                    id: 1,
                    title: 'The Future of Manufacturing: How AI is Reshaping Industry 4.0',
                    slug: 'future-manufacturing-ai-industry-4-0',
                    excerpt: 'Explore how artificial intelligence is transforming manufacturing processes, from predictive maintenance to intelligent supply chain optimization.',
                    content: '{"blocks":[{"type":"header","data":{"text":"The Future of Manufacturing","level":1}},{"type":"paragraph","data":{"text":"Artificial Intelligence is revolutionizing the manufacturing industry at an unprecedented pace."}},{"type":"list","data":{"style":"unordered","items":["Predictive Maintenance","Quality Control","Supply Chain Optimization","Intelligent Automation"]}}]}',
                    category: 'ai',
                    status: 'published',
                    author_name: 'AI Team',
                    author_title: 'Technology Experts',
                    author_avatar: 'AT',
                    featured_image: '',
                    is_featured: 1,
                    read_time: 8,
                    meta_title: 'AI in Manufacturing: Industry 4.0 Revolution',
                    meta_description: 'Discover how AI is transforming manufacturing with predictive maintenance, quality control, and supply chain optimization.',
                    keywords: 'AI manufacturing, Industry 4.0, predictive maintenance, smart factory',
                    canonical_url: 'https://likwidai.com/blog/future-manufacturing-ai-industry-4-0',
                    alt_text: 'AI-powered manufacturing facility',
                    created_at: new Date(Date.now() - 86400000).toISOString(),
                    updated_at: new Date(Date.now() - 86400000).toISOString()
                }
            ];
            localStorage.setItem(this.storageKeys.posts, JSON.stringify(defaultPosts));
        }
    }

    // Authentication
    async login(password) {
        const config = this.getConfig();
        if (password === config.admin_password) {
            const token = 'token_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
            localStorage.setItem(this.storageKeys.auth, JSON.stringify({
                token: token,
                expires: Date.now() + (24 * 60 * 60 * 1000) // 24 hours
            }));
            return { success: true, token: token };
        }
        return { success: false, message: 'Invalid password' };
    }

    isAuthenticated() {
        const auth = localStorage.getItem(this.storageKeys.auth);
        if (!auth) return false;
        
        const authData = JSON.parse(auth);
        return Date.now() < authData.expires;
    }

    logout() {
        localStorage.removeItem(this.storageKeys.auth);
    }

    // Configuration
    getConfig() {
        return JSON.parse(localStorage.getItem(this.storageKeys.config) || '{}');
    }

    updateConfig(newConfig) {
        const config = this.getConfig();
        const updatedConfig = { ...config, ...newConfig };
        localStorage.setItem(this.storageKeys.config, JSON.stringify(updatedConfig));
        return updatedConfig;
    }

    // Posts management
    getPosts(options = {}) {
        const posts = JSON.parse(localStorage.getItem(this.storageKeys.posts) || '[]');
        let filteredPosts = [...posts];

        // Filter by category
        if (options.category && options.category !== 'all') {
            filteredPosts = filteredPosts.filter(post => post.category === options.category);
        }

        // Filter by status (only show published if not admin)
        if (options.published_only) {
            filteredPosts = filteredPosts.filter(post => post.status === 'published');
        }

        // Sort by date (newest first)
        filteredPosts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));

        // Limit results
        if (options.limit) {
            filteredPosts = filteredPosts.slice(0, options.limit);
        }

        return filteredPosts;
    }

    getPost(id) {
        const posts = this.getPosts();
        return posts.find(post => post.id == id) || null;
    }

    createPost(postData) {
        const posts = this.getPosts();
        const newId = Math.max(...posts.map(p => p.id), 0) + 1;
        
        const newPost = {
            id: newId,
            ...postData,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
        };

        posts.push(newPost);
        localStorage.setItem(this.storageKeys.posts, JSON.stringify(posts));
        return newPost;
    }

    updatePost(id, postData) {
        const posts = this.getPosts();
        const index = posts.findIndex(post => post.id == id);
        
        if (index === -1) {
            throw new Error('Post not found');
        }

        posts[index] = {
            ...posts[index],
            ...postData,
            updated_at: new Date().toISOString()
        };

        localStorage.setItem(this.storageKeys.posts, JSON.stringify(posts));
        return posts[index];
    }

    deletePost(id) {
        const posts = this.getPosts();
        const filteredPosts = posts.filter(post => post.id != id);
        
        if (filteredPosts.length === posts.length) {
            throw new Error('Post not found');
        }

        localStorage.setItem(this.storageKeys.posts, JSON.stringify(filteredPosts));
        return { success: true };
    }

    // Enhanced AI Content Generation
    async generateAIContent(type, context = {}) {
        // Simulate AI API call delay
        await new Promise(resolve => setTimeout(resolve, 1500 + Math.random() * 1000));

        // Handle field-specific AI operations for Notion-like interface
        if (type.startsWith('analyze_')) {
            return this.analyzeField(type.replace('analyze_', ''), context);
        }
        if (type.startsWith('generate_')) {
            return this.generateFieldContent(type.replace('generate_', ''), context);
        }
        if (type.startsWith('expand_')) {
            return this.expandFieldContent(type.replace('expand_', ''), context);
        }
        if (type.startsWith('optimize_')) {
            return this.optimizeFieldContent(type.replace('optimize_', ''), context);
        }

        const aiResponses = {
            seo: {
                meta_title: `${context.title} | Manufacturing Intelligence Hub`,
                meta_description: `${context.excerpt?.substring(0, 140)}...`,
                keywords: this.generateKeywords(context.title, context.category),
                alt_text: `${context.category} related image for ${context.title}`,
                readability_score: Math.floor(Math.random() * 30) + 70,
                seo_suggestions: this.generateSEOSuggestions(context)
            },
            improve: this.generateImprovementSuggestions(context),
            continue: this.generateContinuationSuggestions(context),
            summarize: this.generateSummarySuggestions(context),
            expand: this.generateExpansionSuggestions(context),
            grammar: this.generateGrammarSuggestions(context),
            tone: this.generateToneSuggestions(context),
            structure: this.generateStructureSuggestions(context)
        };

        return aiResponses[type] || [];
    }

    // Field-specific AI analysis for Notion-like database fields
    analyzeField(fieldName, context) {
        const allContent = context.allContent || {};
        
        switch(fieldName) {
            case 'title':
                return this.analyzeTitleField(context.title, allContent);
            case 'excerpt':
                return this.analyzeExcerptField(context.excerpt, allContent);
            case 'meta_title':
                return this.analyzeMetaTitleField(context.meta_title, allContent);
            case 'meta_description':
                return this.analyzeMetaDescriptionField(context.meta_description, allContent);
            case 'keywords':
                return this.analyzeKeywordsField(context.keywords, allContent);
            case 'alt_text':
                return this.analyzeAltTextField(context.alt_text, allContent);
            default:
                return [];
        }
    }

    // Generate content for empty fields
    generateFieldContent(fieldName, context) {
        const allContent = context.allContent || {};
        
        switch(fieldName) {
            case 'title':
                return this.generateTitleSuggestions(allContent);
            case 'excerpt':
                return this.generateExcerptSuggestions(allContent);
            case 'meta_title':
                return this.generateMetaTitleSuggestions(allContent);
            case 'meta_description':
                return this.generateMetaDescriptionSuggestions(allContent);
            case 'keywords':
                return this.generateKeywordsSuggestions(allContent);
            case 'alt_text':
                return this.generateAltTextSuggestions(allContent);
            default:
                return [];
        }
    }

    // Expand existing field content
    expandFieldContent(fieldName, context) {
        const currentValue = context[fieldName];
        const allContent = context.allContent || {};
        
        switch(fieldName) {
            case 'excerpt':
                return this.expandExcerpt(currentValue, allContent);
            case 'meta_description':
                return this.expandMetaDescription(currentValue, allContent);
            case 'keywords':
                return this.expandKeywords(currentValue, allContent);
            default:
                return [];
        }
    }

    // Optimize existing field content
    optimizeFieldContent(fieldName, context) {
        const currentValue = context[fieldName];
        const allContent = context.allContent || {};
        
        switch(fieldName) {
            case 'title':
                return this.optimizeTitle(currentValue, allContent);
            case 'meta_title':
                return this.optimizeMetaTitle(currentValue, allContent);
            case 'meta_description':
                return this.optimizeMetaDescription(currentValue, allContent);
            case 'keywords':
                return this.optimizeKeywords(currentValue, allContent);
            default:
                return [];
        }
    }

    generateSEOSuggestions(context) {
        const suggestions = [];
        
        if (context.title && context.title.length < 30) {
            suggestions.push("Title is too short. Consider expanding to 50-60 characters for better SEO.");
        }
        if (context.title && context.title.length > 60) {
            suggestions.push("Title is too long. Consider shortening to under 60 characters.");
        }
        if (!context.content || context.content.length < 300) {
            suggestions.push("Content is too short. Aim for at least 300 words for better SEO ranking.");
        }
        if (context.category === 'ai') {
            suggestions.push("Include terms like 'machine learning', 'automation', or 'artificial intelligence' for better AI content ranking.");
        }
        
        return suggestions;
    }

    generateImprovementSuggestions(context) {
        return [
            {
                type: 'data',
                suggestion: "Add specific statistics and data points to support your claims",
                implementation: "Research and include relevant industry statistics, percentages, or numerical data",
                autoApply: false
            },
            {
                type: 'expert',
                suggestion: "Include expert quotes or testimonials",
                implementation: "Add quotes from industry leaders or customer testimonials to build credibility",
                autoApply: false
            },
            {
                type: 'examples',
                suggestion: "Provide concrete examples and case studies",
                implementation: "Include real-world examples of companies successfully implementing these strategies",
                autoApply: false
            },
            {
                type: 'actionable',
                suggestion: "Add actionable takeaways for readers",
                implementation: "Create a bulleted list of specific steps readers can take immediately",
                autoApply: true,
                content: `\n\n## Key Takeaways\n\n- ${context.title ? 'Apply the concepts discussed in ' + context.title.toLowerCase() : 'Implement the strategies outlined above'}\n- Monitor progress and adjust based on results\n- Consider consulting with experts for complex implementations\n- Start with small pilot projects before full-scale deployment`
            }
        ];
    }

    generateContinuationSuggestions(context) {
        return [
            {
                type: 'implementation',
                suggestion: "Discuss implementation strategies and best practices",
                implementation: "Add a section covering step-by-step implementation guidelines",
                autoApply: true,
                content: `\n\n## Implementation Strategy\n\nTo successfully implement these concepts:\n\n1. **Assessment Phase**: Evaluate your current systems and processes\n2. **Planning Phase**: Develop a detailed implementation roadmap\n3. **Pilot Phase**: Start with a small-scale test implementation\n4. **Scaling Phase**: Gradually expand to full deployment\n5. **Optimization Phase**: Continuously monitor and improve`
            },
            {
                type: 'challenges',
                suggestion: "Address common challenges and solutions",
                implementation: "Include a troubleshooting section with common obstacles and how to overcome them",
                autoApply: true,
                content: `\n\n## Common Challenges & Solutions\n\n**Challenge**: Resistance to change\n**Solution**: Provide comprehensive training and communicate benefits clearly\n\n**Challenge**: Technical integration issues\n**Solution**: Work with experienced vendors and conduct thorough testing\n\n**Challenge**: Budget constraints\n**Solution**: Implement in phases and demonstrate ROI at each stage`
            },
            {
                type: 'future',
                suggestion: "Explore future trends and implications",
                implementation: "Add a forward-looking section discussing where this technology is heading",
                autoApply: false
            }
        ];
    }

    generateSummarySuggestions(context) {
        return [
            {
                type: 'keypoints',
                suggestion: "Create bullet points of key findings",
                implementation: "Add a 'Key Takeaways' section with 3-5 main points",
                autoApply: true,
                content: `\n\n## Summary\n\n${context.title ? 'This article on ' + context.title.toLowerCase() + ' covers:' : 'Key points covered:'}\n\n- Core concepts and their practical applications\n- Benefits and potential challenges\n- Implementation strategies and best practices\n- Future outlook and recommendations`
            },
            {
                type: 'tldr',
                suggestion: "Add a TL;DR (Too Long; Didn't Read) summary",
                implementation: "Include a brief 2-3 sentence summary at the beginning or end",
                autoApply: true,
                content: `\n\n## TL;DR\n\n${context.excerpt || 'This comprehensive guide provides actionable insights and practical strategies for implementation. Focus on gradual adoption, proper planning, and continuous optimization for best results.'}`
            }
        ];
    }

    generateExpansionSuggestions(context) {
        return [
            {
                type: 'details',
                suggestion: "Add more detailed technical explanations",
                implementation: "Expand technical concepts with diagrams, examples, and deeper explanations",
                autoApply: false
            },
            {
                type: 'practical',
                suggestion: "Expand on practical applications",
                implementation: "Include more real-world use cases and application scenarios",
                autoApply: true,
                content: `\n\n## Practical Applications\n\nReal-world applications include:\n\n- **Small Businesses**: Cost-effective solutions for process optimization\n- **Enterprise**: Large-scale implementations with advanced analytics\n- **Manufacturing**: Production line efficiency and quality control\n- **Service Industries**: Customer experience enhancement and operational efficiency`
            }
        ];
    }

    generateGrammarSuggestions(context) {
        return [
            {
                type: 'passive',
                suggestion: "Reduce passive voice usage",
                implementation: "Convert passive sentences to active voice for better engagement",
                autoApply: false
            },
            {
                type: 'transitions',
                suggestion: "Improve paragraph transitions",
                implementation: "Add transitional phrases to create better flow between ideas",
                autoApply: false
            }
        ];
    }

    generateToneSuggestions(context) {
        return [
            {
                type: 'professional',
                suggestion: "Maintain professional yet approachable tone",
                implementation: "Use industry terminology while remaining accessible to broader audience",
                autoApply: false
            },
            {
                type: 'engagement',
                suggestion: "Increase reader engagement",
                implementation: "Add rhetorical questions or direct addresses to the reader",
                autoApply: true,
                content: `\n\n## Questions to Consider\n\n- How might these strategies apply to your specific situation?\n- What challenges do you anticipate in implementation?\n- Which aspects are most relevant to your current goals?`
            }
        ];
    }

    generateStructureSuggestions(context) {
        return [
            {
                type: 'intro',
                suggestion: "Strengthen introduction hook",
                implementation: "Start with a compelling statistic, question, or scenario",
                autoApply: false
            },
            {
                type: 'conclusion',
                suggestion: "Add stronger conclusion with call-to-action",
                implementation: "End with clear next steps or invitation for reader engagement",
                autoApply: true,
                content: `\n\n## Next Steps\n\nReady to move forward? Consider these actions:\n\n1. Assess your current situation and identify opportunities\n2. Research vendors and solutions that fit your needs\n3. Develop a pilot program to test implementation\n4. Connect with industry experts for guidance\n\n*Have questions or want to share your experience? Reach out to our team for personalized advice.*`
            }
        ];
    }

    generateKeywords(title, category) {
        const keywordSets = {
            manufacturing: ['manufacturing', 'industry 4.0', 'automation', 'production', 'factory'],
            ai: ['artificial intelligence', 'machine learning', 'AI technology', 'smart systems', 'automation'],
            trends: ['industry trends', 'future technology', 'innovation', 'digital transformation', 'emerging tech']
        };

        const baseKeywords = keywordSets[category] || ['technology', 'innovation'];
        const titleWords = title.toLowerCase().split(' ').filter(word => word.length > 3);
        
        return [...baseKeywords.slice(0, 3), ...titleWords.slice(0, 2)].join(', ');
    }

    // Export/Import functionality
    exportData() {
        return {
            posts: this.getPosts(),
            config: this.getConfig(),
            exported_at: new Date().toISOString()
        };
    }

    importData(data) {
        if (data.posts) {
            localStorage.setItem(this.storageKeys.posts, JSON.stringify(data.posts));
        }
        if (data.config) {
            localStorage.setItem(this.storageKeys.config, JSON.stringify(data.config));
        }
    }

    // Clear all data (for testing)
    clearAllData() {
        Object.values(this.storageKeys).forEach(key => {
            localStorage.removeItem(key);
        });
        this.initializeData();
    }

    // Field-specific analysis methods for Notion-like interface

    analyzeTitleField(title, allContent) {
        const suggestions = [];
        if (!title || title.trim() === '') {
            suggestions.push({
                type: 'missing',
                message: 'Title is required for SEO and user engagement',
                action: 'generate_title',
                priority: 'high'
            });
        } else {
            if (title.length < 30) {
                suggestions.push({
                    type: 'length',
                    message: 'Title is too short. Optimal length is 50-60 characters',
                    action: 'expand_title',
                    priority: 'medium'
                });
            }
            if (title.length > 60) {
                suggestions.push({
                    type: 'length',
                    message: 'Title is too long. May be truncated in search results',
                    action: 'optimize_title',
                    priority: 'medium'
                });
            }
            if (!/\?|!|:/.test(title)) {
                suggestions.push({
                    type: 'engagement',
                    message: 'Consider adding punctuation for better engagement',
                    action: 'optimize_title',
                    priority: 'low'
                });
            }
        }
        return suggestions;
    }

    analyzeExcerptField(excerpt, allContent) {
        const suggestions = [];
        if (!excerpt || excerpt.trim() === '') {
            suggestions.push({
                type: 'missing',
                message: 'Excerpt helps with social sharing and SEO snippets',
                action: 'generate_excerpt',
                priority: 'medium'
            });
        } else {
            if (excerpt.length < 100) {
                suggestions.push({
                    type: 'length',
                    message: 'Excerpt could be more descriptive (aim for 120-150 characters)',
                    action: 'expand_excerpt',
                    priority: 'low'
                });
            }
            if (excerpt.length > 160) {
                suggestions.push({
                    type: 'length',
                    message: 'Excerpt is too long for meta descriptions',
                    action: 'optimize_excerpt',
                    priority: 'medium'
                });
            }
        }
        return suggestions;
    }

    analyzeMetaTitleField(metaTitle, allContent) {
        const suggestions = [];
        if (!metaTitle || metaTitle.trim() === '') {
            suggestions.push({
                type: 'missing',
                message: 'Meta title is crucial for search engine rankings',
                action: 'generate_meta_title',
                priority: 'high'
            });
        } else {
            if (metaTitle.length > 60) {
                suggestions.push({
                    type: 'length',
                    message: 'Meta title may be truncated in search results',
                    action: 'optimize_meta_title',
                    priority: 'high'
                });
            }
            if (!metaTitle.includes('|') && !metaTitle.includes('-')) {
                suggestions.push({
                    type: 'branding',
                    message: 'Consider adding brand name to meta title',
                    action: 'optimize_meta_title',
                    priority: 'low'
                });
            }
        }
        return suggestions;
    }

    analyzeMetaDescriptionField(metaDescription, allContent) {
        const suggestions = [];
        if (!metaDescription || metaDescription.trim() === '') {
            suggestions.push({
                type: 'missing',
                message: 'Meta description improves click-through rates from search',
                action: 'generate_meta_description',
                priority: 'high'
            });
        } else {
            if (metaDescription.length < 120) {
                suggestions.push({
                    type: 'length',
                    message: 'Meta description could be more detailed (aim for 150-160 characters)',
                    action: 'expand_meta_description',
                    priority: 'medium'
                });
            }
            if (metaDescription.length > 160) {
                suggestions.push({
                    type: 'length',
                    message: 'Meta description is too long and will be truncated',
                    action: 'optimize_meta_description',
                    priority: 'high'
                });
            }
        }
        return suggestions;
    }

    analyzeKeywordsField(keywords, allContent) {
        const suggestions = [];
        if (!keywords || keywords.trim() === '') {
            suggestions.push({
                type: 'missing',
                message: 'Keywords help with content organization and SEO',
                action: 'generate_keywords',
                priority: 'medium'
            });
        } else {
            const keywordArray = keywords.split(',').map(k => k.trim()).filter(k => k);
            if (keywordArray.length < 3) {
                suggestions.push({
                    type: 'count',
                    message: 'Consider adding more keywords (aim for 5-8 relevant terms)',
                    action: 'expand_keywords',
                    priority: 'low'
                });
            }
            if (keywordArray.length > 10) {
                suggestions.push({
                    type: 'count',
                    message: 'Too many keywords may dilute focus',
                    action: 'optimize_keywords',
                    priority: 'medium'
                });
            }
        }
        return suggestions;
    }

    analyzeAltTextField(altText, allContent) {
        const suggestions = [];
        if (!altText || altText.trim() === '') {
            suggestions.push({
                type: 'missing',
                message: 'Alt text is essential for accessibility and SEO',
                action: 'generate_alt_text',
                priority: 'high'
            });
        } else {
            if (altText.length < 20) {
                suggestions.push({
                    type: 'descriptive',
                    message: 'Alt text could be more descriptive',
                    action: 'expand_alt_text',
                    priority: 'low'
                });
            }
            if (altText.length > 125) {
                suggestions.push({
                    type: 'length',
                    message: 'Alt text is too long for screen readers',
                    action: 'optimize_alt_text',
                    priority: 'medium'
                });
            }
        }
        return suggestions;
    }

    // Content generation methods
    generateTitleSuggestions(allContent) {
        const topics = [
            'Manufacturing Intelligence in 2024',
            'AI-Powered Production Optimization',
            'Smart Factory Technologies',
            'Industry 4.0 Implementation Guide',
            'Data-Driven Manufacturing Excellence'
        ];
        return topics.map(title => ({
            type: 'suggestion',
            content: title,
            confidence: 0.8 + Math.random() * 0.2
        }));
    }

    generateExcerptSuggestions(allContent) {
        const excerpts = [
            'Discover how modern manufacturing intelligence transforms production efficiency and quality control through advanced analytics and automation.',
            'Learn practical strategies for implementing AI-powered solutions that drive measurable improvements in manufacturing operations.',
            'Explore cutting-edge technologies that are reshaping the manufacturing landscape and creating competitive advantages.'
        ];
        return excerpts.map(excerpt => ({
            type: 'suggestion',
            content: excerpt,
            confidence: 0.7 + Math.random() * 0.3
        }));
    }

    generateMetaTitleSuggestions(allContent) {
        const title = allContent.title || 'Manufacturing Intelligence';
        return [{
            type: 'suggestion',
            content: `${title} | Likwid Manufacturing Hub`,
            confidence: 0.9
        }, {
            type: 'suggestion',
            content: `${title} - Expert Manufacturing Insights`,
            confidence: 0.8
        }];
    }

    generateMetaDescriptionSuggestions(allContent) {
        const excerpt = allContent.excerpt || 'Expert insights on manufacturing intelligence, AI automation, and industry best practices.';
        return [{
            type: 'suggestion',
            content: `${excerpt.substring(0, 140)}... Learn from industry experts at Likwid.`,
            confidence: 0.8
        }];
    }

    generateKeywordsSuggestions(allContent) {
        const keywords = [
            'manufacturing intelligence, AI automation, industry 4.0, smart factory, production optimization',
            'manufacturing analytics, process improvement, digital transformation, industrial IoT, quality control',
            'lean manufacturing, operational efficiency, data analytics, predictive maintenance, supply chain'
        ];
        return keywords.map(keyword => ({
            type: 'suggestion',
            content: keyword,
            confidence: 0.7 + Math.random() * 0.3
        }));
    }

    generateAltTextSuggestions(allContent) {
        const title = allContent.title || 'manufacturing content';
        return [{
            type: 'suggestion',
            content: `Illustration showing ${title.toLowerCase()} concepts and best practices`,
            confidence: 0.8
        }, {
            type: 'suggestion',
            content: `Diagram depicting modern manufacturing intelligence and automation technologies`,
            confidence: 0.7
        }];
    }

    // Content expansion methods
    expandExcerpt(currentExcerpt, allContent) {
        return [{
            type: 'expansion',
            content: `${currentExcerpt} This comprehensive guide explores practical implementation strategies, real-world case studies, and expert insights to help you succeed.`,
            confidence: 0.8
        }];
    }

    expandMetaDescription(currentMeta, allContent) {
        return [{
            type: 'expansion',
            content: `${currentMeta} Get actionable insights from industry experts.`,
            confidence: 0.8
        }];
    }

    expandKeywords(currentKeywords, allContent) {
        const additionalKeywords = ['digital transformation', 'operational excellence', 'process automation', 'industrial analytics'];
        return [{
            type: 'expansion',
            content: `${currentKeywords}, ${additionalKeywords.join(', ')}`,
            confidence: 0.7
        }];
    }

    // Content optimization methods
    optimizeTitle(currentTitle, allContent) {
        return [{
            type: 'optimization',
            content: currentTitle.length > 60 ? currentTitle.substring(0, 57) + '...' : `${currentTitle} - Complete Guide`,
            confidence: 0.8,
            reason: currentTitle.length > 60 ? 'Shortened for search results' : 'Enhanced for engagement'
        }];
    }

    optimizeMetaTitle(currentMetaTitle, allContent) {
        if (currentMetaTitle.length > 60) {
            return [{
                type: 'optimization',
                content: currentMetaTitle.substring(0, 57) + '...',
                confidence: 0.9,
                reason: 'Truncated to optimal length for search results'
            }];
        }
        return [{
            type: 'optimization',
            content: `${currentMetaTitle} | Likwid`,
            confidence: 0.8,
            reason: 'Added branding for better recognition'
        }];
    }

    optimizeMetaDescription(currentMeta, allContent) {
        if (currentMeta.length > 160) {
            return [{
                type: 'optimization',
                content: currentMeta.substring(0, 157) + '...',
                confidence: 0.9,
                reason: 'Shortened to prevent truncation in search results'
            }];
        }
        return [{
            type: 'optimization',
            content: `${currentMeta} Learn more at Likwid.`,
            confidence: 0.7,
            reason: 'Added call-to-action for better click-through rates'
        }];
    }

    optimizeKeywords(currentKeywords, allContent) {
        const keywords = currentKeywords.split(',').map(k => k.trim()).filter(k => k);
        if (keywords.length > 8) {
            return [{
                type: 'optimization',
                content: keywords.slice(0, 8).join(', '),
                confidence: 0.8,
                reason: 'Reduced to focus on most relevant keywords'
            }];
        }
        return [{
            type: 'optimization',
            content: keywords.join(', '),
            confidence: 0.7,
            reason: 'Keywords are well-optimized'
        }];
    }
}

// Global instance
window.blogManager = new BlogManager();
console.log('BlogManager initialized successfully');
