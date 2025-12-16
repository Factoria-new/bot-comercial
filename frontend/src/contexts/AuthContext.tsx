import { createContext, useContext, useEffect, useState } from "react";
import { onAuthStateChanged, User } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
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
        const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
            setUserRaw(currentUser);

            if (currentUser) {
                try {
                    // Fetch additional data from Firestore 'users' collection
                    const userDocRef = doc(db, "users", currentUser.uid);
                    const userSnapshot = await getDoc(userDocRef);

                    if (userSnapshot.exists()) {
                        const userData = userSnapshot.data();
                        console.log(`[AuthContext] User document found for UID: ${currentUser.uid}, Role: ${userData.role}`);
                        setUser({
                            uid: currentUser.uid,
                            email: currentUser.email,
                            role: userData.role || "basic", // Default to basic if no role defined
                            ...userData,
                        } as UserProfile);
                    } else {
                        console.warn(`[AuthContext] No user document found for UID: ${currentUser.uid}. using basic role.`);
                        // User exists in Auth but not in Firestore (legacy or new user)
                        // You might want to create the document here, or just treat as basic
                        setUser({
                            uid: currentUser.uid,
                            email: currentUser.email,
                            role: "basic",
                        });
                    }
                } catch (error) {
                    console.error("Error fetching user profile:", error);
                    // Fallback to basic auth user if Firestore fails
                    setUser({
                        uid: currentUser.uid,
                        email: currentUser.email,
                        role: "basic",
                    });
                }
            } else {
                setUser(null);
            }
            setLoading(false);
        });

        return () => unsubscribe();
    }, []);

    return (
        <AuthContext.Provider value={{ user, loading, userRaw }}>
            {children}
        </AuthContext.Provider>
    );
};
