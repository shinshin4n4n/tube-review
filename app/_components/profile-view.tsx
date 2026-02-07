import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { CalendarDays, Mail, User, Settings, Briefcase, MapPin, Link as LinkIcon, Cake, Users } from 'lucide-react';
import Link from 'next/link';

type ProfileViewProps = {
  profile: {
    id: string;
    email: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
    bio: string | null;
    occupation: string | null;
    gender: string | null;
    birth_date: string | null;
    prefecture: string | null;
    website_url: string | null;
    created_at: string;
  };
};

export function ProfileView({ profile }: ProfileViewProps) {
  const displayName = profile.display_name || profile.username;
  const initials = displayName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const formattedDate = new Date(profile.created_at).toLocaleDateString('ja-JP', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const formattedBirthDate = profile.birth_date
    ? new Date(profile.birth_date).toLocaleDateString('ja-JP', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
    : null;

  const genderLabel: { [key: string]: string } = {
    male: '男性',
    female: '女性',
    other: 'その他',
    prefer_not_to_say: '回答しない',
  };

  const genderDisplay = profile.gender ? genderLabel[profile.gender] || profile.gender : null;

  return (
    <div className="max-w-2xl mx-auto">
      <Card data-testid="profile-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-2xl text-content">
                プロフィール
              </CardTitle>
              <Link href="/settings/profile">
                <Button variant="outline" size="sm" className="gap-2">
                  <Settings className="h-4 w-4" />
                  編集
                </Button>
              </Link>
            </div>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* アバター */}
            <div className="flex justify-center">
              <Avatar className="h-24 w-24" data-testid="profile-avatar">
                <AvatarImage src={profile.avatar_url || undefined} alt={displayName} />
                <AvatarFallback className="bg-primary text-white text-2xl">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </div>

            {/* プロフィール情報 */}
            <div className="space-y-4">
              {/* 表示名 */}
              {profile.display_name && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">表示名</p>
                    <p
                      className="text-base text-content break-words"
                      data-testid="profile-display-name"
                    >
                      {profile.display_name}
                    </p>
                  </div>
                </div>
              )}

              {/* ユーザー名 */}
              <div className="flex items-start gap-3">
                <User className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ユーザー名</p>
                  <p
                    className="text-base text-content break-words"
                    data-testid="profile-username"
                  >
                    {profile.username}
                  </p>
                </div>
              </div>

              {/* メールアドレス */}
              <div className="flex items-start gap-3">
                <Mail className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">メールアドレス</p>
                  <p
                    className="text-base text-content break-words"
                    data-testid="profile-email"
                  >
                    {profile.email}
                  </p>
                </div>
              </div>

              {/* 自己紹介 */}
              {profile.bio && (
                <div className="flex items-start gap-3">
                  <User className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">自己紹介</p>
                    <p
                      className="text-base text-content whitespace-pre-wrap break-words"
                      data-testid="profile-bio"
                    >
                      {profile.bio}
                    </p>
                  </div>
                </div>
              )}

              {/* 職業 */}
              {profile.occupation && (
                <div className="flex items-start gap-3">
                  <Briefcase className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">職業</p>
                    <p
                      className="text-base text-content break-words"
                      data-testid="profile-occupation"
                    >
                      {profile.occupation}
                    </p>
                  </div>
                </div>
              )}

              {/* 性別 */}
              {genderDisplay && (
                <div className="flex items-start gap-3">
                  <Users className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">性別</p>
                    <p
                      className="text-base text-content"
                      data-testid="profile-gender"
                    >
                      {genderDisplay}
                    </p>
                  </div>
                </div>
              )}

              {/* 生年月日 */}
              {formattedBirthDate && (
                <div className="flex items-start gap-3">
                  <Cake className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">生年月日</p>
                    <p
                      className="text-base text-content"
                      data-testid="profile-birth-date"
                    >
                      {formattedBirthDate}
                    </p>
                  </div>
                </div>
              )}

              {/* 都道府県 */}
              {profile.prefecture && (
                <div className="flex items-start gap-3">
                  <MapPin className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">都道府県</p>
                    <p
                      className="text-base text-content"
                      data-testid="profile-prefecture"
                    >
                      {profile.prefecture}
                    </p>
                  </div>
                </div>
              )}

              {/* ウェブサイトURL */}
              {profile.website_url && (
                <div className="flex items-start gap-3">
                  <LinkIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ウェブサイト</p>
                    <a
                      href={profile.website_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-base text-blue-600 dark:text-blue-400 hover:underline break-all"
                      data-testid="profile-website-url"
                    >
                      {profile.website_url}
                    </a>
                  </div>
                </div>
              )}

              {/* 登録日 */}
              <div className="flex items-start gap-3">
                <CalendarDays className="h-5 w-5 text-gray-500 dark:text-gray-400 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">登録日</p>
                  <p
                    className="text-base text-content"
                    data-testid="profile-created-at"
                  >
                    {formattedDate}
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
    </div>
  );
}
