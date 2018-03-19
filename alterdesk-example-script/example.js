// Description:
//   Alterdesk example bot
//
// Dependencies:
//   hubot-questionnaire-framework
//   node-messenger-sdk
//   node-messenger-extra
//
// Configuration:
//   None
//
// Commands:
//   hubot help                 - Print help of this bot
//   hubot start                - Ask the user some questions
//   hubot photo                - Upload a photo in the current chat
//   hubot pdf                  - Generate and upload a pdf in the current chat
//   hubot ping                 - Ping the bot
//
// Author:
//   Alterdesk

// Requirements
var Messenger = require('node-messenger-sdk');
var Extra = require('node-messenger-extra');
const {Control, Listener, Answers, Flow} = require('hubot-questionnaire-framework');

// Messenger API instance
var messengerApi;

// Questionnaire control instance
var control;

// Script configurations
var DELAY_PDF_CREATION_MS = 2000;

// Regex
var positiveRegex = new RegExp(/yes/, 'i');
var negativeRegex = new RegExp(/no/, 'i');
var coworkerRegex = new RegExp(/coworker/, 'i');
var contactRegex = new RegExp(/contact/, 'i');
var privateRegex = new RegExp(/private/, 'i');

module.exports = function(robot) {

    // Initialize messenger api
    messengerApi = new Messenger.Api();
    // Configure instance with defaults
    messengerApi.configure();

    // Create a control instance
    control = new Control();

    // Override the stop regex to "abort" in addition to "stop"
    control.setStopRegex(new RegExp(/stop|abort/, 'i'));

    // Override default hubot help command
    control.setCatchHelp(true);
    // Override the help regex to detect "what" and "support" in addition to "help"
    control.setHelpRegex(/help|what|support/, 'i');
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

    // Mark these words as accepted commands
    control.addAcceptedCommand("form", "Fill in a form by using a questionnaire");
    control.addAcceptedCommand("photo", "Request a photo from me");
    control.addAcceptedCommand("pdf", "Request a PDF chat log file from this chat");
    control.addAcceptedCommand("ping", "Ping me");
    control.addAcceptedCommand("group", "Create a group chat");
    control.addAcceptedCommand("invite", "Invite a user into a new group chat");

    // Override the default robot message receiver
    control.overrideReceiver(robot);

    // Check if the form command was heard
    robot.hear(/form/i, function(msg) {
        var emailFlow = new Flow(control);
        emailFlow.email("email", "What is your email address? (Allowed domains: .com and .nl)", "Invalid email address.")
        .domains([".com",".nl"]);

        var reasonFlow = new Flow(control);
        reasonFlow.text("reason", "Can you tell us why you don't want to subscribe?", "Invalid answer.")
        .length(3);

        new Flow(control, "Stopped filling in form", "Error while filling in form")
        .text("firstName", "Can you send me your first name?", "Invalid name.")
        .length(2, 100)
        .text("lastName", "Can you send me your last name?", "Invalid name.")
        .length(2, 100)
        .number("age", "How old are you? (Allowed range 12-90)", "Invalid number or out of range.")
        .range(12, 90)
        .polar("subscribe", "Do you want to subscribe to our newsletter? (Yes or no)", "Invalid answer.")
        .positive(positiveRegex, emailFlow)
        .negative(negativeRegex, reasonFlow)
        .phone("phone", "What is your phone number? (Allowed country code +31)", "Invalid phone number.")
        .countryCodes(["+31"])
        .mention("mentions", "Which users do you want to include? (Use '@' to sum up users)", "Invalid mention.")
        .robotAllowed(!control.isUserInGroup(msg.message.user))
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
        msg.send("Generating pdf, one moment please")

        // Delay PDF creation to include latest messages
        setTimeout(function() {
            // Create a PDF data instance
            var pdfData = new Messenger.PdfData();

            // Chat id to generate pdf from
            pdfData.chatId = msg.message.room;
            // If the chat is a group chat or a one-to-one chat
            pdfData.isGroup = control.isUserInGroup(msg.message.user);
            // Optional flag if chat auxiliary
            pdfData.isAux = false;
            // Starting date of generated pdf (null == last 30 days)
            pdfData.startDate = null;
            // Ending date of generated pdf (null == latest message)
            pdfData.endDate = null;
            // Filename of the downloaded pdf
            pdfData.name = "Chat.pdf";

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
                            messageData.message = "Here is the pdf you requested";
                            messageData.addAttachmentPath(pdfData.path);
                            messageData.isGroup = pdfData.isGroup;
                            messageData.isAux = pdfData.isAux;
                            messengerApi.sendMessage(messageData, function(success, json) {
                                console.log("Send pdf successful: " + success);
                                if(json != null) {
                                    var messageId = json["id"];
                                    console.log("Pdf message id: " + messageId);
                                } else {
                                    msg.send("Was unable to upload pdf to chat");
                                }
                            });
                        } else {
                            msg.send("Was unable to download pdf file");
                        }
                    });
                } else {
                    msg.send("Was unable to retrieve pdf file");
                }
            });
        }, DELAY_PDF_CREATION_MS);
    }),

    // Example simple command that does not use the questionnaire
    robot.hear(/ping/i, function(msg) {
        msg.send("PONG!");
    }),

    robot.hear(/group/i, function(msg) {
        // Optional check if user has permission to create a group
        var userId = control.getUserId(msg.message.user);
        console.log("Create group command started by user: " + userId);
        messengerApi.checkPermission(userId, "coworkers", null, function(allowed) {
            if(allowed) {
                var answers = new Answers();
                answers.add("userId", userId);

                new Flow(control, "Stopped creating group", "An error occurred while creating group")
                .text("subject", "What should the subject for the group be? (Accepted length 8-200)", "Invalid group chat subject.")
                .length(8, 200)
                .polar("autoClose", "Should the chat close automatically after a week of inactivity? (Yes or no)", "Invalid answer")
                .positive(positiveRegex)
                .negative(negativeRegex)
                .summary(getGroupSummary)
                .polar("confirmed", "Are you sure you want to create the group? (Yes or no)", "Invalid confirmation.")
                .positive(positiveRegex)
                .negative(negativeRegex)
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
        messengerApi.checkPermission(userId, "coworkers", null, function(allowed) {
            if(allowed) {
                var answers = new Answers();
                answers.add("userId", userId);

                new Flow(control, "Stopped inviting user", "An error occurred while inviting user")
                .text("firstName", "What is the first name of the user you want to invite?", "Invalid name.")
                .text("lastName", "What is the last name?", "Invalid name.")
                .multiple("inviteType", "Do you want to invite the user as a coworker, contact or private user?", "Invalid choice.")
                .option(coworkerRegex)
                .option(contactRegex)
                .option(privateRegex)
                .email("email", "To which email address should the invite be sent?", "Invalid email address.")
                .summary(getInviteSummary)
                .polar("confirmed", "Are you sure you want to send the invite? (Yes or no)", "Invalid confirmation.")
                .positive(positiveRegex)
                .negative(negativeRegex)
                .finish(callbackInviteFinished)
                .start(msg, answers);
            } else {
                msg.send("Sorry you have no access to the invite command.");
            }
        });
    })
};

// Filling in form flow finished callback
var callbackFormFinished = function(response, answers) {
    var summary = "Thank you, your answers were:";
    summary += "\n\nFirst name:\n    " + Extra.capitalizeFirstLetter(answers.get("firstName"));
    summary += "\n\nLast name:\n    " + Extra.capitalizeLastName(answers.get("lastName"));
    summary += "\n\nAge:\n    " + answers.get("age");
    if(answers.get("subscribe")) {
        summary += "\n\nEmail address to subscribe:\n    " + answers.get("email");
    } else {
        summary += "\n\nReason not to subscribe:\n    " + answers.get("reason");
    }
    summary += "\n\nPhone:\n    " + answers.get("phone");
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
