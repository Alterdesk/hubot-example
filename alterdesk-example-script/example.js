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
var Messenger = require('node-messenger-sdk');
var Extra = require('node-messenger-extra');
const {Control, Answers, Flow} = require('hubot-questionnaire-framework');
const {Schedule} = require('hubot-schedule-api');

// Messenger API instance
var messengerApi;

// Questionnaire control instance
var control;

// Schedule API instance
var schedule;

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

module.exports = function(robot) {

    // Initialize messenger api
    messengerApi = new Messenger.Api();
    // Configure instance with defaults
    messengerApi.configure();

    // Create a control instance
    control = new Control();

    // Set the messenger api
    control.setMessengerApi(messengerApi);

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

    control.setAuthenticatedCallback(function(user) {
        console.log("Authenticated: " + user.id);
    });

    control.setTypingCallback(function(userId, typing, chatId, isGroup) {
        console.log("Typing: " + typing + " user: " + userId + " chat: " + chatId + " isGroup: " + isGroup);
    });

    control.setPresenceCallback(function(userId, status) {
        console.log("Presence: user: " + userId + " status: " + status);
    });

    control.setNewChatCallback(function(chatId, isGroup) {
        console.log("New chat: " + chatId + " isGroup: " + isGroup);

        setTimeout(function() {
            var messageData = new Messenger.SendMessageData();
            if(isGroup) {
                messageData.message = "Thank you for adding me to the group!";
            } else {
                messageData.message = "Welcome to the messenger!";
            }
            messageData.chatId = chatId;
            messageData.isGroup = isGroup;
            messageData.isAux = false;

            var questionPayload = new Messenger.QuestionPayload();
            questionPayload.multiAnswer = false;
            questionPayload.style = "horizontal";
            questionPayload.addOption("help", "Help", "green");
            messageData.payload = questionPayload;

            messengerApi.sendMessage(messageData, function(success, json) {
                console.log("Send new chat message successful: " + success);
                if(json != null) {
                    var messageId = json["id"];
                    console.log("New chat message id: " + messageId);
                } else {
                    console.error("Unable to send new chat message");
                }
            });
        }, DELAY_NEW_CHAT_MESSAGE_MS);
    });

    control.setRemovedFromChatCallback(function(groupId) {
        console.log("Removed from chat: " + groupId);
    });

    control.setClosedChatCallback(function(groupId) {
        console.log("Chat closed: " + groupId);
    });

    control.setMessageLikedCallback(function(userId, messageId, chatId, isGroup) {
        console.log("Message liked: id: " + messageId + " user: " + userId + " chat: " + chatId + " isGroup: " + isGroup);
    });

    control.setMessageDeletedCallback(function(userId, messageId, chatId, isGroup) {
        console.log("Message deleted: id: " + messageId + " user: " + userId + " chat: " + chatId + " isGroup: " + isGroup);
    });

    control.setVerificationCallback(function(userId, messageId, chatId, isGroup, accepted) {
        console.log("Verification: id: " + messageId + " user: " + userId + " chat: " + chatId + " isGroup: " + isGroup + " accepted: " + accepted);
    });

    control.setGroupMemberCallback(function(groupId, added, userId, users) {
        for(var index in users) {
            var user = users[index];
            if(added) {
                console.log("Added in group: " + groupId + " userId: " + userId + " member: " + user.id);
            } else {
                console.log("Removed from group: " + groupId + " userId: " + userId + " member: " + user.id);
            }
        }
    });

    control.setGroupSubscribedCallback(function(groupId, subscribed) {
        console.log("Subscribed: " + subscribed + " chat: " + groupId);
    });

    control.setQuestionAnsweredCallback(function(userId, answerKey, answers) {
        console.log("Question answered: " + userId + " key: " + answerKey + " value: " + answers.get(answerKey));
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

    schedule = new Schedule(robot);
    schedule.setOverrideCallback("introduce", (chatId, isGroup, userId, answers) => {
        var messageData = new Messenger.SendMessageData();
        messageData.message = "Hi! I am the Example Alterdesk bot, press start to begin!";
        messageData.chatId = chatId;
        messageData.isGroup = isGroup;
        messageData.isAux = false;

        var questionPayload = new Messenger.QuestionPayload();
        questionPayload.multiAnswer = false;
        questionPayload.style = "horizontal";
        questionPayload.addOption("form", "Start filling in form", "red");
        questionPayload.addUserId(userId);
        messageData.payload = questionPayload;

        messengerApi.sendMessage(messageData, function(success, json) {
            console.log("Send new chat message successful: " + success);
            if(json != null) {
                var messageId = json["id"];
                console.log("New chat message id: " + messageId);
            } else {
                console.error("Unable to send new chat message");
            }
        });
    });

    schedule.setOverrideCallback("askHasTime", (chatId, isGroup, userId, answers) => {
        var response = control.createHubotResponse(userId, chatId, isGroup);

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
            .action((response, answers, flowCallback) => {
                schedule.scheduleEventInMs(chatId, isGroup, userId, "askHasTime", 30000);
                flowCallback();
            }))
        .negativeButton("no", "No", "red")
        .start(response);
    });

    // Check if the form command was heard
    robot.hear(/form/i, function(msg) {
        var isGroup = control.isUserInGroup(msg.message.user);
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
            console.log("Stopped filling in form, answered " + answers.size() + " questions.")})
        .finish(callbackFormFinished)
        .start(msg);
    }),

    // Check if the photo command was heard
    robot.hear(/photo/i, function(msg) {
        // Create a message data instance
        var messageData = new Messenger.SendMessageData();

        // Text body of the message
        messageData.message = "Here is the photo you requested";
        // Optional attachment to send(local absolute or relative paths)
        messageData.addAttachmentPath("../bot.png");
        // Chat id to send the message in
        messageData.chatId = msg.message.room;
        // If the chat is a group chat or a one-to-one chat
        messageData.isGroup = control.isUserInGroup(msg.message.user);
        // Optional flag if chat auxiliary
        messageData.isAux = false;

        // Send the message and parse result in callback
        messengerApi.sendMessage(messageData, function(success, json) {
            console.log("Send photo successful: " + success);
            if(json != null) {
                var messageId = json["id"];
                console.log("Photo message id: " + messageId);
            } else {
                msg.send("Was unable to upload photo to chat");
            }
        });
    }),

    // Check if the pdf command was heard
    robot.hear(/pdf/i, function(msg) {
        // Notify user of generating pdf
        msg.send("Generating pdf, one moment please");

        createAndSendPdf(msg, null, null, "Chat.pdf", "Here is the pdf you requested");
    }),

    // Example simple command that does not use the questionnaire
    robot.hear(/ping/i, function(msg) {
        msg.send("PONG!");
    }),

    robot.hear(/group/i, function(msg) {
        // Optional check if user has permission to create a group
        var userId = control.getUserId(msg.message.user);
        console.log("Create group command started by user: " + userId);
        messengerApi.isCoworker(userId, robot.user, function(allowed) {
            if(allowed) {
                var answers = new Answers();
                answers.add("userId", userId);

                new Flow(control, "Stopped creating group", "An error occurred while creating group")
                .restartButton("group", "Restart creating group", "blue")
                .text("subject", "What should the subject for the group be? (Accepted length 8-200)", "Invalid group chat subject.")
                .length(8, 200)
                .polar("autoClose", "Should the chat close automatically after a week of inactivity? (Yes or no)", "Invalid answer")
                .positive(positiveRegex)
                .positiveButton("yes" ,"Yes", "green")
                .negative(negativeRegex)
                .negativeButton("no", "No", "red")
                .summary(getGroupSummary)
                .polar("confirmed", "Are you sure you want to create the group? (Yes or no)", "Invalid confirmation.")
                .positive(positiveRegex)
                .positiveButton("yes" ,"Yes", "green")
                .negative(negativeRegex)
                .negativeButton("no", "No", "red")
                .finish(callbackGroupFinished)
                .start(msg, answers);
            } else {
                msg.send("Sorry you have no access to the group command.");
            }
        });
    }),

    robot.hear(/invite/i, function(msg) {
        // Optional check if user has permission to invite a user
        var userId = control.getUserId(msg.message.user);
        console.log("Invite user command started by user: " + userId);
        messengerApi.isCoworker(userId, robot.user, function(allowed) {
            if(allowed) {
                var answers = new Answers();
                answers.add("userId", userId);

                new Flow(control, "Stopped inviting a user", "An error occurred while inviting user")
                .restartButton("invite", "Restart inviting a user", "blue")
                .text("firstName", "What is the first name of the user you want to invite?", "Invalid name.")
                .text("lastName", "What is the last name?", "Invalid name.")
                .multiple("inviteType", "Do you want to invite the user as a coworker, contact or private user?", "Invalid choice.")
                .option(coworkerRegex)
                .button("coworker", "Coworker", "black")
                .option(contactRegex)
                .button("contact", "Contact", "black")
                .option(privateRegex)
                .button("private", "Private", "black")
                .email("email", "To which email address should the invite be sent?", "Invalid email address.")
                .summary(getInviteSummary)
                .polar("confirmed", "Are you sure you want to send the invite? (Yes or no)", "Invalid confirmation.")
                .positive(positiveRegex)
                .positiveButton("yes" ,"Yes", "green")
                .negative(negativeRegex)
                .negativeButton("no", "No", "red")
                .finish(callbackInviteFinished)
                .start(msg, answers);
            } else {
                msg.send("Sorry you have no access to the invite command.");
            }
        });
    }),

    robot.hear(/agreement/i, function(msg) {
        if(!control.isUserInGroup(msg.message.user)) {
            msg.send("Making an agreement is only available in group chats");
            return;
        }
        var date = Date.now();
        var userId = control.getUserId(msg.message.user);

        messengerApi.get("users/" + userId, function(success, json) {
            if(success) {
                var includeMentions = [];
                includeMentions.push(json);

                var answers = new Answers();
                answers.add("userId", userId);
                answers.add("chatId", msg.message.room);
                answers.add("isGroup", true);
                answers.add("isAux", false);
                answers.add("start_date", date);
                answers.add("user", json);

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
                .positive(acceptRegex)
                .positiveButton("accept" ,"Accept", "green")
                .negative(rejectRegex)
                .negativeButton("reject", "Reject", "red")
                .timeout(600000)
                .askMentions("mentions")
                .breakOnValue(false, false)
                .multiUserSummary(getAgreementUsersSummary)
                .finish(callbackAgreementFinished)
                .start(msg, answers);
            } else {
                msg.send("An error occurred while making an agreement");
            }
        });
    }),

    robot.hear(/verify/i, function(msg) {
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
        .verification("verification", "alterwaves", true)
        .verified(new Flow()
            .info("Great! Your account is now verified!"))
        .unverified(new Flow()
            .info("It seems you rejected the request, too bad"))
        .start(msg);
    })
};

