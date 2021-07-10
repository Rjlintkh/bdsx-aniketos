import { ActorWildcardCommandSelector } from "bdsx/bds/command";
import { command } from "bdsx/command";
import { CxxString } from "bdsx/nativetype";
import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { serverInstance } from "bdsx/bds/server";
import { ServerPlayer } from "bdsx/bds/player";

export enum cheats {
    AutoClicker = "Auto Clicker",
    EditionFaker = "Fake Platform",
    Flight = "Flight",
    Give = "Illegal Item Giving",
    InstaBreak = "Insta-break",
    NameOverride = "Fake Name",
    NoClip = "No-clip",
    Nuker = "Nuker",
    OmniSprint = "Omni-sprint",
    Reach = "Reach",
    XpOrb = "Illegal Experience Orb Spawning",
}

export function punish(ni: NetworkIdentifier, cheat: cheats): void {
    serverInstance.disconnectClient(ni, `Kicked by §l§4Aniketos§r due to cheating: ${cheat}`);
}

export function report(name: string, reason: string): void {
    console.log("\x1b[41me", `[Aniketos] ${name} was reported for: ${reason}`, "\x1b[0m");
}

command.register("report", "Reports a cheater").overload((param, origin, output) => {
    let entity = origin.getEntity();
    if (entity === null) {
        console.log("Can't run command from Console!");
        return;
    }
    if (entity.as(ServerPlayer).isPlayer()) {
        for (let actor of param.target.newResults(origin)) {
            if (actor.as(ServerPlayer).isPlayer()) {
                report(actor.getName(), param.reason);
            }
        }
    }
}, {
    target: ActorWildcardCommandSelector,
    reason: CxxString,
});