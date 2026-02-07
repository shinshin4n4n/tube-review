'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import WatchingManagement from './watching-management';
import CustomLists from './custom-lists';
import MyReviews from './my-reviews';

interface MyChannelsClientProps {
  initialTab: string;
}

/**
 * マイチャンネルクライアントコンポーネント
 * タブで視聴管理、カスタムリスト、マイれびゅ!を切り替え
 */
export default function MyChannelsClient({
  initialTab,
}: MyChannelsClientProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    const tab = searchParams.get('tab') || 'watching';
    setActiveTab(tab);
  }, [searchParams]);

  const handleTabChange = (value: string) => {
    setActiveTab(value);
    router.push(`/my-channels?tab=${value}`, { scroll: false });
  };

  return (
    <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
      <TabsList className="grid w-full grid-cols-3 mb-8">
        <TabsTrigger value="watching">
          👀 視聴管理
        </TabsTrigger>
        <TabsTrigger value="lists">
          📋 カスタムリスト
        </TabsTrigger>
        <TabsTrigger value="reviews">
          ✍️ マイれびゅ!
        </TabsTrigger>
      </TabsList>

      <TabsContent value="watching">
        <WatchingManagement key={`watching-${activeTab}`} />
      </TabsContent>

      <TabsContent value="lists">
        <CustomLists key={`lists-${activeTab}`} />
      </TabsContent>

      <TabsContent value="reviews">
        <MyReviews key={`reviews-${activeTab}`} />
      </TabsContent>
    </Tabs>
  );
}
