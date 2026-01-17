// Test GLM4.7 Streaming Mode
const fs = require('fs');
const path = require('path');

// Load .env
const envPath = path.resolve(__dirname, '../.env');
if (fs.existsSync(envPath)) {
    fs.readFileSync(envPath, 'utf-8').split('\n').forEach((line) => {
        const match = line.match(/^([^=]+)=(.*)$/);
        if (match && !process.env[match[1]]) {
            process.env[match[1]] = match[2];
        }
    });
}

const ZAI_TOKEN = process.env.ZAI_TOKEN;

async function testGLM47Streaming() {
    console.log('=== GLM4.7 Streaming Test (coding endpoint) ===');
    console.log('Token:', ZAI_TOKEN ? ZAI_TOKEN.substring(0, 10) + '...' : 'NOT SET');

    const response = await fetch('https://api.z.ai/api/coding/paas/v4/chat/completions', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${ZAI_TOKEN}`,
        },
        body: JSON.stringify({
            model: 'glm-4.7',
            messages: [
                { role: 'system', content: 'You are a helpful assistant. Respond briefly.' },
                { role: 'user', content: 'Say hello in Korean!' },
            ],
            max_tokens: 500,
            stream: true,
            thinking: { type: "enabled" },
        }),
    });

    console.log('Status:', response.status);

    if (!response.ok) {
        console.error('Error:', await response.text());
        return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let fullContent = '';

    console.log('\n--- Streaming Response ---');

    while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(l => l.startsWith('data: '));

        for (const line of lines) {
            const data = line.slice(6);
            if (data === '[DONE]') continue;
            try {
                const json = JSON.parse(data);
                const content = json.choices?.[0]?.delta?.content || '';
                const reasoning = json.choices?.[0]?.delta?.reasoning_content || '';

                if (reasoning) {
                    process.stdout.write(`[think] ${reasoning}`);
                }
                if (content) {
                    fullContent += content;
                    process.stdout.write(content);
                }
            } catch (e) {
                // ignore parse errors
            }
        }
    }

    console.log('\n--- End ---');
    console.log('\nFull response:', fullContent);
    console.log('SUCCESS:', fullContent.length > 0 ? 'YES ✅' : 'NO ❌');
}

testGLM47Streaming().catch(console.error);
