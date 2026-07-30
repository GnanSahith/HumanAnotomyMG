import { useEffect, useRef } from 'react';
import { logActivity } from '../utils/activityTracker';

export default function AnalyticsTracker({ username, contextName, module }) {
    const startTimeRef = useRef(Date.now());

    useEffect(() => {
        startTimeRef.current = Date.now();
        
        const logData = () => {
            const timeSpent = Date.now() - startTimeRef.current;
            if (timeSpent > 3000 && username) { // Only log if they spent > 3 seconds
                logActivity(username, 'SESSION_DURATION', {
                    module: module,
                    target: contextName,
                    durationSeconds: Math.floor(timeSpent / 1000)
                });
            }
        };

        const handleUnload = () => {
            logData();
        };

        window.addEventListener('beforeunload', handleUnload);

        return () => {
            window.removeEventListener('beforeunload', handleUnload);
            logData();
        };
    }, [contextName, username, module]);

    return null;
}
