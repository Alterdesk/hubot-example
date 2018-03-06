# Hubot example

An hubot example using the following Alterdesk libraries
* hubot-alterdesk-adapter
* hubot-questionnaire-framework
* node-messenger-sdk
* node-messenger-extra

## Run the Hubot example

### Windows

If you want to connect the example to a messenger user, set your OAuth 2.0 API token on <MESSENGER_API_TOKEN> like shown
in the example below in *hubot/bin/hubot.cmd*. If you do not set the token, you can interact with the Hubot script 
through the command line.
```bat
REM Set your OAuth 2.0 API token for Alterdesk here
SET HUBOT_ALTERDESK_TOKEN=<MESSENGER_API_TOKEN>
```

In command prompt
```bat
cd hubot
.\bin\hubot.cmd
```

### Unix

If you want to connect the example to a messenger user, set your OAuth 2.0 API token on <MESSENGER_API_TOKEN> like shown
in the example below in *hubot/bin/hubot*. If you do not set the token, you can interact with the Hubot script through 
the terminal.
```bash
# Set your OAuth 2.0 API token for Alterdesk here
export HUBOT_ALTERDESK_TOKEN=<MESSENGER_API_TOKEN>
```

In a terminal
```bash
cd hubot
./bin/hubot
```