import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { CalendarDays, Mail, User } from 'lucide-react';

type ProfileViewProps = {
  profile: {
    id: string;
    email: string;
    username: string;
    display_name: string | null;
    avatar_url: string | null;
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

  return (
    <div className="min-h-screen bg-bg-base py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <Card data-testid="profile-card">
          <CardHeader>
            <CardTitle className="text-2xl text-text-primary">
              プロフィール
            </CardTitle>
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
                <div className="flex items-center gap-3">
                  <User className="h-5 w-5 text-text-secondary" />
                  <div>
                    <p className="text-sm text-text-secondary">表示名</p>
                    <p
                      className="text-base font-medium text-text-primary"
                      data-testid="profile-display-name"
                    >
                      {profile.display_name}
                    </p>
                  </div>
                </div>
              )}

              {/* ユーザー名 */}
              <div className="flex items-center gap-3">
                <User className="h-5 w-5 text-text-secondary" />
                <div>
                  <p className="text-sm text-text-secondary">ユーザー名</p>
                  <p
                    className="text-base font-medium text-text-primary"
                    data-testid="profile-username"
                  >
                    {profile.username}
                  </p>
                </div>
              </div>

              {/* メールアドレス */}
              <div className="flex items-center gap-3">
                <Mail className="h-5 w-5 text-text-secondary" />
                <div>
                  <p className="text-sm text-text-secondary">メールアドレス</p>
                  <p
                    className="text-base font-medium text-text-primary"
                    data-testid="profile-email"
                  >
                    {profile.email}
                  </p>
                </div>
              </div>

              {/* 登録日 */}
              <div className="flex items-center gap-3">
                <CalendarDays className="h-5 w-5 text-text-secondary" />
                <div>
                  <p className="text-sm text-text-secondary">登録日</p>
                  <p
                    className="text-base font-medium text-text-primary"
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
    </div>
  );
}
