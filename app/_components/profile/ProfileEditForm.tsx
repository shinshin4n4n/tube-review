'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Toaster } from '@/components/ui/toast';
import { Loader2 } from 'lucide-react';
import { updateProfileAction, type UserProfile } from '@/app/_actions/profile';
import { AvatarUploader } from './AvatarUploader';
import { PrefectureSelect } from './PrefectureSelect';

interface ProfileEditFormProps {
  profile: UserProfile;
}

/**
 * プロフィール編集フォーム
 */
export function ProfileEditForm({ profile }: ProfileEditFormProps) {
  const router = useRouter();
  const { toast, toasts } = useToast();

  const [displayName, setDisplayName] = useState(profile.display_name || '');
  const [avatarUrl, setAvatarUrl] = useState(profile.avatar_url || '');
  const [bio, setBio] = useState(profile.bio || '');
  const [occupation, setOccupation] = useState(profile.occupation || '');
  const [gender, setGender] = useState(profile.gender || '');
  const [birthDate, setBirthDate] = useState(profile.birth_date || '');
  const [prefecture, setPrefecture] = useState(profile.prefecture || '');
  const [websiteUrl, setWebsiteUrl] = useState(profile.website_url || '');

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState<{
    displayName?: string;
    bio?: string;
    occupation?: string;
    gender?: string;
    birthDate?: string;
    prefecture?: string;
    websiteUrl?: string;
  }>({});

  const validateForm = (): boolean => {
    const newErrors: typeof errors = {};

    if (displayName && displayName.length > 50) {
      newErrors.displayName = '表示名は50文字以内で入力してください';
    }

    if (bio && bio.length > 500) {
      newErrors.bio = '自己紹介は500文字以内で入力してください';
    }

    if (occupation && occupation.length > 100) {
      newErrors.occupation = '職業は100文字以内で入力してください';
    }

    if (websiteUrl && websiteUrl.trim() !== '') {
      try {
        new URL(websiteUrl);
      } catch {
        newErrors.websiteUrl = '有効なURLを入力してください';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await updateProfileAction({
        displayName: displayName || undefined,
        avatarUrl: avatarUrl || undefined,
        bio: bio || undefined,
        occupation: occupation || undefined,
        gender: (gender as any) || undefined,
        birthDate: birthDate || undefined,
        prefecture: (prefecture as any) || undefined,
        websiteUrl: websiteUrl || undefined,
      });

      if (result.success) {
        toast({
          title: 'プロフィールを更新しました',
          description: 'プロフィールが正常に更新されました',
        });

        // ページをリフレッシュ
        router.refresh();
      } else {
        toast({
          title: 'エラー',
          description: result.error || 'プロフィールの更新に失敗しました',
          variant: 'destructive',
        });
      }
    } catch (error) {
      console.error('Profile update error:', error);
      toast({
        title: 'エラー',
        description: '予期しないエラーが発生しました',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Toaster toasts={toasts} />
      <form onSubmit={handleSubmit} className="space-y-6">
        {/* アバター画像 */}
        <AvatarUploader
          currentAvatarUrl={profile.avatar_url}
          onUploadComplete={(url) => setAvatarUrl(url)}
          disabled={isSubmitting}
        />

        {/* 表示名 */}
        <div>
          <Label htmlFor="displayName" className="text-base font-semibold mb-2 block">
            表示名
          </Label>
          <Input
            id="displayName"
            type="text"
            placeholder="例: 山田太郎"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            maxLength={50}
            disabled={isSubmitting}
          />
          <p className="text-sm text-content-secondary mt-1">
            {displayName.length} / 50文字
          </p>
          {errors.displayName && (
            <p className="text-sm text-red-500 mt-1">{errors.displayName}</p>
          )}
        </div>

        {/* 自己紹介 */}
        <div>
          <Label htmlFor="bio" className="text-base font-semibold mb-2 block">
            自己紹介
          </Label>
          <Textarea
            id="bio"
            placeholder="あなたについて教えてください..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={4}
            maxLength={500}
            disabled={isSubmitting}
            className="resize-none"
          />
          <p className="text-sm text-content-secondary mt-1">
            {bio.length} / 500文字
          </p>
          {errors.bio && (
            <p className="text-sm text-red-500 mt-1">{errors.bio}</p>
          )}
        </div>

        {/* 職業 */}
        <div>
          <Label htmlFor="occupation" className="text-base font-semibold mb-2 block">
            職業
          </Label>
          <Input
            id="occupation"
            type="text"
            placeholder="例: ソフトウェアエンジニア"
            value={occupation}
            onChange={(e) => setOccupation(e.target.value)}
            maxLength={100}
            disabled={isSubmitting}
          />
          <p className="text-sm text-content-secondary mt-1">
            {occupation.length} / 100文字
          </p>
          {errors.occupation && (
            <p className="text-sm text-red-500 mt-1">{errors.occupation}</p>
          )}
        </div>

        {/* 性別 */}
        <div>
          <Label htmlFor="gender" className="text-base font-semibold mb-2 block">
            性別
          </Label>
          <Select value={gender} onValueChange={setGender} disabled={isSubmitting}>
            <SelectTrigger id="gender">
              <SelectValue placeholder="性別を選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="">選択しない</SelectItem>
              <SelectItem value="male">男性</SelectItem>
              <SelectItem value="female">女性</SelectItem>
              <SelectItem value="other">その他</SelectItem>
              <SelectItem value="prefer_not_to_say">回答しない</SelectItem>
            </SelectContent>
          </Select>
          {errors.gender && (
            <p className="text-sm text-red-500 mt-1">{errors.gender}</p>
          )}
        </div>

        {/* 生年月日 */}
        <div>
          <Label htmlFor="birthDate" className="text-base font-semibold mb-2 block">
            生年月日
          </Label>
          <Input
            id="birthDate"
            type="date"
            value={birthDate}
            onChange={(e) => setBirthDate(e.target.value)}
            max={new Date().toISOString().split('T')[0]}
            disabled={isSubmitting}
          />
          {errors.birthDate && (
            <p className="text-sm text-red-500 mt-1">{errors.birthDate}</p>
          )}
        </div>

        {/* 都道府県 */}
        <PrefectureSelect
          value={prefecture}
          onChange={setPrefecture}
          disabled={isSubmitting}
          error={errors.prefecture}
        />

        {/* ウェブサイトURL */}
        <div>
          <Label htmlFor="websiteUrl" className="text-base font-semibold mb-2 block">
            ウェブサイトURL
          </Label>
          <Input
            id="websiteUrl"
            type="url"
            placeholder="https://example.com"
            value={websiteUrl}
            onChange={(e) => setWebsiteUrl(e.target.value)}
            maxLength={500}
            disabled={isSubmitting}
          />
          {errors.websiteUrl && (
            <p className="text-sm text-red-500 mt-1">{errors.websiteUrl}</p>
          )}
        </div>

        {/* 送信ボタン */}
        <div className="flex gap-4">
          <Button
            type="submit"
            disabled={isSubmitting}
            className="flex-1 bg-accent hover:bg-accent-hover"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                保存中...
              </>
            ) : (
              '保存する'
            )}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.back()}
            disabled={isSubmitting}
          >
            キャンセル
          </Button>
        </div>
      </form>
    </>
  );
}
