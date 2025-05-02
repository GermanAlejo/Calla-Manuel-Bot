import { log } from "../utils/common";
import { ShutUpConversation, ShutUpConversationContext } from "../types/squadTypes";

//This defines the conversation
export async function startNewDebt(conversation: ShutUpConversation, ctx: ShutUpConversationContext) {
    log.info("Starting new Debt");
    const owner = ctx.from;
    if(!owner) {
        log.error("Error reading owner");
        throw new Error("Error reading conversation");
    }
    await ctx.reply("Parece que hay gente que te debe dinero " + owner.username + ", ¿Como quieres llamar a esta deuda?");
    const replyCtx = await conversation.waitFrom(owner);
    await ctx.reply("Parece que hay gente aqui que debe dinero, se ha creado una nueva deuda con el nombre: " + replyCtx.message?.text + " ahora dime quien es deudor");
    
}