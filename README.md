# Hubot example

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
Install [Git Bash](https://git-scm.com/downloads) and add "C:\Program Files\Git\mingw64\bin" to your PATH environment variable