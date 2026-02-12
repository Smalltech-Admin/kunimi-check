'use client';

import { useState } from 'react';
import { Eye, EyeOff, LogIn, Loader2 } from 'lucide-react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface User {
  user_id: string;
  name: string;
}

interface LoginFormProps {
  users: User[];
  onSubmit: (userId: string, password: string) => void;
  isLoading?: boolean;
  error?: string;
}

export function LoginForm({ users, onSubmit, isLoading, error }: LoginFormProps) {
  const [selectedUserId, setSelectedUserId] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (selectedUserId) {
      // デモ用：パスワードが空でもログイン可能
      onSubmit(selectedUserId, password || 'demo');
    }
  };

  return (
    <motion.form
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onSubmit={handleSubmit}
      className="space-y-5"
    >
      <div className="space-y-2">
        <Label htmlFor="user-select" className="text-base font-medium">
          ユーザー選択
        </Label>
        <Select value={selectedUserId} onValueChange={setSelectedUserId}>
          <SelectTrigger
            id="user-select"
            className="w-full h-14 text-base rounded-xl"
          >
            <SelectValue placeholder="ユーザーを選択してください" />
          </SelectTrigger>
          <SelectContent>
            {users.map((user) => (
              <SelectItem
                key={user.user_id}
                value={user.user_id}
                className="py-3 text-base"
              >
                {user.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="password" className="text-base font-medium">
          パスワード
        </Label>
        <div className="relative">
          <Input
            id="password"
            type={showPassword ? 'text' : 'password'}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="パスワードを入力（デモ：省略可）"
            className="h-14 text-base pr-12 rounded-xl"
          />
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-4 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors p-1"
          >
            {showPassword ? (
              <EyeOff className="h-5 w-5" />
            ) : (
              <Eye className="h-5 w-5" />
            )}
          </button>
        </div>
      </div>

      {error && (
        <motion.p
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-base text-destructive text-center bg-destructive/10 py-3 px-4 rounded-lg"
        >
          {error}
        </motion.p>
      )}

      <Button
        type="submit"
        className="w-full h-14 text-lg rounded-xl shadow-md"
        disabled={!selectedUserId || isLoading}
      >
        {isLoading ? (
          <>
            <Loader2 className="h-6 w-6 mr-2 animate-spin" />
            ログイン中...
          </>
        ) : (
          <>
            <LogIn className="h-6 w-6 mr-2" />
            ログイン
          </>
        )}
      </Button>

      <p className="text-sm text-muted-foreground text-center">
        デモ用：パスワードは省略可能です
      </p>
    </motion.form>
  );
}
