import "dotenv/config";
import { Bot, Context } from "grammy";
import {
  type ConversationFlavor,
  conversations,
  createConversation,
} from "@grammyjs/conversations";
import { rentProperty } from "./conversations";
const TOKEN = process.env.TOKEN;

if (!TOKEN) {
  console.log(
    "Token is null, please specify TOKEN variable in the environment variables or in .env file",
  );
  process.exit(1);
}

const bot = new Bot<ConversationFlavor<Context>>(TOKEN);

bot.use(conversations());

bot.use(createConversation(rentProperty));

bot.command("start", async (ctx) => {
  console.log("test");
  await ctx.conversation.enter("rentProperty");
});

bot.start().then(() => console.log("Bot started successfully"));
