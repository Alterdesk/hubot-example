// Description:
//   Alterdesk example bot
//
// Dependencies:
//   hubot-questionnaire-framework
//   hubot-schedule-api
//   node-messenger-sdk
//   node-messenger-extra
//
// Configuration:
//   None
//
// Commands:
//   hubot help                 - Print help of this bot
//   hubot form                 - Fill in a form by using a questionnaire
//   hubot photo                - Upload a photo in the current chat
//   hubot pdf                  - Generate and upload a pdf in the current chat
//   hubot ping                 - Ping the bot
//   hubot group                - Create a group chat
//   hubot invite               - Invite a user into a new group chat
//   hubot agreement            - Make an agreement with one or more users
//   hubot verify               - Verify your account with this bot
//
// Author:
//   Alterdesk

// Requirements
const {Action, Answers, AnswerValue, ChatPdfAction, ChatTools, CheckUserAction, Control, CreateGroupAction, CreateGroupData, Flow, SendMessageData, StringTools, RegexTools, ReplaceAnswerFormatter} = require('./../hubot/node_modules/hubot-questionnaire-framework');
const Logger = require('./../hubot/node_modules/node-messenger-log');

const logger = new Logger(process.env.HUBOT_LOG_LEVEL || 'debug');

// Questionnaire control instance
var control;

// Script configurations
var DELAY_NEW_CHAT_MESSAGE_MS = 2000;
var DELAY_PDF_CREATION_MS = 2000;

// Regex
var positiveRegex = new RegExp(/^[ \n\r\t]*yes[ \n\r\t]*$/, 'gi');
var negativeRegex = new RegExp(/^[ \n\r\t]*no[ \n\r\t]*$/, 'gi');
var acceptRegex = new RegExp(/^[ \n\r\t]*accept[ \n\r\t]*$/, 'gi');
var rejectRegex = new RegExp(/^[ \n\r\t]*reject[ \n\r\t]*$/, 'gi');
var coworkerRegex = new RegExp(/^[ \n\r\t]*coworker[ \n\r\t]*$/, 'gi');
var contactRegex = new RegExp(/^[ \n\r\t]*contact[ \n\r\t]*$/, 'gi');
var privateRegex = new RegExp(/^[ \n\r\t]*private[ \n\r\t]*$/, 'gi');
var aRegex = new RegExp(/^[ \n\r\t]*a[ \n\r\t]*$/, 'gi');
var bRegex = new RegExp(/^[ \n\r\t]*b[ \n\r\t]*$/, 'gi');
var cRegex = new RegExp(/^[ \n\r\t]*c[ \n\r\t]*$/, 'gi');
var dRegex = new RegExp(/^[ \n\r\t]*d[ \n\r\t]*$/, 'gi');

