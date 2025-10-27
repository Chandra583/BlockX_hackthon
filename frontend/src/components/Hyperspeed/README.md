# Hyperspeed Background Component

A stunning 3D animated background component using Three.js and postprocessing effects, perfect for modern web applications.

## Features

- **Multiple Distortion Effects**: Choose from 6 different preset animations
- **Interactive**: Speed up animation on mouse/touch interaction
- **Performance Optimized**: Uses WebGL and postprocessing effects
- **Customizable**: Extensive configuration options for colors, speeds, and effects
- **Responsive**: Automatically adapts to container size

## Usage

```tsx
import Hyperspeed, { hyperspeedPresets } from './components/Hyperspeed';

// Basic usage with preset
<Hyperspeed effectOptions={hyperspeedPresets.one} />

// Custom configuration
<Hyperspeed
  effectOptions={{
    distortion: 'turbulentDistortion',
    length: 400,
    roadWidth: 10,
    colors: {
      roadColor: 0x080808,
      background: 0x000000,
      leftCars: [0xd856bf, 0x6750a2],
      rightCars: [0x03b3c3, 0x0e5ea5],
      sticks: 0x03b3c3
    }
  }}
/>
```

## Available Presets

- `hyperspeedPresets.one` - Turbulent distortion with blue/purple theme
- `hyperspeedPresets.two` - Mountain distortion with red/white theme  
- `hyperspeedPresets.three` - XY distortion with fast movement
- `hyperspeedPresets.four` - Long race distortion with wide road
- `hyperspeedPresets.five` - Turbulent distortion with orange/blue theme
- `hyperspeedPresets.six` - Deep distortion with wide road

## Configuration Options

### Basic Settings
- `distortion`: Type of distortion effect
- `length`: Road length (default: 400)
- `roadWidth`: Width of the road (default: 10)
- `lanesPerRoad`: Number of lanes (default: 4)
- `fov`: Camera field of view (default: 90)

### Animation Settings
- `speedUp`: Speed multiplier on interaction (default: 2)
- `fovSpeedUp`: FOV change on speed up (default: 150)
- `carLightsFade`: Fade effect for car lights (default: 0.4)

### Visual Settings
- `colors`: Object containing all color settings
  - `roadColor`: Road surface color
  - `islandColor`: Median strip color
  - `background`: Background color
  - `leftCars`: Array of colors for left lane cars
  - `rightCars`: Array of colors for right lane cars
  - `sticks`: Color for roadside light sticks

### Callbacks
- `onSpeedUp`: Called when user interacts (mouse down/touch start)
- `onSlowDown`: Called when user stops interacting (mouse up/touch end)

## CSS Requirements

The component requires the following CSS to work properly:

```css
#lights {
  width: 100%;
  height: 100%;
  overflow: hidden;
  position: absolute;
  top: 0;
  left: 0;
  z-index: -1;
}

canvas {
  width: 100%;
  height: 100%;
}
```

## Performance Notes

- The component uses WebGL for optimal performance
- Postprocessing effects include bloom and SMAA anti-aliasing
- Automatically handles window resize events
- Properly disposes of resources on unmount

## Browser Support

- Modern browsers with WebGL support
- Mobile devices with touch support
- Requires Three.js and postprocessing libraries
