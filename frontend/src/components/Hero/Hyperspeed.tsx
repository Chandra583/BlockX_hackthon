import React, { useEffect, useRef } from 'react';

interface HyperspeedProps {
  effectOptions?: {
    onSpeedUp?: () => void;
    onSlowDown?: () => void;
    distortion?: string;
    length?: number;
    roadWidth?: number;
    islandWidth?: number;
    lanesPerRoad?: number;
    fov?: number;
    fovSpeedUp?: number;
    speedUp?: number;
    carLightsFade?: number;
    totalSideLightSticks?: number;
    lightPairsPerRoadWay?: number;
    shoulderLinesWidthPercentage?: number;
    brokenLinesWidthPercentage?: number;
    brokenLinesLengthPercentage?: number;
    lightStickWidth?: [number, number];
    lightStickHeight?: [number, number];
    movingAwaySpeed?: [number, number];
    movingCloserSpeed?: [number, number];
    carLightsLength?: [number, number];
    carLightsRadius?: [number, number];
    carWidthPercentage?: [number, number];
    carShiftX?: [number, number];
    carFloorSeparation?: [number, number];
    colors?: {
      roadColor?: number;
      islandColor?: number;
      background?: number;
      shoulderLines?: number;
      brokenLines?: number;
      leftCars?: number[];
      rightCars?: number[];
      sticks?: number;
    };
  };
  className?: string;
}

