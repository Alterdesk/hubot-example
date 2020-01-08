@echo off

SETLOCAL
SET PATH=node_modules\.bin;node_modules\hubot\node_modules\.bin;%PATH%

REM Set your OAuth 2.0 API token for Alterdesk here
SET HUBOT_ALTERDESK_TOKEN=

REM Alterdesk API
SET HUBOT_ALTERDESK_HOST=api.alterdesk.com:443
SET HUBOT_ALTERDESK_URL=https://api.alterdesk.com/v1/
SET HUBOT_ALTERDESK_PORT=443

REM Question times out after a minute
SET HUBOT_QUESTIONNAIRE_RESPONSE_TIMEOUT=300000

REM Shorter bot typing delay
SET HUBOT_ALTERDESK_TYPING_DELAY=500

# Logger settings
SET NODE_MESSENGER_LOG_TIMESTAMP=1
SET NODE_MESSENGER_LOG_COLORS=1
SET NODE_MESSENGER_LOG_TRUNCATE_STRING=1000

# Enable bot api and set token
SET HUBOT_USE_API=1
SET HUBOT_API_TOKEN=MY_UUID_TOKEN

REM Hubot debug log level
SET HUBOT_LOG_LEVEL=debug

if "%HUBOT_ALTERDESK_TOKEN%"=="" (
    node_modules\.bin\hubot.cmd --name "alterdeskbot" %*
) else (
    node_modules\.bin\hubot.cmd --name "alterdeskbot" --adapter "alterdesk" %*
)
