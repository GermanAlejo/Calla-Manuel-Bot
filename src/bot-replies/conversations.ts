import { ConversationMenu, ConversationMenuContext } from "@grammyjs/conversations";
import { DebtSelectionState, isGroupSession, type MyChatMember, type ShutUpContext, type ShutUpConversation, type ShutUpConversationContext } from "../types/squadTypes";
import { log } from "../utils/common";
import { InlineKeyboard } from "grammy";
import { User, Message } from "grammy/types";



const MEMBERS_PER_PAGE = 4;

export async function newDebtConversation(conversation: ShutUpConversation, ctx: ShutUpConversationContext) {
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
    log.info("Owner of debt found: " + owner.username);

    //Obtenemos la lista de todos los miembros del grupo
    const members: MyChatMember[] = session.groupData.chatMembers;
    //const membersId = members.map(m => m.id);

    //array to keep track of selected members
    //Build menu
    const debtMenu = await buildDebtMenu(conversation, members.map(m => m.username));
    await ctx.reply("Debt Menu", {
        reply_markup: debtMenu
    });

    // Wait until menu handler set `picked`
    /*await conversation.waitUntil(() => !!picked, {
      next: true,
      otherwise: () => ctx.reply("Please use the menu above.")
    });*/

}

async function buildDebtMenu(conversation: ShutUpConversation, members: string[]): Promise<ConversationMenu<ShutUpContext>> {
    const selected: string[] = [];
    //First create menu
    const debtMenu = conversation.menu();
    //for each member we print an option
    members.forEach((member) => {
        debtMenu.text(() => (selected.includes(member) ? `✅ ${member}` : member),
            async (mctx: ConversationMenuContext<ShutUpContext>) => {
                //member is not saved, we add it or viceversa
                await toggle(member, selected);
                await mctx.menu.update();
            })
            .row();
    });

    //add done and cancel buttons
    debtMenu
        .text("✅ Done", async (mctx: ConversationMenuContext<ShutUpContext>) => {
            await mctx.reply(`You selected: ${selected.join(", ") || "nothing"}`);
            //Here the operation should be saved
            await mctx.menu.close();
        })
        .text("❌ Cancel", async (mctx: ConversationMenuContext<ShutUpContext>) => {
            await mctx.reply(`You canceled`);
            await mctx.menu.close();
        });

    return debtMenu;
}

async function toggle(value: string, selected: string[]) {
    const idx = selected.indexOf(value);
    if (idx === -1) selected.push(value);
    else selected.splice(idx, 1);
}


/*********************/

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
    log.info("Owner of debt found: " + owner.username);
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


    await startMenuLoop(conversation, ctx, owner, state, members);
}

async function startMenuLoop(conversation: ShutUpConversation, ctx: ShutUpConversationContext, owner: User, state: DebtSelectionState, members: MyChatMember[]) {

    const totalPages = Math.ceil(state.allMembers.length / MEMBERS_PER_PAGE);
    log.info("Debt initialized with state: " + JSON.stringify(state));
    const message = await ctx.reply("Ahora dime quien de estos imbeciles es deudor", {
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

            finished = await selectState(ctx, state, action, data, totalPages, message);

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

async function selectState(ctx: ShutUpConversationContext, state: DebtSelectionState, action: string, data: string, totalPages: number, message: Message.TextMessage): Promise<boolean> {
    switch (action) {
        case "select":
            const memberId = Number(data);
            const index = state.allMembers.indexOf(memberId);

            //existe
            if (index > -1) {
                log.info("Member found");
                //now search memeber in selected
                const selected = state.selectedMembers.indexOf(memberId);
                if (selected > -1) {
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
            if (data === "cancel" || data === "finish") {
                log.info("Action " + data);
                return true;
            }
            break;
        //TODO: Add handle for default case here
    }
    return false;
}

async function generateKeyboard(state: DebtSelectionState, groupMembers: MyChatMember[], totalPages: number): Promise<InlineKeyboard> {
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


