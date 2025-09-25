
import { ERRORS } from "../utils/constants/errors";
import { Debt, isGroupSession, type MyChatMember, type ShutUpContext, type ShutUpConversation } from "../types/squadTypes";
import { log } from "../utils/common";
import { InlineKeyboard } from "grammy";
import { addDebtToPersistance } from "../middlewares/fileAdapter";

//TODO: Add comments to this code
export async function newDebtConversation(conversation: ShutUpConversation, ctx: ShutUpContext) {
    try {
        log.info("Entering conversational menu");
        // ---- 1. Validate session
        const session = await conversation.external(ctx => ctx.session);
        if (!isGroupSession(session)) {
            log.info("Not in group - this functionality is not available");
            await ctx.reply("❌ Este comando solo funciona en chats grupales.");
            return;
        }

        const members = session.groupData.chatMembers;
        if (members.length === 0) {
            log.warn("Not saved members in session");
            await ctx.reply("⚠️ No hay miembros registrados en este grupo.");
            return;
        }

        // ---- 2. State
        const selected: number[] = []; // store by id
        await ctx.reply("Parece que hay gente aqui que te debe dinero:", {
            reply_markup: buildKeyboard(members, selected)
        });

        // ---- 3. Interactive loop
        while (true) {
            const update = await conversation.waitForCallbackQuery(/.*/);
            // Guard: only caller can use it
            if (update.from?.id !== ctx.from?.id) {
                await update.answerCallbackQuery({
                    text: "❌ Este menú no es para ti",
                    show_alert: true,
                });
                continue;
            }

            const action = update.callbackQuery.data;
            if (!action) {
                continue
            };

            if (action === "done") {
                await update.answerCallbackQuery();
                //TODO: split this into simpler code
                //TODO: Add price calculation
                //TODO: Add step to name conversation
                await update.editMessageText(`Miembros seleccionados: ${selected.map(id =>
                    members.find(m => m.id === id)?.username ?? id).join(", ") || "nadie"}`);

                //Preguntamos por un nombre para la deuda
                await ctx.reply("Dale un nombre a la deuda:");
                const nameMsg = await conversation.waitFor(":text");
                //TODO: What if name emptty
                const debtName = nameMsg.message?.text;
                if (!debtName) {
                    log.error("No debt name!!");
                    //TODO: Extract this Error to interface/entity
                    throw new Error("No debt name provided");
                }
                //If no one is selected then don't save
                if (selected.length === 0) {
                    log.info("No members selected");
                    await ctx.reply("No as seleccionado a nadie imbecil");
                    break;
                }

                // ---- 4. Persist into session
                const resDebt = await conversation.external(ctx => {
                    if (!isGroupSession(ctx.session)) {
                        log.error("Not in a group");
                        return [];
                    }
                    // Filter selected members
                    const selectedMembers = ctx.session.groupData.chatMembers.filter(m => selected.includes(m.id));
                    // now map usernames
                    const debtors = selectedMembers.map(m => m.username);
                    log.info("Saving debt data to persistance");
                    //Create debt
                    const newDebt: Debt = {
                        name: debtName,
                        debtors: debtors
                    };
                    //Save it to persistance
                    addDebtToPersistance(ctx.chatId, newDebt);
                    return debtors;

                });
                await ctx.reply(`✅ Deuda "${debtName}" creada, chavales:\n` +
                    `${resDebt.join("\n")}` +
                    `\nBIZUMS RAPIDITOS!!!`);
                break;
            }

            if (action === "cancel") {
                log.info("Canceling debt");
                await update.answerCallbackQuery();
                await update.editMessageText("❌ Operación cancelada.");
                break;
            }

            //TODO: This can be extracted to a function
            // ---- Toggle selection
            const memberId = parseInt(action);
            const idx = selected.indexOf(memberId);
            if (idx === -1) {
                selected.push(memberId);
            } else {
                selected.splice(idx, 1);
            }

            await update.answerCallbackQuery();
            await update.editMessageReplyMarkup({
                reply_markup: buildKeyboard(members, selected)
            });
        }
    } catch (err) {
        log.error(ERRORS.ERROR_IN_BUENOS_DIAS);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        return err;
    }
}

function buildKeyboard(members: MyChatMember[], selected: number[]) {
    log.info("Building keyboard");
    const kb = new InlineKeyboard();
    members.forEach(m => {
        const label = selected.includes(m.id) ? `✅ ${m.username}` : m.username;
        kb.text(label, String(m.id)).row();
    });
    kb
        .text("✅ Done", "done")
        .text("❌ Cancel", "cancel");
    return kb;
}
