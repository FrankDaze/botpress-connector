import { IAppAccessors, IHttp, ILogger, IModify, IPersistence, IRead, IConfigurationExtend, IEnvironmentRead, IConfigurationModify, ITypingOptions } from '@rocket.chat/apps-engine/definition/accessors';
import { App } from '@rocket.chat/apps-engine/definition/App';
import { ILivechatRoom } from '@rocket.chat/apps-engine/definition/livechat';
import { IMessage, IPostMessageSent } from '@rocket.chat/apps-engine/definition/messages';
import { IAppInfo } from '@rocket.chat/apps-engine/definition/metadata';
import { IRoom } from '@rocket.chat/apps-engine/definition/rooms';

import { IUser } from '@rocket.chat/apps-engine/definition/users';
import { AppSetting, settings } from './config/SettingsBotpress';
import { IUIKitResponse, UIKitBlockInteractionContext } from '@rocket.chat/apps-engine/definition/uikit';

import { UIKitIncomingInteractionContainerType } from '@rocket.chat/apps-engine/definition/uikit/UIKitIncomingInteractionContainer';
import { checkIfValidRoom, parseBotAnswer } from './lib/botpress';
import { ISetting, } from '@rocket.chat/apps-engine/definition/settings';
import { IApp } from '@rocket.chat/apps-engine/definition/IApp';



export class BotpressConnectApp extends App implements IPostMessageSent {
    constructor(info: IAppInfo, logger: ILogger, accessors: IAppAccessors, app: IApp) {
        super(info, logger, accessors);
    }

    // -------------------------------------------------------------
    // Use static variables to refresh them on app settings update
    // -------------------------------------------------------------
    public static botAliasName;
    public static botID;
    public static botURL;
    public static botRoom;


    public async initialize(configurationExtend: IConfigurationExtend, environmentRead: IEnvironmentRead): Promise<void> {
        await this.extendConfiguration(configurationExtend);
        this.getLogger().log('Init Botpress Connector',);
    }

