'use client';
import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useFirestore } from '@/firebase';
import { collection, query, onSnapshot, where, Timestamp } from 'firebase/firestore';

const NotificationContext = createContext<any>(null);

export const NotificationProvider = ({ children }: { children: React.ReactNode }) => {
  const [notifications, setNotifications] = useState<any[]>([]);
  const db = useFirestore();

  const addNotification = useCallback((message: string, duration = 5000) => {
    const id = Date.now();
    setNotifications((prev) => [...prev, { id, message }]);
    setTimeout(() => {
      setNotifications((prev) => prev.filter((n) => n.id !== id));
    }, duration);
  }, []);

  useEffect(() => {
    if (!db) return;

    // Fetch all active notifications (those that haven't expired yet)
    const now = Timestamp.now();
    const q = query(
      collection(db, 'notifications'),
      where('expiresAt', '>', now)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data();
          const expiresAt = data.expiresAt?.toDate() || new Date();
          const timeLeft = expiresAt.getTime() - Date.now();
          
          if (timeLeft > 0) {
            addNotification(data.message, Math.min(timeLeft, data.duration || 10000));
          }
        }
      });
    }, (error) => {
      console.error("Neural Notification Sync Interrupted:", error);
    });

    return () => unsubscribe();
  }, [db, addNotification]);

  return (
    <NotificationContext.Provider value={{ addNotification }}>
      {children}
      <div className="fixed bottom-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none">
        <AnimatePresence>
          {notifications.map((n) => (
            <motion.div
              key={n.id}
              initial={{ opacity: 0, x: 50, scale: 0.9, filter: 'blur(10px)' }}
              animate={{ opacity: 1, x: 0, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, x: 50, scale: 0.9, filter: 'blur(10px)' }}
              className="bg-primary/90 text-primary-foreground px-6 py-4 rounded-2xl shadow-[0_20px_50px_rgba(37,99,235,0.3)] font-black uppercase text-[10px] tracking-[0.2em] border border-white/20 pointer-events-auto backdrop-blur-xl flex items-center gap-4 min-w-[300px]"
            >
              <div className="relative">
                <div className="w-3 h-3 rounded-full bg-white shadow-[0_0_15px_rgba(255,255,255,1)]" />
                <div className="absolute inset-0 w-3 h-3 rounded-full bg-white animate-ping opacity-50" />
              </div>
              <div className="flex-1">
                <p className="opacity-50 text-[7px] mb-1">Incoming Transmission</p>
                {n.message}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotifications = () => useContext(NotificationContext);
