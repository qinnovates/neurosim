/**
 * Canvas-based multi-channel EEG waveform renderer.
 * Renders from ring buffers via requestAnimationFrame — no React state per sample.
 */
import { useRef, useEffect } from "react";
import type { RingBuffer } from "../../lib/ringBuffer";
import { CHANNEL_COLORS, SIEM } from "../../lib/theme";

interface EEGCanvasProps {
  buffersRef: React.RefObject<RingBuffer[]>;
  channelNames: string[];
  height?: number;
}

export function EEGCanvas({ buffersRef, channelNames, height = 600 }: EEGCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const animRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const draw = () => {
      const dpr = window.devicePixelRatio || 1;
      const rect = canvas.getBoundingClientRect();
      const w = rect.width;
      const h = height;

      // Size canvas for HiDPI
      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        canvas.style.width = `${w}px`;
        canvas.style.height = `${h}px`;
        ctx.scale(dpr, dpr);
      }

      const buffers = buffersRef.current;
      if (!buffers) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }
      const numChannels = Math.min(buffers.length, channelNames.length);
      if (numChannels === 0) {
        animRef.current = requestAnimationFrame(draw);
        return;
      }

      const channelHeight = h / numChannels;
      const labelWidth = 40;
      const plotWidth = w - labelWidth;

      // Clear
      ctx.clearRect(0, 0, w, h);

      // Draw each channel
      for (let ch = 0; ch < numChannels; ch++) {
        const yOffset = ch * channelHeight;
        const yCenter = yOffset + channelHeight / 2;

        // Channel separator line
        if (ch > 0) {
          ctx.strokeStyle = SIEM.grid;
          ctx.lineWidth = 1;
          ctx.beginPath();
          ctx.moveTo(0, yOffset);
          ctx.lineTo(w, yOffset);
          ctx.stroke();
        }

        // Channel label
        ctx.fillStyle = SIEM.muted;
        ctx.font = "10px monospace";
        ctx.textAlign = "right";
        ctx.textBaseline = "middle";
        ctx.fillText(channelNames[ch] || `Ch${ch}`, labelWidth - 6, yCenter);

        // Center line
        ctx.strokeStyle = SIEM.gridStrong;
        ctx.lineWidth = 0.5;
        ctx.beginPath();
        ctx.moveTo(labelWidth, yCenter);
        ctx.lineTo(w, yCenter);
        ctx.stroke();

        // Waveform
        const data = buffers[ch].getOrdered();
        if (data.length < 2) continue;

        const amplitude = channelHeight * 0.4; // scale to 80% of channel height
        const maxVal = 100; // microvolts normalization

        ctx.strokeStyle = CHANNEL_COLORS[ch % CHANNEL_COLORS.length];
        ctx.lineWidth = 1.2;
        ctx.beginPath();

        for (let i = 0; i < data.length; i++) {
          const x = labelWidth + (i / (data.length - 1)) * plotWidth;
          const y = yCenter - (data[i] / maxVal) * amplitude;
          if (i === 0) ctx.moveTo(x, y);
          else ctx.lineTo(x, y);
        }
        ctx.stroke();
      }

      animRef.current = requestAnimationFrame(draw);
    };

    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [buffersRef, channelNames, height]);

  return (
    <canvas
      ref={canvasRef}
      className="w-full block"
      style={{ height: `${height}px` }}
    />
  );
}
