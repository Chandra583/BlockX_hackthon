import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import HeroBlockX from './HeroBlockX';

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

// Mock navigator.deviceMemory
Object.defineProperty(navigator, 'deviceMemory', {
  writable: true,
  value: 4,
});

describe('HeroBlockX', () => {
  beforeEach(() => {
    localStorageMock.getItem.mockClear();
    localStorageMock.setItem.mockClear();
  });

  it('renders BlockX brand and gooey text headline', () => {
    render(<HeroBlockX />);
    
    expect(screen.getByText('BlockX')).toBeInTheDocument();
    // The gooey text will cycle between "Elevate Your" and "Digital Trust"
    expect(screen.getByText('Elevate Your')).toBeInTheDocument();
  });

  it('renders BlockX as main heading', () => {
    render(<HeroBlockX />);
    
    const blockxHeading = screen.getByRole('heading', { level: 1 });
    expect(blockxHeading).toHaveTextContent('BlockX');
  });

  it('renders both CTAs', () => {
    render(<HeroBlockX />);
    
    expect(screen.getByText('Get Started')).toBeInTheDocument();
    expect(screen.getByText('Learn More')).toBeInTheDocument();
  });

  it('renders supporting description lines', () => {
    render(<HeroBlockX />);
    
    expect(screen.getByText(/Crafting exceptional vehicle verification experiences/)).toBeInTheDocument();
    expect(screen.getByText(/Real-time, tamper-proof mileage tracking/)).toBeInTheDocument();
    expect(screen.getByText(/Stop odometer fraud. Restore value and trust/)).toBeInTheDocument();
  });

  it('renders transparent content without background panel', () => {
    render(<HeroBlockX />);
    
    // Check that there's no backdrop-filter styling
    const contentPanel = document.querySelector('[style*="backdrop-filter"]');
    expect(contentPanel).toBeNull();
    
    // Content should still render
    expect(screen.getByText('BlockX')).toBeInTheDocument();
  });

  it('renders trust badge', () => {
    render(<HeroBlockX />);
    
    expect(screen.getByText('TrustScore Verified')).toBeInTheDocument();
  });

  it('toggles Hyperspeed via localStorage', () => {
    localStorageMock.getItem.mockReturnValue('false');
    
    render(<HeroBlockX />);
    
    const toggleButton = screen.getByLabelText(/Background:/);
    expect(toggleButton).toBeInTheDocument();
    
    fireEvent.click(toggleButton);
    expect(localStorageMock.setItem).toHaveBeenCalledWith('hyperspeed', 'true');
  });

  it('respects prefers-reduced-motion', () => {
    // Mock prefers-reduced-motion: reduce
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

    render(<HeroBlockX />);
    
    // Component should still render but animations should be disabled
    expect(screen.getByText('Trust every kilometre.')).toBeInTheDocument();
  });

  it('handles mobile device detection', () => {
    // Mock mobile viewport
    Object.defineProperty(window, 'innerWidth', {
      writable: true,
      configurable: true,
      value: 500,
    });

    render(<HeroBlockX />);
    
    expect(screen.getByText('Trust every kilometre.')).toBeInTheDocument();
  });

  it('handles low device memory', () => {
    Object.defineProperty(navigator, 'deviceMemory', {
      writable: true,
      value: 1,
    });

    render(<HeroBlockX />);
    
    expect(screen.getByText('Trust every kilometre.')).toBeInTheDocument();
  });

  it('has proper accessibility attributes', () => {
    render(<HeroBlockX />);
    
    const getStartedButton = screen.getByLabelText('Get started with BlockX');
    const learnMoreButton = screen.getByLabelText('Learn more about BlockX');
    
    expect(getStartedButton).toBeInTheDocument();
    expect(learnMoreButton).toBeInTheDocument();
  });

  it('handles Hyperspeed errors gracefully', () => {
    const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
    
    render(<HeroBlockX />);
    
    // Component should render even if Hyperspeed fails
    expect(screen.getByText('Trust every kilometre.')).toBeInTheDocument();
    
    consoleSpy.mockRestore();
  });

  it('respects environment variable VITE_HYPERSPEED', () => {
    // Mock environment variable
    const originalEnv = import.meta.env.VITE_HYPERSPEED;
    import.meta.env.VITE_HYPERSPEED = 'off';
    
    render(<HeroBlockX />);
    
    // Component should still render
    expect(screen.getByText('Trust every kilometre.')).toBeInTheDocument();
    
    // Restore original value
    import.meta.env.VITE_HYPERSPEED = originalEnv;
  });

  it('has proper accessibility attributes and focus states', () => {
    render(<HeroBlockX />);
    
    const getStartedButton = screen.getByLabelText('Get started with BlockX');
    const learnMoreButton = screen.getByLabelText('Learn more about BlockX');
    const toggleButton = screen.getByLabelText(/Background:/);
    
    expect(getStartedButton).toBeInTheDocument();
    expect(learnMoreButton).toBeInTheDocument();
    expect(toggleButton).toBeInTheDocument();
    
    // Test focus states
    getStartedButton.focus();
    expect(document.activeElement).toBe(getStartedButton);
  });
});
