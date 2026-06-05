'use client';

import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react';

export interface Restaurant {
  id: string;
  nome: string;
  tipo: string;
  citta: string;
  indirizzo: string;
  logo: string;
  colore: string;
}

type LoggedUser = {
  id: string;
  nome: string;
  cognome: string;
  email: string;
  role: 'MANAGER' | 'SOMMELIER' | 'STAFF';
  companyId: string;
  companyName?: string;
  inviteKey?: string | null;
};

type ApiRestaurant = {
  id: string;
  name: string;
  type?: string | null;
  city?: string | null;
  address?: string | null;
  logo?: string | null;
  color?: string | null;
};

type RestaurantContextValue = {
  restaurants: Restaurant[];
  currentRestaurant: Restaurant | null;
  setCurrentRestaurant: (restaurant: Restaurant) => void;
  loadingRestaurants: boolean;
  reloadRestaurants: () => Promise<void>;
};

const RestaurantContext = createContext<RestaurantContextValue | null>(null);

function mapRestaurant(restaurant: ApiRestaurant): Restaurant {
  return {
    id: restaurant.id,
    nome: restaurant.name,
    tipo: restaurant.type || 'Ristorante',
    citta: restaurant.city || '',
    indirizzo: restaurant.address || '',
    logo: restaurant.logo || restaurant.name.slice(0, 2).toUpperCase(),
    colore: restaurant.color || '#7B2D3E',
  };
}

export function RestaurantProvider({
  children,
}: {
  children: React.ReactNode;
}) {
  const [restaurants, setRestaurants] = useState<Restaurant[]>([]);
  const [currentRestaurant, setCurrentRestaurantState] =
    useState<Restaurant | null>(null);
  const [loadingRestaurants, setLoadingRestaurants] = useState(true);

  const getLoggedUser = (): LoggedUser | null => {
    if (typeof window === 'undefined') return null;

    const savedUser = localStorage.getItem('winecellar_user');

    if (!savedUser) return null;

    try {
      return JSON.parse(savedUser);
    } catch {
      localStorage.removeItem('winecellar_user');
      return null;
    }
  };

  const reloadRestaurants = async () => {
    const loggedUser = getLoggedUser();

    if (!loggedUser?.companyId) {
      setRestaurants([]);
      setCurrentRestaurantState(null);
      setLoadingRestaurants(false);
      return;
    }

    try {
      setLoadingRestaurants(true);

      const response = await fetch(
        `/api/restaurants?companyId=${loggedUser.companyId}`,
      );

      const json = await response.json();

      if (!response.ok) {
        throw new Error(json.error || 'Errore caricamento ristoranti');
      }

      const mapped = json.restaurants.map(mapRestaurant);

      setRestaurants(mapped);

      const savedRestaurantId = localStorage.getItem(
        'winecellar_current_restaurant',
      );

      const savedRestaurant =
        mapped.find((restaurant: Restaurant) => restaurant.id === savedRestaurantId) ||
        mapped[0] ||
        null;

      setCurrentRestaurantState(savedRestaurant);
    } catch (error) {
      console.error(error);
      setRestaurants([]);
      setCurrentRestaurantState(null);
    } finally {
      setLoadingRestaurants(false);
    }
  };

  useEffect(() => {
    reloadRestaurants();
  }, []);

  const setCurrentRestaurant = (restaurant: Restaurant) => {
    setCurrentRestaurantState(restaurant);
    localStorage.setItem('winecellar_current_restaurant', restaurant.id);
  };

  const value = useMemo(
    () => ({
      restaurants,
      currentRestaurant,
      setCurrentRestaurant,
      loadingRestaurants,
      reloadRestaurants,
    }),
    [restaurants, currentRestaurant, loadingRestaurants],
  );

  return (
    <RestaurantContext.Provider value={value}>
      {children}
    </RestaurantContext.Provider>
  );
}

export function useRestaurant() {
  const context = useContext(RestaurantContext);

  if (!context) {
    throw new Error('useRestaurant deve essere usato dentro RestaurantProvider');
  }

  return context;
}