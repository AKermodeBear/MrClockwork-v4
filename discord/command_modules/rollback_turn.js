
const assert = require("../../asserter.js");
const Command = require("../prototypes/command.js");
const CommandData = require("../prototypes/command_data.js");
const commandPermissions = require("../command_permissions.js");
const MessagePayload = require("../prototypes/message_payload.js");

const commandData = new CommandData("ROLLBACK_TURN");
const ROLLEBACK_REQUEST_TIMEOUT = 150000;

module.exports = RollbackTurnCommand;

function RollbackTurnCommand()
{
    const rollbackTurnCommand = new Command(commandData);

    rollbackTurnCommand.addBehaviour(_behaviour);

    rollbackTurnCommand.addRequirements(
        commandPermissions.assertCommandIsUsedInGameChannel,
        commandPermissions.assertServerIsOnline,
        commandPermissions.assertMemberIsTrusted,
        commandPermissions.assertMemberIsOrganizer
    );

    return rollbackTurnCommand;
}

function _behaviour(commandContext)
{
    const targetedGame = commandContext.getGameTargetedByCommand();
    const status = targetedGame.getLastKnownStatus();
    const rollbackTurnNbr = status.getTurnNumber() - 1;

    if (assert.isInteger(rollbackTurnNbr) === false || rollbackTurnNbr <= 0)
        return commandContext.respondToCommand(new MessagePayload(`Cannot rollback; turn number '${rollbackTurnNbr}' is incorrect.`));

    return commandContext.respondToCommand(new MessagePayload(`Attempting to roll turn back...`))
    .then(() => targetedGame.emitPromiseWithGameDataToServer("ROLLBACK", { turnNbr: rollbackTurnNbr }, ROLLEBACK_REQUEST_TIMEOUT))
    .then(() => commandContext.respondToCommand(new MessagePayload(`The turn has been rolled back. It may take a minute or two to update properly.`)))
    .catch((err) => commandContext.respondToCommand(new MessagePayload(`An error occurred:\n\n${err.message}`)));
}