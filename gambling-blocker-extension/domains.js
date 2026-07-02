// Curated list of well-known gambling domains (casinos, sportsbooks, poker rooms,
// daily fantasy sites). Shipped as static declarativeNetRequest rules in
// rules/gambling-domains.json, and duplicated here so the Options page can show
// the user what's blocked out of the box. Keep the two lists in sync.
const CURATED_GAMBLING_DOMAINS = [
  "bet365.com", "draftkings.com", "fanduel.com", "pokerstars.com", "pokerstars.net",
  "888casino.com", "888poker.com", "888sport.com", "betway.com", "bovada.lv",
  "williamhill.com", "ladbrokes.com", "paddypower.com", "unibet.com", "betfair.com",
  "bwin.com", "stake.com", "stake.us", "casino.com", "slotomania.com",
  "partypoker.com", "ignitioncasino.eu", "betonline.ag", "mybookie.ag", "betmgm.com",
  "caesarscasino.com", "caesars.com", "hardrock.bet", "pointsbet.com", "wynnbet.com",
  "foxbet.com", "superbook.com", "sugarhouse.com", "twinspires.com", "tvg.com",
  "gtbets.eu", "sportsbetting.ag", "bookmaker.eu", "skybet.com", "coral.co.uk",
  "betfred.com", "32red.com", "leovegas.com", "mrgreen.com", "casumo.com",
  "betsson.com", "bet-at-home.com", "betathome.com", "interwetten.com", "nordicbet.com",
  "comeon.com", "dafabet.com", "sbobet.com", "1xbet.com", "melbet.com",
  "betwinner.com", "22bet.com", "parimatch.com", "betano.com", "betvictor.com",
  "virginbet.com", "boylesports.com", "betbright.com", "galacasino.com", "gala-casino.co.uk",
  "jackpotjoy.com", "virgingames.com", "luckylandslots.com", "chumbacasino.com", "globalpoker.com",
  "high5casino.com", "funzpoints.com", "pulsz.com", "wowvegas.com", "mcluck.com",
  "sportzino.com", "zulacasino.com", "betrivers.com", "tipico.com", "circasports.com",
  "betparx.com", "playstar.com", "goldennuggetcasino.com", "resortscasino.com", "borgataonline.com",
  "ballybet.com", "sisportsbook.com", "prizepicks.com", "underdogfantasy.com", "sleeper.com",
  "monkeyknifefight.com", "grosvenorcasinos.com", "winamax.com", "netbet.com", "casinoeuro.com",
  "mansioncasino.com", "royalvegascasino.com", "spinpalace.com", "jackpotcity.com", "europacasino.com",
  "rubyfortune.com", "harrahscasino.com", "tropicanacasino.com", "partycasino.com", "sportingbet.com",
  "neds.com.au", "sportsbet.com.au", "ladbrokes.com.au", "tab.com.au", "topsport.com.au",
  "palmerbet.com"
];

if (typeof module !== "undefined") {
  module.exports = { CURATED_GAMBLING_DOMAINS };
}
