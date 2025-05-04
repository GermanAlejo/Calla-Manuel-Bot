import { log } from "../utils/common";
import { isGroupSession, MyChatMember, ShutUpConversation, ShutUpConversationContext } from "../types/squadTypes";
import { InlineKeyboard } from "grammy";

//This defines the conversation
export async function startNewDebt(conversation: ShutUpConversation, ctx: ShutUpConversationContext) {
    log.info("Starting new Debt");
    const session = await conversation.external((ctx) => ctx.session);
    if (!session || !isGroupSession(session)) {
        log.info("Not in group - this functionality is not available");
        return;
    }
    const chat = ctx.chat;
    if (!chat) {
        log.error("Error in chat");
        throw new Error("Error reading chat from conversation");
    }
    const owner = ctx.from;
    if (!owner) {
        log.error("Error reading owner");
        throw new Error("Error reading conversation");
    }
    await ctx.reply("Parece que hay gente que te debe dinero " + owner.username + ", ¿Como quieres llamar a esta deuda?");
    const replyCtx = await conversation.waitFrom(owner);
    await ctx.reply("Parece que hay gente aqui que debe dinero, se ha creado una nueva deuda con el nombre: " + replyCtx.message?.text + " ahora dime quien es deudor");

    //Obtenemos la lista de todos los miembros del grupo
    const members: MyChatMember[] = session.groupData.chatMembers;

    //creamos un teclaro
    const keyboard = new InlineKeyboard();

    members.forEach((member, index) => {
        //por cada miembro, lo añadimos al teclado
        keyboard.text(
            member.username ? `@${member.username}` : "",
            `select_member_${member.id}`
        );
        //2 elementos por fila
        if (index % 2 === 1) {
            keyboard.row();
        }
    });

    keyboard.row().text("❌ Cancelar", "cancel_selection");

    // Enviar mensaje con opciones
    const message = await ctx.reply("Selecciona un miembro:", {
        reply_markup: keyboard
    });

    // Esperar selección del usuario
    const { callbackQuery } = await conversation.waitForCallbackQuery(/^select_member_|cancel_selection/);

    // Eliminar teclado después de selección
    await ctx.api.editMessageReplyMarkup(chat.id, message.message_id, { reply_markup: undefined });

    // ahora reaccionamos a la respuesta
    // Cancela
    if (callbackQuery.data === "cancel_selection") {
        await ctx.reply("Selección cancelada ❌");
        return null;
    }

    // Extraer ID del miembro seleccionado
    const selectedId = parseInt(callbackQuery.data.split("_")[2]);
    const selected = members.find(m => m.id === selectedId);

    log.info(selected);
}