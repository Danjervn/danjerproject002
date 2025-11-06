require('dotenv').config({ path: 'key.env' });
const express = require('express');
const axios = require('axios');
const cors = require('cors');

const app = express();

// CORS configuration - CHO PHÉP TẤT CẢ NGUỒN
app.use(cors());

// Parse JSON body
app.use(express.json());

// Middleware log requests
app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
    console.log('Origin:', req.headers.origin);
    next();
});

// Root endpoint
app.get('/', (req, res) => {
    res.json({ 
        status: 'Server is running',
        endpoints: {
            'GET /test': 'Test connection',
            'GET /health': 'Health check',
            'POST /ai-chat': 'AI Chat endpoint'
        }
    });
});

// Test endpoint
app.get('/test', (req, res) => {
    console.log('✅ Test endpoint called');
    res.json({ 
        message: 'Server is working!', 
        timestamp: new Date().toISOString(),
        status: 'OK'
    });
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ 
        status: 'healthy',
        timestamp: new Date().toISOString(),
        groq_api_configured: !!process.env.GROQ_API_KEY
    });
});

// AI Chat endpoint - MAIN ROUTE
app.post('/ai-chat', async (req, res) => {
    console.log('🤖 AI Chat endpoint called');
    console.log('Request body:', req.body);
    
    const { messages } = req.body;
    
    if (!messages || !Array.isArray(messages)) {
        console.error('❌ Invalid messages format');
        return res.status(400).json({ 
            error: 'Messages must be an array',
            received: req.body
        });
    }
    
    if (!process.env.GROQ_API_KEY) {
        console.error('❌ GROQ_API_KEY not configured');
        return res.status(500).json({ 
            error: 'GROQ_API_KEY not configured in environment variables'
        });
    }

    console.log('🔑 Calling Groq API...');

    try {
        const response = await axios.post(
            'https://api.groq.com/openai/v1/chat/completions',
            {
                model: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
                messages: messages,
                max_tokens: 500,
                temperature: 0.7
            },
            {
                headers: { 
                    "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
                    "Content-Type": "application/json"
                },
                timeout: 30000
            }
        );
        
        console.log('✅ Groq API response received');
        res.json(response.data);
        
    } catch (err) {
        console.error('❌ Groq API error:', err.message);
        
        if (err.response) {
            console.error('Response error:', err.response.status, err.response.data);
            res.status(err.response.status).json({ 
                error: `Groq API Error: ${err.response.status}`,
                details: err.response.data
            });
        } else if (err.request) {
            console.error('No response from Groq API');
            res.status(503).json({ 
                error: 'Cannot connect to Groq API',
                details: 'Network error or timeout'
            });
        } else {
            console.error('Other error:', err.message);
            res.status(500).json({ 
                error: 'Internal server error',
                details: err.message
            });
        }
    }
});

// Error handler - PHẢI ĐẶT CUỐI CÙNG
app.use((err, req, res, next) => {
    console.error('💥 Unhandled error:', err);
    res.status(500).json({
        error: 'Internal server error',
        details: err.message
    });
});

// Handle 404 - PHẢI ĐẶT SAU TẤT CẢ ROUTES
app.use((req, res) => {
    console.log(`❌ 404 - Route not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({ 
        error: 'Route not found',
        method: req.method,
        url: req.originalUrl,
        hint: 'Available endpoints: GET /, GET /test, GET /health, POST /ai-chat'
    });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n🚀 Groq Proxy Server running on http://localhost:${PORT}`);
    console.log(`📗 Test URL: http://localhost:${PORT}/test`);
    console.log(`❤️  Health: http://localhost:${PORT}/health`);
    console.log(`🤖 AI Chat: POST http://localhost:${PORT}/ai-chat`);
    console.log(`🔑 API Key: ${process.env.GROQ_API_KEY ? '✅ Configured' : '❌ Missing'}\n`);
});