module.exports = (robot) => {

    // Create a control instance
    control = new Control();

    // Override the stop regex to "abort" in addition to "stop"
    control.setStopRegex(new RegExp(/^[ \n\r\t]*(stop|abort)[ \n\r\t]*$/, 'gi'));

    // Set message text to send when the back command is used
    control.setFlowBackText("OK, going back...");

    // Override default hubot help command
    control.setCatchHelp(true);
    // Override the help regex to detect "what" and "support" in addition to "help"
    control.setHelpRegex(new RegExp(/^[ \n\r\t]*(help|what|support)[ \n\r\t]*$/, 'gi'));
    // Set the question style for help buttons
    control.setHelpQuestionStyle("horizontal");
    // Set the text to send when help was requested
    control.setCatchHelpText("Hello I am the Alterdesk Example Bot, here is a list of things I can do for you:\n");

    // Wait for two minutes for a reply from a user (overrides environment variable)
    control.setResponseTimeoutMs(120000);
    // Set the text to send when a user is too late
    control.setResponseTimeoutText("You waited too long to answer, stopped listening.");

    // When an unknown command was heard, do not pass it along to the default hubot receiver
    control.setCatchAll(true);
    // Set the text to send when an unknown command was heard
    control.setCatchAllText("I did not understand what you said, type \"help\" to see what I can do for you.");
    // Add a help button to the unknown command message
    control.setCatchAllButton("help", "Help", "green");

    control.setAuthenticatedCallback((user) => {
        logger.debug("Authenticated: " + user.id);
    });

    control.setTypingCallback((userId, typing, chatId, isGroup) => {
        logger.debug("Typing: " + typing + " user: " + userId + " chat: " + chatId + " isGroup: " + isGroup);
    });

    control.setPresenceCallback((userId, status) => {
        logger.debug("Presence: user: " + userId + " status: " + status);
    });

    control.setNewChatCallback((chatId, isGroup) => {
        logger.debug("New chat: " + chatId + " isGroup: " + isGroup);

        setTimeout(async () => {
            var messageData = new SendMessageData();
            if(isGroup) {
                messageData.setMessage("Thank you for adding me to the group!");
            } else {
                messageData.setMessage("Welcome to the messenger!");
            }
            messageData.setChat(chatId, isGroup, false);
            messageData.setRequestOptions(false, "horizontal");
            messageData.addQuestionButton("Help", "green");

            var success = await control.messengerClient.sendMessage(messageData);
            logger.debug("Send new chat message successful: " + success);
            if(!success) {
                logger.error("Unable to send new chat message");
            }
        }, DELAY_NEW_CHAT_MESSAGE_MS);
    });

    control.setRemovedFromChatCallback((groupId) => {
        logger.debug("Removed from chat: " + groupId);
    });

    control.setClosedChatCallback((groupId) => {
        logger.debug("Chat closed: " + groupId);
    });

    control.setMessageLikedCallback((userId, messageId, chatId, isGroup) => {
        logger.debug("Message liked: id: " + messageId + " user: " + userId + " chat: " + chatId + " isGroup: " + isGroup);
    });

    control.setMessageDeletedCallback((userId, messageId, chatId, isGroup) => {
        logger.debug("Message deleted: id: " + messageId + " user: " + userId + " chat: " + chatId + " isGroup: " + isGroup);
    });

    control.setVerificationCallback((userId, messageId, chatId, isGroup, accepted) => {
        logger.debug("Verification: id: " + messageId + " user: " + userId + " chat: " + chatId + " isGroup: " + isGroup + " accepted: " + accepted);
    });

    control.setGroupMemberCallback((groupId, added, userId, users) => {
        for(var index in users) {
            var user = users[index];
            if(added) {
                logger.debug("Added in group: " + groupId + " userId: " + userId + " member: " + user.id);
            } else {
                logger.debug("Removed from group: " + groupId + " userId: " + userId + " member: " + user.id);
            }
        }
    });

    control.setGroupSubscribedCallback((groupId, subscribed) => {
        logger.debug("Subscribed: " + subscribed + " chat: " + groupId);
    });

    control.setQuestionAnsweredCallback((userId, answerKey, answerValue, answers, question) => {
        logger.debug("Question answered: " + userId + " key: " + answerKey + " value: " + answerValue);
    });

    // Mark these words as accepted commands
    control.addAcceptedCommand("form", "Fill in a form by using a questionnaire", "Form", "blue");
    control.addAcceptedCommand("photo", "Request a photo from me", "Photo", "yellow");
    control.addAcceptedCommand("pdf", "Request a PDF chat log file from this chat", "PDF", "red");
    control.addAcceptedCommand("ping", "Ping me", "Ping", "purple");
    control.addAcceptedCommand("group", "Create a group chat", "Group", "green");
    control.addAcceptedCommand("invite", "Invite a user into a new group chat", "Invite", "black");
    control.addAcceptedCommand("agreement", "Make an agreement with one or more users", "Agreement", "orange");
    control.addAcceptedCommand("verify", "Verify your account with my help", "Verify", "theme");

    // Override the default robot message receiver
    control.overrideReceiver(robot);

    control.botApi.setOverrideCallback("introduce", async (chatId, isGroup, userId, answers) => {
        var messageData = new SendMessageData();
        messageData.setMessage("Hi! I am the Example Alterdesk bot, press start to begin!");
        messageData.setChat(chatId, isGroup, false);
        messageData.setRequestOptions(false, "horizontal");
        messageData.addQuestionButtonWithName("form", "Start filling in form", "red");

        var success = await control.messengerClient.sendMessage(messageData);
        logger.debug("Send introduction message successful: " + success);
        if(!success) {
            logger.error("Unable to send new chat message");
        }
    });

    control.botApi.setOverrideCallback("askHasTime", (chatId, isGroup, userId, answers) => {
        var response = ChatTools.createHubotResponse(control.robot, userId, chatId, isGroup);

        new Flow(control, "Stopped asking", "Error while asking")
        .polar("hasTime", "Do you have time to fill in a form?", "Invalid answer.")
        .positive(positiveRegex, new Flow()
            .info("OK great, let's get started!")
            .text("postalCode", "What is your postal code?", "Invalid postal code.")
            .text("street", "What is the name of your street?", "Invalid street.")
            .number("houseNumber", "And what is your house number?", "Invalid number.")
            .finish(callbackAddressFinished))
        .positiveButton("yes", "Yes", "green")
        .negative(negativeRegex, new Flow()
            .info("That's too bad, I will ask you again tomorrow")
            .action((flowCallback) => {
                control.botApi.scheduleEventInMs(chatId, isGroup, userId, "askHasTime", 30000);
                flowCallback();
            }))
        .negativeButton("no", "No", "red")
        .start(response);
    });

    // Check if the form command was heard
    robot.hear(RegexTools.getStartCommandRegex("form"), (msg) => {
        var isGroup = ChatTools.isUserInGroup(msg.message.user);
        new Flow(control, "Stopped filling in form", "Error while filling in form")
        .restartButton("form", "Restart filling in form", "blue")
        .info("This is a demo form, it is quite long and you can stop it anytime by sending \"stop\", here we go!", 3000)
        .multiple("color", "Select one or more colors that you like, and press send.", "Invalid choice.")
        .option("red")
        .button("red", "Red", "red")
        .option("green")
        .button("green", "Green", "green")
        .option("orange")
        .button("orange", "Orange", "orange")
        .option("yellow")
        .button("yellow", "Yellow", "yellow")
        .option("purple")
        .button("purple", "Purple", "purple")
        .option("blue")
        .button("blue", "Blue", "blue")
        .option("black")
        .button("black", "Black", "black")
        .option("theme")
        .button("theme", "Theme", "theme")
        .questionStyle("horizontal")
        .multiAnswer()
        .multiple("rating", "How many stars would you rate our service? (from 1 to 5)", "Invalid rating.")
        .option("5")
        .button("5", "★★★★★")
        .option("4")
        .button("4", "★★★★☆")
        .option("3")
        .button("3", "★★★☆☆")
        .option("2")
        .button("2", "★★☆☆☆")
        .option("1")
        .button("1", "★☆☆☆☆")
        .questionStyle("horizontal")
        .multiple("mood", "How are you doing today?", "Invalid choice.")
        .option(aRegex, null, 30)
        .button("a", "A) Great", "green")
        .option(bRegex, null, 20)
        .button("b", "B) Fine", "green")
        .option(cRegex, null, 10)
        .button("c", "C) Not so great", "orange")
        .option(dRegex, new Flow()
            .text("why", "Care to share why?", "Invalid"), 0)
        .button("d", "D) Bad", "red")
        .questionStyle("vertical")
        .text("firstName", "Can you send me your first name?", "Invalid name.")
        .length(2, 100)
        .capitalize()
        .text("lastName", "Can you send me your last name?", "Invalid name.")
        .length(2, 100)
        .lastName()
        .number("age", "How old are you? (Allowed range 12-90)", "Invalid number or out of range.")
        .range(12, 90)
        .polar("subscribe", "Do you want to subscribe to our newsletter? (Yes or no)", "Invalid answer.")
        .positive(positiveRegex, new Flow()
            .email("email", "What is your email address? (Allowed domains: .com and .nl)", "Invalid email address.")
            .domains([".com",".nl"]))
        .positiveButton("yes" ,"Yes", "green")
        .negative(negativeRegex, new Flow()
            .text("reason", "Can you tell us why you don't want to subscribe?", "Invalid answer.")
            .length(2))
        .negativeButton("no", "No", "red")
        .questionStyle("horizontal")
        .info("Just a few more questions that require specific input.", 3000)
        .phone("phone", "What is your phone number? (Allowed country code +31)", "Invalid phone number.")
        .countryCodes(["+31"])
        .attachment("attachments", "Can you send me one to three images? (JPG/PNG, 1KB-1MB)", "Invalid attachment or out of range.")
        .count(1, 3)
        .size(1024, 1048576)
        .extensions([".jpg", ".jpeg", ".png"])
        .mention("mentions", "Which users do you want to include? (Use '@' to sum up users)", "Invalid mention.")
        .robotAllowed(!isGroup)
        .allAllowed(isGroup)
        .completeMentions()
        .stopped((msg, answers) => {
            logger.debug("Stopped filling in form, answered " + answers.size() + " questions.")})
        .finish(callbackFormFinished)
        .start(msg);
    }),

    // Check if the photo command was heard
    robot.hear(RegexTools.getStartCommandRegex("photo"), async (msg) => {
        // Create a message data instance
        var messageData = new SendMessageData();

        // Text body of the message
        messageData.message = "Here is the photo you requested";
        // Optional attachment to send(local absolute or relative paths)
        messageData.addAttachmentPath("../bot.png");
        // Chat id to send the message in
        var chatId = msg.message.room;
        // If the chat is a group chat or a one-to-one chat
        var isGroup = ChatTools.isUserInGroup(msg.message.user);
        // Optional flag if chat auxiliary
        var isAux = false;
        messageData.setChat(chatId, isGroup, isAux);

        // Send the message
        var success = await control.messengerClient.sendMessage(messageData);
        logger.debug("Send photo successful: " + success);
        if(!success) {
            logger.error("Unable to send photo");
        }
    }),

    // Check if the pdf command was heard
    robot.hear(RegexTools.getStartCommandRegex("pdf"), (msg) => {
        // Notify user of generating pdf
        msg.send("Generating pdf, one moment please");

        setTimeout(() => {
            var flow = new Flow(control, "Stopped creating pdf", "An error occurred while creating pdf")
            .add(new ChatPdfAction("Chat.pdf"))
            .start(msg);
        }, DELAY_PDF_CREATION_MS);
    }),

    // Example simple command that does not use the questionnaire
    robot.hear(RegexTools.getStartCommandRegex("ping"), (msg) => {
        msg.send("PONG!");
    }),

    robot.hear(RegexTools.getStartCommandRegex("group"), (msg) => {
        var userId = ChatTools.getUserId(msg.message.user);
        logger.debug("Create group command started by user: " + userId);

        var createGroupAction = new CreateGroupAction(new AnswerValue("subject"));
        createGroupAction.addMemberId(userId);
        createGroupAction.setPositiveSubFlow(new Flow()
            .info("Group chat created")
        );
        createGroupAction.setNegativeSubFlow(new Flow()
            .info("Unable to create group chat")
        );

        // Optional check if user has permission to create a group
        var checkUserAction = new CheckUserAction("COWORKER");
        checkUserAction.setPositiveSubFlow(new Flow()
            .text("subject", "What should the subject for the group be? (Accepted length 8-200)", "Invalid group chat subject.")
            .length(8, 200)
            .polar("autoClose", "Should the chat close automatically after a week of inactivity? (Yes or no)", "Invalid answer")
            .positive(positiveRegex, new Flow()
                .add(new Action((flowCallback) => {
                    // Automatically close the group after 7 days of inactivity (optional)
                    createGroupAction.setAutoCloseAfter(7);
                    flowCallback();
                })))
            .positiveButton("yes" ,"Yes", "green")
            .negative(negativeRegex)
            .negativeButton("no", "No", "red")
            .summary(getGroupSummary)
            .polar("confirmed", "Are you sure you want to create the group? (Yes or no)", "Invalid confirmation.")
            .positive(positiveRegex, new Flow()
                .info("Creating group chat, one moment please")
                .add(createGroupAction))
            .positiveButton("yes" ,"Yes", "green")
            .negative(negativeRegex, new Flow()
                .info("Not creating group"))
            .negativeButton("no", "No", "red"))
        checkUserAction.setNegativeSubFlow(new Flow()
            .info("Sorry you have no access to the group command."))

        new Flow(control, "Stopped creating group", "An error occurred while creating group")
        .restartButton("group", "Restart creating group", "blue")
        .add(checkUserAction)
        .start(msg);
    }),

    robot.hear(RegexTools.getStartCommandRegex("invite"), (msg) => {
        // Optional check if user has permission to invite a user
        var userId = ChatTools.getUserId(msg.message.user);
        logger.debug("Invite user command started by user: " + userId);

        var firstName = new AnswerValue("firstName");
        var lastName = new AnswerValue("lastName");
        var inviteType = new AnswerValue("inviteType_value");
        var inviteText = null;
        var email = new AnswerValue("email");
        var createConversation = false; // Do not create a one-to-one chat with this user
        var auxId = null; // No auxiliary id for user

        var createGroupAction = new CreateGroupAction("Group chat with %first_name% %last_name%");
        createGroupAction.addSubjectFormatter(new ReplaceAnswerFormatter("%first_name%", "firstName"));
        createGroupAction.addSubjectFormatter(new ReplaceAnswerFormatter("%last_name%", "lastName"));
        createGroupAction.addMemberId(userId);
        createGroupAction.setAutoCloseAfter(7);
        createGroupAction.addInvite(email, firstName, lastName, inviteType, inviteText, createConversation, auxId)
        createGroupAction.setPositiveSubFlow(new Flow()
            .info("Group chat created and user is invited")
        );
        createGroupAction.setNegativeSubFlow(new Flow()
            .info("Unable to invite user and/or create group chat")
        );

        // Optional check if user has permission to create a group
        var checkUserAction = new CheckUserAction("COWORKER");
        checkUserAction.setPositiveSubFlow(new Flow()
            .text("firstName", "What is the first name of the user you want to invite?", "Invalid name.")
            .capitalize()   // Capitalize first letter
            .text("lastName", "What is the last name?", "Invalid name.")
            .lastName()     // Capitalize as last name
            .multiple("inviteType", "Do you want to invite the user as a coworker, contact or private user?", "Invalid choice.")
            .option(coworkerRegex, null, "coworker")
            .button("coworker", "Coworker", "black")
            .option(contactRegex, null, "contact")
            .button("contact", "Contact", "black")
            .option(privateRegex, null, "private_user")
            .button("private", "Private", "black")
            .email("email", "To which email address should the invite be sent?", "Invalid email address.")
            .summary(getInviteSummary)
            .polar("confirmed", "Are you sure you want to send the invite? (Yes or no)", "Invalid confirmation.")
            .positive(positiveRegex, new Flow()
                .info("Your invite is being sent and corresponding group chat is created, one moment please")
                .add(createGroupAction))
            .positiveButton("yes" ,"Yes", "green")
            .negative(negativeRegex, new Flow()
                .info("Not inviting user "))
            .negativeButton("no", "No", "red"))
        checkUserAction.setNegativeSubFlow(new Flow()
            .info("Sorry you have no access to the invite command."))

        new Flow(control, "Stopped inviting a user", "An error occurred while inviting user")
        .restartButton("invite", "Restart inviting a user", "blue")
        .add(checkUserAction)
        .start(msg);
    }),

    robot.hear(RegexTools.getStartCommandRegex("agreement"), async (msg) => {
        if(!ChatTools.isUserInGroup(msg.message.user)) {
            msg.send("Making an agreement is only available in group chats");
            return;
        }
        var date = Date.now();
        var userId = ChatTools.getUserId(msg.message.user);
        var user = await control.messengerClient.getUser(userId);
        if(!user) {
            msg.send("Unable to retrieve user data");
            return;
        }

        var includeMentions = [];
        includeMentions.push(user);

        var answers = new Answers();
        answers.add("userId", userId);
        answers.add("chatId", msg.message.room);
        answers.add("isGroup", true);
        answers.add("isAux", false);
        answers.add("start_date", date);
        answers.add("user", user);

        var chatPdfAction = new ChatPdfAction("Chat.pdf");
        chatPdfAction.setStartDate(new AnswerValue("start_date"));

        new Flow(control, "Stopped making an agreement", "An error occurred while making an agreement")
        .restartButton("agreement", "Restart making an agreement", "blue")
        .mention("mentions", "With who do you want to make the agreement with? (Use '@' to sum up users)", "Invalid mention.")
        .formatQuestion(formatAgreementWhoQuestion)
        .includeMentions(includeMentions)
        .allAllowed(true)
        .robotAllowed(false)
        .completeMentions()
        .text("agreement", "What is the agreement?", "Invalid answer.")
        .summary(getAgreementSummary)
        .polar("confirmed", "Do you agree with the agreement? (Accept or Reject)", "Invalid confirmation.")
        .positive(acceptRegex, new Flow()
            .info("Agreement was reached, generating pdf")
            .add(chatPdfAction))
        .positiveButton("accept" ,"Accept", "green")
        .negative(rejectRegex, new Flow()
            .info("Unable to reach an agreement"))
        .negativeButton("reject", "Reject", "red")
        .timeout(600000)
        .askMentions("mentions")
        .breakOnValue(false, false)
        .multiUserSummary(getAgreementUsersSummary)
        .start(msg, answers);
    }),

    robot.hear(RegexTools.getStartCommandRegex("verify"), (msg) => {
        new Flow(control, "Stopped verifying", "An error occurred while verifying")
        .restartButton("verify", "Restart verifying your account", "blue")
        .polar("info", "Seems like you want to verify your account, do you want some information before we start?", "Invalid answer")
        .positive(positiveRegex, new Flow()
            .info("I will send you a verification request.", 3000)
            .info("If you accept the request, you will be guided to the website of the identity provider.", 5000)
            .info("When you are authenticated by the identity provider, your messenger account will be verified.", 5000)
            .info("You can also choose to reject the request, but then your account will not get verified.", 5000)
            .info("I am going to send you the verification request now.", 2000))
        .positiveButton("yes" ,"Yes", "green")
        .negative(negativeRegex)
        .negativeButton("no", "No", "red")
        .verification("verification", "idin", true)
        .verified(new Flow()
            .info("Great! Your account is now verified!"))
        .unverified(new Flow()
            .info("It seems you rejected the request, too bad"))
        .start(msg);
    })
};

