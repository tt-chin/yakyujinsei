import {consumerTreatmentView} from './award-consumer-policy.js';
const LEAGUE_LABELS = {
  CPBL: '台湾プロ野球',
  KBO: 'KBO',
  NPB: 'NPB',
  MLB: 'メジャーリーグ',
};

const CHAMPIONSHIP_TITLES = {
  CPBL: '台湾シリーズ優勝',
  KBO: '韓国シリーズ優勝',
  NPB: '日本一',
  MLB: 'ワールドシリーズチャンピオン',
};

export const DEPARTMENT_TITLES = Object.freeze([
  '首位打者',
  '本塁打王',
  '盗塁王',
  '打点王',
  '最高出塁率',
  '最多セーブ',
  '最優秀中継ぎ',
  '最多奪三振',
  '最多勝',
  '最優秀防御率',
]);

export function honorScoreFor({ bucket, honors = [], position, intlCount = 0, franchise = false, awardState }) {
  const league = LEAGUE_LABELS[bucket];
  const championship = CHAMPIONSHIP_TITLES[bucket];
  let sc = 0;
  let mvp = 0;
  let aceN = 0;
  let king = 0;

  for(const row of consumerTreatmentView(honors,'hof',{league:bucket,state:awardState})){
    if(row.value==='ALL_STAR'){sc+=position==='P'?70:40;continue;}
    if(typeof row.value==='object'){
      sc+=row.value.sc;mvp+=row.value.mvp;aceN+=row.value.aceN;king+=row.value.king;continue;
    }
    sc+=row.value;
    if(row.value===420)mvp++;
    else if(row.value===460)aceN++;
    else if([160,220,300].includes(row.value))king++;
  }

  honors.forEach(honor => {
    if (honor.includes(championship)) {
      sc += 90;
      return;
    }
  });

  if (bucket === 'NPB') {
    sc += intlCount * 80;
    honors.forEach(honor => {
      if (!/ワールド・ベースボール・クラシック|WBSCプレミア12/.test(honor)) return;
      if (honor.includes('準優勝')) sc += 100;
      else if (honor.includes('優勝')) sc += 200;
    });
  }
  if (franchise) sc += 200;

  return { sc, mvp, aceN, king };
}
