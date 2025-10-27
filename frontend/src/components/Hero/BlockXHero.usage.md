# BlockX Hero Component Usage

## Basic Usage

```tsx
import BlockXHero from './components/Hero/BlockXHero';

function App() {
  return (
    <div className="App">
      <BlockXHero />
    </div>
  );
}
```

## Integration with Hyperspeed Background

```tsx
import BlockXHero from './components/Hero/BlockXHero';
import Hyperspeed, { hyperspeedPresets } from './components/Hyperspeed';

function LandingPage() {
  return (
    <div className="relative min-h-screen">
      {/* Animated Background */}
      <Hyperspeed effectOptions={hyperspeedPresets.one} />
      
      {/* Hero Content */}
      <BlockXHero />
    </div>
  );
}
```

## Customization Options

### Color Themes
The component uses CSS custom properties that can be overridden:

```css
:root {
  --hero-text-primary: #EDEFF3;
  --hero-text-secondary: rgba(237,239,243,0.84);
  --hero-text-muted: rgba(237,239,243,0.6);
  --hero-gradient-start: #00D1FF;
  --hero-gradient-end: #7C4DFF;
}
```

### Animation Timing
Adjust animation delays by modifying the component:

```tsx
// In BlockXHero.tsx, modify the delay values:
transition={{ duration: 0.4, delay: 0.2 + (index * 0.1) }}
```

## Responsive Breakpoints

- **Mobile**: < 768px (full-width, single column)
- **Tablet**: 768px - 1024px (left-aligned, max-width)
- **Desktop**: > 1024px (left-of-center, 880px max-width)

## Browser Support

- **Modern Browsers**: Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile**: iOS 14+, Android 10+
- **Features**: CSS Grid, Flexbox, CSS Custom Properties, Framer Motion

## Performance Tips

1. **Lazy Load**: Load the component only when needed
2. **Preload Fonts**: Ensure Inter/Poppins fonts are preloaded
3. **Optimize Images**: Use WebP format for any background images
4. **Bundle Size**: The component adds ~15KB to your bundle

## Accessibility Features

- **WCAG AA Compliant**: 4.5:1 contrast ratio
- **Keyboard Navigation**: Full keyboard support
- **Screen Reader**: Semantic HTML and ARIA labels
- **Reduced Motion**: Respects user preferences
- **Focus Management**: Visible focus indicators

## Testing

### Manual Testing
1. Test keyboard navigation (Tab, Enter, Space)
2. Test with screen reader (NVDA, JAWS, VoiceOver)
3. Test at different zoom levels (100%, 200%, 400%)
4. Test on mobile devices (iOS, Android)

### Automated Testing
```bash
# Run accessibility tests
npx pa11y http://localhost:3000

# Run Lighthouse audit
npx lighthouse http://localhost:3000 --only-categories=accessibility
```

## Troubleshooting

### Common Issues

1. **Animations not working**: Ensure Framer Motion is properly installed
2. **Gradient not showing**: Check CSS custom properties support
3. **Mobile layout issues**: Verify viewport meta tag is present
4. **Focus not visible**: Check focus ring CSS is not overridden

### Debug Mode
Add `data-debug="true"` to enable debug information:

```tsx
<BlockXHero data-debug="true" />
```

## Next Steps

After implementing the hero component:

1. **Add Features Section**: Show how the platform works
2. **Add Testimonials**: Social proof and customer stories
3. **Add Pricing**: Clear value proposition
4. **Add FAQ**: Address common questions
5. **Add Footer**: Contact and legal information

## Support

For issues or questions:
- Check the accessibility checklist
- Review the demo HTML file
- Test with different screen readers
- Verify keyboard navigation works
