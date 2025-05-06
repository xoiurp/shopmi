"use client";

import React, { useRef, useEffect, useState } from 'react';

interface IsolatedHtmlContentProps {
  htmlContent: string;
  mobileHtmlContent?: string; // Conteúdo HTML específico para mobile
  desktopCss?: string;
  mobileCss?: string;
  mobileFooterHeight?: number; // Altura do footer em dispositivos móveis
  desktopFooterHeight?: number; // Altura do footer em dispositivos desktop
  preserveOriginalStyles?: boolean; // Nova prop para preservar os estilos originais
}

const IsolatedHtmlContentTest: React.FC<IsolatedHtmlContentProps> = ({
  htmlContent,
  mobileHtmlContent,
  desktopCss: _desktopCss, // Manter a prop, mas não usá-la na injeção de CSS
  mobileCss: _mobileCss, // Manter a prop, mas não usá-la na injeção de CSS
  mobileFooterHeight = 400, // Valor padrão para a altura do footer mobile
  desktopFooterHeight = 700, // Valor padrão para a altura do footer desktop
  preserveOriginalStyles = false, // Por padrão, não preserva estilos originais
}) => {
  // Estado para detectar se estamos em um dispositivo móvel
  const [isMobile, setIsMobile] = useState(false);
  const iframeRef = useRef<HTMLIFrameElement>(null);
  const [iframeHeight, setIframeHeight] = useState(300); // Altura inicial maior para mobile

  // Efeito para detectar dispositivo móvel
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    
    window.addEventListener('resize', checkMobile);
    
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
  
  // Determinar qual conteúdo HTML usar com base no dispositivo
  const contentToUse = isMobile && mobileHtmlContent ? mobileHtmlContent : htmlContent;
  
  // Armazenar a última altura e o timestamp da última atualização
  const lastHeightRef = useRef<number>(300);
  const lastUpdateTimeRef = useRef<number>(0);
  
  useEffect(() => {
    if (!iframeRef.current) return;
    
    const iframe = iframeRef.current;
    
    const handleMessage = (event: MessageEvent) => {
      if (event.source === iframe.contentWindow) {
        const data = event.data;
        if (data && typeof data === 'object' && 'height' in data) {
          const newHeight = Number(data.height);
          const now = Date.now();
          
          if (
            !isNaN(newHeight) &&
            newHeight > 0 &&
            Math.abs(newHeight - lastHeightRef.current) > 10 &&
            (now - lastUpdateTimeRef.current) > 200
          ) {
            lastHeightRef.current = newHeight;
            lastUpdateTimeRef.current = now;
            
            setIframeHeight(newHeight);
          }
        }
      }
    };
    
    window.addEventListener('message', handleMessage);
    
    // Criar o conteúdo do iframe incluindo a fonte MiSans e estilos BÁSICOS
    // REMOVIDA a injeção de desktopCss e mobileCss aqui
    const combinedStyles = `
      <style>
        /* Importação da fonte MiSans */
        @font-face {
          font-family: 'MiSans';
          font-style: normal;
          font-weight: 300;
          src: url('/fonts/MiSans-Normal.ttf') format('truetype'),
               url('/fonts/MiSans-Normal.woff2') format('woff2');
          font-display: swap;
        }
        
        @font-face {
          font-family: 'MiSans';
          font-style: normal;
          font-weight: 400;
          src: url('/fonts/MiSans-Regular.ttf') format('truetype'),
               url('/fonts/MiSans-Regular.woff2') format('woff2');
          font-display: swap;
        }
        
        @font-face {
          font-family: 'MiSans';
          font-style: normal;
          font-weight: 500;
          src: url('/fonts/MiSans-Medium.ttf') format('truetype'),
               url('/fonts/MiSans-Medium.woff2') format('woff2');
          font-display: swap;
        }
        
        @font-face {
          font-family: 'MiSans';
          font-style: normal;
          font-weight: 600;
          src: url('/fonts/MiSans-SemiBold.ttf') format('truetype'),
               url('/fonts/MiSans-SemiBold.woff2') format('woff2');
          font-display: swap;
        }
        
        @font-face {
          font-family: 'MiSans';
          font-style: normal;
          font-weight: 700;
          src: url('/fonts/MiSans-Bold.ttf') format('truetype'),
               url('/fonts/MiSans-Bold.woff2') format('woff2');
          font-display: swap;
        }
        
        html, body {
          margin: 0;
          padding: 0;
          overflow: hidden; /* Remove barras de rolagem no conteúdo */
          ${!preserveOriginalStyles ? `
          font-family: 'MiSans', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif;
          font-size: 16px;
          ` : ''}
          width: 100%;
        }
        
        /* Estilos básicos para reset ou compatibilidade, se necessário */
        /* Adicione aqui quaisquer estilos que você queira que sejam aplicados DENTRO do iframe */

      </style>
    `;
    
    const heightScript = `
      <script>
        const mobileFooterHeight = ${mobileFooterHeight};
        const desktopFooterHeight = ${desktopFooterHeight};

        (function() {
          let lastHeight = 0;
          let updateTimeout = null;
          const debounceDelay = 100;
          let consecutiveUpdates = 0;
          const maxConsecutiveUpdates = 50;

          function postHeight() {
            const bodyScrollHeight = document.body.scrollHeight;
            const docScrollHeight = document.documentElement.scrollHeight;
            const calculatedHeight = Math.max(bodyScrollHeight, docScrollHeight);
            const finalHeight = calculatedHeight;

            if (Math.abs(finalHeight - lastHeight) < 20) {
              return;
            }

            if (updateTimeout) {
              clearTimeout(updateTimeout);
            }

            updateTimeout = setTimeout(() => {
              lastHeight = finalHeight;
              window.parent.postMessage({ height: finalHeight }, '*');
            }, debounceDelay);
          }

          const resizeObserver = new ResizeObserver((entries) => {
            postHeight();
          });

          resizeObserver.observe(document.body);

          document.addEventListener('DOMContentLoaded', () => {
            postHeight();

            const images = document.querySelectorAll('img');
            images.forEach(img => {
              if (!img.complete) {
                img.addEventListener('load', () => {
                  postHeight();
                }, { once: true });
                img.addEventListener('error', () => {
                  postHeight();
                }, { once: true });
              }
            });
          });

          window.addEventListener('load', () => {
            postHeight();
          });

          window.addEventListener('orientationchange', () => {
            setTimeout(postHeight, 300);
          });

          window.addEventListener('resize', () => {
            postHeight();
          });

          const mutationObserver = new MutationObserver((mutations) => {
            postHeight();
          });

          mutationObserver.observe(document.body, {
            childList: true,
            subtree: true,
            attributes: true
          });

          window.addEventListener('beforeunload', () => {
            resizeObserver.disconnect();
            mutationObserver.disconnect();
          });

        })();
      </script>
    `;

    // Montar o documento completo
    const fullContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
          ${combinedStyles}
        </head>
        <body>
          ${contentToUse}
          ${heightScript}
        </body>
      </html>
    `;

    iframe.srcdoc = fullContent;
    
    return () => {
      window.removeEventListener('message', handleMessage);
    };
  }, [htmlContent, mobileHtmlContent, isMobile, mobileFooterHeight, desktopFooterHeight, preserveOriginalStyles, iframeRef, contentToUse]);

  return (
    <iframe
      ref={iframeRef}
      sandbox="allow-scripts allow-same-origin"
      scrolling="no"
      style={{
        width: '100%',
        height: `${iframeHeight}px`,
        border: 'none',
        display: 'block',
        transition: 'height 0.3s ease-in-out',
        overflow: 'hidden',
      }}
      className="isolated-content-iframe-test w-full" // Nova classe para teste
      title="Conteúdo Isolado do Produto Teste"
    />
  );
};

export default IsolatedHtmlContentTest;
