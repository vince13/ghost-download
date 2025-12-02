/**
 * Shared LLM Processing Module
 * Extracted from llm-process.js to allow direct imports without HTTP calls
 */

async function retrieveRAGContext(text, userId) {
  const pineconeApiKey = process.env.PINECONE_API_KEY;
  if (!pineconeApiKey || !userId) {
    return null;
  }

  try {
    // Use the retrieve-rag API endpoint
    const baseUrl = process.env.VERCEL_URL 
      ? `https://${process.env.VERCEL_URL}` 
      : process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:5173';
    
    const response = await fetch(`${baseUrl}/api/retrieve-rag`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        userId,
        query: text,
        topK: 5
      })
    });

    if (response.ok) {
      const { context } = await response.json();
      return context;
    }
    
    return null;
  } catch (error) {
    console.error('[llmProcessor] RAG retrieval error:', error);
    return null;
  }
}

function buildSystemPrompt(triggers, ragContext, customPrompt) {
  // Use custom playbook prompt if provided, otherwise use default
  let prompt = customPrompt || `You are GHOST, an undetectable, real-time auditory co-pilot for a B2B sales professional.

RULES OF ENGAGEMENT:
1. Persona: You are a hyper-focused, concise coach. Your tone must be neutral, calm, and authoritative.
2. Output Format: Your response MUST be a single, short sentence (max 10 words). You must only give the instruction. Do NOT use conversational fillers like "I recommend," "Hello," or "The answer is."
3. Latency is Critical: Prioritize speed. If the instruction is complex, give the most immediate actionable step only.
4. Grounded Response: All facts and counter-arguments must be based ONLY on the [CONTEXT] provided below. If the context does not contain the necessary information, you must instruct the user to use a generic soft skill cue.

COACHING CUE EXAMPLES:
- For price objections: "Ask: What would make this a no-brainer?" or "Reframe around ROI and value."
- For competitor mentions: "Pivot to Total Cost of Ownership." or "Highlight our unique differentiator."
- For timeline urgency: "Emphasize quick implementation timeline." or "Offer expedited onboarding option."
- For general objections: "Acknowledge concern, then probe deeper." or "Ask: What's driving this concern?"

`;

  if (ragContext) {
    prompt += `CONTEXT (from Knowledge Base):\n${ragContext}\n\n`;
  }

  prompt += `TRIGGER ANALYSIS:
- Objection detected: ${triggers.objection ? 'YES' : 'NO'}
- Competitor mentioned: ${triggers.competitor ? 'YES' : 'NO'}
- Timeline urgency: ${triggers.timeline ? 'YES' : 'NO'}

Generate a concise, actionable coaching cue (max 10 words) that helps the salesperson respond effectively to the customer's statement.`;

  return prompt;
}

