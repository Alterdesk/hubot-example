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
const {Control, Listener, Answers} = require('hubot-questionnaire-framework');

// Messenger API instance
var messengerApi;

// Questionnaire control instance
var control;

// Script configurations
var DELAY_PDF_CREATION_MS = 2000;

module.exports = function(robot) {

    // Initialize messenger api
    messengerApi = new Messenger.Api();
    // Configure instance with defaults
    messengerApi.configure();

    // Create a control instance
    control = new Control();

    // Override the stop regex to "abort" instead of "stop"
    control.setStopRegex(new RegExp(/abort/, 'i'));

    // Override default hubot help command
    control.setCatchHelp(true);
    // Override the help regex to detect "what" and "support" in addition to "help"
    control.setHelpRegex(/help|what|support/, 'i');
    // Set the text to send when help was requested
    control.setCatchHelpText(catchHelpText);

    // Wait for two minutes for a reply from a user (overrides environment variable)
    control.setResponseTimeoutMs(120000);
    // Set the text to send when a user is too late
    control.setResponseTimeoutText(timeoutText);

    // When an unknown command was heard, do not pass it along to the default hubot receiver
    control.setCatchAll(true);
    // Set the text to send when an unknown command was heard
    control.setCatchAllText(catchAllText);

    // Mark these words as accepted commands
    control.addAcceptedCommand("start", startHelpText);
    control.addAcceptedCommand("photo", photoHelpText);
    control.addAcceptedCommand("pdf", pdfHelpText);
    control.addAcceptedCommand("ping", pingHelpText);
    control.addAcceptedCommand("group", groupHelpText);
    control.addAcceptedCommand("invite", inviteHelpText);

    // Override the default robot message receiver
    control.overrideReceiver(robot);

    // Check if the start command of the questionnaire is heard
    robot.hear(/start/i, function(msg) {
        // Ask the first question
        msg.send(startQuestionOneText);
        // Object to contain the answers of the questionnaire
        var answers = new Answers();
        // Create a listener to await response for the user in this room
        var listener = new Listener(msg, callbackOne, answers);
        // Add the listener
        return control.addListener(msg.message, listener);
    }),

    // Check if the photo command was heard
    robot.hear(/photo/i, function(msg) {
        // Create a message data instance
        var messageData = new Messenger.SendMessageData();

        // Text body of the message
        messageData.message = photoMessageText;
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
                msg.send(photoUnableToUploadText);
            }
        });
    }),

    // Check if the pdf command was heard
    robot.hear(/pdf/i, function(msg) {
        // Notify user of generating pdf
        msg.send(pdfGeneratingText)

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
                            messageData.message = pdfMessageText;
                            messageData.addAttachmentPath(pdfData.path);
                            messageData.isGroup = pdfData.isGroup;
                            messageData.isAux = pdfData.isAux;
                            messengerApi.sendMessage(messageData, function(success, json) {
                                console.log("Send pdf successful: " + success);
                                if(json != null) {
                                    var messageId = json["id"];
                                    console.log("Pdf message id: " + messageId);
                                } else {
                                    msg.send(pdfUnableToUploadText);
                                }
                            });
                        } else {
                            msg.send(pdfUnableToDownloadText);
                        }
                    });
                } else {
                    msg.send(pdfUnableToRetrieveText);
                }
            });
        }, DELAY_PDF_CREATION_MS);
    }),

    // Example simple command that does not use the questionnaire
    robot.hear(/ping/i, function(msg) {
        msg.send(pingPongText);
    }),

    robot.hear(/group/i, function(msg) {
        // Optional check if user has permission to create a group
        var userId = control.getUserId(msg.message.user);
        console.log("Create group command started by user: " + userId);
        messengerApi.checkPermission(userId, "coworkers", null, function(allowed) {
            if(allowed) {
                // Ask the first question
                msg.send(groupQuestionSubjectText);
                // Object to contain the answers of the questionnaire
                var answers = new Answers();
                // Add the requesting user id to add as member in the group
                answers.userId = userId;
                // Create a listener to await response for the user in this room
                var listener = new Listener(msg, callbackSubject, answers);
                // Add the listener
                return control.addListener(msg.message, listener);
            } else {
                msg.send(groupNoAccessText);
            }
        });
    }),

    robot.hear(/invite/i, function(msg) {
        // Optional check if user has permission to invite a user
        var userId = control.getUserId(msg.message.user);
        console.log("Invite user command started by user: " + userId);
        messengerApi.checkPermission(userId, "coworkers", null, function(allowed) {
            if(allowed) {
                // Ask the first question
                msg.send(inviteQuestionFirstNameText);
                // Object to contain the answers of the questionnaire
                var answers = new Answers();
                // Add the requesting user id to add as member in the group
                answers.userId = userId;
                // Create a listener to await response for the user in this room
                var listener = new Listener(msg, callbackFirstName, answers);
                // Add the listener
                return control.addListener(msg.message, listener);
            } else {
                msg.send(inviteNoAccessText);
            }
        });
    })
};