var callbackAddressFinished = function(response, answers) {
    var summary = "Thank you, your package will be sent to:";
    summary += "\n\nPostal code:\n    " + answers.get("postalCode");
    summary += "\n\nStreet name::\n    " + Extra.capitalizeLastName(answers.get("street"));
    summary += "\n\nHouse number:\n    " + answers.get("houseNumber");
    response.send(summary);
};

// Filling in form flow finished callback
var callbackFormFinished = function(response, answers) {
    var summary = "Thank you, your answers were:";
    summary += "\n\nColors you like:\n    " + answers.get("color");
    summary += "\n\nMood score:\n    " + answers.get("mood");
    summary += "\n\nFirst name:\n    " + Extra.capitalizeFirstLetter(answers.get("firstName"));
    summary += "\n\nLast name:\n    " + Extra.capitalizeLastName(answers.get("lastName"));
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
            summary += "\n    " + Extra.mentionToUserString(mentions[index]);
        }
    } else {
        summary += "null";
    }
    response.send(summary);
};


// Format an group chat summary of the given answers
var getGroupSummary = function(answers) {
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

// Create group flow finished callback
var callbackGroupFinished = function(response, answers) {
    if(!answers.get("confirmed")) {
        response.send("Not creating group " + answers.get("subject"));
        return;
    }
    // Notify user that creating group has started
    response.send("Creating group chat, one moment please");

    // Create a group data instance
    var groupData = new Messenger.CreateGroupData();

    // Set the chat subject
    groupData.subject = answers.get("subject");
    // Optional members to add
    groupData.addMemberId(answers.get("userId"));
    if(answers.get("autoClose")) {
        // Automatically close the group after 7 days of inactivity (optional)
        groupData.autoCloseAfter = 7;
    }

    // Create group and parse result in callback
    messengerApi.createGroup(groupData, function(success, json) {
        console.log("Create group successful: " + success);
        if(json != null) {
            var groupId = json["id"];
            console.log("Created group with id: " + groupId);
            response.send("Group chat created \"" + groupData.subject + "\"");
        } else {
            response.send("Unable to create group chat");
        }
    });
};

// Format an invite summary of the given answers
var getInviteSummary = function(answers) {
    var summary = "User to invite:";
    summary += "\n\nName:\n    ";
    summary += Extra.capitalizeFirstLetter(answers.get("firstName"))
    summary += " " + Extra.capitalizeLastName(answers.get("lastName"));
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

// Invite user flow finished callback
var callbackInviteFinished = function(response, answers) {
    var firstName = Extra.capitalizeFirstLetter(answers.get("firstName"));
    var lastName = Extra.capitalizeLastName(answers.get("lastName"));
    if(!answers.get("confirmed")) {
        response.send("Not inviting user " + firstName + " " + lastName);
        return;
    }
    // Notify user that invite has started
    response.send("Your invite is being sent and corresponding group chat is created, one moment please");

    // Create a invite user data instance
    var inviteData = new Messenger.InviteUserData();

    // First name of the user (optional)
    inviteData.firstName = firstName;
    // Last name of the user (optional)
    inviteData.lastName = lastName;
    // Invite type (coworker, contact, private_user)
    var inviteType = answers.get("inviteType");
    if(inviteType.match(coworkerRegex)) {
        inviteData.inviteType = "coworker";
    } else if(inviteType.match(contactRegex)) {
        inviteData.inviteType = "contact";
    } else {
        inviteData.inviteType = "private_user";
    }
    // Email address to send invite to
    inviteData.email = answers.get("email");
    // Create a one-to-one chat with this user
    inviteData.createConversation = false;

    // Create a group data instance
    var groupData = new Messenger.CreateGroupData();

    // Set the chat subject
    groupData.subject = "Group chat with " + firstName + " " + lastName;
    // Optional members to add
    groupData.addMemberId(answers.get("userId"));
    // Invite user in the group
    groupData.addInvite(inviteData);
    // Automatically close the group after 7 days of inactivity (optional)
    groupData.autoCloseAfter = 7;

    // Create group and parse result in callback
    messengerApi.createGroup(groupData, function(success, json) {
        console.log("Create group successful: " + success);
        if(json != null) {
            var groupId = json["id"];
            console.log("Created group with id: " + groupId);
            response.send("Group chat created and user is invited in \"" + groupData.subject + "\"");
        } else {
            response.send("Unable to invite user and/or create group chat");
        }
    });
};

var createAndSendPdf = function(response, startDate, endDate, fileName, messageText) {
    // Delay PDF creation to include latest messages
    setTimeout(function() {
        // Create a PDF data instance
        var pdfData = new Messenger.PdfData();

        // Chat id to generate pdf from
        pdfData.chatId = response.message.room;
        // If the chat is a group chat or a one-to-one chat
        pdfData.isGroup = control.isUserInGroup(response.message.user);
        // Optional flag if chat auxiliary
        pdfData.isAux = false;
        // Starting date of generated pdf (null == last 30 days)
        pdfData.startDate = startDate;
        // Ending date of generated pdf (null == latest message)
        pdfData.endDate = endDate;
        // Filename of the downloaded pdf
        pdfData.name = fileName;

        // Retrieve chat pdf download url
        messengerApi.getChatPdfUrl(pdfData, function(success, json, cookie) {
            console.log("Retrieve pdf download url successful: " + success);
            if(json != null) {
                var url = json["link"];

                // Use url and cookie to download pdf
                messengerApi.download(url, pdfData.name, "application/pdf", cookie, function(downloaded, path) {
                    if(downloaded) {
                        console.log("pdf: Path: " + path);
                        pdfData.path = path;

                        // Upload the downloaded pdf file to the chat
                        var messageData = new Messenger.SendMessageData();
                        messageData.chatId = pdfData.chatId;
                        messageData.message = messageText;
                        messageData.addAttachmentPath(pdfData.path);
                        messageData.isGroup = pdfData.isGroup;
                        messageData.isAux = pdfData.isAux;
                        messengerApi.sendMessage(messageData, function(success, json) {
                            console.log("Send pdf successful: " + success);
                            if(json != null) {
                                var messageId = json["id"];
                                console.log("Pdf message id: " + messageId);
                            } else {
                                response.send("Was unable to upload pdf to chat");
                            }
                        });
                    } else {
                        response.send("Was unable to download pdf file");
                    }
                });
            } else {
                response.send("Was unable to retrieve pdf file");
            }
        });
    }, DELAY_PDF_CREATION_MS);
};

var formatAgreementWhoQuestion = function(answers) {
    var user = answers.get("user");
    var firstName = user["first_name"];
    if(firstName != null) {
        return "Hello " + firstName + ", with who do you want to make the agreement with? (Use '@' to sum up users)";
    }
    // Unable to format question, use default
    return null;
};

// Format an agreement summary of the given answers
var getAgreementSummary = function(answers) {
    var summary = "Agreement details:";
    summary += "\n\nAgreement:\n    " + answers.get("agreement");
    summary += "\n\nMentioned users:";
    var mentions = answers.get("mentions");
    if(mentions != null) {
        for(var index in mentions) {
            summary += "\n    " + Extra.mentionToUserString(mentions[index]);
        }
    } else {
        summary += "null";
    }
    return summary;
};

// Format an agreement user answer summary
var getAgreementUsersSummary = function(answers, currentUserId, breaking) {
    var summary = "";
    var multiAnswers = answers.get("confirmed");
    var mentions = answers.get("mentions");

    // Show user that answered now
    for(var index in mentions) {
        var mention = mentions[index];
        var userId = mention["id"];
        if(userId === currentUserId) {
            if(multiAnswers.get(currentUserId)) {
                summary += Extra.mentionToUserString(mention) + " has accepted";
            } else {
                summary += Extra.mentionToUserString(mention) + " has rejected";
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
            waitingFor += "\n    " + Extra.mentionToUserString(mention);
        }
    }
    if(waitingFor.length > 0) {
        summary += "\n\nWaiting for:" + waitingFor;
    }

    return summary;
};

// Agreement flow finished callback
var callbackAgreementFinished = function(response, answers) {
    console.log("Finished:", answers);

    var confirmedAnswers = answers.get("confirmed");
    var keys = confirmedAnswers.keys();
    var agreed = keys.length > 0;
    for(var index in keys) {
        var key = keys[index];
        if(!confirmedAnswers.get(key)) {
            agreed = false;
            break;
        }
    }
    if(agreed) {
        response.send("Agreement was reached, generating pdf");
        var startDate = answers.get("start_date");
        createAndSendPdf(response, startDate, null, "Agreement.pdf", "Here is the agreement formatted as a pdf file");
    } else {
        response.send("Unable to reach an agreement");
    }
};
