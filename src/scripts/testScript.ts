import { prisma } from '../lib/prisma.js';

// 테스트용 스크립트 실행: npx tsx src/scripts/testScript.ts (루트 기준)
async function main() {
  console.log('--- 데이터 생성을 시작합니다 ---');

  // 새로운 사용자 생성 (Create)
  // id는 카카오 발급 ID(문자열)
  const newUser = await prisma.user.upsert({
    where: { email: 'kangyeon@example.com' },
    update: {}, // 이미 존재하면 업데이트하지 않음
    create: {
      id: 'kakao_123456789',
      nickname: '강연',
      email: 'kangyeon@example.com',
      userCode: '#KY26', // 정규식 조건: # + 대문자/숫자
      profile: '테스트주소',
      isKnocked: true,
    },
  });
  console.log('생성/확인된 사용자:', newUser);

  // 모든 사용자 조회 (Read)
  const allUsers = await prisma.user.findMany();
  console.log('현재 모든 사용자 목록:');
  console.dir(allUsers, { depth: null });

  // 특정 사용자 정보 수정 (Update)
  const updatedUser = await prisma.user.update({
    where: { id: 'kakao_123456789' },
    data: {
      nickname: '모멘텀열공중',
    },
  });
  console.log('수정된 사용자:', updatedUser.nickname);
}

main()
  .then(async () => {
    await prisma.$disconnect();
    console.log('--- 작업 완료 및 DB 연결 종료 ---');
  })
  .catch(async (e) => {
    console.error('에러 발생:', e);
    await prisma.$disconnect();
    process.exit(1);
  });
