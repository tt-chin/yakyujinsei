// Data types observed in 14 natural + 10 controlled careers (659 annual samples).
// championmakerAcquiredYear also accepts the integer year assigned by championship-policy.js:updateChampionmaker.
// New plain-data fields are preserved; known fields must retain validated types.
export const SAVE_STATE_CONTRACT = {
  "required": [
    "_salaryV130Migrated",
    "_salaryV140Migrated",
    "ab",
    "age",
    "americanContractSigned",
    "bigInj",
    "birthHighSchool",
    "careerBaseSalary",
    "careerBuyout",
    "careerDevelopmentStipend",
    "careerEarnings",
    "careerIncentive",
    "careerOutsideIncome",
    "careerSigningBonus",
    "champThisTeam",
    "championmakerAcquiredYear",
    "championmakerCount",
    "championmakerWins",
    "championshipMigrationVersion",
    "championshipResults",
    "cntBoldFail",
    "cntBoldWin",
    "cntEndorseBoldWin",
    "cntNormWin",
    "cntSave",
    "cntSaveWin",
    "cntSnack",
    "cntSocialBoldFail",
    "cntTrainingSafeFail",
    "complainCount",
    "contractSequence",
    "corpIncome",
    "corpYears",
    "ct",
    "currentSalary",
    "demotionRefused",
    "domesticCompletedKeys",
    "domesticTournamentLog",
    "domesticTournamentStats",
    "done",
    "dpos",
    "dposYears",
    "draftRights",
    "effort",
    "entryRoute",
    "eventDrawYear",
    "eventDrawnCardIDs",
    "eventSchemaVersion",
    "eventSeasonContext",
    "eventSequence",
    "faElig",
    "faMarketKey",
    "faType",
    "faUsed",
    "firstTeamSeasons",
    "firstTeamYearsByTeam",
    "foreignFirstTeamYears",
    "honors",
    "incomeLedger",
    "indYears",
    "injNext",
    "internationalTraitMigrationVersion",
    "intlBest",
    "intlCompletedKeys",
    "intlCount",
    "intlDeclinedCount",
    "intlDispatchStatus",
    "intlFinalCount",
    "intlLastEventKey",
    "intlStat",
    "intlTraitResults",
    "ironStreak",
    "lastArbitration",
    "lastFaMarket",
    "lastSalaryDecision",
    "lastSalaryEvaluation",
    "lastSalaryPaidYear",
    "log",
    "love",
    "lv",
    "marketInjury",
    "name",
    "npbDevYears",
    "npbFaSeasons",
    "npbRosterDays",
    "npbYears",
    "oldGhostPending",
    "oldGhostUsed",
    "org",
    "orgTeamId",
    "pendStat",
    "pendingEvent",
    "pool",
    "pos",
    "pot",
    "potSum0",
    "processedEventIDs",
    "rehab",
    "removed",
    "rngState",
    "role",
    "roleYears",
    "salaryDecisionHistory",
    "salaryEvaluationHistory",
    "samePick",
    "samePickKey",
    "schoolId",
    "schoolTier",
    "seasonChampContext",
    "seasonEndMaintenanceYear",
    "seasonFactor",
    "seed",
    "senbatsuEligibleYear",
    "serviceTime",
    "serviceTimeAccruedYear",
    "signingPayments",
    "six",
    "stage",
    "stageYr",
    "stats",
    "statsByLevel",
    "svc",
    "svcOrg",
    "team",
    "teamTally",
    "teamYears",
    "tj",
    "tjCount",
    "tjSuccess",
    "tmpInj",
    "tradeHeat",
    "tradeRefuse",
    "traits",
    "tripleCrownHistory",
    "version",
    "year",
    "yearOutsideIncome",
    "yearlyIncentivePaid"
  ],
  "types": {
    "_majorInjuryThisSeason": [
      "boolean"
    ],
    "_salaryV130Migrated": [
      "boolean"
    ],
    "_salaryV140Migrated": [
      "boolean"
    ],
    "ab": [
      "object"
    ],
    "age": [
      "number"
    ],
    "americanContractSigned": [
      "boolean"
    ],
    "awardDecisions": [
      "array"
    ],
    "bigInj": [
      "number"
    ],
    "birthHighSchool": [
      "object"
    ],
    "careerBaseSalary": [
      "number"
    ],
    "careerBuyout": [
      "number"
    ],
    "careerDevelopmentStipend": [
      "number"
    ],
    "careerEarnings": [
      "number"
    ],
    "careerIncentive": [
      "number"
    ],
    "careerOutsideIncome": [
      "number"
    ],
    "careerSigningBonus": [
      "number"
    ],
    "carry": [
      "object"
    ],
    "champTeam": [
      "null",
      "string"
    ],
    "champThisTeam": [
      "boolean"
    ],
    "championmakerAcquiredYear": [
      "null",
      "number"
    ],
    "championmakerCount": [
      "number"
    ],
    "championmakerWins": [
      "array"
    ],
    "championshipMigrationVersion": [
      "number"
    ],
    "championshipResults": [
      "object"
    ],
    "cntBoldFail": [
      "number"
    ],
    "cntBoldWin": [
      "number"
    ],
    "cntEndorseBoldWin": [
      "number"
    ],
    "cntNormWin": [
      "number"
    ],
    "cntSave": [
      "number"
    ],
    "cntSaveWin": [
      "number"
    ],
    "cntSnack": [
      "number"
    ],
    "cntSocialBoldFail": [
      "number"
    ],
    "cntTrainingSafeFail": [
      "number"
    ],
    "comboKey": [
      "string"
    ],
    "complainCount": [
      "number"
    ],
    "contractSequence": [
      "number"
    ],
    "corpIncome": [
      "number"
    ],
    "corpYears": [
      "number"
    ],
    "ct": [
      "null",
      "object"
    ],
    "currentSalary": [
      "number"
    ],
    "demotionRefused": [
      "boolean"
    ],
    "domesticCompletedKeys": [
      "object"
    ],
    "domesticTournamentLog": [
      "array"
    ],
    "domesticTournamentStats": [
      "object"
    ],
    "done": [
      "boolean"
    ],
    "dpos": [
      "null",
      "string"
    ],
    "dposYears": [
      "object"
    ],
    "draftRights": [
      "null",
      "object"
    ],
    "effort": [
      "string"
    ],
    "entryRoute": [
      "string"
    ],
    "eventDrawYear": [
      "number"
    ],
    "eventDrawnCardIDs": [
      "array"
    ],
    "eventSchemaVersion": [
      "number"
    ],
    "eventSeasonContext": [
      "null"
    ],
    "eventSequence": [
      "number"
    ],
    "faElig": [
      "boolean"
    ],
    "faMarketKey": [
      "null",
      "string"
    ],
    "faType": [
      "null",
      "string"
    ],
    "faUsed": [
      "boolean"
    ],
    "firstTeamSeasons": [
      "object"
    ],
    "firstTeamYearsByTeam": [
      "object"
    ],
    "foreignFirstTeamYears": [
      "object"
    ],
    "honors": [
      "array"
    ],
    "incomeLedger": [
      "array"
    ],
    "indYears": [
      "number"
    ],
    "injNext": [
      "number"
    ],
    "internationalTraitMigrationVersion": [
      "number"
    ],
    "intlBest": [
      "null"
    ],
    "intlCompletedKeys": [
      "object"
    ],
    "intlCount": [
      "number"
    ],
    "intlDeclinedCount": [
      "number"
    ],
    "intlDispatchStatus": [
      "null"
    ],
    "intlFinalCount": [
      "number"
    ],
    "intlLastEventKey": [
      "null",
      "string"
    ],
    "intlStat": [
      "object"
    ],
    "intlTraitResults": [
      "object"
    ],
    "ironStreak": [
      "number"
    ],
    "lastArbitration": [
      "null",
      "object"
    ],
    "lastD": [
      "number"
    ],
    "lastFaMarket": [
      "null",
      "object"
    ],
    "lastKboPackage": [
      "number"
    ],
    "lastOverflow": [
      "number"
    ],
    "lastSalaryDecision": [
      "null",
      "object"
    ],
    "lastSalaryEvaluation": [
      "null",
      "object"
    ],
    "lastSalaryPaidYear": [
      "null",
      "number"
    ],
    "lastSt": [
      "object"
    ],
    "lastTrade": [
      "object"
    ],
    "log": [
      "array"
    ],
    "love": [
      "object"
    ],
    "lv": [
      "string"
    ],
    "marketInjury": [
      "string"
    ],
    "name": [
      "string"
    ],
    "npbDevYears": [
      "number"
    ],
    "npbFaSeasons": [
      "number"
    ],
    "npbRosterDays": [
      "number"
    ],
    "npbYears": [
      "number"
    ],
    "oldGhostPending": [
      "boolean"
    ],
    "oldGhostUsed": [
      "boolean"
    ],
    "org": [
      "string"
    ],
    "orgTeamId": [
      "null",
      "string"
    ],
    "pendStat": [
      "number"
    ],
    "pendingEvent": [
      "null"
    ],
    "pool": [
      "number"
    ],
    "pos": [
      "string"
    ],
    "pot": [
      "object"
    ],
    "potSum0": [
      "number"
    ],
    "prevD": [
      "number"
    ],
    "processedEventIDs": [
      "object"
    ],
    "rainbowLg": [
      "string"
    ],
    "rehab": [
      "number"
    ],
    "removed": [
      "array"
    ],
    "rngState": [
      "number"
    ],
    "role": [
      "null",
      "string"
    ],
    "roleYears": [
      "object"
    ],
    "salaryDecisionHistory": [
      "array"
    ],
    "salaryEvaluationHistory": [
      "array"
    ],
    "samePick": [
      "number"
    ],
    "samePickBonus": [
      "boolean"
    ],
    "samePickKey": [
      "null",
      "string"
    ],
    "schoolId": [
      "string"
    ],
    "schoolTier": [
      "string"
    ],
    "seasonChampContext": [
      "null",
      "object"
    ],
    "seasonEndMaintenanceYear": [
      "null",
      "number"
    ],
    "seasonFactor": [
      "number"
    ],
    "seed": [
      "string"
    ],
    "senbatsuEligibleYear": [
      "null",
      "number"
    ],
    "serviceTime": [
      "object"
    ],
    "serviceTimeAccruedYear": [
      "null",
      "number"
    ],
    "signingPayments": [
      "object"
    ],
    "six": [
      "number"
    ],
    "skipMid": [
      "boolean"
    ],
    "stage": [
      "string"
    ],
    "stageYr": [
      "number"
    ],
    "stats": [
      "object"
    ],
    "statsByLevel": [
      "object"
    ],
    "svc": [
      "number"
    ],
    "svcOrg": [
      "null",
      "string"
    ],
    "team": [
      "string"
    ],
    "teamTally": [
      "object"
    ],
    "teamYears": [
      "number"
    ],
    "tj": [
      "number"
    ],
    "tjCount": [
      "number"
    ],
    "tjSuccess": [
      "number"
    ],
    "tmpInj": [
      "number"
    ],
    "tradeFrom": [
      "null"
    ],
    "tradeHeat": [
      "number"
    ],
    "tradeRefuse": [
      "number"
    ],
    "traits": [
      "object"
    ],
    "transferSalarySnapshot": [
      "object"
    ],
    "tripleCrownHistory": [
      "object"
    ],
    "version": [
      "string"
    ],
    "wonChamp": [
      "boolean"
    ],
    "year": [
      "number"
    ],
    "yearOutsideIncome": [
      "number"
    ],
    "yearlyIncentivePaid": [
      "object"
    ]
  }
};
