import { useState, useEffect, useRef } from "react";

/**
 * Custom countdown timer hook
 * @param {number} initialSeconds - number of seconds for countdown
 * @returns {object} { timeLeft, isRunning, startTimer, resetTimer, formattedTime }
 */
export default function useTimer(initialSeconds = 0) {
  const [timeLeft, setTimeLeft] = useState(initialSeconds);
  const [isRunning, setIsRunning] = useState(false);
  const timerRef = useRef(null);

  useEffect(() => {
    if (isRunning && timeLeft > 0) {
      timerRef.current = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    }

    if (timeLeft === 0) {
      clearInterval(timerRef.current);
      setIsRunning(false);
    }

    return () => clearInterval(timerRef.current);
  }, [isRunning, timeLeft]);

  const startTimer = (seconds = initialSeconds) => {
    setTimeLeft(seconds);
    setIsRunning(true);
  };

  const resetTimer = () => {
    clearInterval(timerRef.current);
    setTimeLeft(initialSeconds);
    setIsRunning(false);
  };

  const formattedTime = () => {
    const mins = Math.floor(timeLeft / 60);
    const secs = timeLeft % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  return {
    timeLeft,
    isRunning,
    startTimer,
    resetTimer,
    formattedTime,
  };
}
