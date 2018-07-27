@echo off

call npm install
call npm install ..\alterdesk-example-script

SETLOCAL
SET PATH=node_modules\.bin;node_modules\hubot\node_modules\.bin;%PATH%

REM Set your OAuth 2.0 API token for Alterdesk here
SET NODE_ALTERDESK_TOKEN=

REM Alterdesk API
SET NODE_ALTERDESK_TRANSPORT=https
SET NODE_ALTERDESK_DOMAIN=api.alterdesk.com
SET NODE_ALTERDESK_PORT=443
SET NODE_ALTERDESK_VERSION=v1

REM Alterdesk adapter settings
SET HUBOT_ALTERDESK_TOKEN=%NODE_ALTERDESK_TOKEN%
SET HUBOT_ALTERDESK_HOST=%NODE_ALTERDESK_DOMAIN%:%NODE_ALTERDESK_PORT%

REM Question times out after a minute
SET HUBOT_QUESTIONNAIRE_RESPONSE_TIMEOUT=300000

REM Shorter bot typing delay
SET HUBOT_ALTERDESK_TYPING_DELAY=500
REM SET HUBOT_ALTERDESK_TYPING_DELAY_FACTOR=25
REM SET HUBOT_ALTERDESK_TYPING_DELAY_MIN=250
REM SET HUBOT_ALTERDESK_TYPING_DELAY_MAX=2500

REM Adapter does not force bot name prefix
SET HUBOT_ALTERDESK_PM_PREFIX=0

REM Set command and control token
SET HUBOT_SCHEDULE_API_TOKEN=MY_UUID_TOKEN

REM Hubot debug log level
SET HUBOT_LOG_LEVEL=debug

if "%HUBOT_ALTERDESK_TOKEN%"=="" (
    node_modules\.bin\hubot.cmd --name "alterdeskbot" %*
) else (
    node_modules\.bin\hubot.cmd --name "alterdeskbot" --adapter "alterdesk" %*
)
