import {hofHonorBreakdown} from './hof-evaluation-policy.js';
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

export function honorScoreFor({bucket,honors=[],position,awardState}) {
 return hofHonorBreakdown(awardState||{honors,pos:position},bucket).honor;
}
