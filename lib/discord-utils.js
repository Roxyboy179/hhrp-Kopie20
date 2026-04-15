// Discord Avatar Helper
export function getDiscordAvatarUrl(user, size = 128) {
  if (!user) return null;
  
  // Wenn User ein Avatar hat
  if (user.avatar) {
    const format = user.avatar.startsWith('a_') ? 'gif' : 'png';
    return `https://cdn.discordapp.com/avatars/${user.id}/${user.avatar}.${format}?size=${size}`;
  }
  
  // Default Avatar basierend auf discriminator oder user ID
  const defaultAvatarNumber = user.discriminator 
    ? parseInt(user.discriminator) % 5 
    : (parseInt(user.id) >> 22) % 6;
  
  return `https://cdn.discordapp.com/embed/avatars/${defaultAvatarNumber}.png`;
}

export function getDiscordBannerUrl(user, size = 600) {
  if (!user?.banner) return null;
  
  const format = user.banner.startsWith('a_') ? 'gif' : 'png';
  return `https://cdn.discordapp.com/banners/${user.id}/${user.banner}.${format}?size=${size}`;
}
