import { ISetting, SettingType } from '@rocket.chat/apps-engine/definition/settings';

export enum AppSetting {
    ppBotpressServerUrl = 'botpress_server_url',
    ppBotpressBotID = 'botpress_bot_id',
    ppBotpressRCChannel = 'botpress_rc_channel',
    ppBotAlias = 'botpress_bot_alias',
    ppBotpressReplyInThread = 'botpress_reply_in_thread'
}



export const settings: Array<ISetting> = [
    {
        id: AppSetting.ppBotAlias,
        public: true,
        type: SettingType.STRING,
        packageValue: '',
        i18nLabel: 'botpress_bot_alias',
        required: true
    },
    {
        id: AppSetting.ppBotpressBotID,
        public: true,
        type: SettingType.STRING,
        packageValue: '',
        i18nLabel: 'botpress_bot_id',
        required: true
    },
    {
        id: AppSetting.ppBotpressServerUrl,
        public: true,
        type: SettingType.STRING,
        packageValue: '',
        i18nLabel: 'botpress_server_url',
        i18nPlaceholder: 'botpress_server_url_placeholder',
        required: true
    },
    {
        id: AppSetting.ppBotpressRCChannel,
        public: true,
        type: SettingType.STRING,
        packageValue: '',
        i18nLabel: 'botpress_rc_channel',
        i18nDescription: 'botpress_rc_channel_description',
        required: true
    },
    {
        id: AppSetting.ppBotpressReplyInThread,
        public: true,
        type: SettingType.BOOLEAN,
        packageValue: false,
        i18nLabel: 'botpress_reply_in_thread',
        required: true
    },
];
