'use client';

import { PREFECTURES } from '@/lib/constants/prefectures';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

interface PrefectureSelectProps {
  value?: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

/**
 * 都道府県選択コンポーネント
 */
export function PrefectureSelect({
  value,
  onChange,
  disabled,
  error,
}: PrefectureSelectProps) {
  return (
    <div>
      <Label htmlFor="prefecture" className="text-base font-semibold mb-2 block text-foreground">
        都道府県
      </Label>
      <Select value={value || 'unspecified'} onValueChange={onChange} disabled={disabled}>
        <SelectTrigger id="prefecture">
          <SelectValue placeholder="都道府県を選択" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="unspecified">選択しない</SelectItem>
          {PREFECTURES.map((prefecture) => (
            <SelectItem key={prefecture} value={prefecture}>
              {prefecture}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {error && <p className="text-sm text-red-500 mt-1">{error}</p>}
    </div>
  );
}
