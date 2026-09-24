# @holodori-net/apis

Standalone ESM TypeScript SDK for the Holodori game API.

## Installation

The package is published to GitHub Packages. Configure the `@holodori-net` scope
and authenticate with a GitHub token that has `read:packages` permission:

```ini
@holodori-net:registry=https://npm.pkg.github.com
//npm.pkg.github.com/:_authToken=${GITHUB_PACKAGES_TOKEN}
```

Do not commit the token. Install the SDK after configuring the registry:

```sh
pnpm add @holodori-net/apis
```

## Usage

The SDK requires the app version and the recovered API secret. The secret must
be supplied by the caller and is never read from or written to repository
files.

```ts
import { HolodoriApi } from "@holodori-net/apis";

const api = await HolodoriApi.create({
  appVersion: process.env.HOLODORI_APP_VERSION!,
  apiSecret: process.env.HOLODORI_API_SECRET!,
});

await api.home.login();
const top = await api.notice.top();
console.log(top.categories);
const snapshot = await api.user.getSnapshot();
const parameters = await api.card.getParameters();
console.log(
  snapshot.userData?.userCardList.length,
  parameters.parameterInfos.length,
);
await api.close();
```

`HolodoriApi.create()` automatically reuses a supplied credential, otherwise
creates an anonymous credential, logs in to obtain a game auth token, and
retrieves the current master version. A caller may supply any of those values
to avoid the corresponding bootstrap request.

Call `api.home.login()` after authentication before cached gameplay APIs. It
completes the game's home bootstrap and handles server-side date rollover; an
authenticated session that skips this step can receive `DATE_CHANGED` from
Card and Live methods.

The default endpoint is `https://jp.game-hololive-dreams.com`. A custom
`ApiTransport` can be injected for tests or a caller-owned network layer.
`additionalHeaders` accepts caller-owned device metadata such as
`x-app-device-name`; protocol, app identity, session, and request ID headers
remain controlled by the SDK.

The notice client exposes `top`, `listInCategory`, `get`,
`updateCategoryReadTime`, and `updateDetailReadTime`. Notice `startTime` values
are returned as `bigint` to preserve protobuf `int64` precision.

The user client exposes `listCards()` for owned cards and `get()` or
`getSnapshot()` for the complete `User/Get` response. Protobuf `int64` values
are returned as `bigint`.

Service methods return generated protobuf messages without projecting away
contract fields. Generated schemas and types are exported from
`@holodori-net/apis/protos`; individual generated modules are available below
`@holodori-net/apis/protos/*`. Unknown protobuf fields are retained on the
message `$unknown` property and are preserved when re-encoded.

The card client exposes `getParameter(cardId)` and `getParameters()`. The live
client exposes `getDeckCandidateCardParameters()`, `getDraftDeckInfo()`, and
`getDeck()` for server-calculated card parameters, deck power, deck evaluation,
score-up composition, and in-game effects.

The catalogue clients expose `shop.list()`, `membership.getShop()`, and
`exchange.list(boothGroupId)`. Gacha banners and published probabilities are
available through `gacha.list()`, `gacha.listNormalProbability(gachaId)`, and
`gacha.listCardSelectProbability(gachaId)`. Event definitions, account update
flags, and regional system state are available through `event`, `notification`,
and `system` respectively.

Public ranking data is available through `music`, `marathon`, `profile`,
`jumpRope`, `circuit`, `chase`, `splashBall`, and `comboCardGame`. Public
creative-chart discovery, creator information, chart details, and early-clear
rankings are available through `musicCreativeChart`. The `asset` client reports
expired content asset IDs, while `health` checks the serving state without
requiring authentication.

Additional read APIs include `cookingPuzzle.getRankingInfo()`,
`comboCardGame.listUserInfo()`, `multiGame.listPingServer()`,
`gift.list()`, and `parkPermanence.listCharacterShopItem()`. Gift and Park
responses retain account-specific fields such as collection state.

`musicCreativeChart.listNewer()`, `listPopular()`, and `listByCreator()` search
all music when their request omits `searchParameter`.