// Check and store the answer for the first question and ask followup question when valid
var callbackOne = function(response, listener) {
    // Check if the stop regex was triggered
    if(listener.stop) {
        response.send(startStoppedText);
        return;
    }

    // Check if rexex accepted the answer
    if(listener.matches == null) {
        response.send(startInvalidAnswer + " " + startQuestionOneText);
        return control.addListener(response.message, new Listener(response, callbackOne, listener.answers));
    }
    // Valid answer, store in the answers object
    listener.answers.answerOne = response.message.text;

    response.send(startQuestionTwoText);
    return control.addListener(response.message, new Listener(response, callbackTwo, listener.answers));
};

// Check and store the answer for the second question and show summary when valid
var callbackTwo = function(response, listener) {
    // Check if the stop regex was triggered
    if(listener.stop) {
        response.send(startStoppedText);
        return;
    }

    // Check if rexex accepted the answer
    if(listener.matches == null) {
        response.send(startInvalidAnswer + " " + startQuestionTwoText);
        return control.addListener(response.message, new Listener(response, callbackTwo, listener.answers));
    }
    // Valid answer, store in the answers object
    listener.answers.answerTwo = response.message.text;

    // Execute the command
    executeStartCommand(response, listener.answers);
};

// Execute the start command
var executeStartCommand = function(response, answers) {
    // Do something with the given answers

    // Show summary of answers
    response.send(startThankYou + " \"" + answers.answerOne + "\" " + startAnd + " \"" + answers.answerTwo + "\"");
};

// Check and store chat subject when valid
var callbackSubject = function(response, listener) {
    // Check if the stop regex was triggered
    if(listener.stop) {
        response.send(groupStoppedText);
        return;
    }

    // Check if rexex accepted the answer
    if(listener.matches == null) {
        response.send(groupInvalidSubject + " " + groupQuestionSubjectText);
        return control.addListener(response.message, new Listener(response, callbackSubject, listener.answers));
    }
    // Valid answer, store in the answers object
    listener.answers.subject = response.message.text;

    response.send(getGroupSummary(listener.answers) + groupQuestionConfirmText);
    return control.addListener(response.message, new Listener(response, callbackConfirmGroup, listener.answers));
};

// Check for confirmation and execute when confirmed
var callbackConfirmGroup = function(response, listener) {
    // Check if the stop regex was triggered
    if(listener.stop) {
        response.send(groupStoppedText);
        return;
    }

    if(response.message.match(positiveAnswerRegex)) {
        executeGroupCommand(response, listener.answers);
    } else if(response.message.match(negativeAnswerRegex)) {
        response.send(groupStoppedText);
    } else {
        response.send(groupInvalidConfirmation + " " + groupQuestionConfirmText);
        return control.addListener(response.message, new Listener(response, callbackConfirmGroup, listener.answers));
    }
};

// Format an group chat summary of the given answers
var getGroupSummary = function(answers) {
    var summary = groupCreateText + ":\n" + answers.subject + "\n\n";
    return summary;
};

