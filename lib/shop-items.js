// Shop Items Datenbank - Erweitert auf 50 Rahmen + 50 Effekte
export const SHOP_ITEMS = {
  // ==================== PROFIL RAHMEN (50 Stück) ====================
  
  // Basic Farben (10)
  'frame-red': { id: 'frame-red', name: 'Roter Rahmen', type: 'frame', category: 'profile-frames', price: 1000, vipFree: true, description: 'Klassischer roter Rahmen', css: { border: '3px solid #EF4444', boxShadow: '0 0 15px rgba(239, 68, 68, 0.5)' }},
  'frame-blue': { id: 'frame-blue', name: 'Blauer Rahmen', type: 'frame', category: 'profile-frames', price: 1000, vipFree: true, description: 'Klassischer blauer Rahmen', css: { border: '3px solid #3B82F6', boxShadow: '0 0 15px rgba(59, 130, 246, 0.5)' }},
  'frame-green': { id: 'frame-green', name: 'Grüner Rahmen', type: 'frame', category: 'profile-frames', price: 1000, vipFree: true, description: 'Klassischer grüner Rahmen', css: { border: '3px solid #10B981', boxShadow: '0 0 15px rgba(16, 185, 129, 0.5)' }},
  'frame-yellow': { id: 'frame-yellow', name: 'Gelber Rahmen', type: 'frame', category: 'profile-frames', price: 1000, vipFree: true, description: 'Klassischer gelber Rahmen', css: { border: '3px solid #F59E0B', boxShadow: '0 0 15px rgba(245, 158, 11, 0.5)' }},
  'frame-purple': { id: 'frame-purple', name: 'Lila Rahmen', type: 'frame', category: 'profile-frames', price: 1000, vipFree: true, description: 'Klassischer lila Rahmen', css: { border: '3px solid #8B5CF6', boxShadow: '0 0 15px rgba(139, 92, 246, 0.5)' }},
  'frame-pink': { id: 'frame-pink', name: 'Pinker Rahmen', type: 'frame', category: 'profile-frames', price: 1000, vipFree: true, description: 'Klassischer pinker Rahmen', css: { border: '3px solid #EC4899', boxShadow: '0 0 15px rgba(236, 72, 153, 0.5)' }},
  'frame-cyan': { id: 'frame-cyan', name: 'Türkiser Rahmen', type: 'frame', category: 'profile-frames', price: 1000, vipFree: true, description: 'Klassischer türkiser Rahmen', css: { border: '3px solid #06B6D4', boxShadow: '0 0 15px rgba(6, 182, 212, 0.5)' }},
  'frame-orange': { id: 'frame-orange', name: 'Oranger Rahmen', type: 'frame', category: 'profile-frames', price: 1000, vipFree: true, description: 'Klassischer oranger Rahmen', css: { border: '3px solid #F97316', boxShadow: '0 0 15px rgba(249, 115, 22, 0.5)' }},
  'frame-teal': { id: 'frame-teal', name: 'Petrol Rahmen', type: 'frame', category: 'profile-frames', price: 1000, vipFree: true, description: 'Klassischer petrol Rahmen', css: { border: '3px solid #14B8A6', boxShadow: '0 0 15px rgba(20, 184, 166, 0.5)' }},
  'frame-indigo': { id: 'frame-indigo', name: 'Indigo Rahmen', type: 'frame', category: 'profile-frames', price: 1000, vipFree: true, description: 'Klassischer indigo Rahmen', css: { border: '3px solid #6366F1', boxShadow: '0 0 15px rgba(99, 102, 241, 0.5)' }},

  // Metallic (10)
  'frame-gold': { id: 'frame-gold', name: 'Goldener Rahmen', type: 'frame', category: 'profile-frames', price: 5000, vipFree: true, description: 'Eleganter goldener Rahmen', css: { border: '3px solid #FFD700', boxShadow: '0 0 20px rgba(255, 215, 0, 0.6), inset 0 0 10px rgba(255, 215, 0, 0.3)' }},
  'frame-silver': { id: 'frame-silver', name: 'Silberner Rahmen', type: 'frame', category: 'profile-frames', price: 3000, vipFree: true, description: 'Schlichter silberner Rahmen', css: { border: '3px solid #C0C0C0', boxShadow: '0 0 15px rgba(192, 192, 192, 0.6)' }},
  'frame-bronze': { id: 'frame-bronze', name: 'Bronze Rahmen', type: 'frame', category: 'profile-frames', price: 2500, vipFree: true, description: 'Warmer bronze Rahmen', css: { border: '3px solid #CD7F32', boxShadow: '0 0 15px rgba(205, 127, 50, 0.6)' }},
  'frame-copper': { id: 'frame-copper', name: 'Kupfer Rahmen', type: 'frame', category: 'profile-frames', price: 2000, vipFree: true, description: 'Glänzender Kupfer Rahmen', css: { border: '3px solid #B87333', boxShadow: '0 0 15px rgba(184, 115, 51, 0.6)' }},
  'frame-platinum': { id: 'frame-platinum', name: 'Platin Rahmen', type: 'frame', category: 'profile-frames', price: 8000, vipFree: true, description: 'Luxuriöser Platin Rahmen', css: { border: '3px solid #E5E4E2', boxShadow: '0 0 25px rgba(229, 228, 226, 0.8)' }},
  'frame-rose-gold': { id: 'frame-rose-gold', name: 'Roségold Rahmen', type: 'frame', category: 'profile-frames', price: 6000, vipFree: true, description: 'Edler Roségold Rahmen', css: { border: '3px solid #B76E79', boxShadow: '0 0 20px rgba(183, 110, 121, 0.6)' }},
  'frame-steel': { id: 'frame-steel', name: 'Stahl Rahmen', type: 'frame', category: 'profile-frames', price: 1500, vipFree: true, description: 'Robuster Stahl Rahmen', css: { border: '3px solid #71797E', boxShadow: '0 0 10px rgba(113, 121, 126, 0.5)' }},
  'frame-titanium': { id: 'frame-titanium', name: 'Titan Rahmen', type: 'frame', category: 'profile-frames', price: 7000, vipFree: true, description: 'Futuristischer Titan Rahmen', css: { border: '3px solid #878681', boxShadow: '0 0 20px rgba(135, 134, 129, 0.7)' }},
  'frame-chrome': { id: 'frame-chrome', name: 'Chrom Rahmen', type: 'frame', category: 'profile-frames', price: 4500, vipFree: true, description: 'Glänzender Chrom Rahmen', css: { border: '3px solid #D4D4D4', boxShadow: '0 0 20px rgba(212, 212, 212, 0.8)' }},
  'frame-obsidian': { id: 'frame-obsidian', name: 'Obsidian Rahmen', type: 'frame', category: 'profile-frames', price: 5500, vipFree: true, description: 'Dunkler Obsidian Rahmen', css: { border: '3px solid #0F0F0F', boxShadow: '0 0 25px rgba(15, 15, 15, 0.9)' }},

  // Neon (10)
  'frame-neon-blue': { id: 'frame-neon-blue', name: 'Neon Blau', type: 'frame', category: 'profile-frames', price: 7500, vipFree: true, description: 'Leuchtender blauer Neon', css: { border: '3px solid #00D9FF', boxShadow: '0 0 25px rgba(0, 217, 255, 0.9)', animation: 'neon-pulse 2s ease-in-out infinite' }},
  'frame-neon-pink': { id: 'frame-neon-pink', name: 'Neon Pink', type: 'frame', category: 'profile-frames', price: 7500, vipFree: true, description: 'Leuchtender pinker Neon', css: { border: '3px solid #FF10F0', boxShadow: '0 0 25px rgba(255, 16, 240, 0.9)', animation: 'neon-pulse 2s ease-in-out infinite' }},
  'frame-neon-green': { id: 'frame-neon-green', name: 'Neon Grün', type: 'frame', category: 'profile-frames', price: 7500, vipFree: true, description: 'Leuchtender grüner Neon', css: { border: '3px solid #39FF14', boxShadow: '0 0 25px rgba(57, 255, 20, 0.9)', animation: 'neon-pulse 2s ease-in-out infinite' }},
  'frame-neon-yellow': { id: 'frame-neon-yellow', name: 'Neon Gelb', type: 'frame', category: 'profile-frames', price: 7500, vipFree: true, description: 'Leuchtender gelber Neon', css: { border: '3px solid #FFFF00', boxShadow: '0 0 25px rgba(255, 255, 0, 0.9)', animation: 'neon-pulse 2s ease-in-out infinite' }},
  'frame-neon-orange': { id: 'frame-neon-orange', name: 'Neon Orange', type: 'frame', category: 'profile-frames', price: 7500, vipFree: true, description: 'Leuchtender oranger Neon', css: { border: '3px solid #FF6600', boxShadow: '0 0 25px rgba(255, 102, 0, 0.9)', animation: 'neon-pulse 2s ease-in-out infinite' }},
  'frame-neon-purple': { id: 'frame-neon-purple', name: 'Neon Lila', type: 'frame', category: 'profile-frames', price: 7500, vipFree: true, description: 'Leuchtender lila Neon', css: { border: '3px solid #BC13FE', boxShadow: '0 0 25px rgba(188, 19, 254, 0.9)', animation: 'neon-pulse 2s ease-in-out infinite' }},
  'frame-neon-red': { id: 'frame-neon-red', name: 'Neon Rot', type: 'frame', category: 'profile-frames', price: 7500, vipFree: true, description: 'Leuchtender roter Neon', css: { border: '3px solid #FF073A', boxShadow: '0 0 25px rgba(255, 7, 58, 0.9)', animation: 'neon-pulse 2s ease-in-out infinite' }},
  'frame-neon-cyan': { id: 'frame-neon-cyan', name: 'Neon Cyan', type: 'frame', category: 'profile-frames', price: 7500, vipFree: true, description: 'Leuchtender cyan Neon', css: { border: '3px solid #00FFFF', boxShadow: '0 0 25px rgba(0, 255, 255, 0.9)', animation: 'neon-pulse 2s ease-in-out infinite' }},
  'frame-neon-white': { id: 'frame-neon-white', name: 'Neon Weiß', type: 'frame', category: 'profile-frames', price: 8000, vipFree: true, description: 'Leuchtender weißer Neon', css: { border: '3px solid #FFFFFF', boxShadow: '0 0 30px rgba(255, 255, 255, 0.9)', animation: 'neon-pulse 2s ease-in-out infinite' }},
  'frame-neon-rainbow': { id: 'frame-neon-rainbow', name: 'Neon Regenbogen', type: 'frame', category: 'profile-frames', price: 12000, vipFree: true, description: 'Animierter Regenbogen Neon', css: { border: '3px solid #FF0000', boxShadow: '0 0 30px rgba(255, 0, 0, 0.9)', animation: 'rainbow-neon 3s linear infinite' }},

  // Gradient (10)
  'frame-gradient-sunset': { id: 'frame-gradient-sunset', name: 'Sonnenuntergang', type: 'frame', category: 'profile-frames', price: 9000, vipFree: true, description: 'Warmer Sonnenuntergang Gradient', css: { border: '3px solid transparent', backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #FF512F 0%, #F09819 100%)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' }},
  'frame-gradient-ocean': { id: 'frame-gradient-ocean', name: 'Ozean', type: 'frame', category: 'profile-frames', price: 9000, vipFree: true, description: 'Tiefer Ozean Gradient', css: { border: '3px solid transparent', backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #2E3192 0%, #1BFFFF 100%)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' }},
  'frame-gradient-fire': { id: 'frame-gradient-fire', name: 'Feuer', type: 'frame', category: 'profile-frames', price: 9000, vipFree: true, description: 'Heißer Feuer Gradient', css: { border: '3px solid transparent', backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #FF0000 0%, #FFA500 50%, #FFFF00 100%)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' }},
  'frame-gradient-ice': { id: 'frame-gradient-ice', name: 'Eis', type: 'frame', category: 'profile-frames', price: 9000, vipFree: true, description: 'Kühler Eis Gradient', css: { border: '3px solid transparent', backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #A8EDEA 0%, #FED6E3 100%)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' }},
  'frame-gradient-purple': { id: 'frame-gradient-purple', name: 'Lila Traum', type: 'frame', category: 'profile-frames', price: 9000, vipFree: true, description: 'Mystischer lila Gradient', css: { border: '3px solid transparent', backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #667eea 0%, #764ba2 100%)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' }},
  'frame-gradient-dark': { id: 'frame-gradient-dark', name: 'Dunkler Gradient', type: 'frame', category: 'profile-frames', price: 9000, vipFree: true, description: 'Mysteriöser dunkler Gradient', css: { border: '3px solid transparent', backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #434343 0%, #000000 100%)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' }},
  'frame-gradient-peach': { id: 'frame-gradient-peach', name: 'Pfirsich', type: 'frame', category: 'profile-frames', price: 9000, vipFree: true, description: 'Sanfter Pfirsich Gradient', css: { border: '3px solid transparent', backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #FFECD2 0%, #FCB69F 100%)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' }},
  'frame-gradient-space': { id: 'frame-gradient-space', name: 'Weltall', type: 'frame', category: 'profile-frames', price: 10000, vipFree: true, description: 'Galaktischer Weltraum Gradient', css: { border: '3px solid transparent', backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #000046 0%, #1CB5E0 100%)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' }},
  'frame-gradient-candy': { id: 'frame-gradient-candy', name: 'Bonbon', type: 'frame', category: 'profile-frames', price: 9000, vipFree: true, description: 'Süßer Bonbon Gradient', css: { border: '3px solid transparent', backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #FFA8A8 0%, #FCFF00 50%, #00DBDE 100%)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' }},
  'frame-gradient-emerald': { id: 'frame-gradient-emerald', name: 'Smaragd', type: 'frame', category: 'profile-frames', price: 9000, vipFree: true, description: 'Edler Smaragd Gradient', css: { border: '3px solid transparent', backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #348F50 0%, #56B4D3 100%)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box' }},

  // Rainbow/Special (10)
  'frame-rainbow': { id: 'frame-rainbow', name: 'Regenbogen', type: 'frame', category: 'profile-frames', price: 10000, vipFree: true, description: 'Bunter animierter Regenbogen', css: { border: '3px solid transparent', backgroundImage: 'linear-gradient(white, white), linear-gradient(45deg, red, orange, yellow, green, blue, indigo, violet)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box', animation: 'rainbow-rotate 3s linear infinite' }},
  'frame-glitch': { id: 'frame-glitch', name: 'Glitch', type: 'frame', category: 'profile-frames', price: 11000, vipFree: true, description: 'Digitaler Glitch Effekt', css: { border: '3px solid #00FF00', boxShadow: '0 0 20px rgba(0, 255, 0, 0.7), -2px 0 0 red, 2px 0 0 cyan', animation: 'glitch 1s infinite' }},
  'frame-matrix': { id: 'frame-matrix', name: 'Matrix', type: 'frame', category: 'profile-frames', price: 10500, vipFree: true, description: 'Matrix Code Stil', css: { border: '3px solid #00FF00', boxShadow: '0 0 30px rgba(0, 255, 0, 0.8), inset 0 0 20px rgba(0, 255, 0, 0.2)', animation: 'matrix-pulse 2s ease infinite' }},
  'frame-hologram': { id: 'frame-hologram', name: 'Hologramm', type: 'frame', category: 'profile-frames', price: 12000, vipFree: true, description: 'Futuristisches Hologramm', css: { border: '3px solid #00FFFF', boxShadow: '0 0 40px rgba(0, 255, 255, 0.9)', animation: 'hologram 3s ease-in-out infinite' }},
  'frame-disco': { id: 'frame-disco', name: 'Disco', type: 'frame', category: 'profile-frames', price: 11500, vipFree: true, description: 'Tanzender Disco Ball', css: { border: '3px solid #FFD700', boxShadow: '0 0 30px gold', animation: 'disco-shine 1.5s linear infinite' }},
  'frame-aurora': { id: 'frame-aurora', name: 'Polarlicht', type: 'frame', category: 'profile-frames', price: 13000, vipFree: true, description: 'Magisches Polarlicht', css: { border: '3px solid transparent', backgroundImage: 'linear-gradient(white, white), linear-gradient(45deg, #00FFA3, #03E3FF, #A044FF, #03E3FF)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box', backgroundSize: '300% 300%', animation: 'aurora-wave 4s ease infinite' }},
  'frame-plasma': { id: 'frame-plasma', name: 'Plasma', type: 'frame', category: 'profile-frames', price: 12500, vipFree: true, description: 'Wirbelndes Plasma', css: { border: '3px solid #FF00FF', boxShadow: '0 0 35px rgba(255, 0, 255, 0.9)', animation: 'plasma-spin 2s linear infinite' }},
  'frame-electric': { id: 'frame-electric', name: 'Elektrisch', type: 'frame', category: 'profile-frames', price: 11000, vipFree: true, description: 'Elektrische Blitze', css: { border: '3px solid #00D4FF', boxShadow: '0 0 25px rgba(0, 212, 255, 1), 0 0 50px rgba(0, 212, 255, 0.5)', animation: 'electric-spark 0.5s steps(10) infinite' }},
  'frame-cosmic': { id: 'frame-cosmic', name: 'Kosmisch', type: 'frame', category: 'profile-frames', price: 14000, vipFree: true, description: 'Unendliches Universum', css: { border: '3px solid #4B0082', boxShadow: '0 0 40px rgba(75, 0, 130, 0.9), inset 0 0 30px rgba(138, 43, 226, 0.5)', animation: 'cosmic-glow 4s ease-in-out infinite' }},
  'frame-dragon': { id: 'frame-dragon', name: 'Drachen', type: 'frame', category: 'profile-frames', price: 15000, vipFree: true, description: 'Legendärer Drachen Rahmen', css: { border: '3px solid #DC143C', boxShadow: '0 0 50px rgba(220, 20, 60, 1), 0 0 100px rgba(255, 140, 0, 0.5)', animation: 'dragon-breath 2s ease-in-out infinite' }},

  // Beta Tester Rahmen (2)
  'frame-beta-purple': { id: 'frame-beta-purple', name: 'Beta Lila', type: 'frame', category: 'beta-frames', price: 0, vipFree: true, betaOnly: true, description: 'Exklusiver Beta Tester Rahmen', css: { border: '3px solid #A855F7', boxShadow: '0 0 30px rgba(168, 85, 247, 0.8)' }},
  'frame-beta-gradient': { id: 'frame-beta-gradient', name: 'Beta Gradient', type: 'frame', category: 'beta-frames', price: 0, vipFree: true, betaOnly: true, description: 'Animierter Beta Gradient', css: { border: '3px solid transparent', backgroundImage: 'linear-gradient(white, white), linear-gradient(135deg, #A855F7, #EC4899, #A855F7)', backgroundOrigin: 'border-box', backgroundClip: 'padding-box, border-box', backgroundSize: '200% 200%', animation: 'gradient-shift 3s ease infinite' }},

  // ==================== PROFIL EFFEKTE (50 Stück) ====================
  
  // Glow Effects (10)
  'effect-glow-white': { id: 'effect-glow-white', name: 'Weißes Leuchten', type: 'effect', category: 'profile-effects', price: 2000, vipFree: true, description: 'Sanftes weißes Leuchten', css: { boxShadow: '0 0 30px rgba(255, 255, 255, 0.7)', animation: 'glow-pulse 3s ease-in-out infinite' }},
  'effect-glow-blue': { id: 'effect-glow-blue', name: 'Blaues Leuchten', type: 'effect', category: 'profile-effects', price: 2000, vipFree: true, description: 'Kühles blaues Leuchten', css: { boxShadow: '0 0 30px rgba(59, 130, 246, 0.8)', animation: 'glow-pulse 3s ease-in-out infinite' }},
  'effect-glow-red': { id: 'effect-glow-red', name: 'Rotes Leuchten', type: 'effect', category: 'profile-effects', price: 2000, vipFree: true, description: 'Intensives rotes Leuchten', css: { boxShadow: '0 0 30px rgba(239, 68, 68, 0.8)', animation: 'glow-pulse 3s ease-in-out infinite' }},
  'effect-glow-green': { id: 'effect-glow-green', name: 'Grünes Leuchten', type: 'effect', category: 'profile-effects', price: 2000, vipFree: true, description: 'Frisches grünes Leuchten', css: { boxShadow: '0 0 30px rgba(16, 185, 129, 0.8)', animation: 'glow-pulse 3s ease-in-out infinite' }},
  'effect-glow-purple': { id: 'effect-glow-purple', name: 'Lila Leuchten', type: 'effect', category: 'profile-effects', price: 2000, vipFree: true, description: 'Mystisches lila Leuchten', css: { boxShadow: '0 0 30px rgba(168, 85, 247, 0.8)', animation: 'glow-pulse 3s ease-in-out infinite' }},
  'effect-glow-pink': { id: 'effect-glow-pink', name: 'Pinkes Leuchten', type: 'effect', category: 'profile-effects', price: 2000, vipFree: true, description: 'Romantisches pinkes Leuchten', css: { boxShadow: '0 0 30px rgba(236, 72, 153, 0.8)', animation: 'glow-pulse 3s ease-in-out infinite' }},
  'effect-glow-gold': { id: 'effect-glow-gold', name: 'Goldenes Leuchten', type: 'effect', category: 'profile-effects', price: 3000, vipFree: true, description: 'Edles goldenes Leuchten', css: { boxShadow: '0 0 35px rgba(255, 215, 0, 0.9)', animation: 'glow-pulse 3s ease-in-out infinite' }},
  'effect-glow-cyan': { id: 'effect-glow-cyan', name: 'Cyan Leuchten', type: 'effect', category: 'profile-effects', price: 2000, vipFree: true, description: 'Helles cyan Leuchten', css: { boxShadow: '0 0 30px rgba(6, 182, 212, 0.8)', animation: 'glow-pulse 3s ease-in-out infinite' }},
  'effect-glow-rainbow': { id: 'effect-glow-rainbow', name: 'Regenbogen Leuchten', type: 'effect', category: 'profile-effects', price: 5000, vipFree: true, description: 'Buntes Regenbogen Leuchten', css: { boxShadow: '0 0 40px rgba(255, 0, 0, 0.5)', animation: 'rainbow-glow 3s linear infinite' }},
  'effect-glow-neon': { id: 'effect-glow-neon', name: 'Neon Leuchten', type: 'effect', category: 'profile-effects', price: 4000, vipFree: true, description: 'Intensives Neon Leuchten', css: { boxShadow: '0 0 50px rgba(0, 255, 255, 1)', animation: 'neon-glow-pulse 2s ease-in-out infinite' }},

  // Sparkle/Particle (10)
  'effect-sparkle-white': { id: 'effect-sparkle-white', name: 'Weiße Funken', type: 'effect', category: 'profile-effects', price: 3500, vipFree: true, description: 'Weiße glitzernde Funken', css: { filter: 'drop-shadow(0 0 10px white)', animation: 'sparkle-twinkle 1.5s ease-in-out infinite' }},
  'effect-sparkle-gold': { id: 'effect-sparkle-gold', name: 'Gold Funken', type: 'effect', category: 'profile-effects', price: 4000, vipFree: true, description: 'Goldene Glitzer-Partikel', css: { filter: 'drop-shadow(0 0 15px gold)', animation: 'sparkle-twinkle 1.5s ease-in-out infinite' }},
  'effect-sparkle-rainbow': { id: 'effect-sparkle-rainbow', name: 'Regenbogen Funken', type: 'effect', category: 'profile-effects', price: 6000, vipFree: true, description: 'Bunte Regenbogen Funken', css: { animation: 'rainbow-sparkle 2s linear infinite' }},
  'effect-stars': { id: 'effect-stars', name: 'Sternenhimmel', type: 'effect', category: 'profile-effects', price: 5500, vipFree: true, description: 'Funkelnder Sternenhimmel', css: { boxShadow: '0 0 2px white, 5px 5px 2px white, -5px -5px 2px white, 10px -10px 2px white', animation: 'star-twinkle 3s ease-in-out infinite' }},
  'effect-snow': { id: 'effect-snow', name: 'Schneefall', type: 'effect', category: 'profile-effects', price: 5000, vipFree: true, description: 'Fallende Schneeflocken', css: { filter: 'drop-shadow(0 0 5px white)', animation: 'snow-fall 5s linear infinite' }},
  'effect-confetti': { id: 'effect-confetti', name: 'Konfetti', type: 'effect', category: 'profile-effects', price: 6500, vipFree: true, description: 'Buntes Konfetti', css: { animation: 'confetti-burst 2s ease-out infinite' }},
  'effect-fireflies': { id: 'effect-fireflies', name: 'Glühwürmchen', type: 'effect', category: 'profile-effects', price: 7000, vipFree: true, description: 'Leuchtende Glühwürmchen', css: { boxShadow: '0 0 10px rgba(255, 255, 0, 0.8)', animation: 'firefly-float 4s ease-in-out infinite' }},
  'effect-bubbles': { id: 'effect-bubbles', name: 'Seifenblasen', type: 'effect', category: 'profile-effects', price: 4500, vipFree: true, description: 'Schwebende Seifenblasen', css: { boxShadow: '0 0 20px rgba(255, 255, 255, 0.3)', animation: 'bubble-float 5s ease-in-out infinite' }},
  'effect-petals': { id: 'effect-petals', name: 'Blütenblätter', type: 'effect', category: 'profile-effects', price: 5500, vipFree: true, description: 'Fallende Kirschblüten', css: { filter: 'drop-shadow(0 0 8px pink)', animation: 'petal-fall 6s ease-in-out infinite' }},
  'effect-dust': { id: 'effect-dust', name: 'Sternenstaub', type: 'effect', category: 'profile-effects', price: 6000, vipFree: true, description: 'Magischer Sternenstaub', css: { boxShadow: '0 0 15px rgba(138, 43, 226, 0.7)', animation: 'dust-shimmer 3s ease-in-out infinite' }},

  // Pulse/Wave (10)
  'effect-pulse-slow': { id: 'effect-pulse-slow', name: 'Langsames Pulsieren', type: 'effect', category: 'profile-effects', price: 2500, vipFree: true, description: 'Sanftes langsames Pulsieren', css: { animation: 'pulse-slow 4s ease-in-out infinite' }},
  'effect-pulse-fast': { id: 'effect-pulse-fast', name: 'Schnelles Pulsieren', type: 'effect', category: 'profile-effects', price: 3000, vipFree: true, description: 'Energisches schnelles Pulsieren', css: { animation: 'pulse-fast 1s ease-in-out infinite' }},
  'effect-wave': { id: 'effect-wave', name: 'Welleneffekt', type: 'effect', category: 'profile-effects', price: 4500, vipFree: true, description: 'Fließende Wellen', css: { animation: 'wave-flow 3s ease-in-out infinite' }},
  'effect-ripple': { id: 'effect-ripple', name: 'Wellen-Ringe', type: 'effect', category: 'profile-effects', price: 5000, vipFree: true, description: 'Ausbreitende Wellen-Ringe', css: { animation: 'ripple-spread 2s ease-out infinite' }},
  'effect-heartbeat': { id: 'effect-heartbeat', name: 'Herzschlag', type: 'effect', category: 'profile-effects', price: 3500, vipFree: true, description: 'Pulsierender Herzschlag', css: { animation: 'heartbeat 1.5s ease-in-out infinite' }},
  'effect-breathe': { id: 'effect-breathe', name: 'Atmen', type: 'effect', category: 'profile-effects', price: 3000, vipFree: true, description: 'Sanftes Ein- und Ausatmen', css: { animation: 'breathe 4s ease-in-out infinite' }},
  'effect-bounce': { id: 'effect-bounce', name: 'Hüpfen', type: 'effect', category: 'profile-effects', price: 4000, vipFree: true, description: 'Fröhliches Hüpfen', css: { animation: 'bounce 2s ease infinite' }},
  'effect-shake': { id: 'effect-shake', name: 'Zittern', type: 'effect', category: 'profile-effects', price: 3500, vipFree: true, description: 'Leichtes Zittern', css: { animation: 'shake 0.5s ease infinite' }},
  'effect-float': { id: 'effect-float', name: 'Schweben', type: 'effect', category: 'profile-effects', price: 4500, vipFree: true, description: 'Sanftes Auf und Ab', css: { animation: 'float 3s ease-in-out infinite' }},
  'effect-rotate-slow': { id: 'effect-rotate-slow', name: 'Langsame Drehung', type: 'effect', category: 'profile-effects', price: 5000, vipFree: true, description: 'Gemütliche Rotation', css: { animation: 'rotate-slow 10s linear infinite' }},

  // Special/Advanced (10)
  'effect-glitch': { id: 'effect-glitch', name: 'Glitch', type: 'effect', category: 'profile-effects', price: 8000, vipFree: true, description: 'Digitaler Glitch Effekt', css: { animation: 'glitch-effect 2s steps(10) infinite' }},
  'effect-3d': { id: 'effect-3d', name: '3D Tiefe', type: 'effect', category: 'profile-effects', price: 7500, vipFree: true, description: 'Dreidimensionaler Effekt', css: { transform: 'perspective(1000px)', boxShadow: '10px 10px 20px rgba(0, 0, 0, 0.5)', animation: '3d-rotate 5s ease-in-out infinite' }},
  'effect-mirror': { id: 'effect-mirror', name: 'Spiegelung', type: 'effect', category: 'profile-effects', price: 6000, vipFree: true, description: 'Spiegeleffekt', css: { boxShadow: '0 10px 20px rgba(0, 0, 0, 0.3)', filter: 'brightness(1.1)' }},
  'effect-neon-outline': { id: 'effect-neon-outline', name: 'Neon Umriss', type: 'effect', category: 'profile-effects', price: 7000, vipFree: true, description: 'Leuchtender Neon Umriss', css: { filter: 'drop-shadow(0 0 15px cyan) drop-shadow(0 0 30px cyan)', animation: 'neon-outline-pulse 2s ease-in-out infinite' }},
  'effect-holographic': { id: 'effect-holographic', name: 'Holografisch', type: 'effect', category: 'profile-effects', price: 10000, vipFree: true, description: 'Holografischer Schimmer', css: { backgroundImage: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.3), transparent)', animation: 'holographic-scan 3s linear infinite' }},
  'effect-fire': { id: 'effect-fire', name: 'Feuer', type: 'effect', category: 'profile-effects', price: 9000, vipFree: true, description: 'Lodernde Flammen', css: { boxShadow: '0 0 40px rgba(255, 100, 0, 0.8), 0 0 80px rgba(255, 0, 0, 0.5)', animation: 'fire-flicker 0.5s ease-in-out infinite' }},
  'effect-ice': { id: 'effect-ice', name: 'Eis', type: 'effect', category: 'profile-effects', price: 9000, vipFree: true, description: 'Gefrorenes Eis', css: { boxShadow: '0 0 30px rgba(173, 216, 230, 0.8), inset 0 0 20px rgba(255, 255, 255, 0.3)', filter: 'brightness(1.2)' }},
  'effect-lightning': { id: 'effect-lightning', name: 'Blitze', type: 'effect', category: 'profile-effects', price: 11000, vipFree: true, description: 'Elektrische Blitze', css: { boxShadow: '0 0 50px rgba(255, 255, 0, 1)', animation: 'lightning-strike 1s steps(5) infinite' }},
  'effect-smoke': { id: 'effect-smoke', name: 'Rauch', type: 'effect', category: 'profile-effects', price: 8500, vipFree: true, description: 'Wirbelnder Rauch', css: { filter: 'blur(2px) opacity(0.8)', animation: 'smoke-rise 4s ease-in-out infinite' }},
  'effect-crystal': { id: 'effect-crystal', name: 'Kristall', type: 'effect', category: 'profile-effects', price: 10500, vipFree: true, description: 'Funkelnder Kristall', css: { boxShadow: '0 0 40px rgba(255, 255, 255, 0.9), inset 0 0 30px rgba(138, 43, 226, 0.5)', filter: 'brightness(1.3)', animation: 'crystal-shine 2s ease-in-out infinite' }},

  // Magic/Fantasy (10)
  'effect-magic-circle': { id: 'effect-magic-circle', name: 'Magischer Kreis', type: 'effect', category: 'profile-effects', price: 12000, vipFree: true, description: 'Rotierender magischer Kreis', css: { boxShadow: '0 0 0 3px rgba(138, 43, 226, 0.5), 0 0 0 6px rgba(138, 43, 226, 0.3)', animation: 'magic-circle-rotate 5s linear infinite' }},
  'effect-energy-shield': { id: 'effect-energy-shield', name: 'Energie-Schild', type: 'effect', category: 'profile-effects', price: 11000, vipFree: true, description: 'Schützender Energie-Schild', css: { boxShadow: '0 0 50px rgba(0, 255, 255, 0.6), inset 0 0 30px rgba(0, 255, 255, 0.2)', animation: 'shield-pulse 2s ease-in-out infinite' }},
  'effect-portal': { id: 'effect-portal', name: 'Portal', type: 'effect', category: 'profile-effects', price: 13000, vipFree: true, description: 'Dimensionsportal', css: { boxShadow: '0 0 60px rgba(138, 43, 226, 1), inset 0 0 40px rgba(75, 0, 130, 0.8)', animation: 'portal-spin 3s linear infinite' }},
  'effect-aura-holy': { id: 'effect-aura-holy', name: 'Heilige Aura', type: 'effect', category: 'profile-effects', price: 10000, vipFree: true, description: 'Göttliche heilige Aura', css: { boxShadow: '0 0 50px rgba(255, 255, 255, 0.9), 0 0 100px rgba(255, 215, 0, 0.5)', animation: 'holy-aura 3s ease-in-out infinite' }},
  'effect-aura-dark': { id: 'effect-aura-dark', name: 'Dunkle Aura', type: 'effect', category: 'profile-effects', price: 10000, vipFree: true, description: 'Mysteriöse dunkle Aura', css: { boxShadow: '0 0 50px rgba(75, 0, 130, 0.9), 0 0 100px rgba(0, 0, 0, 0.8)', animation: 'dark-aura 3s ease-in-out infinite' }},
  'effect-wings': { id: 'effect-wings', name: 'Engelsflügel', type: 'effect', category: 'profile-effects', price: 15000, vipFree: true, description: 'Schimmernde Engelsflügel', css: { boxShadow: '0 0 40px rgba(255, 255, 255, 0.8)', filter: 'brightness(1.2)', animation: 'wing-flap 2s ease-in-out infinite' }},
  'effect-demon-horns': { id: 'effect-demon-horns', name: 'Dämonenhörner', type: 'effect', category: 'profile-effects', price: 15000, vipFree: true, description: 'Lodernde Dämonenhörner', css: { boxShadow: '0 0 40px rgba(220, 20, 60, 0.9)', animation: 'demon-glow 2s ease-in-out infinite' }},
  'effect-crown': { id: 'effect-crown', name: 'Königskrone', type: 'effect', category: 'profile-effects', price: 20000, vipFree: true, description: 'Strahlende Königskrone', css: { boxShadow: '0 0 60px rgba(255, 215, 0, 1)', filter: 'brightness(1.3)', animation: 'crown-shine 3s ease-in-out infinite' }},
  'effect-halo': { id: 'effect-halo', name: 'Heiligenschein', type: 'effect', category: 'profile-effects', price: 12000, vipFree: true, description: 'Leuchtender Heiligenschein', css: { boxShadow: '0 -30px 40px rgba(255, 255, 255, 0.8)', animation: 'halo-glow 2s ease-in-out infinite' }},
  'effect-celestial': { id: 'effect-celestial', name: 'Himmlisch', type: 'effect', category: 'profile-effects', price: 18000, vipFree: true, description: 'Himmlisches Leuchten', css: { boxShadow: '0 0 80px rgba(255, 255, 255, 1), 0 0 120px rgba(173, 216, 230, 0.7)', animation: 'celestial-radiance 4s ease-in-out infinite' }}
};

// CSS Animations
export const SHOP_ANIMATIONS = `
@keyframes neon-pulse {
  0%, 100% { filter: brightness(1); }
  50% { filter: brightness(1.4); }
}

@keyframes rainbow-rotate {
  0% { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
}

@keyframes gradient-shift {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes glow-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(255, 255, 255, 0.4); }
  50% { box-shadow: 0 0 45px rgba(255, 255, 255, 0.9); }
}

@keyframes glitch {
  0%, 100% { transform: translate(0); }
  20% { transform: translate(-2px, 2px); }
  40% { transform: translate(-2px, -2px); }
  60% { transform: translate(2px, 2px); }
  80% { transform: translate(2px, -2px); }
}

@keyframes matrix-pulse {
  0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 0, 0.6); }
  50% { box-shadow: 0 0 40px rgba(0, 255, 0, 1); }
}

@keyframes hologram {
  0%, 100% { opacity: 1; filter: brightness(1); }
  50% { opacity: 0.8; filter: brightness(1.2); }
}

@keyframes disco-shine {
  0%, 100% { filter: hue-rotate(0deg) brightness(1); }
  25% { filter: hue-rotate(90deg) brightness(1.2); }
  50% { filter: hue-rotate(180deg) brightness(1); }
  75% { filter: hue-rotate(270deg) brightness(1.2); }
}

@keyframes aurora-wave {
  0%, 100% { background-position: 0% 50%; }
  50% { background-position: 100% 50%; }
}

@keyframes plasma-spin {
  0% { filter: hue-rotate(0deg); }
  100% { filter: hue-rotate(360deg); }
}

@keyframes electric-spark {
  0%, 100% { box-shadow: 0 0 20px rgba(0, 212, 255, 0.8); }
  50% { box-shadow: 0 0 60px rgba(0, 212, 255, 1); }
}

@keyframes cosmic-glow {
  0%, 100% { box-shadow: 0 0 30px rgba(75, 0, 130, 0.7); }
  50% { box-shadow: 0 0 70px rgba(138, 43, 226, 1); }
}

@keyframes dragon-breath {
  0%, 100% { box-shadow: 0 0 40px rgba(220, 20, 60, 0.8); }
  50% { box-shadow: 0 0 80px rgba(255, 140, 0, 1); }
}

@keyframes rainbow-neon {
  0% { filter: hue-rotate(0deg); box-shadow: 0 0 30px rgba(255, 0, 0, 0.9); }
  100% { filter: hue-rotate(360deg); box-shadow: 0 0 30px rgba(255, 0, 0, 0.9); }
}

@keyframes rainbow-glow {
  0% { box-shadow: 0 0 40px rgba(255, 0, 0, 0.7); }
  17% { box-shadow: 0 0 40px rgba(255, 127, 0, 0.7); }
  33% { box-shadow: 0 0 40px rgba(255, 255, 0, 0.7); }
  50% { box-shadow: 0 0 40px rgba(0, 255, 0, 0.7); }
  67% { box-shadow: 0 0 40px rgba(0, 0, 255, 0.7); }
  83% { box-shadow: 0 0 40px rgba(75, 0, 130, 0.7); }
  100% { box-shadow: 0 0 40px rgba(148, 0, 211, 0.7); }
}

@keyframes sparkle-twinkle {
  0%, 100% { filter: drop-shadow(0 0 5px white) brightness(1); }
  50% { filter: drop-shadow(0 0 20px white) brightness(1.5); }
}

@keyframes pulse-slow {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.05); }
}

@keyframes pulse-fast {
  0%, 100% { transform: scale(1); }
  50% { transform: scale(1.1); }
}

@keyframes float {
  0%, 100% { transform: translateY(0px); }
  50% { transform: translateY(-10px); }
}

@keyframes bounce {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-15px); }
}

@keyframes rotate-slow {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes magic-circle-rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes portal-spin {
  from { transform: rotate(0deg); filter: hue-rotate(0deg); }
  to { transform: rotate(360deg); filter: hue-rotate(360deg); }
}

@keyframes celestial-radiance {
  0%, 100% { box-shadow: 0 0 60px rgba(255, 255, 255, 0.8); }
  50% { box-shadow: 0 0 120px rgba(173, 216, 230, 1); }
}
`;
