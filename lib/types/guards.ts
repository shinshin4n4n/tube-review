/**
 * Type guard functions for runtime type checking
 */

/**
 * Supabase channel type (single object)
 */
interface ChannelWithYoutubeId {
  youtube_channel_id?: string;
}

/**
 * Check if value is a channel object with youtube_channel_id
 */
export function isChannelObject(
  channel: unknown
): channel is ChannelWithYoutubeId {
  return (
    typeof channel === "object" &&
    channel !== null &&
    "youtube_channel_id" in channel
  );
}

/**
 * Check if value is an array of channel objects
 */
export function isChannelArray(
  channel: unknown
): channel is ChannelWithYoutubeId[] {
  return Array.isArray(channel) && channel.length > 0;
}

/**
 * Extract youtube_channel_id from Supabase join result
 * Handles both single object and array responses
 */
export function extractYoutubeChannelId(channel: unknown): string | undefined {
  if (isChannelObject(channel)) {
    return channel.youtube_channel_id;
  }
  if (isChannelArray(channel)) {
    return channel[0]?.youtube_channel_id;
  }
  return undefined;
}
