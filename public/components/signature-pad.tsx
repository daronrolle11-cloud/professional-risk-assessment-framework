"use client";

import React, { useRef, useState, useEffect } from "react";
import { X, Eraser, Check } from "lucide-react";

interface SignaturePadProps {
  onSave: (dataUrl: string) => void;
  onCancel: () => void;
  title?: string;
}

export function SignaturePad({ onSave, onCancel, title = "Electronic Signature" }: SignaturePadProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = "#0a376a"; // Navy blue ink
  }, []);

  function getCoordinates(e: React.MouseEvent | React.TouchEvent) {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    };
  }

  function startDrawing(e: React.MouseEvent | React.TouchEvent) {
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.beginPath();
    ctx.moveTo(x, y);
    setIsDrawing(true);
  }

  function draw(e: React.MouseEvent | React.TouchEvent) {
    if (!isDrawing) return;
    const { x, y } = getCoordinates(e);
    const ctx = canvasRef.current?.getContext("2d");
    if (!ctx) return;
    ctx.lineTo(x, y);
    ctx.stroke();
    e.preventDefault();
  }

  function stopDrawing() {
    setIsDrawing(false);
  }

  function clear() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    ctx?.clearRect(0, 0, canvas.width, canvas.height);
  }

  function save() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    
    // Check if anything was drawn
    const blank = document.createElement('canvas');
    blank.width = canvas.width;
    blank.height = canvas.height;
    if (canvas.toDataURL() === blank.toDataURL()) {
        alert("Please provide a signature.");
        return;
    }

    onSave(canvas.toDataURL("image/png"));
  }

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl overflow-hidden shadow-2xl">
        <div className="bg-[#0a376a] p-4 flex items-center justify-between text-white">
          <div className="font-semibold uppercase tracking-wider text-sm">{title}</div>
          <button onClick={onCancel} className="p-1 hover:bg-white/10 rounded-full transition-colors">
            <X className="h-5 w-5" />
          </button>
        </div>
        
        <div className="p-6">
          <p className="text-xs text-gray-500 mb-4 leading-relaxed">
            I understand that this is a legally binding electronic signature. By signing below, I attest to the accuracy and completion of the findings documented in this report.
          </p>
          
          <canvas
            ref={canvasRef}
            width={500}
            height={200}
            onMouseDown={startDrawing}
            onMouseMove={draw}
            onMouseUp={stopDrawing}
            onMouseOut={stopDrawing}
            onTouchStart={startDrawing}
            onTouchMove={draw}
            onTouchEnd={stopDrawing}
            className="w-full h-[200px] bg-gray-50 border-2 border-dashed border-gray-200 rounded-xl cursor-crosshair touch-none"
          />
          
          <div className="mt-6 flex gap-3">
            <button onClick={clear} className="btn btn-ghost !border-gray-200 !text-gray-500 hover:!bg-gray-50">
              <Eraser className="h-4 w-4" /> Clear
            </button>
            <div className="flex-1" />
            <button onClick={onCancel} className="btn btn-ghost !border-gray-200 !text-gray-500">
              Cancel
            </button>
            <button onClick={save} className="btn btn-primary !bg-[#22C55E] !border-[#22C55E] !px-8">
              <Check className="h-4 w-4" /> Sign & Finalize
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
