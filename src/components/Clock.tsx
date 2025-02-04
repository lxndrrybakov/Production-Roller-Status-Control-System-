import React, { useState, useEffect } from 'react';

export const Clock: React.FC = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="text-xl font-mono">
      {time.toLocaleTimeString()}
    </div>
  );
};