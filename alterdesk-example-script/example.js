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
    control.setCatchHelpText("You can send \"start\" to start a questionnaire, \"photo\" to request a photo, \"pdf\" to request a pdf and \"ping\" to ping.");

    // Wait for two minutes for a reply from a user (overrides environment variable)
    control.setResponseTimeoutMs(120000);
    // Set the text to send when a user is too late
    control.setResponseTimeoutText("You waited too long to answer, stopped listening.");

    // When an unknown command was heard, do not pass it along to the default hubot receiver
    control.setCatchAll(true);
    // Set the text to send when an unknown command was heard
    control.setCatchAllText("I did not understand what you said, type \"help\" to see what I can do for you.");

    // Mark these words as accepted commands
    control.addAcceptedCommands(["start", "photo", "pdf", "ping"]);

    // Override the default robot message receiver
    control.overrideReceiver(robot);

    // Check if the start command of the questionnaire is heard
    robot.hear(/start/i, function(msg) {
        // Optional check if user has permission to execute the questionnaire
      var userId = control.getUserId(msg.message.user);
      console.log("Start command started by user: " + userId);
      messengerApi.checkPermission(userId, "coworkers", null, function(allowed) {
            if(allowed) {
                // Ask the first question
                msg.send("What is the answer for question one?");
                // Object to contain the answers of the questionnaire
                var answers = new Answers();
                // Create a listener to await response for the user in this room
                var listener = new Listener(msg, callbackOne, answers);
                // Add the listener
                return control.addListener(msg.message, listener);
            } else {
                msg.send("Sorry you have no access to the start command.");
            }
        });
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
        msg.send("Generating PDF, one moment please")

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
                            messageData.message = "Here is the PDF you requested";
                            messageData.addAttachmentPath(pdfData.path);
                            messageData.isGroup = pdfData.isGroup;
                            messageData.isAux = pdfData.isAux;
                            messengerApi.sendMessage(messageData, function(success, json) {
                                console.log("Send pdf successful: " + success);
                                if(json != null) {
                                    var messageId = json["id"];
                                    console.log("PDF message id: " + messageId);
                                } else {
                                    msg.send("Was unable to upload PDF to chat");
                                }
                            });
                        } else {
                            msg.send("Was unable to download PDF file");
                        }
                    });
                } else {
                    msg.send("Was unable to retrieve PDF file");
                }
            });
        }, DELAY_PDF_CREATION_MS);
    }),

    // Example simple command that does not use the questionnaire
    robot.hear(/ping/i, function(msg) {
        msg.send("PONG!");
    })
};

// Check and store the answer for the first question and ask followup question when valid
var callbackOne = function(response, listener) {
    // Check if the stop regex was triggered
    if(listener.stop) {
        response.send("Stopped the questionnaire");
        return;
    }

    // Check if rexex accepted the answer
    if(listener.matches == null) {
        response.send("Answer not accepted by regex, What is the answer for question one?");
        return control.addListener(response.message, new Listener(response, callbackOne, listener.answers));
    }
    // Valid answer, store in the answers object
    listener.answers.answerOne = response.message.text;

    response.send("What is the answer for question two?");
    return control.addListener(response.message, new Listener(response, callbackTwo, listener.answers));
};

// Check and store the answer for the second question and show summary when valid
var callbackTwo = function(response, listener) {
    // Check if the stop regex was triggered
    if(listener.stop) {
        response.send("Stopped the questionnaire");
        return;
    }

    // Check if rexex accepted the answer
    if(listener.matches == null) {
        response.send("Answer not accepted by regex, What is the answer for question two?");
        return control.addListener(response.message, new Listener(response, callbackTwo, listener.answers));
    }
    // Valid answer, store in the answers object
    listener.answers.answerTwo = response.message.text;

    // Show summary of answers
    response.send("Thank you, your answers were: \"" + listener.answers.answerOne + "\" and \"" + listener.answers.answerTwo + "\"");

    // Execute the command
    executeCommand(listener.answers);
};

var executeCommand = function(answers) {
    // Do something with the given answers
};
