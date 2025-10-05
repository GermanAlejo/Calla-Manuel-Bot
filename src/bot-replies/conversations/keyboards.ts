import { InlineKeyboard } from "grammy";

import type { MyChatMember, Debt } from "../../types/squadTypes";
import { log } from "../../utils/common";

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
export function buildDebtKeyboard(members: MyChatMember[], selected: number[]) {
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

export function buildDebtListKeyboard(debts: Debt[]) {
    log.info("Building keyboard");
    const kb = new InlineKeyboard();
    debts.forEach(d => {
        const label = d.name;
        kb.text(label, `debt:${label}`).row();
    });
    return kb;
}

export function buildSetLevelBroKeyboard() {
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

export function buildSetIgnoreManuelKeyboard() {
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
