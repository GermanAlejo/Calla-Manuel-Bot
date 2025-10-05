import { ERRORS } from "../../utils/constants/errors";
import { isGroupSession, type MyChatMember, type ShutUpContext, type ShutUpConversation } from "../../types/squadTypes";
import type { Debt } from "../../types/squadTypes";
import { log, MUTED_TIME } from "../../utils/common";
import { saveGroupDataToPersistance } from "../../middlewares/fileAdapter";
import { IGNORE_STATES } from "../../utils/constants/general";
import { buildDebtKeyboard, buildDebtListKeyboard, buildSetIgnoreManuelKeyboard, buildSetLevelBroKeyboard } from "./keyboards";
import { changeDebtorsMenuLoop, debtMenuLoop } from "./conversation-utils";

/**
 * Handles the interactive flow for creating a new group debt in a Telegram chat.
 * 
 *  * This function uses grammY's conversational API to guide the caller through:
 * 1. Validating the session and ensuring the command is used in a group.
 * 2. Displaying a dynamic inline keyboard of group members to select who owes money.
 * 3. Letting the caller confirm their selection with Done or cancel with Cancel.
 * 4. Asking the caller to provide a name for the new debt.
 * 5. Persisting the debt in the session (if valid and not duplicated).
 * 6. Sending a confirmation message to the group.
 * 
 * @param conversation - The active conversation instance
 * @param ctx - The context of the command invocation.
 *
 * @returns A promise that resolves once the conversation ends. In case of error,
 *          the error object is returned.
 */
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

        const callerId = ctx.from?.id;
        if (!callerId) {
            log.error("Unexpected error - no caller");
            throw new Error("No caller detected");
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
            reply_markup: buildDebtKeyboard(members, selected)
        });

        // ---- 3. Interactive loop
        await debtMenuLoop(session, ctx, conversation, callerId, selected, members);
    } catch (err) {
        log.error(err);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        return err;
    }
}

export async function changeDebtorState(conversation: ShutUpConversation, ctx: ShutUpContext) {
    try {
        log.info("Entering conversational Menu");
        const session = await conversation.external(ctx => ctx.session);
        if (!isGroupSession(session)) {
            log.info("Not in group - this functionality is not available");
            await ctx.reply("❌ Este comando solo funciona en chats grupales.");
            return;
        }

        const callerId = ctx.from?.id;
        if (!callerId) {
            log.error("Unexpected error - no caller");
            throw new Error("No caller detected");
        }

        //now we search the debt
        const debts = session.groupData.currentDebts.filter(d => d.ownerId === callerId);
        //now debt found
        if (!debts || debts.length === 0) {
            log.info("No debt for this owner");
            return ctx.reply("Nadie te debe dinero a ti tonto del culo");
        }

        const selected: number[] = [];
        let debt: Debt | undefined;
        //If we have more than one debt we build another menu
        await ctx.reply("Que deuda quieres modificar?", {
            reply_markup: buildDebtListKeyboard(debts)
        });
        //Here we listen for first menu
        while (true) {
            const update = await conversation.waitForCallbackQuery(/debt/);
            // Guard: only caller can use it
            if (update.from?.id !== callerId) {
                log.info("Unothorized use of menu");
                await update.answerCallbackQuery({
                    text: "❌ Este menú no es para ti",
                    show_alert: true
                });
                continue;
            }

            const selectedDebtName = update.callbackQuery.data.split(":")[1];
            debt = debts.find(d => d.name === selectedDebtName);
            if (!debt) {
                log.error("No debt read!!");
                throw new Error("No debt read");
            } else {
                log.info("Debt chosen");
                break;
            }
        }

        if (!debt) {
            log.error("No debt detected");
            throw new Error("Error - No Debt Available");
        }

        //select from array only debt users
        const debtMembers: MyChatMember[] = session.groupData.chatMembers.filter(
            member => debt?.debtors.includes(member.username)
        );

        await ctx.reply("Quien en la deuda ha pagado?", {
            reply_markup: buildDebtKeyboard(debtMembers, selected)
        });

        // ---- 3. Interactive loop
        await changeDebtorsMenuLoop(ctx, conversation, callerId, selected, debtMembers, debt);
    } catch (err) {
        log.error(err);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        return err;
    }
}

