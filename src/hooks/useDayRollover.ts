import { useEffect, useRef } from 'react';

/**
 * 자정 롤오버 감지 훅
 * 매일 자정(00:00)이 되면 onMidnight 콜백 실행
 * 
 * @param onMidnight - 자정에 실행할 콜백 함수
 * 
 * @example
 * useDayRollover(() => {
 *   console.log('새로운 날이 시작되었습니다!');
 *   loadTodayDoses(); // 오늘 약 다시 로드
 * });
 */
export function useDayRollover(onMidnight: () => void) {
  const callbackRef = useRef(onMidnight);
  
  // 최신 콜백 참조 유지
  useEffect(() => {
    callbackRef.current = onMidnight;
  }, [onMidnight]);

  useEffect(() => {
    // 다음 자정까지 남은 시간 계산
    const getMillisecondsUntilMidnight = () => {
      const now = new Date();
      const midnight = new Date(now);
      midnight.setHours(24, 0, 0, 0); // 다음날 00:00
      return midnight.getTime() - now.getTime();
    };

    // 첫 자정 타이머 설정
    const firstDelay = getMillisecondsUntilMidnight();
    let timeoutId: NodeJS.Timeout;
    let intervalId: NodeJS.Timeout;

    timeoutId = setTimeout(() => {
      // 자정 도달 - 콜백 실행
      callbackRef.current();

      // 이후 매 24시간마다 반복
      intervalId = setInterval(() => {
        callbackRef.current();
      }, 24 * 60 * 60 * 1000);
    }, firstDelay);

    // Cleanup
    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (intervalId) clearInterval(intervalId);
    };
  }, []);
}
