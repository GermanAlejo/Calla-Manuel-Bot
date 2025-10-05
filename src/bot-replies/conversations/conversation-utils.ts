import { addDebtToPersistance, removeDebtFromPersistance } from "../../middlewares/fileAdapter";
import type { Debt, GroupSession, MyChatMember, ShutUpContext, ShutUpConversation } from "../../types/squadTypes";
import { log } from "../../utils/common";
import { debtReminder } from "../saluda";
import { buildDebtKeyboard } from "./keyboards";

/**
 * Toggles the selection state of a member ID inside the given array.
 *
 * @param action - A string representing the member ID (usually from a button callback).
 * @param selected - Array of currently selected member IDs. Will be modified in place.
 */
function toggleSelection(action: string, selected: number[]) {
    const memberId = parseInt(action);
    const idx = selected.indexOf(memberId);
    if (idx === -1) {
        selected.push(memberId);
    } else {
        selected.splice(idx, 1);
    }
}

export async function debtMenuLoop(session: GroupSession, ctx: ShutUpContext, conversation: ShutUpConversation, callerId: number,
    selected: number[], members: MyChatMember[]) {
    while (true) {
        const update = await conversation.waitForCallbackQuery(/.*/);
        // Guard: only caller can use it
        if (update.from?.id !== callerId) {
            log.info("Unothorized use of menu");
            await update.answerCallbackQuery({
                text: "❌ Este menú no es para ti",
                show_alert: true
            });
            continue;
        }

        const action = update.callbackQuery.data;
        if (!action) {
            continue;
        };

        if (action === "done") {
            await update.answerCallbackQuery();
            await update.editMessageText(`Miembros seleccionados: ${selected.map(id =>
                //Search for members inside selected by if, if found return with username if not found return id, then join after map with commas
                members.find(m => m.id === id)?.username ?? id).join(", ") || "nadie"}`
            );

            //Preguntamos por un nombre para la deuda
            await ctx.reply("Dale un nombre a la deuda:");
            //guard only caller can name
            let debtName: string | undefined;
            const TIMEOUT_MS = 5 * 60 * 1000;//5min 
            while (!debtName) {
                try {
                    const nameMsg = await conversation.waitFor(":text", { maxMilliseconds: TIMEOUT_MS });
                    if (nameMsg.from?.id !== callerId) {
                        log.info("This message is not from caller");
                        continue;
                    }

                    const text = nameMsg.message?.text.trim();
                    if (!text) {
                        log.error("No name provided");
                        await ctx.reply("⚠️ El nombre no puede estar vacío. Inténtalo otra vez:");
                        continue;
                    }
                    debtName = text;
                } catch (err) {
                    log.error("Timeout giving a name");
                    await ctx.reply("⌛ Tiempo agotado. La operación ha sido cancelada.");
                    return err;
                }
            }

            //If no one is selected then don't save
            if (selected.length === 0) {
                log.info("No members selected");
                await ctx.reply("No as seleccionado a nadie imbecil");
                break;
            }

            // ---- 4. Persist into session
            const resDebt: string[] | undefined = await conversation.external(async (ctx) => {
                // Filter selected members
                const selectedMembers = session.groupData.chatMembers.filter(m => selected.includes(m.id));
                // now map usernames
                const debtors = selectedMembers.map(m => m.username);
                //Create debt
                const newDebt: Debt = {
                    ownerId: callerId,
                    name: debtName,
                    debtors: debtors
                };
                // Check debt is not duplicated, if so abort
                if (session.groupData.currentDebts.find(d => d.name === newDebt.name)) {
                    log.warn("Duplicated debt found - Aborting");
                    await ctx.reply("IMBECIL YA HAY UNA DEUDA CON ESE NOMBRE");
                    return;
                }
                //Save it to persistance
                await addDebtToPersistance(ctx.chatId, newDebt);
                //create reminder
                await debtReminder(ctx, newDebt);

                return debtors;
            });

            if (!resDebt) {
                log.info("If undefined the debt was duplicated - Abort");
                return;
            }

            await ctx.reply(`💰 Deuda "${debtName}" creada, chavales:\n` +
                `${resDebt.map(u => `@${u}`).join("\n")}` +
                `\nBIZUMS RAPIDITOS!!!`);
            break;
        }

        if (action === "cancel") {
            log.info("Canceling debt");
            await update.answerCallbackQuery();
            await update.editMessageText("❌ Operación cancelada.");
            break;
        }

        // ---- Toggle selection
        toggleSelection(action, selected);

        await update.answerCallbackQuery();
        await update.editMessageReplyMarkup({
            reply_markup: buildDebtKeyboard(members, selected)
        });
    }
}

export async function changeDebtorsMenuLoop(ctx: ShutUpContext, conversation: ShutUpConversation, callerId: number, 
    selected: number[], debtMembers: MyChatMember[], debt: Debt) {
    while (true) {
        const update = await conversation.waitForCallbackQuery(/.*/);
        // Guard: only caller can use it
        if (update.from?.id !== callerId) {
            log.info("Unothorized use of menu");
            await update.answerCallbackQuery({
                text: "❌ Este menú no es para ti",
                show_alert: true
            });
            continue;
        }

        const action = update.callbackQuery.data;
        if (!action) {
            continue;
        }

        if (action === "done") {
            //Extraer deuda
            await update.answerCallbackQuery();
            await update.editMessageText(`Estos imbeciles han pagado porfin: ${selected.map(id =>
                //Print selected members, we search members with the saved ids
                debtMembers.find(m => m.id === id)?.username ?? id).join(", ") || "nadie"}`
            );


            //If no one is selected then don't save
            if (selected.length === 0) {
                log.info("No members selected");
                await ctx.reply("No as seleccionado a nadie imbecil");
                break;
            }

            // ---- 4. Persist into session
            await conversation.external(async (ctx) => {
                //update the list of debtors, filter by id and save id into array
                const newDebtors = debtMembers.filter(member => !selected.includes(member.id)).map(m => m.username);
                if (newDebtors.length === 0) {
                    log.info("Debt is fully paid");
                    //remove debt from persistance
                    await removeDebtFromPersistance(ctx.chatId, debt);
                    await ctx.reply(`💰 Deuda "${debt.name}" pagada, ¿A que no era tan dificil?`);
                } else {
                    //Save new debtors into debt
                    debt.debtors = newDebtors;
                    //Save it to persistance
                    await addDebtToPersistance(ctx.chatId, debt);
                    await ctx.reply(`💰 Deuda "${debt.name}" actualizada, chavales:\n` +
                        `@${newDebtors.join("\n")}` +
                        `\nBIZUMS RAPIDITOS!!!`
                    );
                }
                return;
            });

            break;
        }

        if (action === "cancel") {
            log.info("Canceling...");
            await update.answerCallbackQuery();
            await update.editMessageText("❌ Operación cancelada.");
            break;
        }

        // ---- Toggle selection
        toggleSelection(action, selected);

        await update.answerCallbackQuery();
        await update.editMessageReplyMarkup({
            reply_markup: buildDebtKeyboard(debtMembers, selected)
        });
    }
}