export async function setIgnoreManuelLevel(conversation: ShutUpConversation, ctx: ShutUpContext) {
    try {
        log.info("Entering conversational Menu");
        // validate session
        const session = await conversation.external(ctx => ctx.session);
        if (!isGroupSession(session)) {
            log.info("Not in group - this functionality is not available");
            await ctx.reply("❌ Este comando solo funciona en chats grupales.");
            return;
        }

        const callerId = ctx.from?.id;
        if (!callerId) {
            log.error("Unexpected error - no caller");
            throw new Error("No caller detected");
        }

        //get the group data to modify the level
        const groupData = session.groupData;

        // Open the menu
        await ctx.reply('Quieres mandar a callar a Manuel? Buena idea', {
            reply_markup: buildSetIgnoreManuelKeyboard()
        });

        //start loop of conversation with menu
        while (true) {
            //wait for update
            const update = await conversation.waitForCallbackQuery(/.*/);
            //Make sure only caller can use menu
            if (update.from.id !== callerId) {
                log.info("Unothorized use of menu");
                await update.answerCallbackQuery({
                    text: "❌ Este menú no es para ti",
                    show_alert: true
                });
                continue;
            }

            //get the action
            const action = update.callbackQuery.data;
            if (action === "level1") {
                //here we don't do anything just change level parameter
                log.info("Level 1 selected");
                await update.answerCallbackQuery();
                await update.editMessageText("Manuel ya no sera callado, gran error...");
                //update persistance
                groupData.userBlockLevel = IGNORE_STATES.low;
                await saveGroupDataToPersistance(groupData.id, groupData);
                break;
            }

            if (action === "level2") {
                log.info("Level 2 selected");
                await update.answerCallbackQuery();
                await update.editMessageText("El Manuel sera mandado a callar, sabia decision");
                //update data
                groupData.userBlockLevel = IGNORE_STATES.medium;
                await saveGroupDataToPersistance(groupData.id, groupData);
                break;
            }

            if (action == "level3") {
                log.info("Level 3 selected");
                await update.answerCallbackQuery();
                await update.editMessageText("El Manuel no podra hablar, por fin");
                //update data
                groupData.userBlockLevel = IGNORE_STATES.high;
                await saveGroupDataToPersistance(groupData.id, groupData);

                log.info("setting timer to unmute manuel");
                //temporizador
                setTimeout(async () => {
                    if (groupData.userBlockLevel === IGNORE_STATES.high) {
                        log.info("User is muted, unmmuting after " + MUTED_TIME);
                        groupData.userBlockLevel = IGNORE_STATES.low;
                        await saveGroupDataToPersistance(groupData.id, groupData);
                    }
                }, MUTED_TIME);
                break;
            }

            if (action === "cancel") {
                log.info("Canceling...");
                await update.answerCallbackQuery();
                await update.editMessageText("❌ Operación cancelada.");
                break;
            }

            await update.answerCallbackQuery();
            await update.editMessageReplyMarkup({
                reply_markup: buildSetIgnoreManuelKeyboard()
            });
        }
    } catch (err) {
        log.error(err);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        throw new Error("Error in set level conversation");
    }
}

/**
 * Handles interactive flow for setting the value of leve for the bro reply
 * 
 *  *  * This function uses grammY's conversational API to guide the caller through:
 * 1. Validating the session and ensuring the command is used in a group.
 * 2. Displaying a dynamic inline keyboard with three options to set
 * 3. Letting the caller confirm their selection with Done or cancel with Cancel.
 * 4. Sending a confirmation message to the group.
 * 
 * @param conversation - The active conversation instance
 * @param ctx - The context of the command invocation.
 *
 * @returns A promise that resolves once the conversation ends. In case of error,
 *          the error object is returned.
 */
export async function setBroLevelConversation(conversation: ShutUpConversation, ctx: ShutUpContext) {
    try {
        log.info("Entering conversational Menu");
        // validate session
        const session = await conversation.external(ctx => ctx.session);
        if (!isGroupSession(session)) {
            log.info("Not in group - this functionality is not available");
            await ctx.reply("❌ Este comando solo funciona en chats grupales.");
            return;
        }

        const callerId = ctx.from?.id;
        if (!callerId) {
            log.error("Unexpected error - no caller");
            throw new Error("No caller detected");
        }

        //get the group data to modify the level
        const groupData = session.groupData;

        // Open the menu
        await ctx.reply('¿Como quieres que tratemos a los imbeciles que digan "bro"', {
            reply_markup: buildSetLevelBroKeyboard()
        });

        // start the loop
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

            if (action === "level1") {
                //here we don't do anything just change level parameter
                log.info("Level 1 selected");
                await update.answerCallbackQuery();
                await update.editMessageText('Pues nada venga hablad como oligofrenicos...');
                //modify the data & persistance
                groupData.broReplyLevel = "off";
                await saveGroupDataToPersistance(groupData.id, groupData);
                break;
            }

            if (action === "level2") {
                log.info("Level 2 selected");
                await update.answerCallbackQuery();
                await update.editMessageText('Se contestara a los imbeciles que usen "bro"');
                //modify persistante
                groupData.broReplyLevel = "responder";
                await saveGroupDataToPersistance(groupData.id, groupData);
                break;
            }

            if (action == "level3") {
                log.info("Level 3 selected");
                await update.answerCallbackQuery();
                await update.editMessageText('A partir de ahora estaran prohibidos los "bro"');
                //modify persistante
                groupData.broReplyLevel = "borrar";
                await saveGroupDataToPersistance(groupData.id, groupData);
                break;
            }

            if (action === "cancel") {
                log.info("Canceling...");
                await update.answerCallbackQuery();
                await update.editMessageText("❌ Operación cancelada.");
                break;
            }

            await update.answerCallbackQuery();
            await update.editMessageReplyMarkup({
                reply_markup: buildSetLevelBroKeyboard()
            });
        }
    } catch (err) {
        log.error(err);
        log.trace(ERRORS.TRACE(__filename, __dirname));
        throw new Error("Error in set bro level conversation");
    }
}

