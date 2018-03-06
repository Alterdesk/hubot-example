@echo off

call npm install
call npm install ..\alterdesk-example-script

SETLOCAL
SET PATH=node_modules\.bin;node_modules\hubot\node_modules\.bin;%PATH%

REM Set your OAuth 2.0 API token for Alterdesk here
SET HUBOT_ALTERDESK_TOKEN=

REM Alterdesk API
SET HUBOT_ALTERDESK_TRANSPORT=https
SET HUBOT_ALTERDESK_DOMAIN=api.alterdesk.com
SET HUBOT_ALTERDESK_PORT=443
SET HUBOT_ALTERDESK_VERSION=v1
SET HUBOT_ALTERDESK_HOST=$HUBOT_ALTERDESK_DOMAIN:$HUBOT_ALTERDESK_PORT

REM Shorter bot typing delay
SET HUBOT_ALTERDESK_TYPING_DELAY=500

REM Adapter does not force bot name prefix
SET HUBOT_ALTERDESK_PM_PREFIX=0

REM Hubot debug log level
SET HUBOT_LOG_LEVEL=debug

if ""%HUBOT_ALTERDESK_TOKEN%"=="" (
    node_modules\.bin\hubot.cmd --name "alterdeskbot" %*
) else (
    node_modules\.bin\hubot.cmd --name "alterdeskbot" --adapter "alterdesk" %*
)
