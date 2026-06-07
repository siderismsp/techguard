/**
 * Domain-to-service categorization map.
 * Takes raw DNS queries like "www.4fi.roblox.com" and maps them
 * to human-readable service names like "Roblox".
 *
 * Uses domain suffix matching so subdomains are automatically categorized.
 */

const serviceMap = [
  // ───── Gaming ─────
  { pattern: 'roblox.com', service: 'Roblox', category: 'gaming', icon: 'ti-device-gamepad-2' },
  { pattern: 'rbxcdn.com', service: 'Roblox', category: 'gaming', icon: 'ti-device-gamepad-2' },
  { pattern: 'epicgames.com', service: 'Epic Games', category: 'gaming', icon: 'ti-device-gamepad-2' },
  { pattern: 'fortnite.com', service: 'Fortnite', category: 'gaming', icon: 'ti-device-gamepad-2' },
  { pattern: 'steam.com', service: 'Steam', category: 'gaming', icon: 'ti-device-gamepad-2' },
  { pattern: 'steamcdn.com', service: 'Steam', category: 'gaming', icon: 'ti-device-gamepad-2' },
  { pattern: 'steampowered.com', service: 'Steam', category: 'gaming', icon: 'ti-device-gamepad-2' },
  { pattern: 'xbox.com', service: 'Xbox', category: 'gaming', icon: 'ti-device-gamepad-2' },
  { pattern: 'xboxlive.com', service: 'Xbox Live', category: 'gaming', icon: 'ti-device-gamepad-2' },
  { pattern: 'playstation.com', service: 'PlayStation', category: 'gaming', icon: 'ti-device-gamepad-2' },
  { pattern: 'nintendo.com', service: 'Nintendo', category: 'gaming', icon: 'ti-device-gamepad-2' },
  { pattern: 'minecraft.net', service: 'Minecraft', category: 'gaming', icon: 'ti-device-gamepad-2' },
  { pattern: 'mojang.com', service: 'Minecraft', category: 'gaming', icon: 'ti-device-gamepad-2' },
  { pattern: 'discord.com', service: 'Discord', category: 'gaming', icon: 'ti-brand-discord' },
  { pattern: 'discordcdn.com', service: 'Discord', category: 'gaming', icon: 'ti-brand-discord' },
  { pattern: 'discordapp.com', service: 'Discord', category: 'gaming', icon: 'ti-brand-discord' },

  // ───── Social Media ─────
  { pattern: 'facebook.com', service: 'Facebook', category: 'social_media', icon: 'ti-brand-facebook' },
  { pattern: 'fbcdn.net', service: 'Facebook', category: 'social_media', icon: 'ti-brand-facebook' },
  { pattern: 'instagram.com', service: 'Instagram', category: 'social_media', icon: 'ti-brand-instagram' },
  { pattern: 'cdninstagram.com', service: 'Instagram', category: 'social_media', icon: 'ti-brand-instagram' },
  { pattern: 'tiktok.com', service: 'TikTok', category: 'social_media', icon: 'ti-brand-tiktok' },
  { pattern: 'tiktokcdn.com', service: 'TikTok', category: 'social_media', icon: 'ti-brand-tiktok' },
  { pattern: 'twitter.com', service: 'Twitter / X', category: 'social_media', icon: 'ti-brand-twitter' },
  { pattern: 'x.com', service: 'Twitter / X', category: 'social_media', icon: 'ti-brand-twitter' },
  { pattern: 'twimg.com', service: 'Twitter / X', category: 'social_media', icon: 'ti-brand-twitter' },
  { pattern: 'snapchat.com', service: 'Snapchat', category: 'social_media', icon: 'ti-brand-snapchat' },
  { pattern: 'sc-cdn.net', service: 'Snapchat', category: 'social_media', icon: 'ti-brand-snapchat' },
  { pattern: 'reddit.com', service: 'Reddit', category: 'social_media', icon: 'ti-brand-reddit' },
  { pattern: 'redditinc.com', service: 'Reddit', category: 'social_media', icon: 'ti-brand-reddit' },
  { pattern: 'linkedin.com', service: 'LinkedIn', category: 'social_media', icon: 'ti-brand-linkedin' },
  { pattern: 'pinterest.com', service: 'Pinterest', category: 'social_media', icon: 'ti-brand-pinterest' },
  { pattern: 'tumblr.com', service: 'Tumblr', category: 'social_media', icon: 'ti-brand-tumblr' },
  { pattern: 'threads.net', service: 'Threads', category: 'social_media', icon: 'ti-messages' },

  // ───── Messaging / Chat ─────
  { pattern: 'whatsapp.com', service: 'WhatsApp', category: 'chat', icon: 'ti-brand-whatsapp' },
  { pattern: 'whatsapp.net', service: 'WhatsApp', category: 'chat', icon: 'ti-brand-whatsapp' },
  { pattern: 'telegram.org', service: 'Telegram', category: 'chat', icon: 'ti-brand-telegram' },
  { pattern: 't.me', service: 'Telegram', category: 'chat', icon: 'ti-brand-telegram' },
  { pattern: 'signal.org', service: 'Signal', category: 'chat', icon: 'ti-message-chatbot' },
  { pattern: 'messenger.com', service: 'Messenger', category: 'chat', icon: 'ti-messages' },
  { pattern: 'wechat.com', service: 'WeChat', category: 'chat', icon: 'ti-messages' },
  { pattern: 'line.me', service: 'LINE', category: 'chat', icon: 'ti-messages' },

  // ───── Video Streaming ─────
  { pattern: 'youtube.com', service: 'YouTube', category: 'streaming', icon: 'ti-brand-youtube' },
  { pattern: 'ytimg.com', service: 'YouTube', category: 'streaming', icon: 'ti-brand-youtube' },
  { pattern: 'googlevideo.com', service: 'YouTube', category: 'streaming', icon: 'ti-brand-youtube' },
  { pattern: 'netflix.com', service: 'Netflix', category: 'streaming', icon: 'ti-brand-netflix' },
  { pattern: 'nflxvideo.net', service: 'Netflix', category: 'streaming', icon: 'ti-brand-netflix' },
  { pattern: 'nflximg.net', service: 'Netflix', category: 'streaming', icon: 'ti-brand-netflix' },
  { pattern: 'hulu.com', service: 'Hulu', category: 'streaming', icon: 'ti-player-play' },
  { pattern: 'disneyplus.com', service: 'Disney+', category: 'streaming', icon: 'ti-brand-disney' },
  { pattern: 'disney.com', service: 'Disney', category: 'streaming', icon: 'ti-brand-disney' },
  { pattern: 'hbomax.com', service: 'HBO Max', category: 'streaming', icon: 'ti-player-play' },
  { pattern: 'max.com', service: 'Max', category: 'streaming', icon: 'ti-player-play' },
  { pattern: 'twitch.tv', service: 'Twitch', category: 'streaming', icon: 'ti-brand-twitch' },
  { pattern: 'twitchcdn.net', service: 'Twitch', category: 'streaming', icon: 'ti-brand-twitch' },
  { pattern: 'spotify.com', service: 'Spotify', category: 'streaming', icon: 'ti-brand-spotify' },
  { pattern: 'scdn.co', service: 'Spotify', category: 'streaming', icon: 'ti-brand-spotify' },
  { pattern: 'apple-music', service: 'Apple Music', category: 'streaming', icon: 'ti-music' },
  { pattern: 'tidal.com', service: 'Tidal', category: 'streaming', icon: 'ti-music' },
  { pattern: 'pandora.com', service: 'Pandora', category: 'streaming', icon: 'ti-music' },
  { pattern: 'crunchyroll.com', service: 'Crunchyroll', category: 'streaming', icon: 'ti-player-play' },
  { pattern: 'vrv.co', service: 'Crunchyroll', category: 'streaming', icon: 'ti-player-play' },

  // ───── Search & Productivity ─────
  { pattern: 'google.com', service: 'Google Search', category: 'search', icon: 'ti-search' },
  { pattern: 'bing.com', service: 'Bing', category: 'search', icon: 'ti-search' },
  { pattern: 'duckduckgo.com', service: 'DuckDuckGo', category: 'search', icon: 'ti-search' },
  { pattern: 'yahoo.com', service: 'Yahoo', category: 'search', icon: 'ti-search' },
  { pattern: 'wikipedia.org', service: 'Wikipedia', category: 'reference', icon: 'ti-book' },
  { pattern: 'wikimedia.org', service: 'Wikipedia', category: 'reference', icon: 'ti-book' },
  { pattern: 'stackoverflow.com', service: 'Stack Overflow', category: 'reference', icon: 'ti-code' },
  { pattern: 'github.com', service: 'GitHub', category: 'reference', icon: 'ti-brand-github' },
  { pattern: 'githubusercontent.com', service: 'GitHub', category: 'reference', icon: 'ti-brand-github' },
  { pattern: 'outlook.com', service: 'Outlook', category: 'productivity', icon: 'ti-mail' },
  { pattern: 'office.com', service: 'Microsoft 365', category: 'productivity', icon: 'ti-files' },
  { pattern: 'office365.com', service: 'Microsoft 365', category: 'productivity', icon: 'ti-files' },
  { pattern: 'sharepoint.com', service: 'SharePoint', category: 'productivity', icon: 'ti-files' },
  { pattern: 'teams.com', service: 'Microsoft Teams', category: 'productivity', icon: 'ti-messages' },
  { pattern: 'zoom.us', service: 'Zoom', category: 'productivity', icon: 'ti-video' },
  { pattern: 'webex.com', service: 'Webex', category: 'productivity', icon: 'ti-video' },
  { pattern: 'slack.com', service: 'Slack', category: 'productivity', icon: 'ti-messages' },
  { pattern: 'notion.so', service: 'Notion', category: 'productivity', icon: 'ti-notes' },
  { pattern: 'miro.com', service: 'Miro', category: 'productivity', icon: 'ti-layout-board' },
  { pattern: 'trello.com', service: 'Trello', category: 'productivity', icon: 'ti-brand-trello' },
  { pattern: 'asana.com', service: 'Asana', category: 'productivity', icon: 'ti-checklist' },
  { pattern: 'docs.google.com', service: 'Google Docs', category: 'productivity', icon: 'ti-file-text' },
  { pattern: 'drive.google.com', service: 'Google Drive', category: 'productivity', icon: 'ti-brand-google-drive' },
  { pattern: 'mail.google.com', service: 'Gmail', category: 'productivity', icon: 'ti-mail' },

  // ───── Education ─────
  { pattern: 'khanacademy.org', service: 'Khan Academy', category: 'education', icon: 'ti-school' },
  { pattern: 'coursera.org', service: 'Coursera', category: 'education', icon: 'ti-school' },
  { pattern: 'udemy.com', service: 'Udemy', category: 'education', icon: 'ti-school' },
  { pattern: 'edx.org', service: 'edX', category: 'education', icon: 'ti-school' },
  { pattern: 'quizlet.com', service: 'Quizlet', category: 'education', icon: 'ti-school' },
  { pattern: 'chegg.com', service: 'Chegg', category: 'education', icon: 'ti-school' },
  { pattern: 'canvaslms.com', service: 'Canvas LMS', category: 'education', icon: 'ti-school' },
  { pattern: 'instructure.com', service: 'Canvas LMS', category: 'education', icon: 'ti-school' },
  { pattern: 'blackboard.com', service: 'Blackboard', category: 'education', icon: 'ti-school' },
  { pattern: 'schology.com', service: 'Schoology', category: 'education', icon: 'ti-school' },
  { pattern: 'powerschool.com', service: 'PowerSchool', category: 'education', icon: 'ti-school' },

  // ───── E-Commerce ─────
  { pattern: 'amazon.com', service: 'Amazon', category: 'shopping', icon: 'ti-brand-amazon' },
  { pattern: 'amazonaws.com', service: 'AWS', category: 'cloud', icon: 'ti-cloud' },
  { pattern: 'ebay.com', service: 'eBay', category: 'shopping', icon: 'ti-shopping-cart' },
  { pattern: 'walmart.com', service: 'Walmart', category: 'shopping', icon: 'ti-shopping-cart' },
  { pattern: 'target.com', service: 'Target', category: 'shopping', icon: 'ti-shopping-cart' },
  { pattern: 'bestbuy.com', service: 'Best Buy', category: 'shopping', icon: 'ti-shopping-cart' },
  { pattern: 'etsy.com', service: 'Etsy', category: 'shopping', icon: 'ti-shopping-cart' },
  { pattern: 'shopify.com', service: 'Shopify', category: 'shopping', icon: 'ti-shopping-cart' },

  // ───── AI & Tools ─────
  { pattern: 'chat.openai.com', service: 'ChatGPT', category: 'ai', icon: 'ti-message-chatbot' },
  { pattern: 'openai.com', service: 'OpenAI', category: 'ai', icon: 'ti-message-chatbot' },
  { pattern: 'anthropic.com', service: 'Claude AI', category: 'ai', icon: 'ti-message-chatbot' },
  { pattern: 'claude.ai', service: 'Claude AI', category: 'ai', icon: 'ti-message-chatbot' },
  { pattern: 'copilot.microsoft.com', service: 'Copilot', category: 'ai', icon: 'ti-message-chatbot' },
  { pattern: 'gemini.google.com', service: 'Gemini', category: 'ai', icon: 'ti-message-chatbot' },
  { pattern: 'perplexity.ai', service: 'Perplexity', category: 'ai', icon: 'ti-message-chatbot' },
  { pattern: 'midjourney.com', service: 'Midjourney', category: 'ai', icon: 'ti-brush' },
  { pattern: 'stability.ai', service: 'Stable Diffusion', category: 'ai', icon: 'ti-brush' },

  // ───── Advertising / Tracking ─────
  { pattern: 'doubleclick.net', service: 'DoubleClick', category: 'tracking', icon: 'ti-ad' },
  { pattern: 'googlesyndication.com', service: 'Google Ads', category: 'tracking', icon: 'ti-ad' },
  { pattern: 'googleadservices.com', service: 'Google Ads', category: 'tracking', icon: 'ti-ad' },
  { pattern: 'google-analytics.com', service: 'Google Analytics', category: 'tracking', icon: 'ti-ad' },
  { pattern: 'googletagmanager.com', service: 'Google Tag Manager', category: 'tracking', icon: 'ti-ad' },
  { pattern: 'facebook.net', service: 'Facebook Pixel', category: 'tracking', icon: 'ti-ad' },
  { pattern: 'fb.com', service: 'Facebook', category: 'tracking', icon: 'ti-ad' },
  { pattern: 'scorecardresearch.com', service: 'Scorecard', category: 'tracking', icon: 'ti-ad' },
  { pattern: 'quantserve.com', service: 'Quantcast', category: 'tracking', icon: 'ti-ad' },
  { pattern: 'criteo.com', service: 'Criteo', category: 'tracking', icon: 'ti-ad' },
  { pattern: 'adsrvr.org', service: 'The Trade Desk', category: 'tracking', icon: 'ti-ad' },

  // ───── CDN / Infrastructure ─────
  { pattern: 'cloudflare.com', service: 'Cloudflare', category: 'infrastructure', icon: 'ti-cloud' },
  { pattern: 'cloudfront.net', service: 'AWS CloudFront', category: 'infrastructure', icon: 'ti-cloud' },
  { pattern: 'akamai.net', service: 'Akamai', category: 'infrastructure', icon: 'ti-cloud' },
  { pattern: 'akamaiedge.net', service: 'Akamai', category: 'infrastructure', icon: 'ti-cloud' },
  { pattern: 'fastly.net', service: 'Fastly', category: 'infrastructure', icon: 'ti-cloud' },
  { pattern: 'jsdelivr.net', service: 'jsDelivr', category: 'infrastructure', icon: 'ti-cloud' },
  { pattern: 'unpkg.com', service: 'UNPKG', category: 'infrastructure', icon: 'ti-cloud' },
  { pattern: 'cdnjs.com', service: 'CDNJS', category: 'infrastructure', icon: 'ti-cloud' },

  // ───── OS / System Updates ─────
  { pattern: 'apple.com', service: 'Apple', category: 'system', icon: 'ti-brand-apple' },
  { pattern: 'icloud.com', service: 'iCloud', category: 'system', icon: 'ti-brand-apple' },
  { pattern: 'icloud-content.com', service: 'iCloud', category: 'system', icon: 'ti-brand-apple' },
  { pattern: 'microsoft.com', service: 'Microsoft', category: 'system', icon: 'ti-brand-windows' },
  { pattern: 'windows.com', service: 'Windows Update', category: 'system', icon: 'ti-brand-windows' },
  { pattern: 'windowsupdate.com', service: 'Windows Update', category: 'system', icon: 'ti-brand-windows' },
  { pattern: 'update.microsoft.com', service: 'Windows Update', category: 'system', icon: 'ti-brand-windows' },
  { pattern: 'swscan.apple.com', service: 'Apple Updates', category: 'system', icon: 'ti-brand-apple' },
  { pattern: 'mesu.apple.com', service: 'Apple Updates', category: 'system', icon: 'ti-brand-apple' },
  { pattern: 'play.google.com', service: 'Google Play', category: 'system', icon: 'ti-brand-android' },
  { pattern: 'android.com', service: 'Android', category: 'system', icon: 'ti-brand-android' },
]

/**
 * Categorize a domain name into a human-readable service.
 * Returns { service, category, icon } or null if unknown.
 */
export function categorizeDomain(domain) {
  if (!domain) return null
  const lower = domain.toLowerCase().trim()

  for (const entry of serviceMap) {
    if (lower === entry.pattern || lower.endsWith('.' + entry.pattern)) {
      return { service: entry.service, category: entry.category, icon: entry.icon }
    }
  }

  // Extract second-level domain as fallback name
  const parts = lower.split('.')
  if (parts.length >= 2) {
    const sld = parts[parts.length - 2]
    if (sld && sld.length > 2 && !['www', 'api', 'cdn', 'mail', 'static', 'img', 'media', 'video', 'support', 'help', 'login', 'account', 'auth', 'app', 'web', 'test', 'dev', 'stage', 'shop', 'store'].includes(sld)) {
      return { service: sld.charAt(0).toUpperCase() + sld.slice(1), category: 'other', icon: 'ti-world' }
    }
  }

  return null
}

export function getServiceMap() {
  return serviceMap
}