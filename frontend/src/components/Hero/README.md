# Hero Components

This directory contains components for creating animated hero sections with the Hyperspeed background effect.

## Components

### Hyperspeed
A canvas-based highway animation component that creates a "hyperspeed" effect with a 3D perspective road, moving cars, and light sticks.

**Props:**
- `effectOptions` - Configuration object for animation parameters
- `className` - Additional CSS classes

### HeroWithBackground
A wrapper component that provides the Hyperspeed animation as a full-bleed background with content overlay and controls.

**Features:**
- Automatic fallback for reduced motion preferences
- Device memory detection (disables on < 2GB)
- Mobile device detection
- User toggle control with localStorage persistence
- Error handling with graceful fallback
- Accessible controls and ARIA labels

## Configuration

### hyperspeedConfig.js
Central configuration file for animation parameters:

```javascript
{
  length: 400,                    // Road length
  roadWidth: 10,                  // Road width
  islandWidth: 2,                 // Center island width
  lanesPerRoad: 4,                // Number of lanes
  fov: 90,                        // Field of view
  speedUp: 2,                     // Speed multiplier
  carLightsFade: 0.4,             // Car light opacity
  totalSideLightSticks: 20,       // Number of light sticks
  colors: {
    roadColor: 0x080808,          // Road color
    islandColor: 0x0a0a0a,        // Island color
    background: 0x000000,          // Background color
    shoulderLines: 0xFFFFFF,       // Line color
    brokenLines: 0xFFFFFF,         // Broken line color
    leftCars: [0xD856BF, 0x6750A2, 0xC247AC],  // Left lane car colors
    rightCars: [0x03B3C3, 0x0E5EA5, 0x324555], // Right lane car colors
    sticks: 0x03B3C3,             // Light stick color
  }
}
```

### Environment Variables
- `VITE_HYPERSPEED_DISABLED=true` - Disables animation globally

## Usage

```tsx
import HeroWithBackground from './components/Hero/HeroWithBackground';

<HeroWithBackground>
  <h1>Your Hero Content</h1>
  <p>Subtitle text</p>
</HeroWithBackground>
```

## Customization

### Tuning Colors and Motion Parameters

Designers can customize the animation by modifying `hyperspeedConfig.js`:

1. **Colors**: Update the `colors` object with your brand palette
2. **Speed**: Adjust `speedUp` for faster/slower motion (1-5 recommended)
3. **Road Length**: Modify `length` for depth (200-800 recommended)
4. **Car Density**: Change `totalSideLightSticks` for more/fewer cars
5. **Visual Effects**: Adjust `carLightsFade` for light intensity (0.1-1.0)

### CSS Classes
- `.hero-bg` - Applied to background container
- Backdrop blur and overlay classes for content readability

## Accessibility

- Respects `prefers-reduced-motion` media query
- Provides toggle control for user preference
- Uses `aria-hidden` appropriately
- Includes focus management for controls

## Performance

- Automatically disables on low-memory devices
- Disables on mobile screens
- Uses `requestAnimationFrame` for smooth animation
- Graceful error handling with fallback
