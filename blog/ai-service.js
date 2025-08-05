/**
 * AI Service - Gemini Integration for Blog System
 * Handles all AI-powered features including content generation, SEO optimization, keyword analysis, and image operations
 */

class AIService {
    constructor() {
        // Initialize configuration manager for secure API key storage
        this.configManager = window.configManager || new ConfigManager();
        this.apiKey = this.configManager.getApiKey();
        
        // Correct API endpoints for different Gemini models
        this.endpoints = {
            text: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent',
            imageGeneration: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-preview-image-generation:generateContent',
            imageAnalysis: 'https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent',
            files: 'https://generativelanguage.googleapis.com/v1beta/files'
        };
        
        this.keywords = [];
        this.uploadedFiles = new Map(); // Track uploaded files
        this.loadKeywords();
        
        // Validate API key on initialization
        if (!this.apiKey) {
            console.warn('⚠️ No API key configured. AI features will not work until an API key is set.');
        }
    }

    // Update API key through configuration manager
    async updateApiKey(newApiKey, confirmCallback = null) {
        try {
            const result = await this.configManager.updateApiKey(newApiKey, confirmCallback);
            this.apiKey = this.configManager.getApiKey();
            console.log('✅ AI Service API key updated successfully');
            return result;
        } catch (error) {
            console.error('❌ Failed to update API key:', error);
            throw error;
        }
    }

    // Get API key status
    getApiKeyStatus() {
        return this.configManager.getStatus();
    }

    // Test current API key
    async testApiConnection() {
        return await this.configManager.testApiKey();
    }

    // Refresh API key from configuration
    refreshApiKey() {
        this.apiKey = this.configManager.getApiKey();
        return !!this.apiKey;
    }

    // Load keywords from CSV data
    async loadKeywords() {
        try {
            // Load keywords from the CSV file
            const response = await fetch('keywords.csv');
            const csvText = await response.text();
            
            // Parse CSV - now it's just one keyword per line
            this.keywords = csvText.trim().split('\n').map(keyword => keyword.trim()).filter(keyword => keyword.length > 0);
            
            console.log(`Loaded ${this.keywords.length} keywords from CSV`);
        } catch (error) {
            console.error('Error loading keywords from CSV:', error);
            
            // Fallback keywords if CSV loading fails
            this.keywords = [
                'erp', 'odoo', 'enterprise resource planning systems', 'enterprise resource management',
                'erp software', 'inventory management software', 'erp system', 'warehouse management system',
                'inventory management system', 'sap business one', 'oracle erp', 'sap software',
                'zoho inventory', 'odoo software', 'tally erp 9', 'erpnext', 'workday erp',
                'sap erp software', 'oracle erp software', 'inventory management programs',
                'erp enterprise resource planning', 'workday erp system', 'inventory tracking programs',
                'oracle and netsuite', 'inventory planning software', 'enterprise resource planning software',
                'enterprise resource management system', 'inventory monitoring system',
                'oracle enterprise resource planning', 'inventory mgmt software', 'manufacturing erp',
                'cloud erp', 'ai manufacturing', 'industry 4.0', 'predictive maintenance',
                'smart factory', 'manufacturing automation', 'supply chain optimization',
                'quality control systems', 'production planning', 'manufacturing intelligence'
            ];
        }
    }

    // Generate content using Gemini AI with proper configuration
    async generateContent(prompt, maxTokens = 1000, model = 'text') {
        try {
            // Validate API key before making request
            if (!this.apiKey) {
                throw new Error('No API key configured. Please set up your Gemini API key first.');
            }

            const endpoint = this.endpoints[model] || this.endpoints.text;
            
            const requestBody = {
                contents: [{
                    parts: [{
                        text: prompt
                    }]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: maxTokens,
                    candidateCount: 1
                },
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_HATE_SPEECH",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    }
                ]
            };

            console.log('Making API request to:', endpoint);
            console.log('Request body:', JSON.stringify(requestBody, null, 2));

            const response = await fetch(`${endpoint}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('API Error Response:', errorData);
                throw new Error(`Gemini API error: ${response.status} - ${errorData}`);
            }

            const data = await response.json();
            console.log('API Response:', data);

            if (!data.candidates || data.candidates.length === 0) {
                throw new Error('No content generated by AI');
            }

            if (data.candidates[0].finishReason === 'SAFETY') {
                throw new Error('Content blocked by safety filters');
            }

            return data.candidates[0].content.parts[0].text;
        } catch (error) {
            console.error('AI generation error:', error);
            throw new Error(`Failed to generate content: ${error.message}`);
        }
    }

    // Upload file to Gemini Files API
    async uploadFile(file) {
        try {
            // Validate API key before making request
            if (!this.apiKey) {
                throw new Error('No API key configured. Please set up your Gemini API key first.');
            }

            const formData = new FormData();
            formData.append('file', file);

            const response = await fetch(`${this.endpoints.files}?key=${this.apiKey}`, {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('File upload error:', errorData);
                throw new Error(`Failed to upload file: ${response.status} - ${errorData}`);
            }

            const data = await response.json();
            console.log('File uploaded successfully:', data);

            // Store file reference
            this.uploadedFiles.set(data.name, {
                name: data.name,
                displayName: data.displayName,
                mimeType: data.mimeType,
                sizeBytes: data.sizeBytes,
                createTime: data.createTime,
                uri: data.uri
            });

            return data;
        } catch (error) {
            console.error('File upload error:', error);
            throw new Error(`Failed to upload file: ${error.message}`);
        }
    }

    // Generate image using Gemini 2.0 Flash with image generation
    async generateImage(prompt, includeText = true) {
        try {
            // Validate API key before making request
            if (!this.apiKey) {
                throw new Error('No API key configured. Please set up your Gemini API key first.');
            }

            const requestBody = {
                contents: [{
                    parts: [{
                        text: `Create a professional image exactly 1920x1080 pixels (16:9 aspect ratio): ${prompt}. 
                        
                        CRITICAL REQUIREMENTS:
                        - Resolution: EXACTLY 1920x1080 pixels
                        - Aspect ratio: 16:9 landscape format
                        - Style: Professional, high-quality, suitable for manufacturing/ERP business blog
                        - Composition: Wide landscape view optimized for header/banner placement
                        - Quality: Sharp, detailed, photorealistic or professional illustration style
                        
                        The image should work perfectly as a blog post cover image or header banner.`
                    }]
                }],
                generationConfig: {
                    temperature: 0.8,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 4096,
                    candidateCount: 1,
                    responseModalities: includeText ? ["TEXT", "IMAGE"] : ["IMAGE"]
                },
                safetySettings: [
                    {
                        category: "HARM_CATEGORY_HARASSMENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_HATE_SPEECH",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_SEXUALLY_EXPLICIT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    },
                    {
                        category: "HARM_CATEGORY_DANGEROUS_CONTENT",
                        threshold: "BLOCK_MEDIUM_AND_ABOVE"
                    }
                ]
            };

            console.log('Generating image with prompt:', prompt);

            const response = await fetch(`${this.endpoints.imageGeneration}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Image generation error:', errorData);
                throw new Error(`Image generation failed: ${response.status} - ${errorData}`);
            }

            const data = await response.json();
            console.log('Image generation response:', data);

            if (!data.candidates || data.candidates.length === 0) {
                throw new Error('No image generated');
            }

            const parts = data.candidates[0].content.parts;
            let imageData = null;
            let textResponse = '';

            // Extract image and text from response
            for (const part of parts) {
                if (part.text) {
                    textResponse += part.text;
                } else if (part.inlineData) {
                    imageData = part.inlineData.data;
                }
            }

            if (!imageData) {
                throw new Error('No image data in response');
            }

            // Create blob URL for the image
            const imageBytes = Uint8Array.from(atob(imageData), c => c.charCodeAt(0));
            const blob = new Blob([imageBytes], { type: 'image/png' });
            const imageUrl = URL.createObjectURL(blob);

            return {
                imageUrl,
                imageData, // base64 string
                description: textResponse,
                prompt,
                blob
            };

        } catch (error) {
            console.error('Image generation error:', error);
            throw new Error(`Failed to generate image: ${error.message}`);
        }
    }

