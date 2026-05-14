import { prisma } from '../lib/prisma.js';

// 약관 더미 데이터 시드 스크립트: npx tsx src/scripts/seedTerms.ts (루트 기준)
// name이 unique이므로 동일 이름은 upsert로 중복 생성 방지
const TERM_SEEDS = [
  {
    name: '서비스 이용약관',
    type: 'REQUIRED',
    content:
      '본 약관은 모멘텀(Momentum) 서비스의 이용과 관련하여 회사와 회원 간의 권리, 의무 및 책임사항, 기타 필요한 사항을 규정함을 목적으로 합니다.',
  },
  {
    name: '개인정보 처리방침',
    type: 'REQUIRED',
    content:
      '회사는 회원의 개인정보를 중요시하며, 개인정보 보호법 등 관련 법령을 준수합니다. 수집 항목: 이메일, 닉네임, 카카오 계정 정보. 보유 기간: 회원 탈퇴 시까지.',
  },
  {
    name: '마케팅 정보 수신 동의',
    type: 'OPTIONAL',
    content:
      '회사가 제공하는 이벤트, 혜택, 신규 서비스 등에 대한 마케팅 정보를 이메일/푸시 알림으로 수신하는 데 동의합니다. 동의하지 않아도 서비스 이용에 제한이 없습니다.',
  },
];

async function main() {
  console.log('--- 약관 더미 데이터 시드를 시작합니다 ---');

  for (const seed of TERM_SEEDS) {
    const term = await prisma.term.upsert({
      where: { name: seed.name },
      update: {
        content: seed.content,
        type: seed.type,
      },
      create: seed,
    });
    console.log(`[${term.type}] ${term.name} (id: ${term.id})`);
  }

  const all = await prisma.term.findMany({ orderBy: { createdAt: 'asc' } });
  console.log(`총 ${all.length}건 등록됨.`);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('--- 시드 완료 및 DB 연결 종료 ---');
  })
  .catch(async (e) => {
    console.error('시드 에러:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
