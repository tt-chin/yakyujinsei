// 聯盟・階級・球団の目録（物件導向化 第38期）。日本版の最終値を一か所で定義する。
// 旧 game.js では台湾版の表（LV・PATHS・TIER_TH・LG_N・TEAM_COLOR）を定義した後、日本版オーバーレイの Object.assign で上書きしていた。
// ここの値とキー順はその上書き後の結果と同一（キー順は元の表の順、追加分はオーバーレイの順）。挙動・RNG は変わらない。
// leagueTables() は呼ぶたびに新しいオブジェクトを返す。game.js は LeagueCatalog の参照を各組件に渡し、テストは同じ値を独立に取得できる。
export function leagueTables(){
  return {
    /* par=当該階級の平均水準、 min=最低基準(下回る→降格/戦力外)、 g=シーズン試合数。 */
    levels:{
      CPBL2:{n:'台湾プロ野球二軍',par:39,min:35,g:80,org:'CPBL',statBucket:'CPBL'},
      CPBL1:{n:'台湾プロ野球一軍',par:48,min:45,g:120,org:'CPBL',top:'CPBL',statBucket:'CPBL'},
      NPB2:{n:'NPB二軍',par:52,min:47,g:100,org:'NPB',statBucket:'NPB'},
      NPB1:{n:'NPB一軍',par:58,min:53,g:143,org:'NPB',top:'NPB',statBucket:'NPB'},
      R:{n:'ルーキーリーグ',par:43,min:39,g:55,org:'MiLB',statBucket:'MINOR'},
      A1:{n:'1A',par:47,min:43,g:110,org:'MiLB',statBucket:'MINOR'},
      A2:{n:'2A',par:51,min:47,g:120,org:'MiLB',statBucket:'MINOR'},
      A3:{n:'3A',par:56,min:52,g:130,org:'MiLB',statBucket:'MINOR'},
      MLB:{n:'メジャーリーグ',par:63,min:58,g:162,org:'MLB',top:'MLB',statBucket:'MLB'},
      HS:{n:'高校野球',par:38,min:0,g:20,org:'AMATEUR'},
      U:{n:'大学野球',par:44,min:0,g:24,org:'AMATEUR'},
      CORP:{n:'社会人野球',par:37,min:32,g:45,org:'CORP',statBucket:'CORP'},
      IND:{n:'独立リーグ',par:35,min:30,g:70,org:'IND',top:'IND',statBucket:'IND'},
      NPB_DEV:{n:'NPB育成',par:35,min:30,g:100,org:'NPB',statBucket:'NPB'},
      KBO2:{n:'KBOフューチャース',par:39,min:35,g:90,org:'KBO',statBucket:'KBO'},
      KBO1:{n:'KBO一軍',par:50,min:47,g:144,org:'KBO',top:'KBO',statBucket:'KBO'},
    },
    paths:{CPBL:['CPBL2','CPBL1'],NPB:['NPB_DEV','NPB2','NPB1'],MiLB:['R','A1','A2','A3','MLB'],KBO:['KBO2','KBO1'],MLB:['R','A1','A2','A3','MLB'],IND:['IND'],CORP:['CORP']},
    leagueNames:{CPBL:'CPBL',KBO:'KBO',NPB:'NPB',MLB:'MLB',MINOR:'マイナー／二軍',IND:'独立',CORP:'社会人'},
    tierThresholds:{CPBL:[8500,6000,3100,1800],KBO:[8200,5900,3000,1800],NPB:[8000,5800,3000,1800],MLB:[8500,6500,3600,2000],IND:[3000,1800,900,400],CORP:[3000,1800,900,400]},
    /* 球団名キーの色。teamId キーの色は LeagueCatalog が球団データから追加する。 */
    teamColorsByName:{
    /* CPBL。 */
    '台中マンモス':'#ffd800','府城ライオンズ':'#ff7f00','桃園コングス':'#8b1a1a','新北ナイツ':'#003f87','台北ダイナソーズ':'#c8102e','高雄イーグルス':'#1a7a3a',
    /* NPB。 */
    '東京グランズ':'#f97709','阪神ストライプス':'#ffe201','横浜ブルースターズ':'#0a3ce0','広島レッドフィッシュ':'#e60012','神宮スカイバーズ':'#0a7bc2','名古屋ドラグーンズ':'#003a70','福岡シーホークス':'#f5c400','北海道ノースファイターズ':'#0a2d5c','千葉オーシャンズ':'#111111','仙台ゴールデンオウルズ':'#8b0000','大阪ブルホーンズ':'#0033a0','埼玉レオンズ':'#1268b3',
    /* MLB。 */
    'ロサンゼルス・ブルー':'#005A9C',   'サンディエゴ・フライアーズ':'#2F241D', 
    'ベイエリア・ジャイアンツ':'#FD5A1E',
    'ニューヨーク・エンパイア':'#0C2340', 
    'ボストン・レッドソックス':'#BD3039',
    'ニューヨーク・ビッグアップル':'#FF5910',
    'フィラデルフィア・アイアンズ':'#E81828',
    'アトランタ・トマホークス':'#13274F',
    'シカゴ・カブス':'#0E3386',
    'セントルイス・カージナルス':'#C41E3A',
    'ヒューストン・ロケッツ':'#EB6E1F',
    'テキサス・レンジャーズ':'#003278',
    'シアトル・マリナーズ':'#005C5C', 
    'ロサンゼルス・エンジェルズ':'#BA0021',
    'トロント・ブルージェイズ':'#134A8E',
    'ボルチモア・オリオールズ':'#DF4601',
    'タンパベイ・レイズ':'#092C5C', 
    'クリーブランド・ガーディアンズ':'#E31937',
    'デトロイト・タイガース':'#0C2340',
    'ミネソタ・ツインズ':'#002B5C',
    'シカゴ・ホワイトソックス':'#27251F',
    'カンザスシティ・ロイヤルズ':'#174885',
    'オークランド・アスレチックス':'#003831',
    'ミルウォーキー・ブルワーズ':'#FFC52F',
    'ピッツバーグ・パイレーツ':'#FDB827',
    'マイアミ・マーリンズ':'#00A3E0',
    'ワシントン・ナショナルズ':'#AB0003',
    'アリゾナ・ダイヤモンドバックス':'#A71930',
    'コロラド・ロッキーズ':'#33006F',
    'シンシナティ・レッズ':'#C6011F'
    },
  };
}

