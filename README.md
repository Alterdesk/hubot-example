# Alterdesk Example Hubot Chatbot

A Hubot example using the following Alterdesk libraries
* [hubot-alterdesk-adapter](https://github.com/Alterdesk/hubot-alterdesk-adapter) - Real time connection with the messenger
* [hubot-questionnaire-framework](https://github.com/Alterdesk/hubot-questionnaire-framework) - Flow of questions and extras
    
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
# Run the setup script once
./bin/setup
# Run the bot
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
REM Run the setup script once
.\bin\setup.cmd
REM Run the bot
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
               • 'invite' - Invite a user into a new group chat
               • 'agreement' - Make an agreement with one or more users
               • 'verify' - Verify your account with my help
```

### Group chat
If the environment variable HUBOT_QUESTIONNAIRE_NEED_MENTION_IN_GROUP is enabled (disabled by default), you will need to
mention the bot in a group chat before it will listen and trigger a command. One-to-one chats are not affected.
```c
// With this setting, not mentioning the bot in a group will trigger no response
User >> Bot: "help"

// Message directed at bot, will respond
User >> Bot: "@<BOT_USERNAME> help"
User << Bot: "Hello I am the Alterdesk Example Bot, here is a list of things I can do for you:
              
               • 'form' - Fill in a form by using a questionnaire
               • 'photo' - Request a photo from me
               • 'pdf' - Request a PDF chat log file from this chat
               • 'ping' - Ping me
               • 'group' - Create a group chat
               • 'invite' - Invite a user into a new group chat
               • 'agreement' - Make an agreement with one or more users
               • 'verify' - Verify your account with my help
```

Once a questionnaire is started the bot does not need te be mentioned anymore by the user that started the 
questionnaire, the bot keeps listening until the questionnaire is finished or waiting for a user response times out.
```c
// Start the questionnaire
User >> Bot: "form"
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
User >> Bot: "unknown"
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
               • 'invite' - Invite a user into a new group chat
               • 'agreement' - Make an agreement with one or more users
               • 'verify' - Verify your account with my help
```

### Guided form
Sending "form" to the bot will trigger a guided form to fill in
```c
User >> Bot: "form"
User << Bot: "This is a demo form, it is quite long and you can stop it anytime by sending "stop", here we go!"
User << Bot: "Select one or more colors that you like, and press send."
User >> Bot: "red|blue"
User << Bot: "How are you doing today?"
User >> Bot: "a"
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
User << Bot: "Just a few more questions that require specific input."
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
                  
              Attachments:
                  image.png
              
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
User >> Bot: "no"
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

### Verify
The bot can also help you to verify your messenger account. If you want the bot can also send you some information about
 the verification process.
```c
User >> Bot: "verify"
User << Bot: "Seems like you want to verify your account, do you want some information before we start?"
User >> Bot: "yes"
User << Bot: "I will send you a verification request."
User << Bot: "If you accept the request, you will be guided to the website of the identity provider."
User << Bot: "When you are authenticated by the identity provider, your messenger account will be verified."
User << Bot: "You can also choose to reject the request, but then your account will not get verified."
User << Bot: "I am going to send you the verification request now."
User << Bot: "Example Bot asked you to verify your account by means of 'Idensys'."
User >> Bot: "accept"
User << Bot: "Great! Your account is now verified!"
```

## Events
Hubot receives various messenger events via callbacks from the *hubot-questionnaire-framework*, you can trigger certain
actions when an event is received, for example when the bot is added to a chat.
```c
// Added to a one-to-one chat
User << Bot: "Welcome to the messenger!"

// Added to a groupchat
User << Bot: "Thank you for adding me to the group!"
```

## Hidden commands
Using the [hubot-schedule-api](https://github.com/Alterdesk/hubot-schedule-api), a REST API is added to the Hubot
instance. Using the setOverrideCallback() function, a hidden command can be added that can only be triggered from the 
Hubot API.

### Introduce
By sending the "introduce" command, the bot will introduce himself and provide an easy button to start the "flow" 
command. This command can not be triggered by sending "introduce" as a text message to the bot as usual.
```c
// Introduce command trigger on the REST API
User << Bot: "Hi! I am the Example Alterdesk bot, press start to begin!"
```

### Ask if the user has time
With the "askHasTime" command, you can ask if the user has time to fill in a form. If the user has time, the flow is
started. When the user does not have the time, the bot schedules the same command with the optional pre-filled answers 
for a later time(bot says tomorrow, using 5 minutes for demo purposes).

When a user has the time:
```c
// Ask command trigger on the REST API
User << Bot: "Do you have time to fill in a form?"
User >> Bot: "yes"
User << Bot: "OK great, let's get started!"
```

When a user does not ave the time:
```c
// Ask command trigger on the REST API
User << Bot: "Do you have time to fill in a form?"
User >> Bot: "no"
User << Bot: "That's too bad, I will ask you again tomorrow"

// Ask command trigger on scheduled time
User << Bot: "Do you have time to fill in a form?"
```