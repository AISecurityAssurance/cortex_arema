"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useToast } from '@/contexts/ToastContext';
import './MermaidAttackTree.css';

interface MermaidAttackTreeProps {
  mermaidCode: string;
  className?: string;
  onExport?: () => void;
}

export const MermaidAttackTree: React.FC<MermaidAttackTreeProps> = ({
  mermaidCode,
  className = '',
  onExport
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [isRendering, setIsRendering] = useState(false);
  const [renderError, setRenderError] = useState<string | null>(null);
  const { showToast } = useToast();

  useEffect(() => {
    const renderMermaid = async () => {
      if (!mermaidCode || !containerRef.current) return;

      setIsRendering(true);
      setRenderError(null);

      try {
        // Dynamic import of mermaid
        const mermaid = (await import('mermaid')).default;

        // Initialize mermaid with custom settings
        mermaid.initialize({
          startOnLoad: false,
          theme: 'dark',
          themeVariables: {
            primaryColor: '#1e293b',
            primaryTextColor: '#e2e8f0',
            primaryBorderColor: '#475569',
            lineColor: '#64748b',
            secondaryColor: '#334155',
            tertiaryColor: '#1e293b',
            background: '#0f172a',
            mainBkg: '#1e293b',
            secondBkg: '#334155',
            tertiaryBkg: '#475569',
            textColor: '#e2e8f0',
            nodeTextColor: '#e2e8f0'
          },
          flowchart: {
            curve: 'basis',
            padding: 20,
            nodeSpacing: 50,
            rankSpacing: 50,
            htmlLabels: false,
            useMaxWidth: true
          },
          securityLevel: 'strict'
        });

        // Clear previous content
        containerRef.current.innerHTML = '';

        // Create a unique ID for this diagram
        const diagramId = `mermaid-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

        // Create a div for the mermaid diagram
        const mermaidDiv = document.createElement('div');
        mermaidDiv.className = 'mermaid';
        mermaidDiv.id = diagramId;

        containerRef.current.appendChild(mermaidDiv);

        // Wait for the element to be in the DOM
        await new Promise(resolve => setTimeout(resolve, 100));

        // Use renderAsync instead of run for better error handling
        const { svg } = await mermaid.render(diagramId, mermaidCode);

        // Replace the div with the rendered SVG
        if (containerRef.current) {
          containerRef.current.innerHTML = svg;

          // Add interactive features after rendering
          setTimeout(() => addInteractivity(), 100);
        }

      } catch (error) {
        console.error('[MermaidAttackTree] Rendering error:', error);
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        setRenderError(errorMessage);
        showToast('Failed to render attack tree', 'error');

        // Show fallback
        if (containerRef.current) {
          containerRef.current.innerHTML = `
            <div class="error-container">
              <h3>Unable to render attack tree</h3>
              <p>${errorMessage}</p>
              <pre>${mermaidCode}</pre>
            </div>
          `;
        }
      } finally {
        setIsRendering(false);
      }
    };

    renderMermaid();
  }, [mermaidCode, showToast]);

  const addInteractivity = () => {
    if (!containerRef.current) return;

    // Add click handlers to nodes
    const nodes = containerRef.current.querySelectorAll('.node');
    nodes.forEach((node) => {
      const nodeElement = node as HTMLElement;
      nodeElement.style.cursor = 'pointer';

      // Add click handler for selection only
      nodeElement.addEventListener('click', (e) => {
        e.stopPropagation();
        const rect = nodeElement.querySelector('rect, polygon');
        if (rect) {
          // Toggle selection state
          const isSelected = rect.getAttribute('data-selected') === 'true';

          // Clear all selections
          containerRef.current?.querySelectorAll('rect, polygon').forEach(r => {
            r.setAttribute('data-selected', 'false');
            (r as SVGElement).style.strokeWidth = '2';
            (r as SVGElement).style.stroke = '#64748b';
          });

          if (!isSelected) {
            // Select this node
            rect.setAttribute('data-selected', 'true');
            (rect as SVGElement).style.strokeWidth = '3';
            (rect as SVGElement).style.stroke = '#3b82f6';
          }
        }
      });
    });

    // Add pan and zoom functionality
    const svg = containerRef.current.querySelector('svg');
    if (svg && containerRef.current) {
      let scale = 1;
      let isPanning = false;
      let startX = 0;
      let startY = 0;
      let translateX = 0;
      let translateY = 0;
      const container = containerRef.current;

      // Apply transform
      const updateTransform = () => {
        svg.style.transform = `translate(${translateX}px, ${translateY}px) scale(${scale})`;
        svg.style.transformOrigin = '0 0';
      };

      // Mouse wheel zoom
      container.addEventListener('wheel', (e) => {
        if (e.ctrlKey || e.metaKey) {
          e.preventDefault();

          // Get mouse position relative to container
          const rect = container.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;

          // Calculate zoom
          const delta = e.deltaY > 0 ? 0.9 : 1.1;
          const newScale = scale * delta;
          const boundedScale = Math.max(0.5, Math.min(newScale, 4));

          // Adjust translation to zoom towards mouse position
          if (boundedScale !== scale) {
            const scaleChange = boundedScale / scale;
            translateX = x - (x - translateX) * scaleChange;
            translateY = y - (y - translateY) * scaleChange;
            scale = boundedScale;
          }

          updateTransform();
        }
      });

      // Pan functionality
      container.addEventListener('mousedown', (e) => {
        if (!e.ctrlKey && !e.metaKey && e.button === 0) {
          isPanning = true;
          startX = e.clientX - translateX;
          startY = e.clientY - translateY;
          container.style.cursor = 'grabbing';
          e.preventDefault();
        }
      });

      container.addEventListener('mousemove', (e) => {
        if (isPanning) {
          translateX = e.clientX - startX;
          translateY = e.clientY - startY;
          updateTransform();
        }
      });

      container.addEventListener('mouseup', () => {
        isPanning = false;
        container.style.cursor = 'grab';
      });

      container.addEventListener('mouseleave', () => {
        isPanning = false;
        container.style.cursor = 'grab';
      });

      // Reset on double click
      container.addEventListener('dblclick', () => {
        scale = 1;
        translateX = 0;
        translateY = 0;
        updateTransform();
      });

      // Set initial cursor
      container.style.cursor = 'grab';
    }
  };

  const downloadDiagram = async () => {
    if (!containerRef.current) return;

    const svg = containerRef.current.querySelector('svg');
    if (!svg) return;

    try {
      // Clone the SVG to avoid modifying the original
      const svgClone = svg.cloneNode(true) as SVGElement;

      // Remove any transforms for export
      svgClone.style.transform = 'none';

      // Get the actual content dimensions from viewBox or compute from content
      const viewBox = svg.getAttribute('viewBox');
      let width, height;

      if (viewBox) {
        const [, , vbWidth, vbHeight] = viewBox.split(' ').map(Number);
        width = vbWidth;
        height = vbHeight;
      } else {
        // Fallback to computed dimensions
        const bbox = svg.getBBox();
        width = bbox.width + bbox.x * 2;
        height = bbox.height + bbox.y * 2;
      }

      // Scale up for better quality (2x resolution)
      const scale = 2;
      const canvasWidth = width * scale;
      const canvasHeight = height * scale;

      // Add padding
      const padding = 20 * scale;

      // Set proper dimensions for high quality
      svgClone.setAttribute('width', (canvasWidth + padding * 2).toString());
      svgClone.setAttribute('height', (canvasHeight + padding * 2).toString());
      svgClone.setAttribute('viewBox', `${-padding/scale} ${-padding/scale} ${width + padding} ${height + padding}`);

      // Set background
      svgClone.style.background = '#0f172a';

      // Serialize the SVG
      const serializer = new XMLSerializer();
      let svgString = serializer.serializeToString(svgClone);

      // Encode the SVG string for data URL
      // Add xmlns if not present (required for proper rendering)
      if (!svgString.includes('xmlns=')) {
        svgString = svgString.replace('<svg', '<svg xmlns="http://www.w3.org/2000/svg"');
      }

      // Convert to base64 data URL to avoid CORS issues
      const encodedData = btoa(unescape(encodeURIComponent(svgString)));
      const dataUrl = `data:image/svg+xml;base64,${encodedData}`;

      // Create an image element
      const img = new Image();

      // Wait for image to load
      await new Promise((resolve, reject) => {
        img.onload = resolve;
        img.onerror = reject;
        img.src = dataUrl;
      });

      // Create canvas
      const canvas = document.createElement('canvas');
      canvas.width = canvasWidth + padding * 2;
      canvas.height = canvasHeight + padding * 2;
      const ctx = canvas.getContext('2d');

      if (!ctx) {
        throw new Error('Failed to get canvas context');
      }

      // Fill background
      ctx.fillStyle = '#0f172a';
      ctx.fillRect(0, 0, canvas.width, canvas.height);

      // Draw the image
      ctx.drawImage(img, 0, 0);

      // Convert to blob
      canvas.toBlob((blob) => {
        if (!blob) {
          showToast('Failed to export diagram', 'error');
          return;
        }

        // Download the PNG
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `attack-tree-${Date.now()}.png`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);

        // Clean up
        URL.revokeObjectURL(url);

        showToast('Diagram downloaded as PNG', 'success');
      }, 'image/png', 1.0);

    } catch (error) {
      console.error('[MermaidAttackTree] Export error:', error);
      showToast('Failed to export diagram', 'error');
    }
  };

  const downloadMermaidCode = () => {
    const blob = new Blob([mermaidCode], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `attack-tree-${Date.now()}.mmd`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('Mermaid code downloaded', 'success');
  };

  return (
    <div className={`mermaid-attack-tree-container ${className}`}>
      {!isRendering && !renderError && (
        <div className="controls-overlay">
          <button
            className="control-button"
            onClick={downloadDiagram}
            title="Download as PNG"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </button>
          <button
            className="control-button"
            onClick={downloadMermaidCode}
            title="Download Mermaid code"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
              <polyline points="14 2 14 8 20 8" />
              <line x1="16" y1="13" x2="8" y2="13" />
              <line x1="16" y1="17" x2="8" y2="17" />
              <polyline points="10 9 9 9 8 9" />
            </svg>
          </button>
          <div className="zoom-hint">Drag to pan • Ctrl+Scroll to zoom • Double-click to reset</div>
        </div>
      )}
      {isRendering && (
        <div className="rendering-overlay">
          <div>Rendering attack tree...</div>
        </div>
      )}
      <div
        ref={containerRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          overflow: 'auto'
        }}
      />
    </div>
  );
};