export class LeagueCatalog {
  #teams;
  constructor({teams}){
    const tables=leagueTables();
    this.levels=tables.levels;
    this.paths=tables.paths;
    this.leagueNames=tables.leagueNames;
    this.tierThresholds=tables.tierThresholds;
    this.teamMaster=Object.freeze(Object.fromEntries(teams.map(x=>[x.teamId,Object.freeze(x)])));
    this.teamColors=tables.teamColorsByName;
    for(const t of teams){ if(t.color)this.teamColors[t.teamId]=t.color; }
    this.#teams=teams;
  }
  teamRec(id){return id?this.teamMaster[id]||null:null;}
  teamDisplay(id,lv){ const t=this.teamRec(id);if(!t)return'';if(['NPB_DEV','NPB2','KBO2','CPBL2','R','A1','A2','A3'].includes(lv))return t.name+' '+this.levels[lv].n;return t.name; }
  listByOrg(org){ const o=org==='MiLB'?'MLB':org;return this.#teams.filter(t=>t.org===o&&t.active).sort((a,b)=>a.order-b.order); }
  teamNick(team){ /* ◯◯先生的◯◯：球団名を代表する語を取得。 */
    const map={'台中マンモス':'マンモス','府城ライオンズ':'ライオン','桃園コングス':'キングコング','新北ナイツ':'騎士','台北ダイナソーズ':'恐竜','高雄イーグルス':'神鷲',
      /* 同名処理：ソックス系は色で区別;大人2球団ともオレンジ、都市名で区別。 */
      'ボストン・レッドソックス':'レッドソックスのキング','シカゴ・ホワイトソックス':'ホワイトソックスのキング','東京グランズ':'東京グランズ','ベイエリア・ジャイアンツ':'ベイエリア・ジャイアンツ',
      /* slice(-2) 切字修正。 */
      'オークランド・アスレチックス':'オークランド・アスレチックス','アリゾナ・ダイヤモンドバックス':'コブラ'};
    return map[team]||(team||'').slice(-2);
  }
}
