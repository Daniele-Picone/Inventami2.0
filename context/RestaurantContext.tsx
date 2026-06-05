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

type CreateRestaurantInput = {
  name: string;
  type?: string;
  city?: string;
  address?: string;
  color?: string;
};

type RestaurantContextValue = {
  restaurants: Restaurant[];
  currentRestaurant: Restaurant | null;
  setCurrentRestaurant: (restaurant: Restaurant) => void;
  loadingRestaurants: boolean;
  reloadRestaurants: () => Promise<void>;
  createRestaurant: (input: CreateRestaurantInput) => Promise<Restaurant>;
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

function getLoggedUser(): LoggedUser | null {
  if (typeof window === 'undefined') return null;

  const savedUser = localStorage.getItem('winecellar_user');

  if (!savedUser) return null;

  try {
    return JSON.parse(savedUser);
  } catch {
    localStorage.removeItem('winecellar_user');
    return null;
  }
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

  const setCurrentRestaurant = (restaurant: Restaurant) => {
    setCurrentRestaurantState(restaurant);
    localStorage.setItem('winecellar_current_restaurant', restaurant.id);
  };

  const createRestaurant = async (
    input: CreateRestaurantInput,
  ): Promise<Restaurant> => {
    const loggedUser = getLoggedUser();

    if (!loggedUser?.companyId) {
      throw new Error('Sessione non valida. Effettua di nuovo il login.');
    }

    const response = await fetch('/api/restaurants', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        companyId: loggedUser.companyId,
        name: input.name,
        type: input.type || 'Ristorante',
        city: input.city || '',
        address: input.address || '',
        color: input.color || '#7B2D3E',
      }),
    });

    const json = await response.json();

    if (!response.ok) {
      throw new Error(json.error || 'Errore creazione ristorante');
    }

    const created = mapRestaurant(json.restaurant);

    setRestaurants((prev) => [...prev, created]);
    setCurrentRestaurant(created);

    return created;
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

      let mapped: Restaurant[] = json.restaurants.map(mapRestaurant);

      if (mapped.length === 0) {
        const created = await createRestaurant({
          name: loggedUser.companyName || 'Il mio locale',
          type: 'Ristorante',
          color: '#7B2D3E',
        });

        mapped = [created];
      }

      setRestaurants(mapped);

      const savedRestaurantId = localStorage.getItem(
        'winecellar_current_restaurant',
      );

      const selectedRestaurant =
        mapped.find((restaurant) => restaurant.id === savedRestaurantId) ||
        mapped[0] ||
        null;

      setCurrentRestaurantState(selectedRestaurant);

      if (selectedRestaurant) {
        localStorage.setItem(
          'winecellar_current_restaurant',
          selectedRestaurant.id,
        );
      }
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const value = useMemo(
    () => ({
      restaurants,
      currentRestaurant,
      setCurrentRestaurant,
      loadingRestaurants,
      reloadRestaurants,
      createRestaurant,
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