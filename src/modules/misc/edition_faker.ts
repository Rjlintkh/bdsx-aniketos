import { MinecraftPacketIds } from "bdsx/bds/packetids";
import { DeviceOS } from "bdsx/common";
import { events } from "bdsx/event";
import { ModuleBase, ModuleConfig } from "../base";

enum TitleId {
	ANDROID = 1739947436,
	IOS = 1810924247,
	WINDOWS_10 = 896928775,
	PLAYSTATION = 2044456598,
	NINTENDO = 2047319603,
	XBOX = 1828326430,
}

export default class EditionFaker extends ModuleBase {
    info(): void {
        /**
         * @name: Edition Faker
         * @version: 1.0.0
         * @description: Checks if the platforms of players are fake.
         */
    }

    configModel = ModuleConfig;
    
    load(): void {
        this.listen(events.packetAfter(MinecraftPacketIds.Login), (pk, ni) => {
            const connreq = pk.connreq;
            if (connreq) {
                const cert = connreq.cert;
                const titleId = cert.json.value()["extraData"]["titleId"];
                const system = connreq.getJsonValue()!["DeviceOS"];
                if (TitleId[titleId] && TitleId[DeviceOS[system] as any] != titleId) {
                    this.suspect(ni, `Platform is overriden, [${TitleId[titleId]}] => [${DeviceOS[system]}].`);
                    this.punish(ni, "Disable edition faker.");
                }
            }
        });
    }
    unload(): void {
    }
}