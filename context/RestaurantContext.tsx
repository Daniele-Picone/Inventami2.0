"use client";
import React,{createContext,useContext,useState,ReactNode} from 'react';
import { RESTAURANTS_MOCK, Restaurant } from '@/data/restaurantData';
interface RestaurantContextType{currentRestaurant:Restaurant;restaurants:Restaurant[];setCurrentRestaurant:(r:Restaurant)=>void}
const RestaurantContext=createContext<RestaurantContextType>({currentRestaurant:RESTAURANTS_MOCK[0],restaurants:RESTAURANTS_MOCK,setCurrentRestaurant:()=>{}});
export function RestaurantProvider({children}:{children:ReactNode}){const [currentRestaurant,setCurrentRestaurant]=useState<Restaurant>(RESTAURANTS_MOCK[0]);return <RestaurantContext.Provider value={{currentRestaurant,restaurants:RESTAURANTS_MOCK,setCurrentRestaurant}}>{children}</RestaurantContext.Provider>}
export function useRestaurant(){return useContext(RestaurantContext)}