async function callGemini(systemPrompt, userText, apiKey) {
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash-exp:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\nCustomer: ${userText}` }] }],
        generationConfig: {
          maxOutputTokens: 50,
          temperature: 0.3
        }
      })
    }
  );

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Gemini API error: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
  }

  const data = await response.json();
  const cue = data.candidates?.[0]?.content?.parts?.[0]?.text?.trim();
  
  if (!cue) {
    throw new Error('No response from Gemini');
  }

  // Enforce 10-word limit
  return cue.split(' ').slice(0, 10).join(' ');
}

async function callOpenAI(systemPrompt, userText, apiKey) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'gpt-4o-mini',
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Customer: ${userText}` }
      ],
      max_tokens: 50,
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`OpenAI API error: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
  }

  const data = await response.json();
  const cue = data.choices?.[0]?.message?.content?.trim();
  
  if (!cue) {
    throw new Error('No response from OpenAI');
  }

  // Enforce 10-word limit
  return cue.split(' ').slice(0, 10).join(' ');
}

export function getFallbackCue(triggers) {
  // More contextual fallback cues based on trigger type
  if (triggers.objection) {
    // Randomly select from objection handling cues
    const objectionCues = [
      'Ask: What would make this a no-brainer?',
      'Reframe around ROI and value.',
      'Acknowledge concern, then probe deeper.',
      'Ask: What\'s driving this concern?',
      'Highlight long-term cost savings.',
      'Pivot to value over price.'
    ];
    return objectionCues[Math.floor(Math.random() * objectionCues.length)];
  }
  if (triggers.competitor) {
    const competitorCues = [
      'Pivot to Total Cost of Ownership.',
      'Highlight our unique differentiator.',
      'Ask: What\'s missing from their solution?',
      'Emphasize our competitive advantage.'
    ];
    return competitorCues[Math.floor(Math.random() * competitorCues.length)];
  }
  if (triggers.timeline) {
    const timelineCues = [
      'Emphasize quick implementation timeline.',
      'Offer expedited onboarding option.',
      'Highlight fast time-to-value.',
      'Ask: What\'s the deadline driving this?'
    ];
    return timelineCues[Math.floor(Math.random() * timelineCues.length)];
  }
  return 'Wait. Let the client finish.';
}

async function callGroq(systemPrompt, userText, apiKey) {
  // Groq uses OpenAI-compatible API format
  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: 'llama-3.1-8b-instant', // Fast, free model perfect for short responses
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: `Customer: ${userText}` }
      ],
      max_tokens: 50,
      temperature: 0.3
    })
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`Groq API error: ${response.status} ${response.statusText} - ${errorText.substring(0, 200)}`);
  }

  const data = await response.json();
  const cue = data.choices?.[0]?.message?.content?.trim();
  
  if (!cue) {
    throw new Error('No response from Groq');
  }

  // Enforce 10-word limit
  return cue.split(' ').slice(0, 10).join(' ');
}

export async function generateCoachingCue({ text, triggers, ragContext, userId, customPrompt }) {
  const groqApiKey = process.env.GROQ_API_KEY;
  const geminiApiKey = process.env.GEMINI_API_KEY;
  const openaiApiKey = process.env.OPENAI_API_KEY;

  const systemPrompt = buildSystemPrompt(triggers, ragContext, customPrompt);

  // Try Groq first (free, fast, perfect for this use case)
  if (groqApiKey) {
    try {
      console.log('[llmProcessor] Using Groq API (free, fast)');
      return await callGroq(systemPrompt, text, groqApiKey);
    } catch (error) {
      console.warn('[llmProcessor] Groq failed, trying fallback:', error.message);
      // Fall through to other providers
    }
  }

  // Fallback to Gemini
  if (geminiApiKey) {
    try {
      console.log('[llmProcessor] Using Gemini API');
      return await callGemini(systemPrompt, text, geminiApiKey);
    } catch (error) {
      console.warn('[llmProcessor] Gemini failed, trying OpenAI:', error.message);
      // Fall through to OpenAI
    }
  }

  // Fallback to OpenAI
  if (openaiApiKey) {
    try {
      console.log('[llmProcessor] Using OpenAI API');
      return await callOpenAI(systemPrompt, text, openaiApiKey);
    } catch (error) {
      console.warn('[llmProcessor] OpenAI failed, using fallback:', error.message);
    }
  }

  // No API keys or all failed - return fallback
  console.log('[llmProcessor] No API keys available or all failed, using fallback');
  return getFallbackCue(triggers);
}

export async function processWithLLM({ text, triggers, userId, customPrompt }) {
  try {
    // Step 1: Retrieve RAG context from Pinecone (if KB is available)
    const ragContext = await retrieveRAGContext(text, userId);
    if (ragContext) {
      console.log('[llmProcessor] ✅ RAG context retrieved:', ragContext.substring(0, 200) + '...');
    } else {
      console.log('[llmProcessor] ℹ️ No RAG context available (no KB or no matches)');
    }

    // Step 2: Generate coaching cue with LLM
    const coachingCue = await generateCoachingCue({
      text,
      triggers,
      ragContext,
      userId,
      customPrompt
    });

    return {
      coachingCue,
      source: 'llm',
      ragUsed: !!ragContext
    };
  } catch (error) {
    console.error('[llmProcessor] LLM processing error:', error);
    
    // Fallback to generic cues if LLM fails
    const fallbackCue = getFallbackCue(triggers);
    return {
      coachingCue: fallbackCue,
      source: 'fallback',
      error: error.message
    };
  }
}

