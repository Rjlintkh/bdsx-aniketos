import { ActorWildcardCommandSelector } from "bdsx/bds/command";
import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { ServerPlayer } from "bdsx/bds/player";
import { serverInstance } from "bdsx/bds/server";
import { command } from "bdsx/command";
import { CxxString } from "bdsx/nativetype";

export enum Cheats {
    AirSwim = "공중 점프",
    AutoClicker = "비정상적인 터치속도",
    Crasher = "크래셔",
    EditionFaker = "가짜 플랫폼",
    Flight = "플라이",
    Give = "아이템 기브",
    InstaBreak = "인스타 브레이크",
    InvMove = "인벤토리 움직임",
    NameOverride = "가짜 닉네임",
    NoClip = "노클립",
    Nuker = "너커",
    OmniSprint = "옴니 프린트",
    Reach = "비정상적인 리치",
    XpOrb = "Illegal Experience Orb Spawning",
}

export function punish(ni: NetworkIdentifier, cheat: Cheats): void {
    serverInstance.disconnectClient(ni, `당신은 밴되었습니다! by §l§4Server§r due to cheating: ${cheat}`);
    // Add your own punishmenet here
    console.log(`${"[Server]".red} ${ni.getActor()?.getName()} was detected for: ${cheat}`);
}

export function report(name: string, reason: string): void {
    console.log(`${"[Server]".red} ${name} was reported for: ${reason}`);
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
