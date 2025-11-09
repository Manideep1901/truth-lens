import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { imageUrl } = await req.json();
    console.log('Analyzing image:', imageUrl);

    if (!imageUrl) {
      throw new Error('Image URL is required');
    }

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    // Call Lovable AI to analyze the image
    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          {
            role: 'system',
            content: `You are an expert deepfake detection AI. Analyze images to determine if they are real or AI-generated/manipulated. 
            Consider factors like:
            - Unnatural facial features or proportions
            - Inconsistent lighting or shadows
            - Artifacts around edges
            - Unusual skin texture
            - Misaligned features
            - Digital manipulation signs
            
            Respond ONLY with a JSON object in this exact format:
            {"isReal": true/false, "score": number between 0-100, "reasoning": "brief explanation"}
            
            Score interpretation:
            - 0-30: Highly confident it's a deepfake
            - 30-50: Likely a deepfake
            - 50-70: Uncertain/borderline
            - 70-90: Likely real
            - 90-100: Highly confident it's real`
          },
          {
            role: 'user',
            content: [
              {
                type: 'text',
                text: 'Analyze this image for deepfake indicators. Is it real or AI-generated?'
              },
              {
                type: 'image_url',
                image_url: {
                  url: imageUrl
                }
              }
            ]
          }
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI gateway error:', response.status, errorText);
      
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: 'Rate limit exceeded. Please try again later.' }),
          { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: 'AI credits depleted. Please add credits to continue.' }),
          { status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      throw new Error(`AI gateway error: ${response.status}`);
    }

    const data = await response.json();
    console.log('AI response:', JSON.stringify(data));
    
    const aiContent = data.choices[0].message.content;
    console.log('AI content:', aiContent);

    // Parse the AI response
    let result;
    try {
      // Try to extract JSON from the response
      const jsonMatch = aiContent.match(/\{[^}]+\}/);
      if (jsonMatch) {
        result = JSON.parse(jsonMatch[0]);
      } else {
        // Fallback: analyze the text response
        const isReal = aiContent.toLowerCase().includes('real') && 
                      !aiContent.toLowerCase().includes('not real') &&
                      !aiContent.toLowerCase().includes('fake') &&
                      !aiContent.toLowerCase().includes('deepfake');
        
        // Extract confidence if mentioned
        const scoreMatch = aiContent.match(/(\d+)%/);
        const score = scoreMatch ? parseInt(scoreMatch[1]) : (isReal ? 75 : 25);
        
        result = {
          isReal,
          score,
          reasoning: aiContent
        };
      }
    } catch (parseError) {
      console.error('Failed to parse AI response:', parseError);
      // Fallback result
      result = {
        isReal: true,
        score: 50,
        reasoning: 'Unable to determine with high confidence'
      };
    }

    console.log('Final result:', result);

    return new Response(
      JSON.stringify({
        isReal: result.isReal,
        score: result.score,
        reasoning: result.reasoning
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    console.error('Error in analyze-deepfake function:', error);
    const errorMessage = error instanceof Error ? error.message : 'Failed to analyze image';
    const errorDetails = error instanceof Error ? error.toString() : String(error);
    
    return new Response(
      JSON.stringify({ 
        error: errorMessage,
        details: errorDetails
      }),
      {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  }
});