    // Analyze uploaded image
    async analyzeImage(file, prompt = "Describe this image in detail") {
        try {
            // Validate API key before making request
            if (!this.apiKey) {
                throw new Error('No API key configured. Please set up your Gemini API key first.');
            }

            // Convert file to base64
            const base64Data = await this.fileToBase64(file);
            
            const requestBody = {
                contents: [{
                    parts: [
                        {
                            text: prompt
                        },
                        {
                            inlineData: {
                                mimeType: file.type,
                                data: base64Data
                            }
                        }
                    ]
                }],
                generationConfig: {
                    temperature: 0.7,
                    topK: 40,
                    topP: 0.95,
                    maxOutputTokens: 2048,
                }
            };

            const response = await fetch(`${this.endpoints.imageAnalysis}?key=${this.apiKey}`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.text();
                console.error('Image analysis error:', errorData);
                throw new Error(`Image analysis failed: ${response.status} - ${errorData}`);
            }

            const data = await response.json();
            
            if (!data.candidates || data.candidates.length === 0) {
                throw new Error('No analysis generated');
            }

            return data.candidates[0].content.parts[0].text;

        } catch (error) {
            console.error('Image analysis error:', error);
            throw new Error(`Failed to analyze image: ${error.message}`);
        }
    }

    // Helper function to convert file to base64
    async fileToBase64(file) {
        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => {
                const base64 = reader.result.split(',')[1]; // Remove data:image/...;base64, prefix
                resolve(base64);
            };
            reader.onerror = reject;
            reader.readAsDataURL(file);
        });
    }

    // Progressive prompt refinement for user input
    async refineUserPrompt(userInput) {
        const refinementPrompt = `
        You are an expert content strategist for a manufacturing ERP software company (Likwid.AI). 
        Analyze this user input: "${userInput}"

        Refine it into a comprehensive content brief that will generate high-quality manufacturing/ERP blog content.

        IMPORTANT: Respond with ONLY a valid JSON object. Do not include any explanatory text before or after the JSON.

        {
            "refined_topic": "Enhanced topic with manufacturing focus",
            "target_audience": "Specific manufacturing professional type",
            "content_angle": "Unique perspective or approach",
            "key_focus_areas": ["area1", "area2", "area3"],
            "business_value": "Main business benefit to highlight",
            "technical_depth": "beginner|intermediate|advanced",
            "content_style": "educational|problem-solving|case-study|how-to|trend-analysis",
            "industry_context": "Specific manufacturing sector or general",
            "pain_points": ["pain1", "pain2", "pain3"],
            "success_metrics": ["metric1", "metric2"],
            "call_to_action_focus": "What should readers do next"
        }

        Make it compelling for manufacturing decision-makers and technical professionals.
        `;

        try {
            const response = await this.generateContent(refinementPrompt, 1200);
            let cleanResponse = response.trim();
            
            console.log('Raw refinement response:', cleanResponse);
            
            if (cleanResponse.startsWith('```json')) {
                cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanResponse.startsWith('```')) {
                cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            // Try to find and extract JSON from the response
            const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleanResponse = jsonMatch[0];
            }

            console.log('Cleaned refinement response:', cleanResponse);
            
            if (!cleanResponse || cleanResponse.length < 10) {
                throw new Error('Empty or invalid response from AI');
            }

            return JSON.parse(cleanResponse);
        } catch (error) {
            console.error('Error refining prompt:', error);
            // Return basic refinement as fallback
            return {
                refined_topic: `${userInput} in Manufacturing Operations`,
                target_audience: "Manufacturing managers and decision-makers",
                content_angle: "Practical implementation guide",
                key_focus_areas: [userInput.toLowerCase(), "efficiency", "cost reduction"],
                business_value: "Improved operational efficiency and cost savings",
                technical_depth: "intermediate",
                content_style: "educational",
                industry_context: "general manufacturing",
                pain_points: ["inefficiency", "high costs", "manual processes"],
                success_metrics: ["ROI improvement", "time savings"],
                call_to_action_focus: "Schedule consultation to learn more"
            };
        }
    }

    // Generate comprehensive content package from user input
    async generateCompleteContent(userInput, options = {}) {
        try {
            console.log('🔄 Starting complete content generation for:', userInput);
            
            // Step 1: Refine the user prompt
            console.log('📝 Refining user prompt...');
            const refinedBrief = await this.refineUserPrompt(userInput);
            console.log('✅ Prompt refined:', refinedBrief.refined_topic);

            // Step 2: Generate strategic keywords
            console.log('🔑 Generating strategic keywords...');
            const strategicKeywords = await this.generateStrategicKeywords(refinedBrief);
            console.log('✅ Keywords generated:', strategicKeywords.primary.slice(0, 3).join(', '));

            // Step 3: Create the blog post with refined context
            console.log('📖 Creating comprehensive blog post...');
            const blogPost = await this.generateEnhancedBlogPost(refinedBrief, strategicKeywords);
            console.log('✅ Blog post created:', blogPost.title);

            // Step 4: Generate SEO optimization
            console.log('🎯 Optimizing SEO...');
            const seoData = await this.generateAdvancedSEO(blogPost, strategicKeywords, refinedBrief);
            console.log('✅ SEO optimized');

            // Step 5: Generate featured image
            console.log('🖼️ Generating featured image...');
            const imageResult = await this.generateContentImage(blogPost.title, refinedBrief);
            console.log('✅ Image generated successfully');

            // Step 6: Create content suggestions
            console.log('💡 Generating content suggestions...');
            const suggestions = await this.generateContentSuggestions(blogPost, refinedBrief);
            console.log('✅ Suggestions generated');

            // Combine everything
            const completeContent = {
                // Original input
                originalInput: userInput,
                refinedBrief: refinedBrief,
                
                // Core content
                blogPost: {
                    ...blogPost,
                    ...seoData,
                    keywords: this.combineKeywords(strategicKeywords),
                    featuredImage: imageResult.imageUrl,
                    imageAlt: imageResult.altText,
                    estimatedReadTime: this.calculateReadTime(this.extractTextFromContent(blogPost.content))
                },
                
                // SEO and optimization data
                seoAnalysis: this.calculateSEOScore({
                    ...blogPost,
                    ...seoData,
                    keywords: strategicKeywords.primary.join(', ')
                }),
                
                // Strategic insights
                keywordStrategy: strategicKeywords,
                contentSuggestions: suggestions,
                
                // Image data
                imageData: {
                    url: imageResult.imageUrl,
                    altText: imageResult.altText,
                    description: imageResult.description,
                    prompt: imageResult.prompt
                },
                
                // Generation metadata
                generatedAt: new Date().toISOString(),
                generationId: `content_${Date.now()}`,
                processingSteps: [
                    'Prompt refinement',
                    'Strategic keyword generation',
                    'Enhanced blog post creation',
                    'SEO optimization',
                    'Image generation',
                    'Content suggestions'
                ]
            };

            console.log('🎉 Complete content generation finished!');
            return completeContent;

        } catch (error) {
            console.error('❌ Complete content generation failed:', error);
            throw new Error(`Content generation failed: ${error.message}`);
        }
    }

    // Generate strategic keywords based on refined brief
    async generateStrategicKeywords(refinedBrief) {
        // First, get relevant CSV keywords for this topic
        const relevantCSVKeywords = this.findRelevantCSVKeywords(refinedBrief.refined_topic, 15);
        const topCSVKeywords = relevantCSVKeywords.slice(0, 10).join(', ');
        
        const keywordPrompt = `
        Generate strategic keywords for a manufacturing ERP blog post with this brief:
        
        Topic: ${refinedBrief.refined_topic}
        Audience: ${refinedBrief.target_audience}
        Focus Areas: ${refinedBrief.key_focus_areas.join(', ')}
        Industry Context: ${refinedBrief.industry_context}

        PRIORITIZE these CSV keywords that are highly relevant to this topic: ${topCSVKeywords}
        
        Additional CSV keywords to consider: ${this.keywords.slice(0, 30).join(', ')}

        IMPORTANT: Respond with ONLY a valid JSON object. Do not include any explanatory text before or after the JSON.

        {
            "primary": ["5-8 main keywords prioritizing CSV keywords"],
            "secondary": ["8-12 supporting keywords including CSV matches"],
            "long_tail": ["6-10 long-tail keyword phrases"],
            "csv_matches": ["CSV keywords that perfectly fit this topic"],
            "search_intent": ["what users are searching for related to this topic"],
            "competitor_keywords": ["keywords competitors might target"],
            "industry_specific": ["manufacturing and ERP specific terms"],
            "technical_keywords": ["technical terms relevant to the topic"]
        }

        Focus heavily on manufacturing, ERP, automation, and industry-specific terms from the CSV.
        Ensure primary keywords include at least 3-4 CSV keywords when relevant.
        `;

        try {
            const response = await this.generateContent(keywordPrompt, 2500);
            let cleanResponse = response.trim();
            
            console.log('Raw keywords response:', cleanResponse);
            
            if (cleanResponse.startsWith('```json')) {
                cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanResponse.startsWith('```')) {
                cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            // Try to find and extract JSON from the response
            const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleanResponse = jsonMatch[0];
            }

            console.log('Cleaned keywords response:', cleanResponse);

            if (!cleanResponse || cleanResponse.length < 10) {
                throw new Error('Empty or invalid response from AI');
            }

            const keywords = JSON.parse(cleanResponse);
            
            // Enhance with additional CSV keyword matches
            const enhancedCSVMatches = this.findRelevantCSVKeywords(refinedBrief.refined_topic, 20);
            keywords.csv_matches = [...new Set([...enhancedCSVMatches, ...(keywords.csv_matches || [])])];
            
            // Ensure primary keywords include CSV keywords
            const csvInPrimary = keywords.primary.filter(keyword => 
                this.keywords.some(csvKeyword => 
                    csvKeyword.toLowerCase().includes(keyword.toLowerCase()) ||
                    keyword.toLowerCase().includes(csvKeyword.toLowerCase())
                )
            );
            
            if (csvInPrimary.length < 2 && enhancedCSVMatches.length > 0) {
                // Add more CSV keywords to primary if not enough
                const additionalCSV = enhancedCSVMatches.slice(0, 3).filter(csv => 
                    !keywords.primary.some(p => p.toLowerCase().includes(csv.toLowerCase()))
                );
                keywords.primary = [...keywords.primary.slice(0, 5), ...additionalCSV].slice(0, 8);
            }
            
            return keywords;
        } catch (error) {
            console.error('Error generating strategic keywords:', error);
            return {
                primary: [...refinedBrief.key_focus_areas, ...relevantCSVKeywords.slice(0, 3), 'manufacturing', 'erp', 'automation'].slice(0, 8),
                secondary: ['efficiency', 'productivity', 'technology', 'industry 4.0', 'digital transformation', ...relevantCSVKeywords.slice(3, 8)],
                long_tail: [`${refinedBrief.refined_topic} in manufacturing`, 'manufacturing efficiency solutions', ...relevantCSVKeywords.slice(8, 12).map(k => `${k} solutions`)],
                csv_matches: relevantCSVKeywords,
                search_intent: ['how to improve manufacturing', 'best manufacturing software', `${refinedBrief.refined_topic} implementation`],
                competitor_keywords: ['manufacturing solutions', 'erp systems', ...relevantCSVKeywords.slice(0, 3)],
                industry_specific: relevantCSVKeywords.slice(0, 8),
                technical_keywords: relevantCSVKeywords.filter(k => k.includes('system') || k.includes('software') || k.includes('management'))
            };
        }
    }

    // Find relevant CSV keywords for a topic
    findRelevantCSVKeywords(topic, limit = 10) {
        const topicLower = topic.toLowerCase();
        const topicWords = topicLower.split(/\s+/);
        
        // Score keywords based on relevance
        const keywordScores = this.keywords.map(keyword => {
            const keywordLower = keyword.toLowerCase();
            let score = 0;
            
            // Exact match bonus
            if (keywordLower === topicLower) {
                score += 100;
            }
            
            // Contains topic bonus
            if (keywordLower.includes(topicLower) || topicLower.includes(keywordLower)) {
                score += 50;
            }
            
            // Word matching bonus
            const keywordWords = keywordLower.split(/\s+/);
            for (const topicWord of topicWords) {
                if (topicWord.length > 2) { // Ignore short words
                    for (const keywordWord of keywordWords) {
                        if (keywordWord === topicWord) {
                            score += 30;
                        } else if (keywordWord.includes(topicWord) || topicWord.includes(keywordWord)) {
                            score += 15;
                        }
                    }
                }
            }
            
            // Manufacturing relevance bonus
            const manufacturingTerms = ['manufacturing', 'production', 'factory', 'plant', 'operations', 'process', 'automation', 'industry'];
            const erpTerms = ['erp', 'enterprise', 'resource', 'planning', 'management', 'software', 'system'];
            
            for (const term of manufacturingTerms) {
                if (keywordLower.includes(term)) score += 20;
            }
            
            for (const term of erpTerms) {
                if (keywordLower.includes(term)) score += 25;
            }
            
            // Length preference (moderate length keywords are better)
            if (keywordLower.length >= 15 && keywordLower.length <= 40) {
                score += 10;
            }
            
            return { keyword, score };
        });
        
        // Sort by score and return top matches
        const sortedKeywords = keywordScores
            .filter(item => item.score > 0)
            .sort((a, b) => b.score - a.score)
            .map(item => item.keyword);
        
        return sortedKeywords.slice(0, limit);
    }

    // Generate enhanced blog post with refined brief
    async generateEnhancedBlogPost(refinedBrief, strategicKeywords) {
        const enhancedPrompt = `
        Create an expert-level blog post for Likwid.AI manufacturing ERP software company.

        CONTENT BRIEF:
        - Topic: ${refinedBrief.refined_topic}
        - Audience: ${refinedBrief.target_audience}
        - Content Style: ${refinedBrief.content_style}
        - Technical Depth: ${refinedBrief.technical_depth}
        - Business Value: ${refinedBrief.business_value}
        - Industry Context: ${refinedBrief.industry_context}
        
        KEY FOCUS AREAS: ${refinedBrief.key_focus_areas.join(', ')}
        PAIN POINTS TO ADDRESS: ${refinedBrief.pain_points.join(', ')}
        SUCCESS METRICS: ${refinedBrief.success_metrics.join(', ')}
        
        STRATEGIC KEYWORDS TO INTEGRATE:
        Primary: ${strategicKeywords.primary.join(', ')}
        Secondary: ${strategicKeywords.secondary.slice(0, 6).join(', ')}
        
        You must respond with ONLY a valid JSON object:
        {
            "title": "Compelling title (50-60 characters)",
            "excerpt": "Hook readers with value proposition (120-160 characters)",
            "content": {
                "blocks": [
                    {"type": "header", "data": {"text": "Introduction", "level": 2}},
                    {"type": "paragraph", "data": {"text": "Problem-focused opening paragraph that hooks readers with a compelling statistic or industry insight"}},
                    {"type": "paragraph", "data": {"text": "Second paragraph expanding on the problem and its impact on manufacturing operations"}},
                    {"type": "paragraph", "data": {"text": "Third paragraph introducing the solution approach and setting expectations"}},
                    
                    {"type": "header", "data": {"text": "Understanding the Challenge", "level": 2}},
                    {"type": "paragraph", "data": {"text": "Detailed analysis of current industry challenges and pain points"}},
                    {"type": "paragraph", "data": {"text": "Statistical evidence and real-world examples of the problem"}},
                    {"type": "paragraph", "data": {"text": "Impact on different stakeholders and business operations"}},
                    
                    {"type": "header", "data": {"text": "Strategic Solutions and Benefits", "level": 2}},
                    {"type": "paragraph", "data": {"text": "Comprehensive overview of solution approaches and methodologies"}},
                    {"type": "list", "data": {"style": "unordered", "items": ["Immediate operational benefit 1", "Long-term strategic benefit 2", "Cost reduction benefit 3", "Efficiency improvement benefit 4", "Quality enhancement benefit 5"]}},
                    {"type": "paragraph", "data": {"text": "Detailed explanation of how these benefits translate to business value"}},
                    {"type": "paragraph", "data": {"text": "Case study or example of successful implementation"}},
                    
                    {"type": "header", "data": {"text": "Implementation Framework", "level": 2}},
                    {"type": "paragraph", "data": {"text": "Overview of the implementation approach and methodology"}},
                    {"type": "list", "data": {"style": "ordered", "items": ["Phase 1: Assessment and Planning", "Phase 2: System Design and Configuration", "Phase 3: Implementation and Testing", "Phase 4: Training and Change Management", "Phase 5: Go-Live and Optimization", "Phase 6: Continuous Improvement"]}},
                    {"type": "paragraph", "data": {"text": "Detailed breakdown of each implementation phase with timelines"}},
                    {"type": "paragraph", "data": {"text": "Risk mitigation strategies and best practices"}},
                    
                    {"type": "header", "data": {"text": "Technology Components and Features", "level": 2}},
                    {"type": "paragraph", "data": {"text": "Detailed overview of key technology components and capabilities"}},
                    {"type": "paragraph", "data": {"text": "Integration capabilities with existing systems and processes"}},
                    {"type": "paragraph", "data": {"text": "Scalability and future-proofing considerations"}},
                    
                    {"type": "header", "data": {"text": "Measuring Success and ROI", "level": 2}},
                    {"type": "paragraph", "data": {"text": "Framework for measuring implementation success and business impact"}},
                    {"type": "paragraph", "data": {"text": "Key performance indicators and metrics to track"}},
                    {"type": "paragraph", "data": {"text": "ROI calculation methods and expected timeframes"}},
                    
                    {"type": "header", "data": {"text": "Industry Trends and Future Outlook", "level": 2}},
                    {"type": "paragraph", "data": {"text": "Current industry trends and market developments"}},
                    {"type": "paragraph", "data": {"text": "Future technology evolution and emerging opportunities"}},
                    {"type": "paragraph", "data": {"text": "Strategic considerations for long-term competitiveness"}},
                    
                    {"type": "header", "data": {"text": "Getting Started", "level": 2}},
                    {"type": "paragraph", "data": {"text": "Practical next steps for organizations considering implementation"}},
                    {"type": "paragraph", "data": {"text": "Clear call-to-action focused on: ${refinedBrief.call_to_action_focus}"}}
                ]
            },
            "category": "Technology",
            "author": "Likwid.AI Team"
        }

        REQUIREMENTS:
        - Minimum 2000 words across all content blocks (aim for 2500-3000 words)
        - Create comprehensive, in-depth content with detailed explanations
        - Include multiple paragraphs for each section (3-4 paragraphs minimum per section)
        - Add specific examples, case studies, and real-world scenarios
        - Include statistical data and industry insights where relevant
        - Naturally integrate ALL primary keywords throughout the content
        - Address specific pain points: ${refinedBrief.pain_points.join(', ')}
        - Include success metrics: ${refinedBrief.success_metrics.join(', ')}
        - Technical depth: ${refinedBrief.technical_depth}
        - Professional, authoritative tone with actionable insights
        - Include specific examples and data points
        - Add detailed implementation steps and best practices
        - End with strong call-to-action

        Do not include any text before or after the JSON object.
        `;

        try {
            const response = await this.generateContent(enhancedPrompt, 8000);
            let cleanResponse = response.trim();
            
            console.log('Raw blog post response length:', cleanResponse.length);
            console.log('Raw blog post response start:', cleanResponse.substring(0, 200));
            
            if (cleanResponse.startsWith('```json')) {
                cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanResponse.startsWith('```')) {
                cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            // Try to find and extract JSON from the response
            const jsonMatch = cleanResponse.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                cleanResponse = jsonMatch[0];
            }

            console.log('Cleaned blog post response length:', cleanResponse.length);

            if (!cleanResponse || cleanResponse.length < 50) {
                throw new Error('Empty or invalid response from AI');
            }

            const blogPost = JSON.parse(cleanResponse);
            
            // Validate structure
            if (!blogPost.title || !blogPost.content || !blogPost.content.blocks) {
                throw new Error('Invalid blog post structure received from AI');
            }

            return blogPost;

        } catch (error) {
            console.error('Error generating enhanced blog post:', error);
            // Return to the standard generation method as fallback
            return await this.generateBlogPost(refinedBrief.refined_topic);
        }
    }

    // Generate advanced SEO with strategic context
    async generateAdvancedSEO(blogPost, strategicKeywords, refinedBrief) {
        const seoPrompt = `
        Create advanced SEO optimization for this blog post:
        
        Title: "${blogPost.title}"
        Audience: ${refinedBrief.target_audience}
        Business Value: ${refinedBrief.business_value}
        
        Primary Keywords: ${strategicKeywords.primary.join(', ')}
        Search Intent: ${strategicKeywords.search_intent.join(', ')}
        
        Respond with ONLY a JSON object:
        {
            "meta_title": "SEO title (50-60 chars) with primary keyword",
            "meta_description": "Compelling description (120-160 chars) with value prop",
            "slug": "seo-friendly-url-slug",
            "alt_text": "Image alt text with keywords",
            "schema_type": "Article",
            "focus_keyphrase": "main keyphrase to target",
            "related_keyphrases": ["related phrase 1", "related phrase 2"],
            "social_title": "Social media optimized title",
            "social_description": "Social media description"
        }

        Optimize for manufacturing decision-makers searching for solutions.
        `;

        try {
            const response = await this.generateContent(seoPrompt, 600);
            let cleanResponse = response.trim();
            if (cleanResponse.startsWith('```json')) {
                cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            }

            return JSON.parse(cleanResponse);
        } catch (error) {
            console.error('Error generating advanced SEO:', error);
            return await this.generateSEO(blogPost.title, this.extractTextFromContent(blogPost.content));
        }
    }

    // Generate content-specific image
    async generateContentImage(title, refinedBrief) {
        const imagePrompt = `
        Create a professional cover image for a manufacturing blog post titled "${title}".
        
        SPECIFICATIONS:
        - Exact dimensions: 1920x1080 pixels
        - Format: 16:9 landscape banner/header style
        - Purpose: Blog post cover image (like Notion page covers)
        
        CONTENT REQUIREMENTS:
        - Context: ${refinedBrief.industry_context} manufacturing environment
        - Audience: ${refinedBrief.target_audience}
        - Theme: ${refinedBrief.key_focus_areas.join(', ')}
        
        VISUAL ELEMENTS:
        - Modern manufacturing facility or factory floor
        - Advanced technology and automation equipment
        - Professional workers in manufacturing environment
        - Digital interfaces, screens, or control systems
        - Clean, modern industrial aesthetic
        
        STYLE REQUIREMENTS:
        - Professional, high-quality photorealistic style
        - Bright, well-lit environment
        - Blue and silver color scheme matching Likwid.AI branding
        - Wide composition suitable for header banner
        - Avoid generic stock photo appearance
        - Ensure readability space for potential text overlay
        
        The image should capture the essence of modern manufacturing and ERP technology while being visually striking as a blog cover.
        `;

        try {
            const imageResult = await this.generateImage(imagePrompt, false);
            
            // Generate appropriate alt text
            const altText = `${refinedBrief.key_focus_areas.join(' and ')} in modern manufacturing facility - ${title}`;
            
            return {
                ...imageResult,
                altText: altText,
                dimensions: "1920x1080",
                aspectRatio: "16:9",
                purpose: "cover_image"
            };
        } catch (error) {
            console.error('Error generating content image:', error);
            throw error;
        }
    }

    // Generate a new cover image for an existing post
    async regenerateCoverImage(title, description, style = "modern manufacturing") {
        const imagePrompt = `
        Create a fresh, professional 1920x1080 cover image for "${title}".
        
        REQUIREMENTS:
        - Exact dimensions: 1920x1080 pixels (16:9)
        - Style: ${style}
        - Context: ${description}
        - Purpose: Blog header/cover image
        
        VISUAL ELEMENTS:
        - Manufacturing or ERP technology theme
        - Professional industrial environment
        - Modern, clean aesthetic
        - Blue and silver color scheme
        - High-quality, detailed composition
        - Suitable for text overlay
        
        Create a unique visual that represents the content while maintaining professional appeal.
        `;

        try {
            const imageResult = await this.generateImage(imagePrompt, false);
            
            return {
                ...imageResult,
                altText: `Cover image for ${title}`,
                dimensions: "1920x1080",
                aspectRatio: "16:9",
                purpose: "cover_image",
                isRegenerated: true
            };
        } catch (error) {
            console.error('Error regenerating cover image:', error);
            throw error;
        }
    }

    // Generate content improvement suggestions
    async generateContentSuggestions(blogPost, refinedBrief) {
        const suggestionsPrompt = `
        Analyze this blog post and suggest improvements:
        
        Title: "${blogPost.title}"
        Target Audience: ${refinedBrief.target_audience}
        Content Style: ${refinedBrief.content_style}
        
        Content Preview: "${this.extractTextFromContent(blogPost.content).substring(0, 300)}..."
        
        Suggest 5 specific improvements in JSON format:
        {
            "suggestions": [
                {
                    "type": "content|structure|seo|engagement|conversion",
                    "priority": "high|medium|low",
                    "title": "Improvement title",
                    "description": "Detailed suggestion",
                    "implementation": "How to implement this",
                    "expected_impact": "Expected result"
                }
            ],
            "content_score": 85,
            "engagement_potential": "high|medium|low",
            "conversion_potential": "high|medium|low"
        }
        `;

        try {
            const response = await this.generateContent(suggestionsPrompt, 1000);
            let cleanResponse = response.trim();
            if (cleanResponse.startsWith('```json')) {
                cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            }

            return JSON.parse(cleanResponse);
        } catch (error) {
            console.error('Error generating content suggestions:', error);
            return {
                suggestions: [
                    {
                        type: "engagement",
                        priority: "medium",
                        title: "Add more industry examples",
                        description: "Include specific manufacturing case studies",
                        implementation: "Add real-world examples and data points",
                        expected_impact: "Increased reader engagement and credibility"
                    }
                ],
                content_score: 75,
                engagement_potential: "medium",
                conversion_potential: "medium"
            };
        }
    }

    // Calculate estimated read time
    calculateReadTime(text) {
        const wordsPerMinute = 200;
        const wordCount = text.split(/\s+/).filter(word => word.length > 0).length;
        return Math.ceil(wordCount / wordsPerMinute);
    }

    // Combine strategic keywords into a comprehensive keyword string
    combineKeywords(strategicKeywords) {
        const allKeywords = [
            ...(strategicKeywords.primary || []),
            ...(strategicKeywords.csv_matches || []).slice(0, 5),
            ...(strategicKeywords.industry_specific || []).slice(0, 3),
            ...(strategicKeywords.technical_keywords || []).slice(0, 3)
        ];
        
        // Remove duplicates and return as comma-separated string
        const uniqueKeywords = [...new Set(allKeywords.map(k => k.toLowerCase()))];
        return uniqueKeywords.slice(0, 15).join(', ');
    }

    // Generate blog post from topic with improved prompting (keep existing method for compatibility)
    async generateBlogPost(topic) {
        const prompt = `
        Create a comprehensive blog post about "${topic}" for a manufacturing ERP software company called Likwid.AI. 

        You must respond with ONLY a valid JSON object with this exact structure:
        {
            "title": "Engaging title for the post (50-60 characters)",
            "excerpt": "Brief 2-3 sentence summary (120-160 characters)",
            "content": {
                "blocks": [
                    {"type": "header", "data": {"text": "Introduction", "level": 2}},
                    {"type": "paragraph", "data": {"text": "Opening paragraph content"}},
                    {"type": "header", "data": {"text": "Main Section", "level": 2}},
                    {"type": "paragraph", "data": {"text": "Main content paragraph"}},
                    {"type": "list", "data": {"style": "unordered", "items": ["Point 1", "Point 2", "Point 3"]}},
                    {"type": "header", "data": {"text": "Conclusion", "level": 2}},
                    {"type": "paragraph", "data": {"text": "Closing paragraph"}}
                ]
            },
            "keywords": "keyword1, keyword2, keyword3, keyword4, keyword5",
            "meta_title": "SEO optimized title (50-60 chars)",
            "meta_description": "SEO description (120-160 chars)",
            "category": "Technology"
        }

        Requirements:
        - Make it informative and engaging for manufacturing professionals
        - Include relevant manufacturing/ERP keywords naturally
        - Focus on practical applications and benefits
        - Use professional but accessible language
        - Include at least 1500-2000 words of content across all paragraphs
        - Create comprehensive, detailed content with multiple paragraphs per section
        - Include specific examples, case studies, and implementation details
        - Categories: Technology, Business, Innovation, Industry, Tutorial

        Do not include any text before or after the JSON object.
        `;

        try {
            console.log('Generating blog post for topic:', topic);
            const response = await this.generateContent(prompt, 5000);
            
            // Clean response - remove any markdown formatting
            let cleanResponse = response.trim();
            if (cleanResponse.startsWith('```json')) {
                cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanResponse.startsWith('```')) {
                cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            console.log('Raw AI response:', cleanResponse);
            
            const parsedResponse = JSON.parse(cleanResponse);
            
            // Validate required fields
            if (!parsedResponse.title || !parsedResponse.content || !parsedResponse.content.blocks) {
                throw new Error('Invalid blog post structure received from AI');
            }

            console.log('Successfully generated blog post:', parsedResponse.title);
            return parsedResponse;

        } catch (error) {
            console.error('Error generating blog post:', error);
            
            // Return comprehensive fallback structure
            const fallbackPost = {
                title: `Understanding ${topic} in Manufacturing`,
                excerpt: `Explore how ${topic} is transforming modern manufacturing operations and improving efficiency.`,
                content: {
                    blocks: [
                        {
                            type: "header",
                            data: { text: "Introduction", level: 2 }
                        },
                        {
                            type: "paragraph",
                            data: { text: `In today's rapidly evolving manufacturing landscape, ${topic} has emerged as a critical factor for operational success. This comprehensive guide explores the impact and implementation of ${topic} in modern manufacturing environments.` }
                        },
                        {
                            type: "header",
                            data: { text: "Key Benefits", level: 2 }
                        },
                        {
                            type: "paragraph",
                            data: { text: `The implementation of ${topic} brings numerous advantages to manufacturing operations, from improved efficiency to enhanced quality control.` }
                        },
                        {
                            type: "list",
                            data: {
                                style: "unordered",
                                items: [
                                    "Increased operational efficiency",
                                    "Enhanced quality control processes",
                                    "Improved resource management",
                                    "Better data-driven decision making",
                                    "Reduced operational costs"
                                ]
                            }
                        },
                        {
                            type: "header",
                            data: { text: "Implementation Strategy", level: 2 }
                        },
                        {
                            type: "paragraph",
                            data: { text: `Successful implementation of ${topic} requires careful planning, stakeholder buy-in, and a phased approach to ensure minimal disruption to existing operations.` }
                        },
                        {
                            type: "header",
                            data: { text: "Conclusion", level: 2 }
                        },
                        {
                            type: "paragraph",
                            data: { text: `As manufacturing continues to evolve, ${topic} will play an increasingly important role in maintaining competitive advantage and operational excellence.` }
                        }
                    ]
                },
                keywords: `${topic.toLowerCase().replace(/ /g, ', ')}, manufacturing, erp, automation, efficiency`,
                meta_title: topic.length > 60 ? topic.substring(0, 57) + '...' : topic,
                meta_description: `Learn how ${topic} is revolutionizing manufacturing operations and driving business growth.`,
                category: "Technology"
            };

            console.log('Using fallback blog post structure');
            return fallbackPost;
        }
    }

    // Generate SEO optimizations with improved prompting
    async generateSEO(title, content) {
        const prompt = `
        Based on this blog post title "${title}" and content, generate SEO optimizations for a manufacturing ERP software company (Likwid.AI).

        You must respond with ONLY a valid JSON object with this exact structure:
        {
            "meta_title": "SEO optimized title (50-60 characters)",
            "meta_description": "SEO description (120-160 characters)",
            "keywords": "5-8 relevant keywords separated by commas",
            "alt_text": "Image alt text description",
            "slug": "url-friendly-slug"
        }

        Requirements:
        - Focus on manufacturing, ERP, automation, and industry keywords
        - Make titles compelling and click-worthy
        - Keep descriptions informative and actionable
        - Use manufacturing industry terminology
        - Create URL-friendly slugs

        Do not include any text before or after the JSON object.
        `;

        try {
            console.log('Generating SEO for:', title);
            const response = await this.generateContent(prompt, 800);
            
            // Clean response
            let cleanResponse = response.trim();
            if (cleanResponse.startsWith('```json')) {
                cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanResponse.startsWith('```')) {
                cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            const seoData = JSON.parse(cleanResponse);
            
            // Validate required fields
            if (!seoData.meta_title || !seoData.meta_description) {
                throw new Error('Invalid SEO structure received from AI');
            }

            console.log('Successfully generated SEO data');
            return seoData;

        } catch (error) {
            console.error('Error generating SEO:', error);
            
            // Return improved fallback SEO
            const titleWords = title.toLowerCase().split(' ');
            const slug = titleWords
                .map(word => word.replace(/[^a-z0-9]/g, ''))
                .filter(word => word.length > 0)
                .slice(0, 6)
                .join('-');

            return {
                meta_title: title.length > 60 ? title.substring(0, 57) + '...' : title,
                meta_description: `Discover how ${title.toLowerCase()} can transform your manufacturing operations and boost efficiency with Likwid.AI ERP solutions.`,
                keywords: `${titleWords.slice(0, 3).join(', ')}, manufacturing, erp, automation, efficiency`,
                alt_text: `${title} in manufacturing environment`,
                slug: slug || 'manufacturing-article'
            };
        }
    }

    // Generate content ideas with improved prompting
    async generateContentIdeas(category = 'manufacturing') {
        const prompt = `
        Generate 10 engaging blog post ideas for a manufacturing ERP software company (Likwid.AI).
        Focus on topics like: ERP systems, manufacturing automation, Industry 4.0, AI in manufacturing, 
        supply chain, inventory management, quality control, production planning.

        You must respond with ONLY a valid JSON array with this exact structure:
        [
            {
                "title": "Engaging post title",
                "description": "Brief description of the article content",
                "category": "Technology",
                "estimated_read_time": 6
            }
        ]

        Categories: Technology, Business, Innovation, Industry, Tutorial
        Read times: 3-12 minutes
        Make titles actionable and benefit-focused for manufacturing professionals.

        Do not include any text before or after the JSON array.
        `;

        try {
            console.log('Generating content ideas for category:', category);
            const response = await this.generateContent(prompt, 1500);
            
            // Clean response
            let cleanResponse = response.trim();
            if (cleanResponse.startsWith('```json')) {
                cleanResponse = cleanResponse.replace(/^```json\s*/, '').replace(/\s*```$/, '');
            } else if (cleanResponse.startsWith('```')) {
                cleanResponse = cleanResponse.replace(/^```\s*/, '').replace(/\s*```$/, '');
            }

            const ideas = JSON.parse(cleanResponse);
            
            if (!Array.isArray(ideas) || ideas.length === 0) {
                throw new Error('Invalid content ideas structure received from AI');
            }

            console.log(`Successfully generated ${ideas.length} content ideas`);
            return ideas;

        } catch (error) {
            console.error('Error generating content ideas:', error);
            
            // Return comprehensive fallback ideas
            return [
                {
                    title: "How ERP Systems Transform Manufacturing Efficiency",
                    description: "Explore the impact of modern ERP systems on manufacturing operations and productivity",
                    category: "Technology",
                    estimated_read_time: 6
                },
                {
                    title: "AI-Powered Inventory Management: The Future is Now",
                    description: "Discover how AI is revolutionizing inventory management in manufacturing",
                    category: "Innovation",
                    estimated_read_time: 8
                },
                {
                    title: "Industry 4.0: A Complete Guide for Manufacturers",
                    description: "Understanding the fourth industrial revolution and its impact on manufacturing",
                    category: "Industry",
                    estimated_read_time: 10
                },
                {
                    title: "5 Ways to Reduce Manufacturing Costs with Smart ERP",
                    description: "Practical strategies to cut costs and improve margins using ERP technology",
                    category: "Business",
                    estimated_read_time: 7
                },
                {
                    title: "Predictive Maintenance: Preventing Downtime Before It Happens",
                    description: "Learn how predictive maintenance technology can save your manufacturing operation",
                    category: "Technology",
                    estimated_read_time: 9
                },
                {
                    title: "Supply Chain Optimization in the Digital Age",
                    description: "Modern approaches to streamline your supply chain for maximum efficiency",
                    category: "Business",
                    estimated_read_time: 6
                },
                {
                    title: "Quality Control Automation: Ensuring Perfect Products",
                    description: "How automated quality control systems improve product consistency",
                    category: "Technology",
                    estimated_read_time: 5
                },
                {
                    title: "Implementing Lean Manufacturing with ERP Support",
                    description: "Combine lean principles with ERP technology for optimal results",
                    category: "Tutorial",
                    estimated_read_time: 8
                },
                {
                    title: "The ROI of Manufacturing Automation",
                    description: "Calculate and maximize returns on automation investments",
                    category: "Business",
                    estimated_read_time: 7
                },
                {
                    title: "Smart Factory Implementation: A Step-by-Step Guide",
                    description: "Transform your facility into a connected, intelligent manufacturing hub",
                    category: "Tutorial",
                    estimated_read_time: 12
                }
            ];
        }
    }

    // Calculate comprehensive SEO score
    calculateSEOScore(postData) {
        let score = 0;
        const factors = [];

        // Title optimization (25 points)
        const title = postData.title || '';
        const metaTitle = postData.meta_title || '';
        
        if (title.length >= 30 && title.length <= 60) {
            score += 12;
            factors.push('✓ Title length optimal');
        } else {
            factors.push('✗ Title length needs optimization');
        }

        if (metaTitle.length >= 30 && metaTitle.length <= 60) {
            score += 13;
            factors.push('✓ Meta title optimal');
        } else {
            factors.push('✗ Meta title needs optimization');
        }

        // Content length (20 points)
        const content = this.extractTextFromContent(postData.content);
        const wordCount = content.split(/\s+/).filter(word => word.length > 0).length;
        
        if (wordCount >= 800) {
            score += 20;
            factors.push('✓ Content length excellent');
        } else if (wordCount >= 500) {
            score += 15;
            factors.push('○ Content length good');
        } else {
            factors.push('✗ Content too short');
        }

        // Meta description (15 points)
        const metaDesc = postData.meta_description || '';
        if (metaDesc.length >= 120 && metaDesc.length <= 160) {
            score += 15;
            factors.push('✓ Meta description optimal');
        } else {
            factors.push('✗ Meta description needs optimization');
        }

        // Keywords usage (25 points)
        const keywords = postData.keywords || '';
        const keywordList = keywords.split(',').map(k => k.trim()).filter(k => k.length > 0);
        
        if (keywordList.length >= 5) {
            score += 10;
            factors.push('✓ Good keyword density');
        } else {
            factors.push('✗ Need more keywords');
        }

        // Check CSV keyword usage with detailed tracking
        const csvKeywordAnalysis = this.countCSVKeywords(content + ' ' + title + ' ' + metaDesc);
        const csvKeywordScore = Math.min(15, csvKeywordAnalysis.count * 2);
        score += csvKeywordScore;
        factors.push(`○ Using ${csvKeywordAnalysis.count}/${this.keywords.length} CSV keywords (${csvKeywordAnalysis.percentage}%)`);

        // Bonus for high CSV keyword usage
        if (csvKeywordAnalysis.percentage >= 10) {
            score += 5;
            factors.push('✓ Excellent CSV keyword coverage');
        } else if (csvKeywordAnalysis.percentage >= 5) {
            factors.push('○ Good CSV keyword usage');
        } else {
            factors.push('✗ Need more CSV keyword integration');
        }

        // URL slug (5 points)
        const slug = postData.slug || '';
        if (slug && slug.length > 0) {
            score += 5;
            factors.push('✓ URL slug present');
        } else {
            factors.push('✗ Missing URL slug');
        }

        // Image alt text (5 points)
        const altText = postData.alt_text || '';
        if (altText && altText.length > 0) {
            score += 5;
            factors.push('✓ Image alt text present');
        } else {
            factors.push('✗ Missing image alt text');
        }

        // Readability bonus (5 points)
        const readabilityScore = this.calculateReadability(content);
        if (readabilityScore >= 70) {
            score += 5;
            factors.push('✓ Good readability');
        } else {
            factors.push('○ Readability could improve');
        }

        return {
            score: Math.min(100, score),
            factors,
            details: {
                titleLength: title.length,
                contentWords: wordCount,
                metaDescLength: metaDesc.length,
                keywordCount: keywordList.length,
                csvKeywords: csvKeywordAnalysis.count,
                csvKeywordPercentage: csvKeywordAnalysis.percentage,
                readability: readabilityScore,
                usedCsvKeywords: csvKeywordAnalysis.used
            }
        };
    }

    // Count how many CSV keywords are used with detailed tracking
    countCSVKeywords(text) {
        const lowerText = text.toLowerCase();
        let count = 0;
        const usedKeywords = [];
        
        for (const keyword of this.keywords) {
            if (lowerText.includes(keyword.toLowerCase())) {
                count++;
                usedKeywords.push(keyword);
            }
        }
        
        return {
            count: count,
            used: usedKeywords,
            percentage: this.keywords.length > 0 ? Math.round((count / this.keywords.length) * 100) : 0
        };
    }

    // Get detailed keyword analytics
    getKeywordAnalytics(text) {
        const lowerText = text.toLowerCase();
        const analytics = {
            totalKeywords: this.keywords.length,
            usedKeywords: [],
            unusedKeywords: [],
            keywordDensity: {},
            topKeywords: [],
            suggestions: []
        };

        // Check each keyword
        for (const keyword of this.keywords) {
            const keywordLower = keyword.toLowerCase();
            const regex = new RegExp(keywordLower.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
            const matches = text.match(regex) || [];
            const count = matches.length;

            if (count > 0) {
                analytics.usedKeywords.push({
                    keyword: keyword,
                    count: count,
                    density: ((count / text.split(/\s+/).length) * 100).toFixed(2)
                });
            } else {
                analytics.unusedKeywords.push(keyword);
            }

            analytics.keywordDensity[keyword] = count;
        }

        // Sort by usage count
        analytics.topKeywords = analytics.usedKeywords
            .sort((a, b) => b.count - a.count)
            .slice(0, 10);

        // Get suggestions from unused keywords
        analytics.suggestions = analytics.unusedKeywords
            .slice(0, 15)
            .map(keyword => ({
                keyword: keyword,
                relevance: this.calculateKeywordRelevance(keyword, text),
                priority: 'medium'
            }))
            .sort((a, b) => b.relevance - a.relevance);

        return analytics;
    }

    // Calculate keyword relevance to content
    calculateKeywordRelevance(keyword, text) {
        const keywordWords = keyword.toLowerCase().split(/\s+/);
        const textWords = text.toLowerCase().split(/\s+/);
        let relevanceScore = 0;

        for (const word of keywordWords) {
            if (textWords.includes(word)) {
                relevanceScore += 1;
            }
        }

        return relevanceScore / keywordWords.length;
    }

    // Get unused CSV keywords as suggestions
    getKeywordSuggestions(text, limit = 10) {
        const lowerText = text.toLowerCase();
        const unusedKeywords = this.keywords.filter(keyword => 
            !lowerText.includes(keyword.toLowerCase())
        );
        
        return unusedKeywords.slice(0, limit);
    }

    // Extract text from EditorJS content
    extractTextFromContent(contentString) {
        try {
            if (typeof contentString === 'string') {
                const content = JSON.parse(contentString);
                if (content && content.blocks) {
                    return content.blocks.map(block => {
                        switch (block.type) {
                            case 'paragraph':
                            case 'header':
                                return block.data.text || '';
                            case 'list':
                                return (block.data.items || []).join(' ');
                            case 'quote':
                                return block.data.text || '';
                            default:
                                return '';
                        }
                    }).join(' ');
                }
            }
            return contentString || '';
        } catch (error) {
            return contentString || '';
        }
    }

    // Calculate readability score (simplified)
    calculateReadability(text) {
        const sentences = text.split(/[.!?]+/).length;
        const words = text.split(/\s+/).length;
        const avgWordsPerSentence = words / sentences;
        
        let score = 100;
        if (avgWordsPerSentence > 20) score -= 20;
        if (avgWordsPerSentence > 30) score -= 20;
        
        return Math.max(0, score);
    }

    // Generate content improvement suggestions
    async generateImprovements(postData) {
        const seoAnalysis = this.calculateSEOScore(postData);
        const keywordSuggestions = this.getKeywordSuggestions(
            this.extractTextFromContent(postData.content) + ' ' + postData.title
        );

        const prompt = `
        Analyze this blog post and suggest improvements:

        Title: "${postData.title}"
        Content: "${this.extractTextFromContent(postData.content).substring(0, 500)}..."
        Current SEO Score: ${seoAnalysis.score}/100

        Available keywords to use: ${keywordSuggestions.slice(0, 5).join(', ')}

        Provide 3-5 specific, actionable improvement suggestions in JSON format:
        {
            "suggestions": [
                {
                    "type": "content|seo|keywords|structure",
                    "priority": "high|medium|low",
                    "suggestion": "Specific improvement suggestion",
                    "reason": "Why this improvement is important"
                }
            ]
        }
        `;

        try {
            const response = await this.generateContent(prompt, 800);
            return JSON.parse(response);
        } catch (error) {
            console.error('Error generating improvements:', error);
            return {
                suggestions: [
                    {
                        type: "keywords",
                        priority: "high",
                        suggestion: `Consider adding these keywords: ${keywordSuggestions.slice(0, 3).join(', ')}`,
                        reason: "These keywords can improve search visibility"
                    }
                ]
            };
        }
    }

    // Auto-improve content
    async autoImproveContent(contentBlocks, targetKeywords) {
        const prompt = `
        Improve this blog content by naturally incorporating these keywords: ${targetKeywords.join(', ')}

        Current content blocks: ${JSON.stringify(contentBlocks)}

        Return improved content in the same EditorJS format, naturally integrating the keywords while maintaining readability and flow.
        `;

        try {
            const response = await this.generateContent(prompt, 1500);
            return JSON.parse(response);
        } catch (error) {
            console.error('Error improving content:', error);
            return contentBlocks; // Return original if improvement fails
        }
    }

    // Generate related post suggestions
    async generateRelatedPosts(currentPost, existingPosts) {
        const prompt = `
        Based on this blog post: "${currentPost.title}"
        
        Suggest 3 related blog post topics that would complement this content for a manufacturing ERP company.

        Return JSON:
        {
            "related_posts": [
                {
                    "title": "Related post title",
                    "reason": "Why it's related",
                    "category": "Technology|Business|Innovation|Industry|Tutorial"
                }
            ]
        }
        `;

        try {
            const response = await this.generateContent(prompt, 600);
            return JSON.parse(response);
        } catch (error) {
            console.error('Error generating related posts:', error);
            return { related_posts: [] };
        }
    }

    // Get comprehensive keyword dashboard data
    getKeywordDashboard(allPosts = []) {
        const dashboard = {
            totalKeywords: this.keywords.length,
            globalUsage: {
                used: new Set(),
                unused: [...this.keywords],
                topKeywords: {},
                coverage: 0
            },
            postAnalytics: [],
            recommendations: []
        };

        // Analyze each post
        for (const post of allPosts) {
            const content = this.extractTextFromContent(post.content);
            const fullText = [post.title, content, post.meta_description, post.keywords].join(' ');
            const analytics = this.getKeywordAnalytics(fullText);
            
            dashboard.postAnalytics.push({
                postId: post.id,
                title: post.title,
                keywordCount: analytics.usedKeywords.length,
                keywordPercentage: ((analytics.usedKeywords.length / this.keywords.length) * 100).toFixed(1),
                topKeywords: analytics.topKeywords.slice(0, 5)
            });

            // Track global usage
            for (const usedKeyword of analytics.usedKeywords) {
                dashboard.globalUsage.used.add(usedKeyword.keyword);
                dashboard.globalUsage.topKeywords[usedKeyword.keyword] = 
                    (dashboard.globalUsage.topKeywords[usedKeyword.keyword] || 0) + usedKeyword.count;
            }
        }

        // Calculate unused keywords
        dashboard.globalUsage.unused = this.keywords.filter(
            keyword => !dashboard.globalUsage.used.has(keyword)
        );

        // Calculate coverage
        dashboard.globalUsage.coverage = 
            ((dashboard.globalUsage.used.size / this.keywords.length) * 100).toFixed(1);

        // Generate recommendations
        dashboard.recommendations = this.generateKeywordRecommendations(dashboard);

        return dashboard;
    }

    // Generate keyword usage recommendations
    generateKeywordRecommendations(dashboard) {
        const recommendations = [];

        // Low coverage recommendation
        if (dashboard.globalUsage.coverage < 20) {
            recommendations.push({
                type: 'coverage',
                priority: 'high',
                title: 'Improve Keyword Coverage',
                description: `Only ${dashboard.globalUsage.coverage}% of available keywords are being used. Consider creating content around unused keywords.`,
                action: 'Create new posts targeting unused keywords',
                keywords: dashboard.globalUsage.unused.slice(0, 10)
            });
        }

        // Underutilized keywords
        const underutilized = dashboard.globalUsage.unused.slice(0, 20);
        if (underutilized.length > 0) {
            recommendations.push({
                type: 'expansion',
                priority: 'medium',
                title: 'Target Underutilized Keywords',
                description: 'These keywords could be integrated into existing or new content.',
                action: 'Update existing posts or create new content',
                keywords: underutilized
            });
        }

        // Content gaps
        const manufacturingKeywords = this.keywords.filter(k => 
            k.includes('manufacturing') || k.includes('production') || k.includes('factory')
        );
        const usedManufacturing = [...dashboard.globalUsage.used].filter(k => 
            k.includes('manufacturing') || k.includes('production') || k.includes('factory')
        );

        if (usedManufacturing.length < manufacturingKeywords.length * 0.3) {
            recommendations.push({
                type: 'content_gap',
                priority: 'high',
                title: 'Manufacturing Content Gap',
                description: 'Need more content focused on core manufacturing topics.',
                action: 'Create manufacturing-focused blog posts',
                keywords: manufacturingKeywords.filter(k => !dashboard.globalUsage.used.has(k)).slice(0, 15)
            });
        }

        return recommendations;
    }

    // Test AI service functionality
    async testAIService() {
        const testResults = {
            apiConnection: false,
            textGeneration: false,
            imageGeneration: false,
            keywordLoading: false,
            errors: []
        };

        try {
            // Test 1: Basic API connection
            console.log('Testing API connection...');
            await this.generateContent("Test", 50);
            testResults.apiConnection = true;
            console.log('✅ API connection successful');
        } catch (error) {
            testResults.errors.push(`API Connection: ${error.message}`);
            console.error('❌ API connection failed:', error.message);
        }

        try {
            // Test 2: Text generation
            console.log('Testing text generation...');
            const testPost = await this.generateBlogPost("Manufacturing Automation");
            if (testPost && testPost.title) {
                testResults.textGeneration = true;
                console.log('✅ Text generation successful');
            }
        } catch (error) {
            testResults.errors.push(`Text Generation: ${error.message}`);
            console.error('❌ Text generation failed:', error.message);
        }

        try {
            // Test 3: Image generation
            console.log('Testing image generation...');
            const testImage = await this.generateImage("A modern factory with robots");
            if (testImage && testImage.imageUrl) {
                testResults.imageGeneration = true;
                console.log('✅ Image generation successful');
            }
        } catch (error) {
            testResults.errors.push(`Image Generation: ${error.message}`);
            console.error('❌ Image generation failed:', error.message);
        }

        // Test 4: Keywords loading
        if (this.keywords.length > 0) {
            testResults.keywordLoading = true;
            console.log(`✅ Keywords loaded: ${this.keywords.length} keywords`);
        } else {
            testResults.errors.push('Keywords: No keywords loaded');
            console.error('❌ No keywords loaded');
        }

        return testResults;
    }

    // Check if service is properly configured
    isConfigured() {
        return !!(this.apiKey && this.endpoints && this.endpoints.text);
    }

    // Get service status
    getStatus() {
        return {
            configured: this.isConfigured(),
            keywordsLoaded: this.isKeywordsLoaded(),
            keywordCount: this.keywords.length,
            uploadedFiles: this.uploadedFiles.size,
            apiKey: this.apiKey ? '✓ Set' : '✗ Missing'
        };
    }
}

// Global AI service instance
window.aiService = new AIService();
