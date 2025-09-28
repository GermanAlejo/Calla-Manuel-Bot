
import { ERRORS } from "../utils/constants/errors";
import { Debt, isGroupSession, type MyChatMember, type ShutUpContext, type ShutUpConversation } from "../types/squadTypes";
import { log, MUTED_TIME } from "../utils/common";
import { InlineKeyboard } from "grammy";
import { addDebtToPersistance, saveGroupDataToPersistance } from "../middlewares/fileAdapter";
import { debtReminder } from "./saluda";
import { IGNORE_STATES } from "../utils/constants/general";

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
                continue
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
                        return;
                    }
                }

                //If no one is selected then don't save
                if (selected.length === 0) {
                    log.info("No members selected");
                    await ctx.reply("No as seleccionado a nadie imbecil");
                    break;
                }

                // ---- 4. Persist into session
                const resDebt: string[] | undefined = await conversation.external(ctx => {
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
                        ctx.reply("IMBECIL YA HAY UNA DEUDA CON ESE NOMBRE");
                        return;
                    }
                    //Save it to persistance
                    addDebtToPersistance(ctx.chatId, newDebt);
                    //create reminder
                    debtReminder(ctx, newDebt);

                    return debtors;
                });

                if (!resDebt) {
                    log.info("If undefined the debt was duplicated - Abort");
                    return;
                }

                await ctx.reply(`💰 Deuda "${debtName}" creada, chavales:\n` +
                    `@${resDebt.join("\n")}` +
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

        let debt;
        //If we have more than one debt we build another menu
        if (debts.length > 1) {
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

                debt = update.callbackQuery.data.split(":")[1];
                if (!debt) {
                    log.error("No debt read!!");
                    continue;
                };

            }
            //TODO: Call second menu and read data
            //TODO: Case for 1 debt only
        }

        //TODO: Build second menu
        //Here build the second menu
        await ctx.reply("Quien no es moroso?", {
            reply_markup: 
        });

        // ---- 3. Interactive loop
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
                continue
            };

            if (action === "done") {
            }
        }


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
            const action = await update.callbackQuery.data;
            if (action === "level1") {
                //here we don't do anything just change level parameter
                log.info("Level 1 selected");
                await update.answerCallbackQuery();
                await update.editMessageText("Manuel ya no sera callado, gran error...");
                //update persistance
                groupData.userBlockLevel = IGNORE_STATES.low;
                saveGroupDataToPersistance(groupData.id, groupData);
                break;
            }

            if (action === "level2") {
                log.info("Level 2 selected");
                await update.answerCallbackQuery();
                await update.editMessageText("El Manuel sera mandado a callar, sabia decision");
                //update data
                groupData.userBlockLevel = IGNORE_STATES.medium;
                saveGroupDataToPersistance(groupData.id, groupData);
                break;
            }

            if (action == "level3") {
                log.info("Level 3 selected");
                await update.answerCallbackQuery();
                await update.editMessageText("El Manuel no podra hablar, por fin");
                //update data
                groupData.userBlockLevel = IGNORE_STATES.high;
                saveGroupDataToPersistance(groupData.id, groupData);
                log.info("setting timer to unmute manuel");
                //temporizador
                setTimeout(() => {
                    if (groupData.userBlockLevel === IGNORE_STATES.high) {
                        log.info("User is muted, unmmuting after " + MUTED_TIME);
                        groupData.userBlockLevel = IGNORE_STATES.low;
                        saveGroupDataToPersistance(groupData.id, groupData);
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
        throw new Error("Error in set level conversation")
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
                saveGroupDataToPersistance(groupData.id, groupData);
                break;
            }

            if (action === "level2") {
                log.info("Level 2 selected");
                await update.answerCallbackQuery();
                await update.editMessageText('Se contestara a los imbeciles que usen "bro"');
                //modify persistante
                groupData.broReplyLevel = "responder";
                saveGroupDataToPersistance(groupData.id, groupData);
                break;
            }

            if (action == "level3") {
                log.info("Level 3 selected");
                await update.answerCallbackQuery();
                await update.editMessageText('A partir de ahora estaran prohibidos los "bro"');
                //modify persistante
                groupData.broReplyLevel = "borrar";
                saveGroupDataToPersistance(groupData.id, groupData);
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

/**
 * Builds a inline keyboard for selecting members.
 *
 * Each member is displayed as a button. If the member is already in the
 * `selected` array, their username is prefixed with a ✅ checkmark.
 *
 * The keyboard also includes two control buttons at the bottom:
 * - **✅ Done** → to confirm selection
 * - **❌ Cancel** → to cancel the process
 *
 * @param members - The list of chat members to display as selectable buttons.
 *                  Each member should have an `id` (number) and `username` (string).
 * @param selected - Array of member IDs that are currently marked as selected.
 *
 * @returns An {@link InlineKeyboard} instance representing the constructed keyboard.
 */
function buildDebtKeyboard(members: MyChatMember[], selected: number[]) {
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

function buildDebtListKeyboard(debts: Debt[]) {
    log.info("Building keyboard");
    const kb = new InlineKeyboard();
    debts.forEach(d => {
        const label = d.name;
        kb.text(label, `debt:${label}`).row();
    });
    return kb;
}

function buildSetLevelBroKeyboard() {
    log.info("Building keyboard");
    const kb = new InlineKeyboard();
    kb.text('Nivel 1: Se permite a los oligofrenicos decir "bro"', "level1")
        .row()
        .text('Nivel 2: Se contestara adecuadamente a los que digan "bro"', "level2")
        .row()
        .text('Nivel 3: ESTA PROHIBIDO EL USO DE LA PALABRA "BRO"', "level3")
        .row()
        .text("❌ Cancel", "cancel");
    return kb;
}

function buildSetIgnoreManuelKeyboard() {
    log.info("Building keyboard");
    const kb = new InlineKeyboard();
    kb.text('Nivel 1: Manuel tiene libertad absoluta, gran error...', 'level1')
        .row()
        .text('Nivel 2: Mandare mandar callar a Manuel en cada mensaje', 'level2')
        .row()
        .text('Nivel 3: El Manuel no podra hablar, por fin', 'level3')
        .row()
        .text("❌ Cancel", "cancel");
    return kb;
}
