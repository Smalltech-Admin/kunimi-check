import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';

// Supabase クライアント（サーバーサイド用）
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;

/**
 * 操作ログ記録API
 * IP/User-Agentをサーバーサイドで取得してSupabaseに記録
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { user_id, action, target_type, target_id, details } = body;

    // バリデーション
    if (!user_id || !action || !target_type) {
      return NextResponse.json(
        { error: 'Missing required fields: user_id, action, target_type' },
        { status: 400 }
      );
    }

    // IPアドレス取得
    // x-forwarded-for: プロキシ/ロードバランサー経由の場合
    // x-real-ip: Nginx等のリバースプロキシ
    // request.ip: Vercelの場合（利用可能なら）
    const forwardedFor = request.headers.get('x-forwarded-for');
    const realIp = request.headers.get('x-real-ip');
    const ip_address = forwardedFor?.split(',')[0]?.trim() || realIp || 'unknown';

    // User-Agent取得
    const user_agent = request.headers.get('user-agent') || 'unknown';

    // Supabaseクライアント作成
    const supabase = createClient(supabaseUrl, supabaseAnonKey);

    // 操作ログ挿入
    const { error } = await supabase.from('operation_logs').insert({
      user_id,
      action,
      target_type,
      target_id: target_id || null,
      details: details || null,
      ip_address,
      user_agent,
    });

    if (error) {
      console.error('[OperationLog API] Insert error:', error);
      return NextResponse.json(
        { error: 'Failed to insert operation log' },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error('[OperationLog API] Unexpected error:', err);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