var callbackAddressFinished = (response, answers) => {
    var summary = "Thank you, your package will be sent to:";
    summary += "\n\nPostal code:\n    " + answers.get("postalCode");
    summary += "\n\nStreet name::\n    " + StringTools.capitalizeLastName(answers.get("street"));
    summary += "\n\nHouse number:\n    " + answers.get("houseNumber");
    response.send(summary);
};

// Filling in form flow finished callback
var callbackFormFinished = (response, answers) => {
    var summary = "Thank you, your answers were:";
    summary += "\n\nColors you like:\n    " + answers.get("color");
    summary += "\n\nMood score:\n    " + answers.get("mood");
    summary += "\n\nFirst name:\n    " + StringTools.capitalizeFirstLetter(answers.get("firstName"));
    summary += "\n\nLast name:\n    " + StringTools.capitalizeLastName(answers.get("lastName"));
    summary += "\n\nAge:\n    " + answers.get("age");
    if(answers.get("subscribe")) {
        summary += "\n\nEmail address to subscribe:\n    " + answers.get("email");
    } else {
        summary += "\n\nReason not to subscribe:\n    " + answers.get("reason");
    }
    summary += "\n\nPhone:\n    " + answers.get("phone");
    summary += "\n\nAttachments:";
    var attachments = answers.get("attachments");
    if(attachments != null) {
        for(var index in attachments) {
            summary += "\n    " + attachments[index]["name"];
        }
    }
    summary += "\n\nMentioned users:";
    var mentions = answers.get("mentions");
    if(mentions != null) {
        for(var index in mentions) {
            summary += "\n    " + StringTools.mentionToUserString(mentions[index]);
        }
    } else {
        summary += "null";
    }
    response.send(summary);
};


