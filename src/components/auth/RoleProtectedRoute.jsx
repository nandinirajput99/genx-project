                                                                            import { useState, useEffect } from "react";
import { Navigate, useLocation } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase/firebase";

function RoleProtectedRoute({ children, allowedRole = "Host" }) {
  const [user, setUser] = useState(null);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      if (currentUser) {
        setUser(currentUser);
        try {
          const userDocSnap = await getDoc(doc(db, "users", currentUser.uid));
          if (userDocSnap.exists()) {
            setRole(userDocSnap.data().role || "");
          } else {
            setRole("");
          }
        } catch (err) {
          console.error("Error fetching user role:", err);
          setRole("");
        }
      } else {
        setUser(null);
        setRole(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0b071e] text-white flex flex-col items-center justify-center p-4 font-sans select-none">
        <div className="flex flex-col items-center space-y-4">
          <div className="w-16 h-16 rounded-full bg-linear-to-b from-indigo-600 to-purple-900 border-2 border-purple-400 flex items-center justify-center text-3xl shadow-[0_0_30px_rgba(168,85,247,0.5)] animate-pulse">
            👑
          </div>
          <p className="text-purple-300 font-medium tracking-wide animate-pulse">
            Checking Permissions...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role === "Player" && allowedRole === "Host") {
    return <Navigate to="/player/join" replace />;
  }

  if (role !== allowedRole) {
    return <Navigate to="/game-options" replace />;
  }

  return children;
}

export default RoleProtectedRoute;
