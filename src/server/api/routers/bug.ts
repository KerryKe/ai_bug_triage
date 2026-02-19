import { z } from "zod";
import { createTRPCRouter, publicProcedure } from "~/server/api/trpc";
import { triageBug } from "~/server/ai";

export const bugRouter = createTRPCRouter({
  getAll: publicProcedure.query(async ({ ctx }) => {
    return ctx.db.bug.findMany({
      orderBy: { createdAt: "desc" },
    });
  }),

  create: publicProcedure
    .input(z.object({ title: z.string(), description: z.string() }))
    .mutation(async ({ ctx, input }) => {
      // get ai suggestion, and save to DB
      const aiResponse = await triageBug(input.title, input.description);
      return ctx.db.bug.create({
        data: {
          title: input.title,
          description: input.description,
          severity: aiResponse.severity || "S3",
          area: aiResponse.area || "backend",
        },
      });
    }),

  getById: publicProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const bug = await ctx.db.bug.findUnique({ where: { id: input.id } });
      if (!bug) throw new Error("Bug not found");

      // get duplicates
      const candidates = await ctx.db.bug.findMany({
        where: { id: { not: input.id }, area: bug.area },
        take: 5,
      });

      if (candidates.length === 0) return { bug, potentialDuplicates: [] };

      const prompt = 
      `
        Compare "Bug A" against the candidates.
        Return ONLY a JSON object with a "similar_bugs" array containing objects with "id" and "score" (0.0-1.0).
        
        Bug A: ${bug.title}
        
        Candidates:
        ${candidates.map(c => `ID ${c.id}: ${c.title}`).join("\n")}
      `;

      const aiResult = await triageBug("Similarity Check", prompt);
      const scores = aiResult.similar_bugs || [];
      return {
        bug,
        potentialDuplicates: candidates.map(c => ({
          ...c,
          score: scores.find((s: any) => s.id === c.id)?.score ?? 0.1
        })).sort((a, b) => b.score - a.score)
      };
    }),

  chat: publicProcedure
    .input(z.object({ 
      message: z.string(), 
      bugId: z.number().optional() 
    }))
    .mutation(async ({ ctx, input }) => {
      const recentBugs = await ctx.db.bug.findMany({
        orderBy: { createdAt: 'desc' },
        take: 20,
      });

      // current bug
      const contextString = recentBugs.map(b => {
        const marker = b.id === input.bugId ? " <<< CURRENTLY VIEWING" : "";
        return `[ID: ${b.id}] ${b.title} (Sev: ${b.severity}, Area: ${b.area})${marker}`;
      }).join("\n");






      // hard-core prompt, tested many versions and this is the only one to make gemini return json structure
      const prompt = 
      `
        You are an Admin Bug Agent with database write access.
        
        CURRENT BUGS CONTEXT:
        ${contextString}

        USER REQUEST: "${input.message}"
        
        INSTRUCTIONS:
        If the user asks to modify data, return a JSON object with an "action" field.
        
        1. TO FIX SEVERITY:
           If user says "Change bug 5 to S0" or "Fix severity for [title]", return:
           { "action": "UPDATE_SEVERITY", "bugId": 123, "newSeverity": "S0" }
           If user says "Change THIS bug", use the ID marked "CURRENTLY VIEWING".
           
        2. TO DEDUPLICATE/COLLAPSE:
           If user says "Merge bug A and B" or "Deduplicate this", pick the best survivor.
           { "action": "DEDUPLICATE", "keepId": 123, "mergeId": 456 }
           
        3. GENERAL CHAT:
           If no modification is needed, just return plain text.
      `;







      const response = await triageBug("Agent Chat", prompt);

      // update severity:
      if (response.action === "UPDATE_SEVERITY") {
        const { bugId, newSeverity } = response;
        const targetId = bugId || input.bugId;
        if (!targetId || !newSeverity) return { reply: "Error: Could not identify which bug to update." };

        await ctx.db.bug.update({
          where: { id: targetId },
          data: { severity: newSeverity }
        });
        return { reply: `✅ Successfully changed Bug #${targetId} to ${newSeverity}.` };
      }

      // deduplicate:
      if (response.action === "DEDUPLICATE") {
        const { keepId, mergeId } = response;
        if (!keepId || !mergeId) return { reply: "Error: Could not identify bugs to merge." };

        const bugToMerge = await ctx.db.bug.findUnique({ where: { id: mergeId } });
        const bugToKeep = await ctx.db.bug.findUnique({ where: { id: keepId } });
        
        if (bugToMerge && bugToKeep) {
          const newDesc = `${bugToKeep.description}\n\n--- Merged Content from Bug #${mergeId} ---\n${bugToMerge.description}`;
          
          await ctx.db.$transaction([
            ctx.db.bug.update({
              where: { id: keepId },
              data: { description: newDesc }
            }),
            ctx.db.bug.update({
              where: { id: mergeId },
              data: { status: "DUPLICATE", title: `[DUPLICATE] ${bugToMerge.title}` }
            })
          ]);
          return { reply: `✅ Merged Bug #${mergeId} into Bug #${keepId}. The duplicate is now closed.` };
        }
      }

      // default:
      return { 
        reply: response.reply || response.analysis || "I couldn't process that request." 
      };
    }),
});