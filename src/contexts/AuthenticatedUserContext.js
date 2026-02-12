import PropTypes from 'prop-types';
import React, { useMemo, useState, useEffect, createContext } from 'react';

import { getCurrentSession, getProfileById, onAuthStateChange, upsertProfile } from '../services/authService';

export const AuthenticatedUserContext = createContext({});

export const AuthenticatedUserProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [profile, setProfile] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;

    const hydrate = async () => {
      try {
        const session = await getCurrentSession();
        const nextUser = session?.user ?? null;

        if (!isMounted) return;

        setUser(nextUser);
        if (nextUser) {
          try {
            const loadedProfile = await getProfileById(nextUser.id);
            if (isMounted) setProfile(loadedProfile);
          } catch (_error) {
            const fallbackProfile = {
              id: nextUser.id,
              email: nextUser.email,
              name: nextUser.user_metadata?.name ?? nextUser.email,
              about: 'Available',
            };
            await upsertProfile(fallbackProfile);
            if (isMounted) setProfile(fallbackProfile);
          }
        } else {
          setProfile(null);
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    hydrate();

    const unsubscribe = onAuthStateChange(async (session) => {
      const nextUser = session?.user ?? null;
      setUser(nextUser);

      if (!nextUser) {
        setProfile(null);
        return;
      }

      try {
        const loadedProfile = await getProfileById(nextUser.id);
        setProfile(loadedProfile);
      } catch (_error) {
        const fallbackProfile = {
          id: nextUser.id,
          email: nextUser.email,
          name: nextUser.user_metadata?.name ?? nextUser.email,
          about: 'Available',
        };
        await upsertProfile(fallbackProfile);
        setProfile(fallbackProfile);
      }
    });

    return () => {
      isMounted = false;
      unsubscribe();
    };
  }, []);

  const value = useMemo(
    () => ({ user, profile, isLoading, setUser, setProfile }),
    [isLoading, profile, user]
  );

  return (
    <AuthenticatedUserContext.Provider value={value}>{children}</AuthenticatedUserContext.Provider>
  );
};

AuthenticatedUserProvider.propTypes = {
  children: PropTypes.node.isRequired,
};
