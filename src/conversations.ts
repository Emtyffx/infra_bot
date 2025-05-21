import { conversations, type Conversation } from "@grammyjs/conversations";
import { InlineKeyboard, Keyboard, type Context } from "grammy";
import config from "../configuration.json";

interface Callback {
  propType: string;
  important: string[];
  infra: string;
}
export async function rentProperty(conversation: Conversation, ctx: Context) {
  let result: Callback = {
    propType: "",
    important: [],
    infra: "",
  };
  const propSizeKeyboard = new InlineKeyboard()
    .text("1 кім. квартира", "first#1 кім. квартира")
    .row()
    .text("2 кім. квартира", "first#2 кім. квартира")
    .row()
    .text("3 кім. квартира", "first#3 кім. квартира")
    .row()
    .text("Таунхаус/котедж", "first#Таунхаус/котедж")
    .row()
    .text("Інше", "first#Інше");
  const firstMessage = await ctx.reply("Яка нерухомість вас цікавить?", {
    reply_markup: propSizeKeyboard,
  });
  const query = await conversation.waitForCallbackQuery(/^first/g);
  await query.answerCallbackQuery();
  await ctx.api.editMessageText(
    firstMessage.chat.id,
    firstMessage.message_id,
    `Ви обрали: ${query.callbackQuery.data.split("#")[1]}`,
  );
  result.propType = query.callbackQuery.data.split("#")[1];
  let infraChosen = new Set<string>();
  const infraChoices = [
    "Розтермінування",
    "Є-оселя",
    "Пошвидше б новосілля",
    "Надійний забудовник",
    "Інше",
    "Готово",
  ];
  const keyboard = InlineKeyboard.from(
    infraChoices.map((x) => [InlineKeyboard.text(x, "second#" + x)]),
  );
  const secondMessage = await ctx.reply(
    "Що для вас важливо при купівлі нерухомості?",
    { reply_markup: keyboard },
  );

  while (true) {
    const query = await conversation.waitForCallbackQuery(/^second/g);
    const data = query.callbackQuery.data.split("#")[1];
    if (data == "Готово") {
      if (infraChosen.size == 0) {
        await ctx.reply("Будь-ласка оберіть щось");
        await query.answerCallbackQuery();
      } else {
        await ctx.api.editMessageText(
          secondMessage.chat.id,
          secondMessage.message_id,
          "Ви обрали: " + Array.from(infraChosen).join(","),
        );
        console.log(Array.from(infraChosen));
        result.important = Array.from(infraChosen);
        await query.answerCallbackQuery();
        break;
      }
    } else {
      if (infraChosen.has(data)) {
        infraChosen.delete(data);
      } else infraChosen.add(data);
      const newKeyboard = InlineKeyboard.from(
        infraChoices.map((x) => [
          InlineKeyboard.text(
            (infraChosen.has(x) ? "✔️" : "") + x,
            "second#" + x,
          ),
        ]),
      );
      await ctx.api.editMessageReplyMarkup(
        secondMessage.chat.id,
        secondMessage.message_id,
        { reply_markup: newKeyboard },
      );
    }
  }
  const thirdKeyboard = new InlineKeyboard()
    .text("Дитячий майданчик у дворі", "third#Дитячий майданчик у дворі")
    .row()
    .text("Дитячий садок/школа поблизу", "third#Дитячий садок/школа поблизу")
    .row()
    .text("Достатньо паркомісць", "third#Достатньо паркомісць");

  const thirdMessage = await ctx.reply("Яка інфраструктура ЖК вам важлива?", {
    reply_markup: thirdKeyboard,
  });
  const thirdQuery = await conversation.waitForCallbackQuery(/^third/g);
  const thirdData = await thirdQuery.callbackQuery.data.split("#")[1];
  await thirdQuery.answerCallbackQuery();
  await ctx.api.editMessageText(
    thirdMessage.chat.id,
    thirdMessage.message_id,
    `Ви обрали: ${thirdData}`,
  );
  result.infra = thirdData;
  await ctx.reply("Ми вже готуємо для вас гарну пропозицію ;)");
  await ctx.reply("Як до вас можна звертатися?");
  const name = await conversation.form.text();
  console.log(result, name);
  const phoneKeyboard = new Keyboard()
    .requestContact("Share your phone number")
    .oneTime()
    .row();
  await ctx.reply("Який ваш номер телефону?", { reply_markup: phoneKeyboard });
  const phone = await conversation.form.contact();
  await ctx.reply("Дякуємо, менеджер скоро відправить інформацію.");
  try {
    const chat = await ctx.api.getChat(config.managerId);
    await ctx.api.sendMessage(
      chat.id,
      `Інформація:\nЦікавить нерухомість: ${result.propType}\nВажливі для купівлі: ${result.important.join(",")}\nВажлива інфраструктура: ${result.infra}\nНік: @${ctx.chat?.username}\nЗвертатися: ${name}\nНомер телефона: ${phone.phone_number}`,
    );

    await ctx.reply(
      `Інформація про менеджера:\nНомер телефону:${config.managerPhone}\n${config.managerName}`,
    );
  } catch (e) {}
}
