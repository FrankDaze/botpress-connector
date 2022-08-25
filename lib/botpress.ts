import { IModify, IRead } from '@rocket.chat/apps-engine/definition/accessors';
import { ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';
import { IMessage, IMessageAttachment } from '@rocket.chat/apps-engine/definition/messages';
import { IRoom, RoomType } from '@rocket.chat/apps-engine/definition/rooms';
import { BlockElementType, BlockType, IActionsBlock, IButtonElement, IImageBlock, IOptionObject, ISectionBlock, ISelectElement, IUIKitInteractionHandler, IUIKitResponse, TextObjectType, UIKitActionButtonInteractionContext, UIKitBlockInteractionContext, UIKitLivechatBlockInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';
import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { BotAnswerType } from '../enum/botpress';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';
import { AppSetting } from '../config/SettingsBotpress';
// --------------------------------------------------------------
// currently suppored answertypes Text,QuickReply,Image
// --------------------------------------------------------------
export const parseBotAnswer = async (app: IApp, threadId: any, response: any, sender: IUser, chatRoom: IRoom, read: IRead, modify: IModify, botAlias: string) => {
    if (!response.type) {
        return;
    }


    if (response.type == BotAnswerType.Text) {
        await sendMessage(app, threadId, sender, chatRoom, read, modify, { text: response.text }, botAlias);
    }

    if (response.type == BotAnswerType.QuickReply) {
        const Choices = response.choices;


        const elements: Array<IButtonElement> = Choices.map((payload: any) => ({
            type: BlockElementType.BUTTON,
            text: {
                type: TextObjectType.PLAINTEXT,
                text: payload.title
            },
            value: payload.value
        } as IButtonElement));

        const actionsBlock: IActionsBlock = { type: BlockType.ACTIONS, elements };

        await sendMessage(app, threadId, sender, chatRoom, read, modify, { text: response.text }, botAlias);
        await sendMessage(app, threadId, sender, chatRoom, read, modify, { actionsBlock }, botAlias);


    }
    // --------------------------------------
    // Old Botpress support
    // --------------------------------------
    if (response.type == BotAnswerType.Custom && response.component && response.component == "QuickReplies") {

        const Choices = response.quick_replies;

        const elements: Array<IButtonElement> = Choices.map((payload: any) => ({
            type: BlockElementType.BUTTON,
            text: {
                type: TextObjectType.PLAINTEXT,
                text: payload.title
            },
            value: payload.payload
        } as IButtonElement));

        const actionsBlock: IActionsBlock = { type: BlockType.ACTIONS, elements };

        if (response.wrapped && response.wrapped.type == BotAnswerType.Text) {
            await sendMessage(app, threadId, sender, chatRoom, read, modify, { text: response.wrapped.text }, botAlias);
        }

        await sendMessage(app, threadId, sender, chatRoom, read, modify, { actionsBlock }, botAlias);
    }
    if (response.type == BotAnswerType.Image) {
        const imageBlock = {
            type: 'image',
            imageUrl: response.image,
            altText: 'An image',
            title: {
                type: 'plain_text',
                text: response.title,
                emoji: true,
            }
        } as IImageBlock;

        await sendMessage(app, threadId, sender, chatRoom, read, modify, { imageBlock }, botAlias);
    }

    // support for old botpress versions


    if (response.type == BotAnswerType.File) {
        const imageBlock = {
            type: 'image',
            imageUrl: response.url,
            altText: 'An image'

        } as IImageBlock;

        await sendMessage(app, threadId, sender, chatRoom, read, modify, { imageBlock }, botAlias);
    }

    return;
}
// -----------------------------------------------
// Send Answer to Chat
// -----------------------------------------------
export const sendMessage = async (app: IApp, threadId, sender: IUser, room: IRoom, read: IRead, modify: IModify, message: any, botAlias: string): Promise<any> => {
    if (!message) {
        return;
    }
    const { text, actionsBlock, imageBlock, selectBlock } = message;

    const msg = modify.getCreator().startMessage()
        .setRoom(room)
        .setSender(sender)
        .setUsernameAlias(botAlias)
    //.setEmojiAvatar(':space_invader:');
    const replyInThread = await read.getEnvironmentReader().getSettings().getValueById(AppSetting.ppBotpressReplyInThread);
    if (threadId && replyInThread) {
        msg.setThreadId(threadId);
    }

    if (text) {
        msg.setText(text);
    }

    if (actionsBlock) {
        const { elements } = actionsBlock as IActionsBlock;

        msg.addBlocks(modify.getCreator().getBlockBuilder().addActionsBlock({ elements }));
    }

    if (selectBlock) {
        // msg.addBlocks(modify.getCreator().getBlockBuilder().addActionsBlock( selectBlock ));
    }
    if (imageBlock) {
        msg.setAttachments(new Array({ "imageUrl": imageBlock.imageUrl }));
    }

    return new Promise(async (resolve) => {
        modify.getCreator().finish(msg).then((result) => resolve(result)).catch((error) => console.error("message" + error));
    });
}

export const checkIfValidRoom = async (read: IRead, message: IMessage, isQuickReply: boolean, botRoom: string): Promise<boolean> => {
    // -------------------------------------------------------------------------
    // Init Values
    // -------------------------------------------------------------------------

    // prevent Bot talking with himself
    if (!isQuickReply && message.sender.username == botRoom) {
        return false;
    }

    const { text, editedAt, room } = message;
    const chatRoom = room as ILivechatRoom;

    const { id: rid, type, servedBy, isOpen, customFields, userIds } = chatRoom;

    let directMessageUser: string = "";

    // -------------------------------------------------------------------------
    // check if room has userIDs and then get the names of the users
    // -------------------------------------------------------------------------
    if (!userIds || userIds.length < 2) {
        return false;
    }

    await Promise.all(userIds.map(async (id) => {
        const user = await read.getUserReader().getById(id);
        if (user.username == botRoom) {
            directMessageUser = user.username;
        }
    }));

    // -------------------------------------------------------------------------
    // if you are not in the directmessage room with the bot then do nothing
    // -------------------------------------------------------------------------
    if (!type || type !== RoomType.DIRECT_MESSAGE) {
        return false;
    }

    if (botRoom === "" || directMessageUser !== botRoom) {
        return false;
    }
    return true;
}