The high-level client is grouped by service: use `api.auth`, `api.master`,
`api.home`, `api.notice`, `api.notification`, `api.user`, `api.card`,
`api.live`, `api.event`, `api.shop`, `api.membership`, `api.exchange`,
`api.gacha`, `api.music`, `api.marathon`, `api.profile`, `api.asset`,
`api.musicCreativeChart`, `api.jumpRope`, `api.circuit`, `api.chase`,
`api.splashBall`, `api.comboCardGame`, `api.cookingPuzzle`, `api.multiGame`,
`api.gift`, `api.parkPermanence`, `api.health`, `api.system`, and
`api.accountMigration`. The older top-level authentication and master methods
remain available as deprecated delegations. Transport implementations are
also available from `@holodori-net/apis/transports`; generated contracts are
available from `@holodori-net/apis/protos`; protobuf and gRPC helpers are
available from `@holodori-net/apis/low-level`.

Every service method accepts optional per-call controls as its final argument.
They apply to the target RPC; automatic authentication bootstrap retains the
client defaults and its shared single-flight behavior.

```ts
const controller = new AbortController();
const shops = await api.shop.list({
  signal: controller.signal,
  timeoutMs: 10_000,
});
```

High-level failures are reported as `HolodoriApiError` with a structured
`kind`, RPC path, optional HTTP or gRPC status, request ID, transport phase,
and original `cause`. Existing `path` and `status` properties remain as
deprecated compatibility aliases.

See the generated [API reference](docs/api-reference.md) for every implemented
high-level method, its purpose, RPC path, signature, and account-state effects.
The recovered catalog below also shows which contract methods are not yet
implemented.

## API coverage

The recovered contract currently contains 53 services and 312 RPC methods.
Every method has a `POST /<Service>/<Method>` HTTP annotation and uses the gRPC
path `/rpc.api.<Service>/<Method>`. The SDK implements 61 of those methods:

| Service               | Implemented | Contract | SDK methods                                                                      |
| --------------------- | ----------: | -------: | -------------------------------------------------------------------------------- |
| AccountMigration      |           2 |        8 | `PrepareMigrationPassword`, `Migrate`                                            |
| Asset                 |           1 |        1 | `ListExpiredAssetId`                                                             |
| Auth                  |           2 |        2 | `Create`, `Login`                                                                |
| Card                  |           2 |        5 | `GetParameter`, `GetParameters`                                                  |
| Chase                 |           1 |        5 | `GetRankingInfo`                                                                 |
| Circuit               |           1 |        5 | `GetRankingInfo`                                                                 |
| ComboCardGame         |           2 |        6 | `GetRankingInfo`, `ListUserInfo`                                                 |
| CookingPuzzle         |           1 |        6 | `GetRankingInfo`                                                                 |
| Event                 |           2 |        2 | `ListEventInfo`, `ListEventInfoForPortal`                                        |
| Exchange              |           1 |        3 | `List`                                                                           |
| Gacha                 |           3 |        8 | `List`, `ListNormalProbability`, `ListCardSelectProbability`                     |
| Gift                  |           1 |        5 | `List`                                                                           |
| Health                |           1 |        1 | `Check`                                                                          |
| Home                  |           1 |        2 | `Login`                                                                          |
| JumpRope              |           1 |        8 | `GetRankingInfo`                                                                 |
| Live                  |           3 |       18 | `GetDeckCandidateCardParameters`, `GetDraftDeckInfo`, `GetDeck`                  |
| Marathon              |           7 |       11 | `Top` and six public grade/top ranking queries                                   |
| Master                |           1 |        1 | `Get`                                                                            |
| Membership            |           1 |        1 | `GetShop`                                                                        |
| Music                 |           5 |        7 | Public score/rating rankings and highest-score deck                              |
| MusicCreativeChart    |           9 |       30 | Public discovery, creator, chart detail, and early-clear ranking queries         |
| MultiGame             |           1 |       15 | `ListPingServer`                                                                 |
| Notice                |           5 |        5 | `Top`, `ListInCategory`, `Get`, `UpdateCategoryReadTime`, `UpdateDetailReadTime` |
| Notification          |           1 |        2 | `List`                                                                           |
| ParkPermanence        |           1 |       15 | `ListCharacterShopItem`                                                          |
| Profile               |           1 |       16 | `GetUserProfileDetail`                                                           |
| Shop                  |           1 |        3 | `List`                                                                           |
| SplashBall            |           1 |        5 | `GetRankingInfo`                                                                 |
| System                |           1 |        1 | `GetSystemInfo`                                                                  |
| User                  |           1 |        2 | `Get` through `listCards()` and `getSnapshot()`                                  |
| Remaining 23 services |           0 |      113 | —                                                                                |
| **Total**             |      **61** |  **312** | **19.6%**                                                                        |

