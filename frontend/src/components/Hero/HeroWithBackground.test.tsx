import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import HeroWithBackground from './HeroWithBackground';

// Mock Hyperspeed component
jest.mock('./Hyperspeed', () => {
  return function MockHyperspeed() {
    return <div data-testid="hyperspeed-animation">Hyperspeed Animation</div>;
  };
});

// Mock framer-motion
jest.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...props }: any) => <div {...props}>{children}</div>,
    button: ({ children, ...props }: any) => <button {...props}>{children}</button>,
  },
}));

// Mock localStorage
const localStorageMock = {
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
  clear: jest.fn(),
};
Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
});

// Mock matchMedia
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: jest.fn().mockImplementation(query => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: jest.fn(),
    removeListener: jest.fn(),
    addEventListener: jest.fn(),
    removeEventListener: jest.fn(),
    dispatchEvent: jest.fn(),
  })),
});

describe('HeroWithBackground', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
    
    // Mock window.innerWidth for mobile detection
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 1024,
    });
  });

  it('renders children content', () => {
    render(
      <HeroWithBackground>
        <h1>Test Hero Content</h1>
      </HeroWithBackground>
    );

    expect(screen.getByText('Test Hero Content')).toBeInTheDocument();
  });

  it('renders toggle button', () => {
    render(
      <HeroWithBackground>
        <h1>Test Content</h1>
      </HeroWithBackground>
    );

    const toggleButton = screen.getByRole('button', { name: /background/i });
    expect(toggleButton).toBeInTheDocument();
  });

  it('toggles animation when button is clicked', async () => {
    render(
      <HeroWithBackground>
        <h1>Test Content</h1>
      </HeroWithBackground>
    );

    const toggleButton = screen.getByRole('button', { name: /background/i });
    
    // Initially should show Eye icon (animation enabled)
    expect(screen.getByTestId('hyperspeed-animation')).toBeInTheDocument();
    
    // Click to disable
    fireEvent.click(toggleButton);
    
    await waitFor(() => {
      expect(localStorageMock.setItem).toHaveBeenCalledWith('hyperspeed', 'false');
    });
  });

  it('respects localStorage setting on mount', () => {
    localStorageMock.getItem.mockReturnValue('false');
    
    render(
      <HeroWithBackground>
        <h1>Test Content</h1>
      </HeroWithBackground>
    );

    // Should not render Hyperspeed when disabled in localStorage
    expect(screen.queryByTestId('hyperspeed-animation')).not.toBeInTheDocument();
  });

  it('shows fallback background when animation is disabled', () => {
    localStorageMock.getItem.mockReturnValue('false');
    
    render(
      <HeroWithBackground>
        <h1>Test Content</h1>
      </HeroWithBackground>
    );

    // Should show fallback gradient background
    const fallbackBg = document.querySelector('.bg-gradient-to-br');
    expect(fallbackBg).toBeInTheDocument();
  });

  it('handles reduced motion preference', () => {
    // Mock prefers-reduced-motion
    window.matchMedia = jest.fn().mockImplementation(query => ({
      matches: query === '(prefers-reduced-motion: reduce)',
      media: query,
      onchange: null,
      addListener: jest.fn(),
      removeListener: jest.fn(),
      addEventListener: jest.fn(),
      removeEventListener: jest.fn(),
      dispatchEvent: jest.fn(),
    }));

    render(
      <HeroWithBackground>
        <h1>Test Content</h1>
      </HeroWithBackground>
    );

    // Should not render Hyperspeed when reduced motion is preferred
    expect(screen.queryByTestId('hyperspeed-animation')).not.toBeInTheDocument();
  });

  it('handles mobile screen size', () => {
    // Mock mobile screen size
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 600,
    });

    render(
      <HeroWithBackground>
        <h1>Test Content</h1>
      </HeroWithBackground>
    );

    // Should not render Hyperspeed on mobile
    expect(screen.queryByTestId('hyperspeed-animation')).not.toBeInTheDocument();
  });

  it('applies custom className', () => {
    const { container } = render(
      <HeroWithBackground className="custom-class">
        <h1>Test Content</h1>
      </HeroWithBackground>
    );

    expect(container.firstChild).toHaveClass('custom-class');
  });
});
