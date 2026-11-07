import Anthropic from "@anthropic-ai/sdk";

const SYSTEM_PROMPT = `You write posts for Valley Brews, a weekly feed of specials and events from businesses in State College, PA. A manager gives you a rough note. Turn it into a finished post, using only what the note says. Never invent prices, times, or offers.

Fields:
- title: short and specific, under 60 characters.
- date: the next date this happens, as YYYY-MM-DD, worked out from today's date. If the note names no day, use today.
- start_time: 24-hour HH:MM. Use "" if the note gives no time.
- end_time: 24-hour HH:MM, "close" if it runs until close, or "" if the note doesn't say.
- category: Specials for deals, Events for live music, trivia and similar, Food for food-only offers, Game Day for anything tied to a Penn State football game.
- is_21_plus: true if the post involves alcohol or a bar-only event.
- description: one or two plain sentences for the feed.
- instagram_caption: friendly, in a local voice, with up to 3 hashtags.
- text_message: one short line, 160 characters at most.

Posts are about deals and events, not drinking a lot. Never encourage heavy or fast drinking, and avoid words like "wasted", "hammered", or "shots shots shots". Add "21+" to the caption and the text message whenever is_21_plus is true.`;

const POST_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    date: { type: "string" },
    start_time: { type: "string" },
    end_time: { type: "string" },
    category: { type: "string", enum: ["Specials", "Events", "Food", "Game Day"] },
    is_21_plus: { type: "boolean" },
    description: { type: "string" },
    instagram_caption: { type: "string" },
    text_message: { type: "string" },
  },
  required: [
    "title",
    "date",
    "start_time",
    "end_time",
    "category",
    "is_21_plus",
    "description",
    "instagram_caption",
    "text_message",
  ],
  additionalProperties: false,
};

// Turns a manager's rough note into a structured post.
export async function writePost(note) {
  const client = new Anthropic();

  const today = new Date().toLocaleDateString("en-US", {
    timeZone: "America/New_York",
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const response = await client.beta.messages.create({
    model: "claude-opus-5-5",
    max_tokens: 16000,
    betas: ["server-side-fallback-2026-07-01"],
    fallbacks: "default",
    system: SYSTEM_PROMPT,
    output_config: {
      effort: "low",
      format: { type: "json_schema", schema: POST_SCHEMA },
    },
    messages: [{ role: "user", content: `Today is ${today}.\n\nManager's note:\n${note}` }],
  });

  if (response.stop_reason !== "end_turn") {
    throw new Error(`Post not finished: ${response.stop_reason}`);
  }

  const textBlock = response.content.find((block) => block.type === "text");
  return JSON.parse(textBlock.text);
}
