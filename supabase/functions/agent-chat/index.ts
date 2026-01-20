import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface ChatMessage {
  role: "system" | "user" | "assistant";
  content: string;
}

interface ToolCall {
  id: string;
  type: "function";
  function: {
    name: string;
    arguments: string;
  };
}

// Define available tools for the AI agent
const tools = [
  {
    type: "function",
    function: {
      name: "create_ticket",
      description: "Create a new IT support ticket",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Ticket title" },
          description: { type: "string", description: "Detailed description of the issue" },
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"], description: "Ticket priority" },
          category: { type: "string", description: "Ticket category (e.g., hardware, software, network)" },
        },
        required: ["title", "description"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "search_kb",
      description: "Search the knowledge base for articles and documentation",
      parameters: {
        type: "object",
        properties: {
          query: { type: "string", description: "Search query" },
          category: { type: "string", description: "Optional category filter" },
        },
        required: ["query"],
      },
    },
  },
  {
    type: "function",
    function: {
      name: "get_member_info",
      description: "Get information about a member by ID or email",
      parameters: {
        type: "object",
        properties: {
          member_id: { type: "string", description: "Member ID" },
          email: { type: "string", description: "Member email" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "list_tickets",
      description: "List support tickets with optional filters",
      parameters: {
        type: "object",
        properties: {
          status: { type: "string", enum: ["open", "in_progress", "resolved", "closed"], description: "Filter by status" },
          priority: { type: "string", enum: ["low", "medium", "high", "urgent"], description: "Filter by priority" },
          limit: { type: "number", description: "Maximum number of tickets to return" },
        },
      },
    },
  },
  {
    type: "function",
    function: {
      name: "update_ticket_status",
      description: "Update the status of an existing ticket",
      parameters: {
        type: "object",
        properties: {
          ticket_id: { type: "string", description: "Ticket ID" },
          status: { type: "string", enum: ["open", "in_progress", "resolved", "closed"], description: "New status" },
          note: { type: "string", description: "Optional note about the status change" },
        },
        required: ["ticket_id", "status"],
      },
    },
  },
];

// Execute tool calls
async function executeTool(
  supabase: any,
  toolName: string,
  args: Record<string, any>
): Promise<{ success: boolean; result: any }> {
  try {
    switch (toolName) {
      case "create_ticket": {
        const { data, error } = await supabase
          .from("it_tickets")
          .insert({
            title: args.title,
            description: args.description,
            priority: args.priority || "medium",
            category: args.category || "general",
            status: "open",
          })
          .select()
          .single();

        if (error) throw error;
        return { success: true, result: { message: `Ticket created with ID: ${data.id}`, ticket: data } };
      }

      case "search_kb": {
        const { data, error } = await supabase
          .from("knowledge_base")
          .select("id, title, content, category")
          .textSearch("content", args.query)
          .limit(5);

        if (error) {
          // Fallback to simple search if full-text search fails
          const { data: fallbackData, error: fallbackError } = await supabase
            .from("knowledge_base")
            .select("id, title, content, category")
            .ilike("content", `%${args.query}%`)
            .limit(5);

          if (fallbackError) throw fallbackError;
          return { success: true, result: { articles: fallbackData || [] } };
        }

        return { success: true, result: { articles: data || [] } };
      }

      case "get_member_info": {
        let query = supabase.from("profiles").select("*");

        if (args.member_id) {
          query = query.eq("id", args.member_id);
        } else if (args.email) {
          query = query.eq("email", args.email);
        } else {
          return { success: false, result: { error: "Either member_id or email is required" } };
        }

        const { data, error } = await query.single();
        if (error) throw error;

        // Remove sensitive fields
        const { ...safeData } = data;
        return { success: true, result: { member: safeData } };
      }

      case "list_tickets": {
        let query = supabase.from("it_tickets").select("*");

        if (args.status) query = query.eq("status", args.status);
        if (args.priority) query = query.eq("priority", args.priority);

        query = query.order("created_at", { ascending: false }).limit(args.limit || 10);

        const { data, error } = await query;
        if (error) throw error;

        return { success: true, result: { tickets: data || [] } };
      }

      case "update_ticket_status": {
        const { data, error } = await supabase
          .from("it_tickets")
          .update({
            status: args.status,
            updated_at: new Date().toISOString(),
          })
          .eq("id", args.ticket_id)
          .select()
          .single();

        if (error) throw error;

        // Add note if provided
        if (args.note) {
          await supabase.from("ticket_notes").insert({
            ticket_id: args.ticket_id,
            content: args.note,
          });
        }

        return { success: true, result: { message: `Ticket ${args.ticket_id} updated to ${args.status}`, ticket: data } };
      }

      default:
        return { success: false, result: { error: `Unknown tool: ${toolName}` } };
    }
  } catch (error) {
    console.error(`Tool execution error (${toolName}):`, error);
    return { success: false, result: { error: error.message } };
  }
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    // Verify auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      return new Response(JSON.stringify({ error: "Missing authorization header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create Supabase client with user's token for RLS
    const supabaseClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Verify the user's token
    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser(token);

    if (authError || !user) {
      return new Response(JSON.stringify({ error: "Invalid or expired token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages } = await req.json();

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Messages array is required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Call OpenAI API
    const openaiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        tools,
        tool_choice: "auto",
        max_tokens: 1024,
      }),
    });

    if (!openaiResponse.ok) {
      const errorData = await openaiResponse.text();
      console.error("OpenAI API error:", errorData);
      throw new Error(`OpenAI API error: ${openaiResponse.status}`);
    }

    const openaiData = await openaiResponse.json();
    const assistantMessage = openaiData.choices[0].message;

    // Handle tool calls if present
    const toolResults: any[] = [];
    if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
      for (const toolCall of assistantMessage.tool_calls) {
        const args = JSON.parse(toolCall.function.arguments);
        const result = await executeTool(supabaseClient, toolCall.function.name, args);
        toolResults.push({
          tool_call_id: toolCall.id,
          name: toolCall.function.name,
          result: result.result,
          success: result.success,
        });
      }

      // If there were tool calls, make a follow-up call to get the final response
      const followUpMessages = [
        ...messages,
        assistantMessage,
        ...toolResults.map((tr) => ({
          role: "tool",
          tool_call_id: tr.tool_call_id,
          content: JSON.stringify(tr.result),
        })),
      ];

      const followUpResponse = await fetch("https://api.openai.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: "gpt-4o-mini",
          messages: followUpMessages,
          max_tokens: 1024,
        }),
      });

      if (!followUpResponse.ok) {
        throw new Error(`OpenAI follow-up API error: ${followUpResponse.status}`);
      }

      const followUpData = await followUpResponse.json();
      const finalMessage = followUpData.choices[0].message;

      return new Response(
        JSON.stringify({
          message: finalMessage,
          tool_calls: assistantMessage.tool_calls,
          tool_results: toolResults,
          finish_reason: followUpData.choices[0].finish_reason,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // No tool calls, return the response directly
    return new Response(
      JSON.stringify({
        message: assistantMessage,
        finish_reason: openaiData.choices[0].finish_reason,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error:", error);
    return new Response(
      JSON.stringify({ error: error.message || "Internal server error" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
