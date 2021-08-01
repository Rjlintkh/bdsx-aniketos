import { ActorWildcardCommandSelector } from "bdsx/bds/command";
import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { ServerPlayer } from "bdsx/bds/player";
import { serverInstance } from "bdsx/bds/server";
import { command } from "bdsx/command";
import { CxxString } from "bdsx/nativetype";

export enum Cheats {
    AirSwim = "Air Swim",
    AutoClicker = "Auto Clicker",
    Crasher = "Crasher",
    EditionFaker = "Fake Platform",
    Flight = "Flight",
    Give = "Illegal Item Giving",
    InstaBreak = "Insta-break",
    InvMove = "Inventory Move",
    NameOverride = "Fake Name",
    NoClip = "No-clip",
    Nuker = "Nuker",
    OmniSprint = "Omni-sprint",
    Reach = "Reach",
    XpOrb = "Illegal Experience Orb Spawning",
}

export function punish(ni: NetworkIdentifier, cheat: Cheats): void {
    serverInstance.disconnectClient(ni, `Kicked by §l§4Aniketos§r due to cheating: ${cheat}`);
    // Add your own punishmenet here
    console.log(`${"[Aniketos]".red} ${ni.getActor()?.getName()} was detected for: ${cheat}`);
}

export function report(name: string, reason: string): void {
    console.log(`${"[Aniketos]".red} ${name} was reported for: ${reason}`);
}

command.register("report", "Reports a cheater").overload((param, origin, output) => {
    for (let actor of param.target.newResults(origin)) {
        if (actor.as(ServerPlayer).isPlayer()) {
            report(actor.getName(), param.reason);
        }
    }
}, {
    target: ActorWildcardCommandSelector,
    reason: CxxString,
});