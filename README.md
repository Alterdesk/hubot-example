# Alterdesk Example Hubot Chatbot

A Hubot example using the following Alterdesk libraries
* hubot-alterdesk-adapter
* hubot-questionnaire-framework
* node-messenger-sdk
* node-messenger-extra

## Run the Hubot example

### Unix

#### Set API token in Hubot start script

If you want to connect the example to a messenger user, set your OAuth 2.0 API token on <MESSENGER_API_TOKEN> like shown
in the example below. If you do not set the token, you can interact with the Hubot script through 
the terminal.

Bash script [hubot/bin/hubot](hubot/bin/hubot)
```bash
# Set your OAuth 2.0 API token for Alterdesk here
export HUBOT_ALTERDESK_TOKEN=<MESSENGER_API_TOKEN>
```

#### Start Hubot

Start the Hubot script in a terminal
```bash
cd hubot
./bin/hubot
```

### Windows

#### Set API token in Hubot start script
If you want to connect the example to a messenger user, set your OAuth 2.0 API token on <MESSENGER_API_TOKEN> like shown
in the example below. If you do not set the token, you can interact with the Hubot script 
through the command line.

Batch script [hubot\bin\hubot.cmd](hubot/bin/hubot.cmd)
```bat
REM Set your OAuth 2.0 API token for Alterdesk here
SET HUBOT_ALTERDESK_TOKEN=<MESSENGER_API_TOKEN>
```

#### Start Hubot

Start the Hubot script in command prompt
```bat
cd hubot
.\bin\hubot.cmd
```

#### Missing Git

If the script fails with the error
```batch
npm ERR! not found: git
```
Install [Git Bash](https://git-scm.com/downloads) and add "C:\Program Files\Git\mingw64\bin" to your PATH environment 
variable

## Interacting with the example

### One-to-one chat
When sending messages to the bot in a one-to-one chat, the bot will always listen and respond
```
// One-to-one message always directed at bot, will respond
User >> Bot: "help"
User << Bot: "You can send "command" to start a questionnaire, "photo" to request a photo, "pdf" to request a pdf and 
             "ping" to ping."
```

### Group chat
When sending messages to the bot in a group chat, the bot will only listen and respond when mentioned
```
// No response
User >> Bot: "help"

// Message directed at bot, will respond
User >> Bot: "@<BOT_USERNAME> help"
User << Bot: "You can send 'command' to start a questionnaire, 'photo' to request a photo, 'pdf' to request a pdf and 
             'ping' to ping."
```

Once a questionnaire is started the bot does not need te be mentioned anymore by the user that started the 
questionniare, the bot keeps listening until the questionnaire is finished or waiting for a user response times out.
```
// Start the questionnaire
User >> Bot: "@<BOT_USERNAME> command"
User << Bot: "What is the answer for question one?"
User >> Bot: "First answer"
User << Bot: "What is the answer for question two?"
User >> Bot: "Second answer"
User << Bot: "Thank you, your answers were: 'First answer' and 'Second answer'"
```