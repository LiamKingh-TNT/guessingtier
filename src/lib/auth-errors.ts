const ERROR_MESSAGES: Record<string, string> = {
  "auth/invalid-email": "電子郵件格式不正確",
  "auth/user-not-found": "找不到此帳號",
  "auth/wrong-password": "密碼錯誤",
  "auth/invalid-credential": "帳號或密碼錯誤",
  "auth/user-disabled": "此帳號已被停用",
  "auth/too-many-requests": "嘗試次數過多，請稍後再試",
  "auth/email-already-in-use": "此電子郵件已被註冊",
  "auth/weak-password": "密碼強度不足，至少需要 6 個字元",
  "auth/operation-not-allowed": "目前無法使用電子郵件註冊",
  "auth/network-request-failed": "網路連線失敗，請稍後再試",
};

export function getAuthErrorMessage(error: unknown, fallback: string): string {
  const code = (error as { code?: string } | null)?.code;
  if (code && ERROR_MESSAGES[code]) {
    return ERROR_MESSAGES[code];
  }
  return fallback;
}
