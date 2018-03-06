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
//   hubot command              - An example command
//   hubot ping                 - Ping the bot
//
// Author:
//   Alterdesk

// Requirements
const {Control, Listener, Answers} = require('hubot-questionnaire-framework');

// Questionnaire control instance
var control;

module.exports = function(robot) {

    // Create a control instance
    control = new Control();

    // Override the stop regex to "abort" instead of "stop"
    control.setStopRegex(new RegExp(/abort/, 'i'));

    // Override default hubot help command
    control.setCatchHelp(true);
    // Override the help regex to detect "what" and "support" in addition to "help"
    control.setHelpRegex(/help|what|support/, 'i');
    // Set the text to send when help was requested
    control.setCatchHelpText("You can send \"command\" to start the questionnaire.");

    // Wait for two minutes for a reply from a user
    control.setResponseTimeoutMs(120000);
    // Set the text to send when a user is too late
    control.setResponseTimeoutText("You waited too long to answer, stopped listening.");

    // When an unknown command was heard, do not pass it along to the default hubot receiver
    control.setCatchAll(true);
    // Set the text to send when an unknown command was heard
    control.setCatchAllText("I did not understand what you said, type \"help\" to see what I can do for you.");

    // Mark the words "command" and "ping" as an accepted commands
    control.addAcceptedCommands(["command", "ping"]);

    // Override the default robot message receiver
    control.overrideReceiver(robot);

    // Check if the start command of the questionnaire is heard
    robot.hear(/command/i, function(msg) {
        // Optional check if user has permission to execute the questionnaire
        hasPermission(msg.message.user, function(allowed) {
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
                msg.send("Sorry you have no access to command.");
            }
        });
    }),

    // Example simple command that does not use the questionnaire
    robot.hear(/ping/i, function(msg) {
        msg.send("PONG!");
    })
};

// Check if user has permission
var hasPermission = function(user, callback) {
    // Using a callback mechanism like this the check can be an asynchonous network call
    callback(true);
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
    response.send("Thank you, your answers were: " + listener.answers.answerOne + " and " + listener.answers.answerTwo);

    // Execute the command
    executeCommand(listener.answers);
};

var executeCommand = function(answers) {
    // Do something with the given answers
};
