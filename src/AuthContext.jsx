import React, { createContext, useState, useContext } from 'react';

const AuthContext = createContext();

export function AuthProvider({ children }) {
    // Simulated state for user and subscription
    const [user, setUser] = useState(null); // { email: string, name: string }
    const [isSubscribed, setIsSubscribed] = useState(false);

    // Simulate API calls with small delays
    const login = async (email, password) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (email && password) {
                    setUser({ email, name: email.split('@')[0] });
                    resolve(true);
                } else {
                    reject(new Error("Invalid credentials"));
                }
            }, 800);
        });
    };

    const register = async (email, password) => {
        return new Promise((resolve, reject) => {
            setTimeout(() => {
                if (email && password) {
                    // Auto-login after registration
                    setUser({ email, name: email.split('@')[0] });
                    resolve(true);
                } else {
                    reject(new Error("Please fill in all fields"));
                }
            }, 800);
        });
    };

    const logout = () => {
        setUser(null);
        setIsSubscribed(false);
    };

    const simulatePayment = async () => {
        return new Promise((resolve) => {
            setTimeout(() => {
                setIsSubscribed(true);
                resolve(true);
            }, 1500); // Simulate processing time
        });
    };

    return (
        <AuthContext.Provider value={{ user, isSubscribed, login, register, logout, simulatePayment }}>
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth() {
    return useContext(AuthContext);
}