// Format an group chat summary of the given answers
var getGroupSummary = (answers) => {
    var summary = "Group chat to create:";
    summary += "\n\nSubject:\n    " + answers.get("subject");
    summary += "\n\nAuto close:\n    ";
    if(answers.get("autoClose")) {
        summary += "Yes";
    } else {
        summary += "No";
    }
    return summary;
};

// Format an invite summary of the given answers
var getInviteSummary = (answers) => {
    var summary = "User to invite:";
    summary += "\n\nName:\n    ";
    summary += StringTools.capitalizeFirstLetter(answers.get("firstName"))
    summary += " " + StringTools.capitalizeLastName(answers.get("lastName"));
    summary += "\n\nInvite as:\n    " + answers.get("inviteType");
    summary += "\n\nSend invite to:\n    ";
    if(answers.get("email") != null) {
        summary += answers.get("email");
    } else if(answers.get("phoneNumber") != null) {
        summary += answers.get("phoneNumber");
    } else {
        summary += "<INVALID_DESTINATION>";
    }
    return summary;
};

var formatAgreementWhoQuestion = (answers) => {
    var user = answers.get("user");
    var firstName = user["first_name"];
    if(firstName != null) {
        return "Hello " + firstName + ", with who do you want to make the agreement with? (Use '@' to sum up users)";
    }
    // Unable to format question, use default
    return null;
};

