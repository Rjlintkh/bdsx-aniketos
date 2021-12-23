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
    configModel = ModuleConfig;
    langModel = () => {
    /*
        name=Edition Faker
        description=Checks if the platforms of players are fake.

        suspect.overriden=Platform is overriden [%1] => [%2].

        punish.generic=Disable edition faker.
    */};
    
    load(): void {
        this.listen(events.packetAfter(MinecraftPacketIds.Login), (pk, ni) => {
            const connreq = pk.connreq;
            if (connreq) {
                const cert = connreq.cert;
                const titleId = cert.json.value()["extraData"]["titleId"];
                const system = connreq.getJsonValue()!["DeviceOS"];
                if (TitleId[titleId] && TitleId[DeviceOS[system] as any] != titleId) {
                    this.suspect(ni, this.translate("suspect.overriden", [TitleId[titleId], DeviceOS[system]]));
                    this.punish(ni, this.translate("punish.generic"));
                }
            }
        });
    }
    unload(): void {
    }
}