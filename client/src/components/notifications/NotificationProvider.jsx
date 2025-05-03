// src/components/notifications/NotificationProvider.jsx
import React, { createContext, useContext, useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Button } from '../ui/button';

const NotificationContext = createContext();

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);

  const addNotification = (notification) => {
    const id = Date.now();
    setNotifications(prev => [...prev, { ...notification, id }]);
    // Auto remove after 5 seconds
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(notification => notification.id !== id));
  };

  // Listen for server-sent events
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) return;

    const eventSource = new EventSource(`http://localhost:5000/api/notifications/stream?token=${token}`);

    eventSource.onmessage = (event) => {
      const data = JSON.parse(event.data);
      addNotification({
        title: data.title,
        message: data.message,
        type: data.type
      });
    };

    return () => eventSource.close();
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification }}>
      {children}
      <div className="fixed bottom-4 right-4 z-50 space-y-2">
        {notifications.map((notification) => (
          <div
            key={notification.id}
            className={`p-4 rounded-lg shadow-lg max-w-sm animate-slide-in-right
              ${notification.type === 'error' ? 'bg-red-100 text-red-800' : 
                notification.type === 'success' ? 'bg-green-100 text-green-800' : 
                'bg-blue-100 text-blue-800'}`}
          >
            <div className="flex justify-between items-start">
              <div>
                <h4 className="font-semibold">{notification.title}</h4>
                <p className="text-sm">{notification.message}</p>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => removeNotification(notification.id)}
                className="h-6 w-6 p-0"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        ))}
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};