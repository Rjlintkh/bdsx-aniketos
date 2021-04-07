import { nethook, MinecraftPacketIds } from "bdsx";
import "./autoclicker";
import "./edition_faker";
import "./flight";
import "./give";
import "./instabreak";
import "./movement";
import "./name_override";
import "./noclip";
import "./nuker";
//import "./omnisprint"; // This became legit bruh
import "./reach";
import "./xp_orb";

for (let i = 1; i < 164; i++) {
    switch (i) {
        case MinecraftPacketIds.MovePlayer:
        case MinecraftPacketIds.PlayerAuthInput:
        case MinecraftPacketIds.ClientCacheBlobStatus:
        case MinecraftPacketIds.ClientCacheMissResponse:
        case MinecraftPacketIds.LevelChunk:
        case MinecraftPacketIds.LevelSoundEvent:
        case MinecraftPacketIds.MoveActorDelta:
        case MinecraftPacketIds.NetworkChunkPublisherUpdate:
        case MinecraftPacketIds.SetTime:
            continue;
    }
    nethook.before(i).on((pk, ni) => {
        //console.log(MinecraftPacketIds[i], new Date());
    })
    // nethook.send(i).on((pk, ni) => {
    //     console.log(MinecraftPacketIds[i], new Date());
    // })
}