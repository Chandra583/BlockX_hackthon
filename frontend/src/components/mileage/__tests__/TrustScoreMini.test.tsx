import React from 'react';
import { render, screen } from '@testing-library/react';
import '@testing-library/jest-dom';
import TrustScoreMini from '../TrustScoreMini';

describe('TrustScoreMini', () => {
  it('renders excellent trust score correctly', () => {
    render(<TrustScoreMini trustScore={85} />);
    
    expect(screen.getByText('TrustScore: 85')).toBeInTheDocument();
    expect(screen.getByText('(Excellent)')).toBeInTheDocument();
  });

  it('renders good trust score correctly', () => {
    render(<TrustScoreMini trustScore={70} />);
    
    expect(screen.getByText('TrustScore: 70')).toBeInTheDocument();
    expect(screen.getByText('(Good)')).toBeInTheDocument();
  });

  it('renders fair trust score correctly', () => {
    render(<TrustScoreMini trustScore={50} />);
    
    expect(screen.getByText('TrustScore: 50')).toBeInTheDocument();
    expect(screen.getByText('(Fair)')).toBeInTheDocument();
  });

  it('renders poor trust score correctly', () => {
    render(<TrustScoreMini trustScore={30} />);
    
    expect(screen.getByText('TrustScore: 30')).toBeInTheDocument();
    expect(screen.getByText('(Poor)')).toBeInTheDocument();
  });

  it('applies correct styling for different scores', () => {
    const { rerender } = render(<TrustScoreMini trustScore={85} />);
    
    // Excellent score should have green styling
    const excellentElement = screen.getByText('TrustScore: 85').closest('div');
    expect(excellentElement).toHaveClass('text-green-600', 'bg-green-100', 'border-green-200');
    
    // Poor score should have red styling
    rerender(<TrustScoreMini trustScore={30} />);
    const poorElement = screen.getByText('TrustScore: 30').closest('div');
    expect(poorElement).toHaveClass('text-red-600', 'bg-red-100', 'border-red-200');
  });

  it('applies custom className', () => {
    render(<TrustScoreMini trustScore={85} className="custom-class" />);
    
    const element = screen.getByText('TrustScore: 85').closest('div');
    expect(element).toHaveClass('custom-class');
  });

  it('shows correct icons for different scores', () => {
    const { rerender } = render(<TrustScoreMini trustScore={85} />);
    
    // Excellent score should show Shield icon
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    
    // Good score should show TrendingUp icon
    rerender(<TrustScoreMini trustScore={70} />);
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
    
    // Poor score should show AlertTriangle icon
    rerender(<TrustScoreMini trustScore={30} />);
    expect(screen.getByRole('img', { hidden: true })).toBeInTheDocument();
  });
});
