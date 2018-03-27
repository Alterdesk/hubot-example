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
```c
// One-to-one message always directed at bot, will respond
User >> Bot: "help"
User << Bot: "Hello I am the Alterdesk Example Bot, here is a list of things I can do for you:
              
               • 'form' - Fill in a form by using a questionnaire
               • 'photo' - Request a photo from me
               • 'pdf' - Request a PDF chat log file from this chat
               • 'ping' - Ping me
               • 'group' - Create a group chat
               • 'invite' - Invite a user into a group chat"
               • 'agreement' - Make an agreement with one or more users
```

### Group chat
When sending messages to the bot in a group chat, the bot will only listen and respond when mentioned
```c
// Not mentioning the bot in a group will trigger no response
User >> Bot: "help"

// Message directed at bot, will respond
User >> Bot: "@<BOT_USERNAME> help"
User << Bot: "Hello I am the Alterdesk Example Bot, here is a list of things I can do for you:
              
               • 'form' - Fill in a form by using a questionnaire
               • 'photo' - Request a photo from me
               • 'pdf' - Request a PDF chat log file from this chat
               • 'ping' - Ping me
               • 'group' - Create a group chat
               • 'invite' - Invite a user into a group chat"
               • 'agreement' - Make an agreement with one or more users
```

Once a questionnaire is started the bot does not need te be mentioned anymore by the user that started the 
questionniare, the bot keeps listening until the questionnaire is finished or waiting for a user response times out.
```c
// Start the questionnaire
User >> Bot: "@<BOT_USERNAME> form"
// Bot was triggered for first question
User << Bot: "Can you send me your first name?"
// User responds without mentioning the bot
User >> Bot: "piet"
// Bot was triggered because of active questionnaire
User << Bot: "Can you send me your last name?"
// User responds again
User >> Bot: "de graaf"
// After the questionnaire is done, the bot stops listening for messages without mention from the user
User << Bot: "Thank you, your answers were: ...."
```
### Stopping a questionnaire
If you do not want to finish a started questionnaire, you can either wait until waiting for a response times out, or
send the stop command to stop the questionnaire immediately. The default stop command is "stop" but the example script
has overridden the command with "abort" with the function set setStopRegex() in the Questionnaire Control object.
```c
User >> Bot: "abort"
User << Bot: "Stopped the questionnaire"
```

### Unknown commands
When you send the bot a command that it does not recognize(not one of the accpeted commands) it will reply that the bot
did not understand you. This behaviour is enabled/disabled with setCatchAll() in the Questionnaire Control object.
```c
User >> Bot: "@<BOT_USERNAME> unknown"
User << Bot: "I did not understand what you said, type 'help' to see what I can do for you."
```

## Available commands

### Help
To see what the bot can do for you, you can send "help". The example script also adds "what" and "support" as help 
triggers using setHelpRegex() in the Questionnaire Control object.
```c
User >> Bot: "help"
User << Bot: "Hello I am the Alterdesk Example Bot, here is a list of things I can do for you:
              
               • 'form' - Fill in a form by using a questionnaire
               • 'photo' - Request a photo from me
               • 'pdf' - Request a PDF chat log file from this chat
               • 'ping' - Ping me
               • 'group' - Create a group chat
               • 'invite' - Invite a user into a group chat"
               • 'agreement' - Make an agreement with one or more users
```

### Guided form
Sending "form" to the bot will trigger a guided form to fill in
```c
User >> Bot: "form"
User << Bot: "Can you send me your first name?"
User >> Bot: "piet"
User << Bot: "Can you send me your last name?"
User >> Bot: "de graaf"
User << Bot: "How old are you? (Allowed range 12-90)"
User >> Bot: "30"
User << Bot: "Do you want to subscribe to our newsletter? (Yes or no)"
User >> Bot: "yes"
User << Bot: "What is your email address? (Allowed domains: .com and .nl)"
User >> Bot: "pietdegraaf@example.com"
User << Bot: "What is your phone number? (Allowed country code +31)"
User >> Bot: "+3123456789"
User << Bot: "Can you send me one to three images? (JPG/PNG, 1KB-1MB)"
User >> Bot: "(attachment image.png)"
User << Bot: "Which users do you want to include? (Use '@' to sum up users)"
User >> Bot: "@Harry de Boer"
User << Bot: "Thank you, your answers were:
              
              First name:
                  Piet
              
              Last name:
                  de Graaf
              
              Age:
                  30
              
              Email address to subscribe:
                  pietdegraaf@example.com
              
              Phone:
                  +3123456789
              
              Mentioned user ids:
                  a37c725e-fe91-4033-a6ce-6a5a81eacba7"
```