### Recommended next APIs

The simulator foundation includes the account snapshot, current card
parameters, candidate card evaluation, draft deck power, and saved deck
evaluation APIs. Public-information follow-up candidates include
event-specific rankings and read-only catalogue gaps. Account-specific
history, `AroundSelf` rankings, and read-state operations are intentionally
outside the current public-information scope.

Method names do not establish that an operation is read-only. Inspect its
request, response, method options, and client call site before using a
production account. In particular, purchase, draw, open, receive, set, delete,
start, finish, and progression methods may spend resources or mutate account
state.

### Recovered API catalog

This catalog mirrors the pinned contract in `proto/descriptor-set.pb`.
Methods listed here are recovered contracts, not necessarily implemented SDK
methods. A struck-through method is already implemented by the SDK.

| Service                 | Methods                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| ----------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AccountMigration (8)    | `List`, `SetPassword`, ~~`PrepareMigrationPassword`~~, `LinkApple`, `LinkGoogle`, `PrepareMigrationProviderWithoutAuth`, ~~`Migrate`~~, `Unlink`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                  |
| Achievement (1)         | `ReceiveReward`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| Announcement (2)        | `List`, `Read`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| AppReview (1)           | `SetDisplayed`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                    |
| Asset (1)               | ~~`ListExpiredAssetId`~~                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Auth (2)                | ~~`Create`~~, ~~`Login`~~                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Card (5)                | ~~`GetParameter`~~, ~~`GetParameters`~~, `LevelUp`, `LevelLimitBreak`, `UpgradePotential`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Character (2)           | `Read`, `ReadPark`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| CharacterHistory (1)    | `List`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Chase (5)               | `MatchRandom`, `CreatePrivateRoom`, `Start`, `Finish`, ~~`GetRankingInfo`~~                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Cheat (1)               | `CheckPlayIntegrity`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Circuit (5)             | `MatchRandom`, `CreatePrivateRoom`, `Start`, `Finish`, ~~`GetRankingInfo`~~                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ComboCardGame (6)       | `MatchRandom`, `CreatePrivateRoom`, `Start`, `Finish`, ~~`GetRankingInfo`~~, ~~`ListUserInfo`~~                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                   |
| CookingPuzzle (6)       | `Start`, `Finish`, `Retire`, ~~`GetRankingInfo`~~, `ReportRecipeProgress`, `ReadNotification`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| Costume (5)             | `SetCostume`, `SetSdCostume`, `ReadCostume`, `ReadSdCostume`, `ReadSdCostumeHairAccessory`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Event (2)               | ~~`ListEventInfo`~~, ~~`ListEventInfoForPortal`~~                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| EventMission (2)        | `ReadEventMission`, `ReceiveMissionReward`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        |
| Exchange (3)            | ~~`List`~~, `Purchase`, `ReadBooth`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Friend (8)              | `Top`, `TopReload`, `SearchUser`, `DeleteFriend`, `Offer`, `ApproveOffer`, `CancelOffer`, `RejectOffer`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Gacha (8)               | ~~`List`~~, `ListHistory`, `Read`, `DrawNormal`, ~~`ListNormalProbability`~~, `DrawCardSelect`, ~~`ListCardSelectProbability`~~, `SetSelectedCard`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Gift (5)                | `Top`, ~~`List`~~, `Open`, `ListHistory`, `Count`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Health (1)              | ~~`Check`~~                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| Home (2)                | ~~`Login`~~, `AgreeRule`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Inquiry (2)             | `Send`, `GetUploadUrl`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            |
| Item (1)                | `SelectRewardBox`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| JumpRope (8)            | `MatchRandom`, `CreatePrivateRoom`, `StartSingle`, `StartMulti`, `FinishSingle`, `FinishMulti`, ~~`GetRankingInfo`~~, `ReadNotification`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |
| Live (18)               | ~~`GetDeckCandidateCardParameters`~~, ~~`GetDraftDeckInfo`~~, ~~`GetDeck`~~, `SaveDeck`, `SetSkinLog`, `SetRewardUpStaminaConsumptionSetting`, `RecoverRewardUpStamina`, `MatchRandom`, `CreatePrivateRoom`, `StartSingle`, `StartMulti`, `FinishSingle`, `FinishMultiLiveCooperation`, `FinishDisconnectedMultiLiveCooperation`, `Continue`, `Retry`, `Retire`, `ListRecommendCharacterDeck`                                                                                                                                                                                                                                                                                                                                                     |
| LoginBonus (1)          | `Check`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Marathon (11)           | ~~`Top`~~, `ReadTop`, ~~`ListMusicHighestScoreRankingGrade`~~, ~~`ListMusicHighestScoreRankingTop`~~, `ListMusicHighestScoreRankingAroundSelf`, ~~`ListMarathonScoreRankingGrade`~~, ~~`ListMarathonScoreRankingTop`~~, `ListMarathonScoreRankingAroundSelf`, ~~`ListTotalMusicHighestScoreRankingGrade`~~, ~~`ListTotalMusicHighestScoreRankingTop`~~, `ListTotalMusicHighestScoreRankingAroundSelf`                                                                                                                                                                                                                                                                                                                                             |
| Master (1)              | ~~`Get`~~                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Membership (1)          | ~~`GetShop`~~                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| MiniGame (4)            | `RecoverRewardUpStamina`, `ConvertRewardUpStaminaToReward`, `ReadNotification`, `SetConsumptionSetting`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Mission (3)             | `ReceiveReward`, `ReceivePassReward`, `PurchasePassLevel`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| MultiGame (15)          | ~~`ListPingServer`~~, `GeneratePrivateRoomId`, `GetPrivateRoomInfo`, `EnterPrivateRoom`, `InviteFriendToPrivateRoom`, `InviteAllFriendToPrivateRoom`, `ListPrivateRoomFriendUser`, `CheckInvitedPrivateRoom`, `ListInvitedPrivateRoom`, `CheckMatchStatus`, `CancelMatch`, `SetPrivateRoomRematchStatus`, `CheckPrivateRoomRematchStatus`, `ListBasicUserInfo`, `SaveReactionSendInfo`                                                                                                                                                                                                                                                                                                                                                            |
| Music (7)               | `SwitchFavorite`, ~~`GetHighestScoreLiveDeck`~~, ~~`GetHighestScoreRankingInfo`~~, ~~`ListHighestScoreRatingRankingRank`~~, ~~`GetHighestScoreRatingRankingInfo`~~, `ReleaseMusic`, ~~`ListHighestScoreRatingRankingRewardThresholdRankingRankInfo`~~                                                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| MusicCreativeChart (30) | `GetUploadUrlForCreate`, `GetUploadUrlForUpdate`, `UpdateFileUploadTime`, ~~`GetQuoteTargetChart`~~, `Create`, `Update`, `EditSetting`, `Delete`, `Like`, `SwitchFavorite`, `Complain`, `ListOwn`, ~~`ListNewer`~~, `ListFavorite`, `ListPlayHistory`, ~~`ListByCreator`~~, `ListByFriend`, ~~`GetByMusicCreativeChartId`~~, ~~`ListPopular`~~, ~~`ListPopularCreator`~~, `ListFriendCreator`, ~~`GetCreatorInfoByMusicCreativeChartId`~~, `GetUserStatus`, `StartLiveSingle`, `FinishLiveSingle`, `RetryLiveSingle`, `RetireLiveSingle`, `StartPreview`, ~~`GetEarlyClearRankingInfo`~~, ~~`GetEarlyClearLiveDeck`~~                                                                                                                             |
| Notice (5)              | ~~`Top`~~, ~~`ListInCategory`~~, ~~`Get`~~, ~~`UpdateCategoryReadTime`~~, ~~`UpdateDetailReadTime`~~                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                              |
| Notification (2)        | `Read`, ~~`List`~~                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| Park (13)               | `Enter`, `Refresh`, `SetCharacter`, `SetAccessory`, `UpdateTimePeriod`, `ReceivePlayerLevelReward`, `OpenTreasure`, `CollectFixedSymbol`, `CollectRandomSymbol`, `ListenCall`, `ReportAction`, `ReadTalkFree`, `SelectArea`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| ParkPermanence (15)     | `SetPosterBooth`, `LevelUpFacility`, `ReceivePresent`, ~~`ListCharacterShopItem`~~, `PurchaseCharacterShopItem`, `SelectCharacterShopItem`, `DrawLottery`, `StartHighLow`, `FinishHighLow`, `PrepareFishing`, `StartFishing`, `MissFishing`, `FinishFishing`, `ReceiveFishingTotalCaughtReward`, `LevelUpFishingRod`                                                                                                                                                                                                                                                                                                                                                                                                                              |
| ParkQuest (36)          | `StartCharacter`, `ClearStep`, `GetLiveFixedDeck`, `GetLiveFixedCharacterDeck`, `StartLive`, `FinishLive`, `RetryLive`, `RetireLive`, `StartTutorialLive`, `FinishTutorialLive`, `MatchRandomJumpRope`, `StartJumpRopeSingle`, `StartJumpRopeMulti`, `FinishJumpRopeSingle`, `FinishJumpRopeMulti`, `MatchRandomCircuit`, `StartCircuit`, `FinishCircuit`, `StartCookingPuzzle`, `FinishCookingPuzzle`, `RetireCookingPuzzle`, `ReportCookingPuzzleRecipeProgress`, `MatchRandomComboCardGame`, `StartComboCardGame`, `FinishComboCardGame`, `MatchRandomChase`, `StartChase`, `FinishChase`, `MatchRandomSplashBall`, `StartSplashBall`, `FinishSplashBall`, `DeliverItem`, `LevelUpFacility`, `UseCharacterQuestItem`, `SelectArea`, `MoveArea` |
| Payment (5)             | `CheckPurchase`, `CreateOrder`, `CancelOrder`, `RegisterDeferredPurchase`, `FulfillOrder`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| Profile (16)            | `SetName`, `SetMessage`, `SetFanMark`, `SwitchPublishSetting`, `SetEmblem`, ~~`GetUserProfileDetail`~~, `BlockUser`, `UnblockUser`, `ListBlockedUser`, `ComplainUser`, `ListCustomPalette`, `GetCustomPaletteImageUploadUrl`, `EditCustomPalette`, `SetCustomPalette`, `DeleteCustomPalette`, `SetDefaultCustomPalette`                                                                                                                                                                                                                                                                                                                                                                                                                           |
| Shop (3)                | ~~`List`~~, `PurchaseConsumptionItem`, `Read`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                     |
| SkillTree (3)           | `ReleaseNode`, `ConnectNode`, `ResetNode`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| SplashBall (5)          | `MatchRandom`, `CreatePrivateRoom`, `Start`, `Finish`, ~~`GetRankingInfo`~~                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                       |
| StartupNotification (2) | `Read`, `ReadMusic`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Story (6)               | `ReadMain`, `ReadArea`, `ReadCharacter`, `ReadEvent`, `ReadSpecial`, `ReadHologra`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                |
| System (1)              | ~~`GetSystemInfo`~~                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| Tutorial (7)            | `Progress`, `RegisterInitialUserInfo`, `ChooseCharacter`, `DrawGacha`, `ConfirmGacha`, `ListGachaCard`, `ReadInstantTips`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                         |
| User (2)                | ~~`Get`~~, `Delete`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                               |
| UserContentCdn (1)      | `GetSignedCookie`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                 |
| Work (6)                | `ListWorkSlotPower`, `Refresh`, `Start`, `Finish`, `FinishAll`, `Cancel`                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                                          |