const Hyperspeed: React.FC<HyperspeedProps> = ({ 
  effectOptions = {},
  className = ''
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animationRef = useRef<number>();
  const timeRef = useRef<number>(0);

  const defaultOptions = {
    onSpeedUp: () => {},
    onSlowDown: () => {},
    distortion: 'turbulentDistortion',
    length: 400,
    roadWidth: 10,
    islandWidth: 2,
    lanesPerRoad: 4,
    fov: 90,
    fovSpeedUp: 150,
    speedUp: 2,
    carLightsFade: 0.4,
    totalSideLightSticks: 20,
    lightPairsPerRoadWay: 40,
    shoulderLinesWidthPercentage: 0.05,
    brokenLinesWidthPercentage: 0.1,
    brokenLinesLengthPercentage: 0.5,
    lightStickWidth: [0.12, 0.5],
    lightStickHeight: [1.3, 1.7],
    movingAwaySpeed: [60, 80],
    movingCloserSpeed: [-120, -160],
    carLightsLength: [400 * 0.03, 400 * 0.2],
    carLightsRadius: [0.05, 0.14],
    carWidthPercentage: [0.3, 0.5],
    carShiftX: [-0.8, 0.8],
    carFloorSeparation: [0, 5],
    colors: {
      roadColor: 0x080808,
      islandColor: 0x0a0a0a,
      background: 0x000000,
      shoulderLines: 0xFFFFFF,
      brokenLines: 0xFFFFFF,
      leftCars: [0xD856BF, 0x6750A2, 0xC247AC],
      rightCars: [0x03B3C3, 0x0E5EA5, 0x324555],
      sticks: 0x03B3C3,
    }
  };

  const options = { ...defaultOptions, ...effectOptions };

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Set canvas size
    const resizeCanvas = () => {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };

    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Helper functions
    const hexToRgb = (hex: number) => {
      const r = (hex >> 16) & 255;
      const g = (hex >> 8) & 255;
      const b = hex & 255;
      return { r, g, b };
    };

    const drawLine = (x1: number, y1: number, x2: number, y2: number, color: number, width: number = 1) => {
      ctx.strokeStyle = `rgb(${hexToRgb(color).r}, ${hexToRgb(color).g}, ${hexToRgb(color).b})`;
      ctx.lineWidth = width;
      ctx.beginPath();
      ctx.moveTo(x1, y1);
      ctx.lineTo(x2, y2);
      ctx.stroke();
    };

    const drawRect = (x: number, y: number, width: number, height: number, color: number) => {
      ctx.fillStyle = `rgb(${hexToRgb(color).r}, ${hexToRgb(color).g}, ${hexToRgb(color).b})`;
      ctx.fillRect(x, y, width, height);
    };

    // Animation loop
    const animate = () => {
      timeRef.current += 0.016; // ~60fps
      
      // Clear canvas
      drawRect(0, 0, canvas.width, canvas.height, options.colors!.background!);

      const centerX = canvas.width / 2;
      const centerY = canvas.height / 2;
      
      // Draw road perspective
      const roadLength = options.length!;
      const roadWidth = options.roadWidth!;
      const islandWidth = options.islandWidth!;
      
      // Calculate perspective points
      const perspective = (z: number) => {
        const scale = 1 / (z / roadLength + 1);
        return { scale, y: centerY - (z / roadLength) * centerY };
      };

      // Draw road segments
      for (let z = roadLength; z > 0; z -= 10) {
        const { scale, y } = perspective(z);
        
        if (y < centerY) continue;
        
        const roadWidthScaled = roadWidth * scale;
        const islandWidthScaled = islandWidth * scale;
        
        // Road
        drawRect(
          centerX - roadWidthScaled / 2,
          y,
          roadWidthScaled,
          10,
          options.colors!.roadColor!
        );
        
        // Island
        drawRect(
          centerX - islandWidthScaled / 2,
          y,
          islandWidthScaled,
          10,
          options.colors!.islandColor!
        );
        
        // Shoulder lines
        const shoulderWidth = roadWidthScaled * options.shoulderLinesWidthPercentage!;
        drawLine(
          centerX - roadWidthScaled / 2,
          y,
          centerX - roadWidthScaled / 2,
          y + 10,
          options.colors!.shoulderLines!,
          shoulderWidth
        );
        drawLine(
          centerX + roadWidthScaled / 2,
          y,
          centerX + roadWidthScaled / 2,
          y + 10,
          options.colors!.shoulderLines!,
          shoulderWidth
        );
        
        // Broken lines
        if (Math.floor(z / 20) % 2 === 0) {
          const brokenWidth = roadWidthScaled * options.brokenLinesWidthPercentage!;
          drawLine(
            centerX - brokenWidth / 2,
            y,
            centerX + brokenWidth / 2,
            y + 10,
            options.colors!.brokenLines!,
            2
          );
        }
      }

      // Draw light sticks
      for (let i = 0; i < options.totalSideLightSticks!; i++) {
        const z = (i * 20 + timeRef.current * 50) % roadLength;
        const { scale, y } = perspective(z);
        
        if (y < centerY) continue;
        
        const stickWidth = (options.lightStickWidth![1] - options.lightStickWidth![0]) * scale + options.lightStickWidth![0];
        const stickHeight = (options.lightStickHeight![1] - options.lightStickHeight![0]) * scale + options.lightStickHeight![0];
        
        // Left side
        drawRect(
          centerX - roadWidth * scale / 2 - stickWidth,
          y - stickHeight / 2,
          stickWidth,
          stickHeight,
          options.colors!.sticks!
        );
        
        // Right side
        drawRect(
          centerX + roadWidth * scale / 2,
          y - stickHeight / 2,
          stickWidth,
          stickHeight,
          options.colors!.sticks!
        );
      }

      // Draw cars
      for (let i = 0; i < 10; i++) {
        const z = (i * 40 + timeRef.current * 30) % roadLength;
        const { scale, y } = perspective(z);
        
        if (y < centerY) continue;
        
        const carWidth = roadWidth * scale * (options.carWidthPercentage![1] - options.carWidthPercentage![0]) + options.carWidthPercentage![0];
        const carHeight = carWidth * 0.6;
        
        // Random car color
        const carColors = Math.random() > 0.5 ? options.colors!.leftCars! : options.colors!.rightCars!;
        const carColor = carColors[Math.floor(Math.random() * carColors.length)];
        
        // Car position
        const shiftX = (options.carShiftX![1] - options.carShiftX![0]) * Math.random() + options.carShiftX![0];
        const carX = centerX + shiftX * roadWidth * scale;
        
        // Draw car
        drawRect(
          carX - carWidth / 2,
          y - carHeight / 2,
          carWidth,
          carHeight,
          carColor
        );
        
        // Car lights
        const lightRadius = carWidth * 0.1;
        ctx.fillStyle = `rgba(255, 255, 255, ${options.carLightsFade!})`;
        ctx.beginPath();
        ctx.arc(carX, y - carHeight / 2, lightRadius, 0, Math.PI * 2);
        ctx.fill();
      }

      animationRef.current = requestAnimationFrame(animate);
    };

    animate();

    return () => {
      window.removeEventListener('resize', resizeCanvas);
      if (animationRef.current) {
        cancelAnimationFrame(animationRef.current);
      }
    };
  }, [options]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 w-full h-full ${className}`}
      style={{ zIndex: 0 }}
      aria-hidden="true"
    />
  );
};

export default Hyperspeed;
