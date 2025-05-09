import { log } from "../utils/common";
import { DebtSelectionState, isGroupSession, MyChatMember, ShutUpConversation, ShutUpConversationContext } from "../types/squadTypes";
import { InlineKeyboard } from "grammy";

const MEMBERS_PER_PAGE = 4;

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
    log.info("Owner of debt found: " + owner);
    await ctx.reply("Parece que hay gente que te debe dinero " + owner.username + ", ¿Como quieres llamar a esta deuda?");
    const replyCtx = await conversation.waitFrom(owner);
    await ctx.reply("Parece que hay gente aqui que debe dinero, se ha creado una nueva deuda con el nombre: " + replyCtx.message?.text);

    //Obtenemos la lista de todos los miembros del grupo
    const members: MyChatMember[] = session.groupData.chatMembers;
    const membersId = members.map(m => m.id);

    //initialize state
    const state: DebtSelectionState = {
        selectedMembers: [],
        currentPage: 0,
        allMembers: membersId
    }

    const totalPages = Math.ceil(state.allMembers.length / MEMBERS_PER_PAGE);
    log.info("Debt initialize with state");
    let message = await ctx.reply("Ahora dime quien de estos imbeciles es deudor", {
        reply_markup: await generateKeyboard(state, members, totalPages)
    });

    let finished = false;
    log.info("Entering selection in keyboard");
    while (!finished) {
        try {
            const maxTimeInMilliseconds = 5 * 60 * 1000; //5 min in miliseconds
            const { callbackQuery } = await conversation.waitForCallbackQuery(
                /^(select|page|action):/,
                { maxMilliseconds: maxTimeInMilliseconds } // 5 minutos de timeout
            );

            // Verificar usuario válido
            if (callbackQuery.from.id !== owner.id) {
                await ctx.answerCallbackQuery("⚠️ Solo el iniciador puede seleccionar");
                continue;
            }

            const [action, data] = callbackQuery.data.split(":");

            switch (action) {
                case "select":
                    const memberId = Number(data);
                    const index = state.allMembers.indexOf(memberId);

                    //existe
                    if (index > -1) {
                        log.info("Member found");
                        //now search memeber in selected
                        const selected = state.selectedMembers.indexOf(memberId);
                        if(selected > -1) {
                            log.info("Member deselected");
                            state.selectedMembers.splice(index, 1); // Deseleccionar
                        } else {
                            log.info("Member selected");
                            state.selectedMembers.push(memberId); // Seleccionar
                        }
                    } //no existe
                    else {
                        log.info("Member not found");
                        throw new Error("Member id not found in object");
                    }
                    break;

                case "page":
                    if (data === "prev" && state.currentPage > 0) {
                        state.currentPage--;
                    } else if (data === "next" && state.currentPage < totalPages - 1) {
                        state.currentPage++;
                    }
                    break;

                case "action":
                    if (data === "cancel") {
                        log.info("Action canceled");
                        await ctx.api.editMessageText(
                            message.chat.id,
                            message.message_id,
                            "❌ Selección cancelada - No se creara deuda"
                        );
                        return;
                    }
                    if (data === "finish") {
                        log.info("Selection finished");
                        finished = true;
                    }
                    break;
            }

            if (state.selectedMembers.length > 0) {
                // Actualizar mensaje
                await ctx.api.editMessageText(
                    message.chat.id,
                    message.message_id,
                    `Miembros seleccionados: ${state.selectedMembers.length}\nSelecciona miembros:`
                );

                await ctx.api.editMessageReplyMarkup(
                    message.chat.id,
                    message.message_id,
                    { reply_markup: await generateKeyboard(state, members, totalPages) }
                );
                
                await ctx.answerCallbackQuery();
            } else {
                log.info("Action canceled");
                await ctx.api.editMessageText(
                    message.chat.id,
                    message.message_id,
                    "❌ Selección cancelada - No se creara deuda"
                );
            }

        } catch (err) {
            log.error(err);
            log.warn("Timeout reached!");
            await ctx.reply("⌛ Tiempo de espera agotado");
            return;
        }
    }
    log.info("Menu finished");
    //end of loop selection
    log.info(state.selectedMembers);
}

async function generateKeyboard(state: DebtSelectionState, groupMembers: MyChatMember[], totalPages: number) {
    const keyboard = new InlineKeyboard();
    const start = state.currentPage * MEMBERS_PER_PAGE;
    const end = start + MEMBERS_PER_PAGE;

    state.allMembers.slice(start, end).forEach(mId => {
        const member = groupMembers.find(m => m.id === mId);
        if (member) {
            const isSelected = state.selectedMembers.includes(member.id);
            keyboard.text(
                `${isSelected ? "✅ " : ""}${member.username}`,
                `select:${mId}`
            ).row();
        }
    });
    // Controles de paginación
    if (state.currentPage > 0) {
        keyboard.text("⬅️ Anterior", "page:prev");
    }
    if (state.currentPage < totalPages - 1) {
        keyboard.text("➡️ Siguiente", "page:next");
    }

    // Botones de acción
    keyboard.row().text("Selección cancelada ❌", "action:cancel");
    keyboard.text("✔️ Finalizar selección", "action:finish");

    return keyboard;
}