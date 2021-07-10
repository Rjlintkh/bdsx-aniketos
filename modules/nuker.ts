import { events } from "bdsx/event";
import { NetworkIdentifier } from "bdsx/bds/networkidentifier";
import { cheats, punish } from "./punish";

const bps = new Map<NetworkIdentifier, number[]>();
setInterval(() => {
    let now = new Date().getTime();
    for (let [ni, clicks] of bps) {
        for (let time of clicks) {
            if ((now - time) >= 1000) {
                clicks.splice(clicks.indexOf(now));
            }
        }
        if (clicks.length >= 18) {
            punish(ni, cheats.Nuker);
        }
    }
}, 1000).unref();

events.blockDestroy.on(ev => {
    try {
        let ni = ev.player.getNetworkIdentifier();
        let gamemode = ev.player.getGameType();
        if (gamemode !== 1 && gamemode !== 4) {
            if (!bps.get(ni)) {
                bps.set(ni, new Array<number>());
            }
            bps.get(ni)!.push(new Date().getTime());
        }
    } catch { }
});

events.networkDisconnected.on(ni => {
    bps.delete(ni);
});