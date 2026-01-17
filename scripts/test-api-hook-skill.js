// Test Hook and Skill API Integration
const path = require('path');
const fs = require('fs');

// Load .env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match && !process.env[match[1]]) {
            process.env[match[1]] = match[2];
        }
    });
}

const ZAI_TOKEN = process.env.ZAI_TOKEN;
const GEMINI_TOKEN = process.env.GEMINI_TOKEN;

// Try different endpoints
const ZAI_API_URLS = {
    international: 'https://api.z.ai/api/paas/v4/chat/completions',
    coding: 'https://api.z.ai/api/coding/paas/v4/chat/completions',
    china: 'https://open.bigmodel.cn/api/paas/v4/chat/completions',
};
const GEMINI_API_URL = 'https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent';

async function testGLM47AllEndpoints() {
    console.log('\n=== GLM4.7 Basic Test (all endpoints) ===');

    for (const [name, url] of Object.entries(ZAI_API_URLS)) {
        console.log(`\nTrying ${name} endpoint: ${url}`);
        try {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${ZAI_TOKEN}`,
                },
                body: JSON.stringify({
                    model: 'glm-4.7',
                    messages: [
                        { role: 'system', content: 'You are a helpful assistant. Respond briefly.' },
                        { role: 'user', content: 'Say hello in Korean.' },
                    ],
                    max_tokens: 100,
                    stream: false,
                }),
            });

            console.log('Status:', response.status);

            if (!response.ok) {
                const errorText = await response.text();
                console.error('Error:', errorText.substring(0, 200));
                continue;
            }

            const result = await response.json();
            console.log('Response:', result.choices?.[0]?.message?.content);
            return { success: true, endpoint: name };
        } catch (err) {
            console.error('Exception:', err.message);
        }
    }
    return { success: false, error: 'All endpoints failed' };
}

async function testGeminiSkillPrompt() {
    console.log('\n=== Gemini Skill System Prompt Test ===');

    const skillSystemPrompt = `You are an AI assistant with access to skills.

Available skills:
- code-review: Analyzes code for bugs, style issues, and best practices
- test-writer: Generates comprehensive unit tests for code
- doc-generator: Creates documentation from source code

When asked about code review, testing, or documentation, mention that you can use the corresponding skill.
Keep responses concise (1-2 sentences).`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_TOKEN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: skillSystemPrompt }] },
                contents: [{
                    role: 'user',
                    parts: [{ text: 'Can you help me review this function: function add(a,b){return a+b}' }]
                }],
                generationConfig: { maxOutputTokens: 300 },
            }),
        });

        console.log('Status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error:', errorText);
            return { success: false, error: errorText };
        }

        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('Response:', text);

        const mentionsSkill = text.toLowerCase().includes('skill') ||
                              text.toLowerCase().includes('code-review') ||
                              text.toLowerCase().includes('review');
        console.log('Skill awareness:', mentionsSkill ? 'YES' : 'NO');

        return { success: true, mentionsSkill };
    } catch (err) {
        console.error('Exception:', err.message);
        return { success: false, error: err.message };
    }
}

async function testGeminiToolCall() {
    console.log('\n=== Gemini Tool Call Test ===');

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_TOKEN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: {
                    parts: [{
                        text: 'You are a coding assistant. When asked to review code, you MUST use the use_skill function with skill_name="code-review". Do not respond with text, only use the function.'
                    }]
                },
                contents: [{
                    role: 'user',
                    parts: [{ text: 'Please review this code: const x = undefined; x.toString();' }]
                }],
                tools: [{
                    functionDeclarations: [{
                        name: 'use_skill',
                        description: 'Activates a skill by name to get specialized instructions',
                        parameters: {
                            type: 'object',
                            properties: {
                                skill_name: { type: 'string', description: 'Name of the skill to activate' }
                            },
                            required: ['skill_name']
                        }
                    }]
                }],
                generationConfig: { maxOutputTokens: 500 },
            }),
        });

        console.log('Status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error:', errorText);
            return { success: false, error: errorText };
        }

        const result = await response.json();
        const content = result.candidates?.[0]?.content;
        const hasFunctionCall = content?.parts?.some(p => p.functionCall);

        if (hasFunctionCall) {
            const funcCall = content.parts.find(p => p.functionCall);
            console.log('Tool called:', funcCall.functionCall.name);
            console.log('Arguments:', JSON.stringify(funcCall.functionCall.args));
            return { success: true, toolCalled: true, toolName: funcCall.functionCall.name };
        } else {
            console.log('Text response (no tool call):', content?.parts?.[0]?.text?.substring(0, 200));
            return { success: true, toolCalled: false };
        }
    } catch (err) {
        console.error('Exception:', err.message);
        return { success: false, error: err.message };
    }
}

async function testGeminiHookContext() {
    console.log('\n=== Gemini Hook Context Test ===');

    const hookSystemPrompt = `You are an AI assistant with hooks enabled.

Active hooks:
- TaskStart: Runs when a new task begins, can inject project context
- PreToolUse: Runs before executing any tool, can validate or block
- PostToolUse: Runs after tool execution, can log or verify results
- TaskComplete: Runs when task finishes, can summarize changes

When asked about your capabilities for automation or task management, explain the hook system briefly.`;

    try {
        const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_TOKEN}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                systemInstruction: { parts: [{ text: hookSystemPrompt }] },
                contents: [{
                    role: 'user',
                    parts: [{ text: 'What automation features do you have for managing tasks?' }]
                }],
                generationConfig: { maxOutputTokens: 400 },
            }),
        });

        console.log('Status:', response.status);

        if (!response.ok) {
            const errorText = await response.text();
            console.error('Error:', errorText);
            return { success: false, error: errorText };
        }

        const result = await response.json();
        const text = result.candidates?.[0]?.content?.parts?.[0]?.text || '';
        console.log('Response:', text);

        const mentionsHooks = text.toLowerCase().includes('hook') ||
                              text.toLowerCase().includes('taskstart') ||
                              text.toLowerCase().includes('pretooluse');
        console.log('Hook awareness:', mentionsHooks ? 'YES' : 'NO');

        return { success: true, mentionsHooks };
    } catch (err) {
        console.error('Exception:', err.message);
        return { success: false, error: err.message };
    }
}

async function main() {
    console.log('========================================');
    console.log('Hook and Skill API Integration Test');
    console.log('========================================');

    const results = {};

    // Test GLM4.7
    results.glm47 = await testGLM47AllEndpoints();

    // Test Gemini
    results.geminiSkillPrompt = await testGeminiSkillPrompt();
    results.geminiToolCall = await testGeminiToolCall();
    results.geminiHookContext = await testGeminiHookContext();

    // Summary
    console.log('\n========================================');
    console.log('SUMMARY');
    console.log('========================================');

    console.log('\n[GLM4.7]');
    if (results.glm47.success) {
        console.log(`  Status: PASS (via ${results.glm47.endpoint} endpoint)`);
    } else {
        console.log(`  Status: FAIL - ${results.glm47.error?.substring(0, 100)}`);
    }

    console.log('\n[Gemini]');
    console.log('  Skill Prompt:', results.geminiSkillPrompt.success ? 'PASS' : 'FAIL');
    if (results.geminiSkillPrompt.success) {
        console.log('    - Skill awareness:', results.geminiSkillPrompt.mentionsSkill ? 'YES' : 'NO');
    }

    console.log('  Tool Call:', results.geminiToolCall.success ? 'PASS' : 'FAIL');
    if (results.geminiToolCall.success) {
        console.log('    - Tool called:', results.geminiToolCall.toolCalled ? `YES (${results.geminiToolCall.toolName})` : 'NO');
    }

    console.log('  Hook Context:', results.geminiHookContext.success ? 'PASS' : 'FAIL');
    if (results.geminiHookContext.success) {
        console.log('    - Hook awareness:', results.geminiHookContext.mentionsHooks ? 'YES' : 'NO');
    }

    // Final result
    const geminiPassed = results.geminiSkillPrompt.success &&
                         results.geminiToolCall.success &&
                         results.geminiHookContext.success;

    console.log('\n========================================');
    console.log('FINAL RESULT');
    console.log('========================================');
    console.log('GLM4.7:', results.glm47.success ? 'PASS' : 'FAIL');
    console.log('Gemini:', geminiPassed ? 'PASS' : 'FAIL');

    // Return exit code
    process.exit(geminiPassed ? 0 : 1);
}

main().catch(err => {
    console.error('Fatal error:', err);
    process.exit(1);
});
