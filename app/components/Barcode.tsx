"use client";

import { useEffect, useRef } from "react";

interface BarcodeProps {
  value: string;
  width?: number;
  height?: number;
}

export default function Barcode({ value, width = 2, height = 60 }: BarcodeProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  useEffect(() => {
    if (svgRef.current && value) {
      import("jsbarcode").then((mod) => {
        const JsBarcode = mod.default || mod;
        try {
          JsBarcode(svgRef.current, value, {
            format: "CODE128",
            width,
            height,
            displayValue: true,
            fontSize: 14,
            margin: 10,
          });
        } catch {
          // silently fail if barcode generation fails
        }
      });
    }
  }, [value, width, height]);

  if (!value) return null;

  return <svg ref={svgRef} />;
}
