import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, onSnapshot } from "firebase/firestore";
import { auth } from "@/config/firebase";
import { db } from "@/config/db";

// Define the shape of our User object (extending Firebase User)
// You can add more profile fields here (e.g., subscriptionStatus, companyName)
export interface UserProfile {
    uid: string;
    email: string | null;
    role: "basic" | "pro" | "admin";
    // Add other fields from Firestore as needed
}

interface AuthContextType {
    user: UserProfile | null;
    loading: boolean;
    userRaw: User | null; // The original Firebase Auth user object
}

const AuthContext = createContext<AuthContextType>({
    user: null,
    loading: true,
    userRaw: null,
});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }: { children: React.ReactNode }) => {
    const [user, setUser] = useState<UserProfile | null>(null);
    const [userRaw, setUserRaw] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        let unsubscribeSnapshot: (() => void) | null = null;

        const unsubscribeAuth = onAuthStateChanged(auth, (currentUser) => {
            setUserRaw(currentUser);

            // Clean up previous snapshot listener if it exists (e.g. user switch)
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
                unsubscribeSnapshot = null;
            }

            if (currentUser) {
                // Subscribe to real-time updates for the user document
                const userDocRef = doc(db, "users", currentUser.uid);

                unsubscribeSnapshot = onSnapshot(userDocRef, (docSnapshot) => {
                    if (docSnapshot.exists()) {
                        const userData = docSnapshot.data();
                        console.log(`[AuthContext] User update: ${currentUser.uid}, Role: ${userData.role}`);
                        setUser({
                            uid: currentUser.uid,
                            email: currentUser.email,
                            role: (userData.role ? String(userData.role).toLowerCase().trim() : "basic") as "basic" | "pro" | "admin",
                            ...userData,
                        } as UserProfile);
                    } else {
                        console.warn(`[AuthContext] No user document found for UID: ${currentUser.uid}. Using basic role.`);
                        setUser({
                            uid: currentUser.uid,
                            email: currentUser.email,
                            role: "basic",
                        });
                    }
                    setLoading(false);
                }, (error) => {
                    console.error("Error listening to user profile:", error);
                    // On error, keep existing user but maybe valid defaults?
                    // If this is the first load, we need to stop loading
                    setLoading(false);
                });
            } else {
                setUser(null);
                setLoading(false);
            }
        });

        return () => {
            unsubscribeAuth();
            if (unsubscribeSnapshot) {
                unsubscribeSnapshot();
            }
        };
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, userRaw }}>
            {children}
        </AuthContext.Provider>
    );
};
