// 유저 코드 생성 (#+ 대문자/숫자 4자리)
export function generateUserCode(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
  let code = '#';
  for (let i = 0; i < 4; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

// 랜덤 닉네임 생성 (닉네임 없는 경우)
export function generateNickname(kakaoId: string): string {
  const suffix = Math.floor(1000 + Math.random() * 9000); // 4자리 랜덤 숫자
  return `user_${kakaoId.slice(-4)}_${suffix}`;
}