var executeGroupCommand = function(response, answers) {
    // Notify user that creating group has started
    response.send(groupExecutingText);

    // Create a group data instance
    var groupData = new Messenger.CreateGroupData();

    // Set the chat subject
    groupData.subject = answers.subject;
    // Optional members to add
    groupData.addMemberId(answers.userId);
    // Automatically close the group after 7 days of inactivity (optional)
    groupData.autoCloseAfter = 7;

    // Create group and parse result in callback
    messengerApi.createGroup(groupData, function(success, json) {
        console.log("Create group successful: " + success);
        if(json != null) {
            var groupId = json["id"];
            console.log("Created group with id: " + groupId);
            response.send(groupDoneText + " \"" + groupData.subject + "\"");
        } else {
            response.send(groupFailedText);
        }
    });
};

// Check and store first name and ask last name when valid
var callbackFirstName = function(response, listener) {
    // Check if the stop regex was triggered
    if(listener.stop) {
        response.send(inviteStoppedText);
        return;
    }

    // Check if rexex accepted the answer
    if(listener.matches == null) {
        response.send(inviteInvalidName + " " + inviteQuestionFirstNameText);
        return control.addListener(response.message, new Listener(response, callbackFirstName, listener.answers));
    }
    // Valid answer, store in the answers object
    listener.answers.firstName = Extra.capitalizeFirstLetter(response.message.text);

    response.send(inviteQuestionLastNameText);
    return control.addListener(response.message, new Listener(response, callbackLastName, listener.answers));
};

// Check and store last name and ask email address when valid
var callbackLastName = function(response, listener) {
    // Check if the stop regex was triggered
    if(listener.stop) {
        response.send(inviteStoppedText);
        return;
    }

    // Check if rexex accepted the answer
    if(listener.matches == null) {
        response.send(inviteInvalidName + " " + inviteQuestionLastNameText);
        return control.addListener(response.message, new Listener(response, callbackLastName, listener.answers));
    }
    // Valid answer, store in the answers object
    listener.answers.lastName = Extra.capitalizeLastName(response.message.text);

    response.send(inviteQuestionEmailText);
    return control.addListener(response.message, new Listener(response, callbackEmail, listener.answers, Extra.getEmailRegex()));
};

// Check and store email address and ask confirmation when valid
var callbackEmail = function(response, listener) {
    // Check if the stop regex was triggered
    if(listener.stop) {
        response.send(inviteStoppedText);
        return;
    }

    // Check if rexex accepted the answer
    if(listener.matches == null) {
        response.send(inviteInvalidEmail + " " + inviteQuestionEmailText);
        return control.addListener(response.message, new Listener(response, callbackEmail, listener.answers, Extra.getEmailRegex()));
    }
    // Valid answer, store in the answers object
    listener.answers.email = response.message.text;

    response.send(getInviteSummary(listener.answers) + inviteQuestionConfirmText);
    return control.addListener(response.message, new Listener(response, callbackConfirmInvite, listener.answers));
};

// Check for confirmation and execute when confirmed
var callbackConfirmInvite = function(response, listener) {
    // Check if the stop regex was triggered
    if(listener.stop) {
        response.send(inviteStoppedText);
        return;
    }

    if(response.message.match(positiveAnswerRegex)) {
        executeInviteCommand(response, listener.answers);
    } else if(response.message.match(negativeAnswerRegex)) {
        response.send(inviteStoppedText);
    } else {
        response.send(inviteInvalidConfirmation + inviteQuestionConfirmText);
        return control.addListener(response.message, new Listener(response, callbackConfirmInvite, listener.answers));
    }
}

// Format an invite summary of the given answers
var getInviteSummary = function(answers) {
    var summary = inviteUserText + ":\n" + answers.firstName + " " + answers.lastName + "\n\n";
    summary += inviteSendToText + ":\n";
    if(answers.email != null) {
        summary += answers.email + "\n\n";
    } else if(answers.phoneNumber) {
        summary += answers.phoneNumber + "\n\n";
    } else {
        summary += "<INVALID_DESTINATION>\n\n";
    }
    return summary;
};


