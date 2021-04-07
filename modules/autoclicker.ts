import { bedrockServer, MinecraftPacketIds, nethook, NetworkIdentifier } from "bdsx";
import { cheats, punish } from "./punish";

const cps = new Map<NetworkIdentifier, number[]>();
const warns = new Map<NetworkIdentifier, number>();
const interval = setInterval(() => {
    let now = new Date().getTime();
    for (let [ni, clicks] of cps) {
        for (let time of clicks) {
            if ((now - time) >= 1000) {
                clicks.splice(clicks.indexOf(now));
            }
        }
        if (clicks.length >= 20) {
            let warn = (warns.get(ni) ?? 0) + 1;
            warns.set(ni, warn);
            if (warn > 2) {
                punish(ni, cheats.AutoClicker);
            }
        } else {
            warns.set(ni, 0);
        }
    }
}, 1000);

nethook.before(MinecraftPacketIds.LevelSoundEvent).on((pk, ni) => {
    if (pk.sound === 42 && !pk.disableRelativeVolume) {
        if (!cps.get(ni)) {
            cps.set(ni, new Array<number>());
        }
        cps.get(ni)!.push(new Date().getTime());
    }
});

NetworkIdentifier.close.on(ni => {
    cps.delete(ni);
    warns.delete(ni);
});

bedrockServer.close.on(() => {
    clearInterval(interval);
});