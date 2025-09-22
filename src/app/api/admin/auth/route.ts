import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// 환경변수에서 관리자 비밀번호 해시 가져오기
const ADMIN_PASSWORD_HASH = process.env.ADMIN_PASSWORD_HASH || 'b97c08c26e4ec9f8d32d3af0c1effe94dce346963f2e5d84928727bef4c5ec0e';

// 비밀번호 해시 생성 함수 (개발용)
function hashPassword(password: string): string {
  return crypto.createHash('sha256').update(password).digest('hex');
}

// POST /api/admin/auth
export async function POST(req: NextRequest) {
  try {
    const { password } = await req.json();
    
    if (!password) {
      return NextResponse.json({ 
        success: false, 
        error: '비밀번호가 필요합니다.' 
      }, { status: 400 });
    }

    if (!ADMIN_PASSWORD_HASH) {
      return NextResponse.json({ 
        success: false, 
        error: '서버 설정 오류: 관리자 비밀번호가 설정되지 않았습니다.' 
      }, { status: 500 });
    }

    // 비밀번호 해시 비교
    const inputHash = hashPassword(password);
    const isValid = inputHash === ADMIN_PASSWORD_HASH;
    
    if (isValid) {
      return NextResponse.json({ 
        success: true, 
        message: '로그인 성공' 
      });
    } else {
      return NextResponse.json({ 
        success: false, 
        error: '비밀번호가 올바르지 않습니다.' 
      }, { status: 401 });
    }
    
  } catch (error) {
    console.error('인증 오류:', error);
    return NextResponse.json({ 
      success: false, 
      error: '서버 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