var executeInviteCommand = function(response, answers) {
    // Notify user that invite has started
    response.send(inviteExecutingText);

    // Create a invite user data instance
    var inviteData = new Messenger.InviteUserData();

    // First name of the user (optional)
    inviteData.firstName = answers.firstName;
    // Last name of the user (optional)
    inviteData.lastName = answers.lastName;
    // Invite type (coworker, contact, private_user)
    inviteData.inviteType = "private_user";
    // Email address to send invite to
    inviteData.email = answers.email;
    // Create a one-to-one chat with this user
    inviteData.createConversation = false;

    // Create a group data instance
    var groupData = new Messenger.CreateGroupData();

    // Set the chat subject
    groupData.subject = "Group chat with " + answers.firstName + " " + answers.lastName;
    // Optional members to add
    groupData.addMemberId(answers.userId);
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
            response.send(inviteDoneText + " \"" + groupData.subject + "\"");
        } else {
            response.send(inviteFailedText);
        }
    });
};

// Regex
var positiveAnswerRegex = new RegExp(/yes/, 'i');
var negativeAnswerRegex = new RegExp(/no/, 'i');

// General texts
var catchHelpText = "Hello I am the Alterdesk Example Bot, here is a list of things I can do for you:\n";
var catchAllText = "I did not understand what you said, type \"help\" to see what I can do for you.";
var timeoutText = "You waited too long to answer, stopped listening.";

// Start command texts
var startHelpText = "Start a simple and short questionnaire";
var startQuestionOneText = "What is the answer for question one?";
var startQuestionTwoText = "What is the answer for question two?";
var startInvalidAnswer = "Invalid answer for question.";
var startStoppedText = "Stopped the questionnaire";
var startThankYou = "Thank you, your answers were:";
var startAnd = "and";

// Photo command texts
var photoHelpText = "Request a photo from me";
var photoMessageText = "Here is the photo you requested";
var photoUnableToUploadText = "Was unable to upload photo to chat";

// PDF command texts
var pdfHelpText = "Request a PDF chat log file from this chat";
var pdfGeneratingText = "Generating pdf, one moment please";
var pdfMessageText = "Here is the pdf you requested";
var pdfUnableToUploadText = "Was unable to upload pdf to chat";
var pdfUnableToDownloadText = "Was unable to download pdf file";
var pdfUnableToRetrieveText = "Was unable to retrieve pdf file";

// Ping command texts
var pingHelpText = "Ping me";
var pingPongText = "PONG!";

// Group command texts
var groupHelpText = "Create a group chat";
var groupNoAccessText = "Sorry you have no access to the group command.";
var groupQuestionSubjectText = "What should the subject for the group be?"
var groupQuestionConfirmText = "Are you sure you want to create the group?";
var groupExecutingText = "Creating group chat, one moment please";
var groupDoneText = "Group chat created";
var groupFailedText = "Unable to create group chat";
var groupInvalidSubject = "Invalid group chat subject.";
var groupInvalidConfirmation = "Invalid confirmation.";
var groupStoppedText = "Stopped creating group";
var groupCreateText = "Group chat to create";

// Invite command texts
var inviteHelpText = "Invite a user into a group chat";
var inviteNoAccessText = "Sorry you have no access to the invite command.";
var inviteQuestionFirstNameText = "What is the first name of the user you want to invite?";
var inviteQuestionLastNameText = "What is the last name?";
var inviteQuestionEmailText = "To which email address should the invite be sent?";
var inviteQuestionConfirmText = "Are you sure you want to send the invite?";
var inviteExecutingText = "Your invite is being sent and corresponding group chat is created, one moment please";
var inviteDoneText = "Group chat created and user is invited in";
var inviteFailedText = "Unable to invite user and/or create group chat";
var inviteInvalidName = "Invalid name.";
var inviteInvalidEmail = "Invalid email address.";
var inviteInvalidConfirmation = "Invalid confirmation.";
var inviteStoppedText = "Stopped inviting user";
var inviteUserText = "User";
var inviteSendToText = "Send invite to";