// Format an agreement summary of the given answers
var getAgreementSummary = (answers) => {
    var summary = "Agreement details:";
    summary += "\n\nAgreement:\n    " + answers.get("agreement");
    summary += "\n\nMentioned users:";
    var mentions = answers.get("mentions");
    if(mentions != null) {
        for(var index in mentions) {
            summary += "\n    " + StringTools.mentionToUserString(mentions[index]);
        }
    } else {
        summary += "null";
    }
    return summary;
};

// Format an agreement user answer summary
var getAgreementUsersSummary = (answers, currentUserId, breaking) => {
    var summary = "";
    var multiAnswers = answers.get("confirmed");
    var mentions = answers.get("mentions");

    // Show user that answered now
    for(var index in mentions) {
        var mention = mentions[index];
        var userId = mention["id"];
        if(userId === currentUserId) {
            if(multiAnswers.get(currentUserId)) {
                summary += StringTools.mentionToUserString(mention) + " has accepted";
            } else {
                summary += StringTools.mentionToUserString(mention) + " has rejected";
            }
            break;
        }
    }

    // User answer value breaking multi user question
    if(breaking) {
       return summary;
    }

    // Show users that have not answered yet
    var waitingFor = "";
    for(var index in mentions) {
        var mention = mentions[index];
        var userId = mention["id"];
        if(multiAnswers.get(userId) == null) {
            waitingFor += "\n    " + StringTools.mentionToUserString(mention);
        }
    }
    if(waitingFor.length > 0) {
        summary += "\n\nWaiting for:" + waitingFor;
    }

    return summary;
};
