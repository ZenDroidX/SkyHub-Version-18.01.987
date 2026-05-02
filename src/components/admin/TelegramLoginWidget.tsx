
'use client';

import React, { useEffect, useRef } from 'react';

interface TelegramUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface TelegramLoginWidgetProps {
  botName: string;
  onAuth: (user: TelegramUser) => void;
  className?: string;
}

export function TelegramLoginWidget({ botName, onAuth, className }: TelegramLoginWidgetProps) {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const currentContainer = containerRef.current;
    // Callback for the widget
    (window as any).onTelegramAuth = (user: TelegramUser) => {
      onAuth(user);
    };

    const script = document.createElement('script');
    script.src = `https://telegram.org/js/telegram-widget.js?22`;
    script.async = true;
    script.setAttribute('data-telegram-login', botName);
    script.setAttribute('data-size', 'large');
    script.setAttribute('data-onauth', 'onTelegramAuth(user)');
    script.setAttribute('data-request-access', 'write');

    if (currentContainer) {
      currentContainer.appendChild(script);
    }

    return () => {
      if (currentContainer) {
        currentContainer.innerHTML = '';
      }
      delete (window as any).onTelegramAuth;
    };
  }, [botName, onAuth]);

  return <div ref={containerRef} className={className} />;
}
