import React, { useEffect, useRef, useState } from 'react';
import { AuditPreview } from './AuditPreview';

export const ScaledAuditPreview: React.FC = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const innerRef = useRef<HTMLDivElement>(null);
  const [scale, setScale] = useState(1);
  const [outerHeight, setOuterHeight] = useState<number | undefined>(undefined);

  useEffect(() => {
    const updateScale = () => {
      if (!containerRef.current || !innerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      const designWidth = 896; // canonical fixed design width
      const newScale = Math.min(1, containerWidth / designWidth);
      setScale(newScale);
      setOuterHeight(innerRef.current.offsetHeight * newScale);
    };

    const observer = new ResizeObserver(() => {
      updateScale();
    });

    if (containerRef.current) {
      observer.observe(containerRef.current);
    }
    if (innerRef.current) {
      observer.observe(innerRef.current);
    }

    updateScale();

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={containerRef}
      className="w-full relative overflow-hidden flex justify-center"
      style={{ height: outerHeight !== undefined ? `${outerHeight}px` : 'auto' }}
    >
      <div
        ref={innerRef}
        style={{
          width: '896px',
          transform: `scale(${scale})`,
          transformOrigin: 'top center',
          transition: 'transform 0.05s ease-out',
        }}
      >
        <AuditPreview />
      </div>
    </div>
  );
};

export default ScaledAuditPreview;