### Request photo
To request a photo from the bot, send "photo"
```c
User >> Bot: "photo"
User << Bot: "Here is the photo you requested(with attachment bot.png)"
```

### Generate chat PDF
To generate a pdf from the chat by the bot, you can send the command "pdf"
```c
User >> Bot: "pdf"
User << Bot: "Generating pdf, one moment please"
User << Bot: "Here is the pdf you requested(with attachment Chat.pdf)"
```

### Ping bot
And to simply ping the bot, send "ping"
```c
User >> Bot: "ping"
User << Bot: "PONG!"
```

### Create a group chat
The bot can create a group chat in which the requesting user will be added. Before starting the questionnaire for 
creating the group, the bot will first check if the user is a coworker and thereby have permission to execute the 
command. 

To start the create group command, send "group"
```c
User >> Bot: "group"
User << Bot: "What should the subject for the group be?"
User >> Bot: "My new group"
User << Bot: "Should the chat close automatically after a week of inactivity? (Yes or no)"
User >> Bot: "My new group"
User << Bot: "Group chat to create:
              
              Subject:
                  My new group
              
              Auto close:
                  Yes"
User << Bot: "Are you sure you want to create the group? (Yes or no)"
User >> Bot: "yes"
User << Bot: "Creating group chat, one moment please"
User << Bot: "Group chat created 'My new group'"
```

### Invite a user
The bot can invite a user for you. Before starting the questionnaire for inviting the user, the bot will first check 
if the user is a coworker and thereby have permission to execute the command. 
After the bot has invited the user, the bot will place you in a group chat with the invited user.

To start inviting a user, send "invite"
```c
User >> Bot: "invite"
User << Bot: "What is the first name of the user you want to invite?"
User >> Bot: "piet"
User << Bot: "What is the last name?"
User >> Bot: "de graaf"
User << Bot: "Do you want to invite the user as a coworker, contact or private user?"
User >> Bot: "private"
User << Bot: "To which email address should the invite be sent?"
User >> Bot: "pietdegraaf@example.com"
User << Bot: "User:
                  Piet de Graaf

              Invite as:
                  private
              
              Send invite to:
                  pietdegraaf@example.com"
User << Bot: "Are you sure you want to send the invite? (Yes or no)"
User >> Bot: "yes"
User << Bot: "Your invite is being sent and corresponding group chat is created, one moment please"
User << Bot: "Group chat created and user is invited in 'Group chat with Piet de Graaf'"
```

### Agreement
You can ask one or more users to make an agreement with you, start the process by sending the command "agrreement".
Mention the users you want to make the agreement with and send the agreement text. The bot will send a summary of the 
agreement and asks you and the mentioned users to either accept or reject the agreement. When a user rejects the 
agreement the process is stopped. If all users agree a pdf file is generated and sent in the chat. 
```c
User >> Bot: "agreement"
User << Bot: "Hello Piet, with who do you want to make the agreement with? (Use '@' to sum up users)"
User >> Bot: "@Harry de Boer"
User << Bot: "What is the agreement?"
User >> Bot: "That Harry will pay my lunch today"
User << Bot: "Agreement details:
              
              Agreement:
                  That Harry will pay my lunch today
              
              Mentioned users:
                  Piet de Graaf (Alterdesk)
                  Harry de Boer (Github)"
User << Bot: "Do you agree with the agreement? (Accept or reject)"
User >> Bot: "accept"
User << Bot: "Piet de Graaf (Alterdesk) has accepted
              
              Waiting for:
                  Harry de Boer (Github)"
User >> Bot: "accept(Harry)"
User << Bot: "Harry de Boer (Github) has accepted"
User << Bot: "Agreement was reached, generating pdf"
User << Bot: "Here is the agreement formatted as a pdf file(with attachment Agreement.pdf)"
```