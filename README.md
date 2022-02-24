# Botpress Connect

## What is Botpress Connect?

Botpress Conntect connects Rocket.Chat with a Botpress chatbot. 

This allows you to build a support bot for your chat users that answers their everyday questions. Create an IT support bot, an onboarding bot or just answer the question how the weather will be tomorrow. 

Botpress Connect supports text output for questions and answers, images and quick answer buttons. 

https://rocket.chat | https://www.botpress.com | https://www.publicplan.de 

## Hot to setup Botpress Connect

To use this app, create a user in Rocket.Chat of type bot. Then go to the app settings of the Botpress Connector. 
Add the name of you Rocket.Chat user, the ID of you Botpress bot (you see it in the URL of you bot in Botpress) and add the URL of your Botserver. 
Save the settings. 
Now you can start a direct message with you bot user. All your messages are only visible to you. It's like a normal conversations with other chat users.

<img width="669" alt="Bildschirmfoto 2022-02-24 um 09 18 59" src="https://user-images.githubusercontent.com/22960630/155485626-d07fb98d-0eca-4015-bf4a-e234929ae6fa.png">

## Getting Started
Now that you have generated a blank default Rocket.Chat App, what are you supposed to do next?
Start developing! Open up your favorite editor, our recommended one is Visual Studio code,
and start working on your App. Once you have something ready to test, you can either
package it up and manually deploy it to your test instance or you can use the CLI to do so.
Here are some commands to get started:
- `rc-apps package`: this command will generate a packaged app file (zip) which can be installed **if** it compiles with TypeScript
- `rc-apps deploy`: this will do what `package` does but will then ask you for your server url, username, and password to deploy it for you

## Documentation
Here are some links to examples and documentation:

- [Rocket.Chat Apps TypeScript Definitions Documentation](https://rocketchat.github.io/Rocket.Chat.Apps-engine/)
- [Rocket.Chat Apps TypeScript Definitions Repository](https://github.com/RocketChat/Rocket.Chat.Apps-engine)
- [Example Rocket.Chat Apps](https://github.com/graywolf336/RocketChatApps)
- Community Forums
  - [App Requests](https://forums.rocket.chat/c/rocket-chat-apps/requests)
  - [App Guides](https://forums.rocket.chat/c/rocket-chat-apps/guides)
  - [Top View of Both Categories](https://forums.rocket.chat/c/rocket-chat-apps)
- [#rocketchat-apps on Open.Rocket.Chat](https://open.rocket.chat/channel/rocketchat-apps)





