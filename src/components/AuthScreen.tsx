import { useState } from 'react';
import { Lock, Mail, Shirt } from 'lucide-react';
import { supabase } from '../supabase';

export default function AuthScreen() {
  const [mode, setMode] = useState<'signin' | 'signup'>('signin');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setMessage('');
    setIsLoading(true);

    try {
      const credentials = {
        email: email.trim(),
        password,
      };

      const { error } = mode === 'signin'
        ? await supabase.auth.signInWithPassword(credentials)
        : await supabase.auth.signUp(credentials);

      if (error) {
        setMessage(error.message);
        return;
      }

      if (mode === 'signup') {
        setMessage('注册成功。请先打开邮箱确认邮件，然后回到这里登录。');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF8F5] flex items-center justify-center px-4 text-[#2A2724]">
      <div className="w-full max-w-sm bg-white border border-[#EAE6DF] rounded-2xl shadow-xl p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#2A2724] text-white flex items-center justify-center">
            <Shirt size={19} />
          </div>
          <div>
            <div className="font-semibold text-lg leading-tight">服装管理系统</div>
            <div className="text-xs text-[#8C867E]">Supabase 云同步登录</div>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <label className="block">
            <span className="text-xs font-mono text-[#8C867E] uppercase tracking-wider">邮箱</span>
            <div className="mt-1.5 flex items-center gap-2 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl px-3">
              <Mail size={15} className="text-[#8C867E]" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                required
                className="w-full bg-transparent py-3 text-sm outline-none"
                placeholder="name@example.com"
              />
            </div>
          </label>

          <label className="block">
            <span className="text-xs font-mono text-[#8C867E] uppercase tracking-wider">密码</span>
            <div className="mt-1.5 flex items-center gap-2 bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl px-3">
              <Lock size={15} className="text-[#8C867E]" />
              <input
                type="password"
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                required
                minLength={6}
                className="w-full bg-transparent py-3 text-sm outline-none"
                placeholder="至少 6 位"
              />
            </div>
          </label>

          {message && (
            <div className="text-xs bg-[#FAF8F5] border border-[#EAE6DF] rounded-xl px-3 py-2 text-[#4E4237]">
              {message}
            </div>
          )}

          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-[#2A2724] disabled:bg-[#8C867E] text-white rounded-full py-3 text-sm font-mono tracking-wider"
          >
            {isLoading ? '处理中...' : mode === 'signin' ? '登录' : '注册'}
          </button>
        </form>

        <button
          type="button"
          onClick={() => {
            setMode(mode === 'signin' ? 'signup' : 'signin');
            setMessage('');
          }}
          className="w-full mt-4 text-xs text-[#8C867E] hover:text-[#2A2724]"
        >
          {mode === 'signin' ? '没有账号？注册一个' : '已有账号？返回登录'}
        </button>
      </div>
    </div>
  );
}