Persist the returned credential and pass it to later client instances to avoid
creating a new anonymous account for every process. Treat the credential, game
auth token, and API secret as sensitive values and do not log them.

Account migration by linking ID and password is available without first
authenticating the SDK. `migrateWithPassword()` performs the prepare and
migrate requests, updates the SDK's credential, and clears any previous
session. It does not call `Auth/Login`; authenticate the migrated credential
explicitly before using authenticated APIs.

```ts
const api = await HolodoriApi.create(
  {
    appVersion: process.env.HOLODORI_APP_VERSION!,
    apiSecret: process.env.HOLODORI_API_SECRET!,
    autoAuthenticate: false,
  },
  transport,
);

await api.accountMigration.migrateWithPassword(
  process.env.HOLODORI_MIGRATION_CODE!,
  process.env.HOLODORI_MIGRATION_PW!,
);
await api.auth.login();
await api.master.get();
```

`preparePassword()` returns the linked user information when the caller needs
to show a confirmation step. `migrate()` accepts either an
`AccountMigrationMigrateRequest` object or the target public user ID, one-time
token, and optional previous public user ID. Migration credentials, passwords,
one-time tokens, and auth tokens must not be logged.

When the configured base URL is an official Holodori region endpoint, the
combined method resolves `linkedUserInfo.region` (`1=jp`, `2=us`, `3=as`),
sends `Migrate` to that region, and keeps the client on the new region for
subsequent calls. Custom base URLs remain unchanged by default; provide
`regionBaseUrlResolver` when a caller-owned environment has multiple regions.

