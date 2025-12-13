import React, { useEffect, useState } from 'react';
import { Trophy, Star } from 'lucide-react';
import api from '../lib/api';

export default function UserLevel() {
    const [user, setUser] = useState({ level: 1, xp: 0, total_xp: 0 });

    const fetchUser = async () => {
        try {
            const { data } = await api.get('/user');
            if (data) setUser(data);
        } catch (err) {
            console.error('Failed to fetch user stats', err);
        }
    };

    useEffect(() => {
        fetchUser();
        // Poll for updates every 5 seconds to catch XP gains from other components
        const interval = setInterval(fetchUser, 5000);
        return () => clearInterval(interval);
    }, []);

    const xpForNextLevel = user.level * 100;
    const progress = Math.min((user.xp / xpForNextLevel) * 100, 100);

    return (
        <div className="bg-gradient-to-r from-gray-900 to-black rounded-xl p-4 text-white shadow-lg relative overflow-hidden group hover:scale-[1.02] transition-transform">
            <div className="absolute top-0 right-0 p-2 opacity-10">
                <Trophy size={64} />
            </div>
            
            <div className="flex justify-between items-end mb-2 relative z-10">
                <div>
                    <div className="text-xs text-gray-400 font-bold uppercase tracking-wider mb-1">Level {user.level}</div>
                    <div className="text-xl font-bold flex items-center gap-2">
                        {user.username}
                        {user.level >= 10 && <Star size={16} className="text-yellow-400 fill-yellow-400" />}
                    </div>
                </div>
                <div className="text-right">
                    <div className="text-xs font-mono text-gray-400">
                        <span className="text-white font-bold">{user.xp}</span> / {xpForNextLevel} XP
                    </div>
                </div>
            </div>

            <div className="h-2 bg-gray-700/50 rounded-full overflow-hidden relative z-10">
                <div 
                    className="h-full bg-gradient-to-r from-yellow-500 to-orange-500 transition-all duration-1000 ease-out shadow-[0_0_10px_rgba(245,158,11,0.5)]"
                    style={{ width: `${progress}%` }}
                />
            </div>
            {/* XP float animation could go here */}
        </div>
    );
}
