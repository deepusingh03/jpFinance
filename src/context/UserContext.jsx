import React, { createContext, useState, useContext, useEffect, useRef } from 'react';
import { helperMethods } from "../utility/CMPhelper";

const UserContext = createContext();

export const UserProvider = ({ children }) => {
  const [userData, setUserData] = useState(null);
  const [userInitials, setUserInitials] = useState("");
  const hasFetched = useRef(false);

  useEffect(() => {
    if (!hasFetched.current) {
      const fetchUser = async () => {
        const user = await helperMethods.fetchUserDetails();
        if (user && user.Id) {
          setUserData(user);
          const initials = `${user.FirstName.charAt(0)}${user.LastName.charAt(0)}`.toUpperCase();
          setUserInitials(initials);
        }
      };
      fetchUser();
      hasFetched.current = true;
    }
  }, []);

  const value = {
    userData,
    userInitials,
    getUserName: () => userData ? `${userData.FirstName} ${userData.LastName}` : null,
  };

  return <UserContext.Provider value={value}>{children}</UserContext.Provider>;
};

// eslint-disable-next-line react-refresh/only-export-components
export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};