# BLOCKX Landing Page Component

A pixel-perfect recreation of the BLOCKX landing page design with modern web3 aesthetics and dynamic background effects.

## Features

- **Exact Design Match**: Pixel-perfect recreation of the original BLOCKX design
- **Hyperspeed Background**: Integrated 3D animated road background with car lights
- **Dynamic Overlay**: Glowing wavy lines and floating orbs with animations
- **Gradient Logo**: "BLOCK" in cyan-blue gradient, "X" in purple-pink gradient with diamond cutout
- **Responsive Design**: Optimized for desktop and mobile devices
- **Smooth Animations**: Framer Motion powered entrance animations
- **Interactive CTAs**: Hover effects and micro-interactions

## Design Elements

### Logo
- **BLOCK**: Cyan to blue gradient (`#00D1FF` to `#3B82F6`)
- **X**: Purple to pink gradient (`#7C4DFF` to `#FF6B9D`)
- **Diamond Cutout**: Black diamond shape in the center of "X"
- **Typography**: Extra bold, large scale (8xl-9xl)

### Background
- **Hyperspeed 3D**: Animated road with moving car lights and distortion effects
- **Clean Black Base**: Solid black background for maximum contrast
- **Minimal Overlay**: Light gradient overlay for text readability only

### Content
- **Tagline**: "Digital Trust" in light gray
- **Description**: Three lines of white text describing the service
- **CTAs**: "Get Started" (gradient) and "Learn More" (outlined)
- **Trust Badge**: "TrustScore Verified" with pulsing dot

## Usage

```tsx
import BlockXLanding from './components/Landing';

function App() {
  return (
    <div className="min-h-screen">
      <BlockXLanding />
    </div>
  );
}
```

## Integration with Hyperspeed

```tsx
import BlockXLanding from './components/Landing';
import Hyperspeed, { hyperspeedPresets } from './components/Hyperspeed';

function LandingPage() {
  return (
    <div className="relative min-h-screen">
      <Hyperspeed effectOptions={hyperspeedPresets.one} />
      <BlockXLanding />
    </div>
  );
}
```

## Customization

### Colors
The component uses Tailwind CSS classes that can be easily customized:

```css
/* Logo gradients */
.gradient-text {
  background: linear-gradient(135deg, #00D1FF, #3B82F6);
}

.gradient-text-purple {
  background: linear-gradient(135deg, #7C4DFF, #FF6B9D);
}
```

### Animations
Modify animation timing in the component:

```tsx
// Entrance animations
initial={{ opacity: 0, y: 20 }}
animate={{ opacity: 1, y: 0 }}
transition={{ duration: 0.8, delay: 0.2 }}
```

### Background Effects
Adjust the background graphics:

```tsx
// Floating orbs
<div className="absolute top-1/4 left-1/4 w-20 h-20 bg-blue-400 rounded-full blur-lg opacity-20 animate-pulse"></div>
```

## Responsive Behavior

- **Desktop**: Full-size logo, side-by-side CTAs, full background effects
- **Mobile**: Smaller logo, stacked CTAs, optimized spacing
- **Tablet**: Medium sizing with responsive text scaling

## Performance

- **SVG Graphics**: Scalable vector graphics for crisp display
- **CSS Animations**: Hardware-accelerated transforms
- **Optimized Gradients**: Efficient CSS gradients
- **Lazy Loading**: Animations load after critical content

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS 14+, Android 10+
- **Features**: CSS Grid, Flexbox, CSS Custom Properties, SVG

## Accessibility

- **Semantic HTML**: Proper heading hierarchy and structure
- **Keyboard Navigation**: Full keyboard support for CTAs
- **Screen Reader**: Descriptive text and proper labeling
- **Color Contrast**: WCAG AA compliant contrast ratios
- **Reduced Motion**: Respects user motion preferences

## File Structure

```
components/Landing/
├── BlockXLanding.tsx          # Main component
├── BlockXLanding.demo.html    # Static demo
├── index.ts                   # Export file
└── README.md                  # This file
```

## Testing

### Visual Testing
1. Compare with original design
2. Test on different screen sizes
3. Verify gradient rendering
4. Check animation performance

### Accessibility Testing
1. Keyboard navigation
2. Screen reader compatibility
3. Color contrast validation
4. Motion sensitivity

### Performance Testing
1. Page load speed
2. Animation smoothness
3. Memory usage
4. Battery impact on mobile

## Troubleshooting

### Common Issues

1. **Gradients not showing**: Check browser support for CSS gradients
2. **Animations stuttering**: Verify hardware acceleration is enabled
3. **SVG not rendering**: Check SVG support and viewBox attributes
4. **Mobile layout issues**: Verify viewport meta tag is present

### Debug Mode
Add debug classes to visualize layout:

```tsx
<div className="border border-red-500"> {/* Debug border */}
  <BlockXLanding />
</div>
```

## Next Steps

After implementing the landing page:

1. **Add Navigation**: Header with menu items
2. **Add Sections**: Features, testimonials, pricing
3. **Add Footer**: Contact information and links
4. **Add Analytics**: Track user interactions
5. **Add SEO**: Meta tags and structured data

## Support

For issues or questions:
- Check the demo HTML file
- Review Tailwind CSS documentation
- Test with different browsers
- Verify responsive behavior