## Proxy transports

Pass a transport as the second argument to keep network routing explicit. An
injected transport is caller-owned, so close it separately from the API client.

OpenSSH stdio forwarding requires an installed `ssh` executable and existing
host-key trust. It always uses non-interactive authentication and strict
host-key verification.

```ts
import { HolodoriApi } from "@holodori-net/apis";
import { SshHttp2Transport } from "@holodori-net/apis/transports";

const transport = new SshHttp2Transport({
  target: "tpe",
  configFile: "/home/user/.ssh/config",
  options: ["ConnectTimeout=15"],
});
const api = await HolodoriApi.create(
  {
    appVersion: process.env.HOLODORI_APP_VERSION!,
    apiSecret: process.env.HOLODORI_API_SECRET!,
    credential: process.env.HOLODORI_CREDENTIAL,
  },
  transport,
);

try {
  console.log((await api.notice.top()).categories);
} finally {
  await api.close();
  transport.close();
}
```

HTTP CONNECT supports both HTTP and HTTPS proxy endpoints. URL credentials are
sent as Basic proxy authorization; do not include credentials in logs or error
messages. HTTPS proxies may receive a caller-owned CA through `proxyCa`.

```ts
import { HolodoriApi } from "@holodori-net/apis";
import { HttpConnectHttp2Transport } from "@holodori-net/apis/transports";

const transport = new HttpConnectHttp2Transport({
  proxyUrl: "https://proxy.example:8443",
  headers: { "x-proxy-tenant": "example" },
  // proxyCa: readFileSync("company-proxy-ca.pem"),
});
const api = await HolodoriApi.create(
  {
    appVersion: process.env.HOLODORI_APP_VERSION!,
    apiSecret: process.env.HOLODORI_API_SECRET!,
  },
  transport,
);
// After the API work completes: transport.close();
```

The SDK does not read `HTTP_PROXY`, `HTTPS_PROXY`, `NO_PROXY`, or Holodori proxy
environment variables. Future system proxy or SOCKS integrations can implement
`ApiTunnelConnector` and pass it to `new Http2Transport({ connector })` without
changing the game API layer.