    // ---------------------------------------
    // Button action handler
    // ---------------------------------------
    public async executeBlockActionHandler(context: UIKitBlockInteractionContext, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<IUIKitResponse> {

        try {
            const interactionData = context.getInteractionData();

            const { room, container: { id, type }, value, message, user } = interactionData;

            if (type !== UIKitIncomingInteractionContainerType.MESSAGE) {
                return context.getInteractionResponder().successResponse();
            }
            if (!message) {
                return context.getInteractionResponder().successResponse();
            }
            // -------------------------------------------------------------------------
            // Init Values
            // -------------------------------------------------------------------------

            if (!BotpressConnectApp.botRoom) {
                this.initVariables(read);
            }
            const sender = await read.getUserReader().getByUsername(BotpressConnectApp.botRoom);

            const validRoom = await checkIfValidRoom(read, message, true, BotpressConnectApp.botRoom);
            if (!validRoom) {
                return context.getInteractionResponder().successResponse();
            }

            if (value) {
                if (interactionData.message) {
                    let block = JSON.parse(JSON.stringify(interactionData.message.blocks));
                    let choice = "";
                    block[0].elements.map(el => {
                        if (el.value === value) {
                            choice = el.text.text;
                        }
                    })

                    await this.deleteActionBlocks(modify, sender, id, "`" + choice + "`");
                }

            }


            const chatRoom = room as ILivechatRoom;

            let botpressMessage = {
                "type": "text",
                "text": value
            }
            const { data } = await http.post(BotpressConnectApp.botURL + "/api/v1/bots/" + BotpressConnectApp.botID + "/converse/" + user.id, {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                content: JSON.stringify(botpressMessage)
            });

            if (!data.responses) {
                return context.getInteractionResponder().successResponse();
            }


            data.responses.map(async (response) => {
                await parseBotAnswer(this, message.id, response, sender, chatRoom, read, modify, BotpressConnectApp.botAliasName);
            });


            return context.getInteractionResponder().successResponse();
        } catch (error) {

            return context.getInteractionResponder().errorResponse();
        }
    }

    public async deleteActionBlocks(modify: IModify, appUser: IUser, msgId: string, choice: string): Promise<void> {
        const msg = await modify.getUpdater().message(msgId, appUser);
        msg.setEditor(appUser).setBlocks(modify.getCreator().getBlockBuilder().getBlocks());
        msg.setText(choice);
        return modify.getUpdater().finish(msg);
    };

    public async executePostMessageSent(message: IMessage, read: IRead, http: IHttp, persistence: IPersistence, modify: IModify): Promise<void> {
        // -------------------------------------------------------------------------
        // Init Variables
        // -------------------------------------------------------------------------

        if (!BotpressConnectApp.botRoom) {
            this.initVariables(read);
        }

        const sender = await read.getUserReader().getByUsername(BotpressConnectApp.botRoom);

        const validRoom = await checkIfValidRoom(read, message, false, BotpressConnectApp.botRoom);

        if (!validRoom) {
            return;
        }

        const botVersion = await http.get(BotpressConnectApp.botURL + "/version");

        const { text, editedAt, room, id, threadId } = message;
        const chatRoom = room as ILivechatRoom;


        let botpressMessage;
        const versionDiff = await this.compareVersion(botVersion.content, "12.26.7");

        // ------------------------------------------------------------
        // meatadata is available from botpress version > v12.26.7
        // ------------------------------------------------------------
        if (versionDiff) {
            botpressMessage = {
                "type": "text",
                "text": text,
                "metadata": {
                    "sendername": message.sender.name,
                    "senderusername": message.sender.username
                }
            }
        } else {
            botpressMessage = {
                "type": "text",
                "text": text,
            }
        }

        const replyInThread = await read.getEnvironmentReader().getSettings().getValueById(AppSetting.ppBotpressReplyInThread);

        const notifiedId: string = "@" + BotpressConnectApp.botRoom;
        const isNotified = message.text?.includes(notifiedId);
        //If "Reply In Thread" option is selected, then the bot should only respond when it is mentioned  
        if (replyInThread) {
            if (!isNotified && !message.threadId) {
                return;
            }
        }

        let replyId = id;

        if (!replyInThread) {
            replyId = message.sender.id;
        }

        if (threadId) {
            replyId = threadId;
        }

        const { data } = await http.post(
            BotpressConnectApp.botURL
            + "/api/v1/bots/"
            + BotpressConnectApp.botID
            + "/converse/"
            + replyId,
            {
                headers: {
                    'Content-Type': 'application/json',
                    'Accept': 'application/json'
                },
                content: JSON.stringify(botpressMessage)
            });

        if (!data.responses) {
            return;
        }


        data.responses.map(async (response) => {
            await parseBotAnswer(this, id, response, sender, chatRoom, read, modify, BotpressConnectApp.botAliasName);
        });
    }

    private async compareVersion(v1: any, v2: string) {
        const v1Array = v1.split(".");
        const v2Array = v2.split(".");

        if (parseInt(v1Array[0]) > parseInt(v2Array[0])) {
            return true;
        } else {
            if (parseInt(v1Array[1]) > parseInt(v2Array[1])) {
                return true;
            } else {
                if (parseInt(v1Array[2]) > parseInt(v2Array[2])) {
                    return true;
                } else {
                    return false;
                }
            }
        }
    }

    private async showTyping(sender: IUser, room: IRoom, read: IRead): Promise<void> {
        const tpyingOptions: ITypingOptions = {
            id: room.id,
            username: BotpressConnectApp.botRoom
        }
        await read.getNotifier().typing(tpyingOptions);
    }


    private async sendNotifyMessage(sender: IUser, room: IRoom, read: IRead, text: string): Promise<void> {
        const botAlias = await read.getEnvironmentReader().getSettings().getValueById(AppSetting.ppBotAlias);
        const msg = read.getNotifier().getMessageBuilder().setText(text)
            .setUsernameAlias(botAlias).setEmojiAvatar(':space_invader:')
            .setRoom(room).setSender(sender).getMessage();

        await read.getNotifier().notifyUser(sender, msg);
    }


    protected async extendConfiguration(configuration: IConfigurationExtend): Promise<void> {
        await Promise.all(settings.map((setting) => configuration.settings.provideSetting(setting)));
    }

    protected async initVariables(read) {
        BotpressConnectApp.botRoom = await read.getEnvironmentReader().getSettings().getValueById(AppSetting.ppBotpressRCChannel);
        BotpressConnectApp.botURL = await read.getEnvironmentReader().getSettings().getValueById(AppSetting.ppBotpressServerUrl);
        BotpressConnectApp.botID = await read.getEnvironmentReader().getSettings().getValueById(AppSetting.ppBotpressBotID);
        BotpressConnectApp.botAliasName = await read.getEnvironmentReader().getSettings().getValueById(AppSetting.ppBotAlias);


    }

    public async onSettingUpdated(setting: ISetting, configurationModify: IConfigurationModify, read: IRead, http: IHttp): Promise<void> {

        // -------------------------------------
        // Value mapping
        // -------------------------------------
        if (setting.id == AppSetting.ppBotAlias) {
            BotpressConnectApp.botAliasName = setting.value;
        }
        if (setting.id == AppSetting.ppBotpressBotID) {
            BotpressConnectApp.botID = setting.value;
        }
        if (setting.id == AppSetting.ppBotpressRCChannel) {
            BotpressConnectApp.botRoom = setting.value;
        }
        if (setting.id == AppSetting.ppBotpressServerUrl) {
            BotpressConnectApp.botURL = setting.value;
        }

        return super.onSettingUpdated(setting, configurationModify, read, http);
    }
}
